// backend/server.js

const User = require('./models/user');
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

console.log('⏳ Connecting to MongoDB Cloud...');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => {
    console.log('❌ DB Connection Failed!');
    console.log('Error:', err.message);
  });

function storedPasswordLooksBcrypt(stored) {
  return typeof stored === 'string' && /^\$2[aby]\$\d{2}\$/.test(stored);
}

app.post('/api/login', async (req, res) => {
  try {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '').trim();
    if (!username || !password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const stored = user.password;
    let isPasswordValid = false;
    if (storedPasswordLooksBcrypt(stored)) {
      isPasswordValid = await bcrypt.compare(password, stored);
    } else {
      isPasswordValid = password === String(stored).trim();
    }
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({
      success: true,
      role: user.role,
      username: user.username,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const OPENROUTE_API_KEY =
  process.env.OPENROUTE_API_KEY ||
  '5b3ce3597851110001cf62484720627ea924407099674626b693b31c';

const MAX_JUNCTION_MARKERS = 12;
const TIME_SAVED_PER_JUNCTION_SEC = 30;
/** ~250m — avoids missed junctions when route points are sparse */
const JUNCTION_TRIGGER_RADIUS_KM = 0.25;
const TRIP_CLEANUP_DELAY_MS = 1000;

/** @type {Map<string, any>} */
const trips = new Map();
/** @type {Map<string, string>} driverUsername -> socket.id */
const driverSocketById = new Map();

function sampleJunctions(coordinates, max) {
  if (!coordinates?.length) return [];
  if (coordinates.length <= max) {
    return coordinates.map((c, i) => ({
      id: `junction-${i}`,
      lng: c[0],
      lat: c[1],
    }));
  }
  const out = [];
  const step = Math.max(1, Math.floor(coordinates.length / max));
  for (let i = 0; i < coordinates.length && out.length < max; i += step) {
    const c = coordinates[i];
    out.push({ id: `junction-${out.length}`, lng: c[0], lat: c[1] });
  }
  return out;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function checkJunctionProximityAndSignal(trip) {
  const coords = trip.routeCoordinates;
  if (!coords?.length || trip.currentRouteIndex == null) return;
  const [lng, lat] = coords[trip.currentRouteIndex];
  for (const j of trip.junctions) {
    if (trip.triggeredJunctions.has(j.id)) continue;
    const d = haversineKm(lat, lng, j.lat, j.lng);
    if (d < JUNCTION_TRIGGER_RADIUS_KM) {
      trip.triggeredJunctions.add(j.id);
      trip.timeSaved += TIME_SAVED_PER_JUNCTION_SEC;
      trip.signalStates[j.id] = 'GREEN';
      io.emit('signal_update', {
        tripId: trip.tripId,
        junctionId: j.id,
        state: 'GREEN',
      });
      io.emit('time_saved_update', {
        tripId: trip.tripId,
        timeSaved: trip.timeSaved,
      });
    }
  }
}

function emitVehicleProgressFromTrip(trip) {
  const coords = trip.routeCoordinates;
  const idx = trip.currentRouteIndex;
  if (!coords?.length || idx == null || idx < 0 || idx >= coords.length) return;
  const [lng, lat] = coords[idx];
  io.emit('vehicle_progress', {
    tripId: trip.tripId,
    driverId: trip.driverId,
    index: idx,
    lat,
    lng,
    speed: 55,
  });
}

function scheduleTripCleanup(tripId, trip) {
  if (trip.cleanupScheduled) return;
  trip.cleanupScheduled = true;
  const driverId = trip.driverId;
  setTimeout(() => {
    trips.delete(tripId);
    io.emit('trip_cleanup', { tripId, driverId });
  }, TRIP_CLEANUP_DELAY_MS);
}

async function geocodeAddress(text) {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTE_API_KEY}&text=${encodeURIComponent(
    text.trim()
  )}&size=1`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Geocode HTTP ${response.status}`);
  const data = await response.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) throw new Error('No geocode result');
  return coords;
}

async function fetchRouteLngLat(start, end) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTE_API_KEY}&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
    },
  });
  if (!response.ok) throw new Error(`Directions HTTP ${response.status}`);
  const data = await response.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error('No route geometry');
  return coords;
}

io.on('connection', (socket) => {
console.log('🔌 User connected:', socket.id);

  socket.on('register', (payload) => {
    console.log('📝 Register attempt:', payload);
    const role = payload?.role;
    const driverId = payload?.driverId;
    socket.data.role = role;
    socket.data.driverId = driverId;
    if (role === 'admin') {
      socket.join('admins');
      console.log('👑 Admin joined admins room:', socket.id, payload.driverId || 'no-driverId');
    }
    if (role === 'driver' && driverId) {
      socket.join('drivers');
      driverSocketById.set(driverId, socket.id);
    }
  });

  socket.on('trip_request', (payload) => {
    console.log('🚑 TRIP REQUEST RECEIVED from socket', socket.id, 'payload:', payload);
    const source = (payload?.source || '').trim();
    const destination = (payload?.destination || '').trim();
    const driverId = payload?.driverId;

    if (!source || !destination || !driverId) return;
    if (socket.data.role !== 'driver' || socket.data.driverId !== driverId) return;

    for (const t of trips.values()) {
      if (t.driverId === driverId && (t.status === 'pending' || t.status === 'approved' || t.status === 'active')) {
        return;
      }
    }

    const tripId = crypto.randomUUID();
    trips.set(tripId, {
      tripId,
      driverId,
      source,
      destination,
      status: 'pending',
      routeCoordinates: null,
      junctions: [],
      triggeredJunctions: new Set(),
      timeSaved: 0,
      signalStates: {},
    });

    console.log('📢 Broadcasting trip_request to admins room. Socket.rooms:', Array.from(socket.rooms));
    console.log('🔍 Admin sockets in room:', io.sockets.adapter.rooms.get('admins')?.size || 0);
    io.to('admins').emit('trip_request', {
      tripId,
      driverId,
      source,
      destination,
    });
  });

  socket.on('trip_approved', async (payload) => {
    if (socket.data.role !== 'admin') return;
    const tripId = payload?.tripId;
    const trip = trips.get(tripId);
    if (!trip || trip.status !== 'pending') return;

    try {
      const start = await geocodeAddress(trip.source);
      const end = await geocodeAddress(trip.destination);
      const coordinates = await fetchRouteLngLat(start, end);
      const junctions = sampleJunctions(coordinates, MAX_JUNCTION_MARKERS);

      trip.status = 'approved';
      trip.routeCoordinates = coordinates;
      trip.junctions = junctions;
      trip.triggeredJunctions = new Set();
      trip.timeSaved = 0;
      trip.signalStates = {};
      trip.currentRouteIndex = 0;
      trip.cleanupScheduled = false;

      const routePayload = {
        tripId,
        driverId: trip.driverId,
        route: {
          coordinates,
          junctions,
        },
      };

      io.emit('route_data', routePayload);
    } catch (err) {
      console.error('Route generation failed:', err.message);
      const driverId = trip.driverId;
      const reason = err.message || 'Could not build route';
      trips.delete(tripId);
      io.emit('trip_rejected', {
        tripId,
        driverId,
        reason,
      });
    }
  });

  socket.on('trip_rejected', (payload) => {
    if (socket.data.role !== 'admin') return;
    const tripId = payload?.tripId;
    const trip = trips.get(tripId);
    if (!trip || trip.status !== 'pending') return;

    trips.delete(tripId);
    const ds = driverSocketById.get(trip.driverId);
    if (ds) io.to(ds).emit('trip_rejected', { tripId, reason: 'Rejected by traffic control' });
  });

  socket.on('trip_active', (payload) => {
    const tripId = payload?.tripId;
    const driverId = payload?.driverId;
    const trip = trips.get(tripId);
    if (!trip || trip.driverId !== driverId) return;
    if (socket.data.role !== 'driver' || socket.data.driverId !== driverId) return;
    if (trip.status !== 'approved') return;
    trip.status = 'active';
    trip.currentRouteIndex = 0;
    trip.cleanupScheduled = false;
    checkJunctionProximityAndSignal(trip);
    emitVehicleProgressFromTrip(trip);
    io.emit('trip_status', { tripId, status: 'ACTIVE', driverId });
    if (trip.routeCoordinates.length <= 1) {
      scheduleTripCleanup(tripId, trip);
    }
  });

  /** Driver requests one simulation step; server owns index + lat/lng + junction triggers */
  socket.on('trip_tick', (data) => {
    const { tripId, driverId } = data || {};
    const trip = trips.get(tripId);
    if (!trip || trip.driverId !== driverId) return;
    if (socket.data.role !== 'driver' || socket.data.driverId !== driverId) return;
    if (trip.status !== 'active') return;

    const coords = trip.routeCoordinates;
    if (!coords?.length) return;

    let idx = trip.currentRouteIndex ?? 0;
    if (idx >= coords.length - 1) {
      return;
    }

    idx += 1;
    trip.currentRouteIndex = idx;
    checkJunctionProximityAndSignal(trip);
    emitVehicleProgressFromTrip(trip);

    if (idx >= coords.length - 1) {
      scheduleTripCleanup(tripId, trip);
    }
  });

  socket.on('driverLocation', (data) => {
    io.emit('adminUpdate', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    const did = socket.data.driverId;
    if (did && driverSocketById.get(did) === socket.id) {
      driverSocketById.delete(did);
    }
  });
});

app.get('/', (req, res) => res.send('Server is Running!'));

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
