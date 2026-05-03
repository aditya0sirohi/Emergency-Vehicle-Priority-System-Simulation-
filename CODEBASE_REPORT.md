# 🚑 Emergency Vehicle Priority System - Comprehensive Codebase Report

**Project Name:** Green Corridor  
**Version:** 0.1.0  
**Current Date:** April 23, 2026  
**Status:** Development Phase

---

## 📋 Executive Summary

**Green Corridor** is an AI-driven **Vehicle-to-Everything (V2X) communication system** designed to optimize emergency vehicle routing and dynamically manage traffic for ambulances and other emergency vehicles. The system reduces response times by leveraging real-time route optimization, dynamic traffic signal adjustment, and alerts to nearby vehicles and pedestrians.

**Core Objective:** Enable faster emergency vehicle response times through intelligent traffic management and real-time alerts within a 10 km radius of the emergency vehicle's path.

---

## 🎯 Project Aim & Vision

### Primary Goals:
1. **Reduce Emergency Response Times** - Deploy AI-powered routing to minimize travel duration
2. **Intelligent Traffic Control** - Dynamically adjust traffic signals to create clear corridors
3. **Real-Time Notifications** - Alert drivers and pedestrians within a 10 km radius
4. **Scalable & Secure Communication** - Implement IEEE standards for V2X communication (802.11p, 1609, 5G-V2X)
5. **Multi-Role Management** - Support different user roles (Admin, Ambulance Drivers) with role-based access

### Expected Benefits:
- **Social Impact:** Reduced loss of life during emergencies
- **Economic Impact:** Lower fuel costs and reduced traffic congestion
- **Community Impact:** Enhanced emergency system reliability and public trust

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Pages: Home / Login / Admin Dashboard / Driver Dashboard │  │
│  │ Components: MapLibre Map, Toast Notifications            │  │
│  │ Communication: Socket.IO (Real-time Updates)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────┬──────────────────────┘
                                          │ Real-time Events via WebSocket
                                          │ API Requests (REST)
┌─────────────────────────────────────────▼──────────────────────┐
│                    Backend (Express.js + Node.js)               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Socket.IO Server (Real-time communication)               │  │
│  │ REST API Endpoints:                                       │  │
│  │  - POST /api/login (User authentication)                 │  │
│  │  - GET /api/directions (Route calculation)               │  │
│  │  - POST /api/matrix-distances (Distance matrix)          │  │
│  │ Database Models: User, Vehicle, Route                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────┬──────────────────────┘
                                          │ Database Queries
                                          │
┌─────────────────────────────────────────▼──────────────────────┐
│              Database (MongoDB Cloud)                            │
│                                                                   │
│  Collections:                                                    │
│  ├─ Users (usernames, passwords, roles, vehicle data)          │
│  └─ Vehicles & Routes (real-time tracking data)                │
└─────────────────────────────────────────────────────────────────┘

External APIs:
│
├─ OpenRouteService (OSRM-compatible routing engine)
│   ├─ Directions API: Calculate optimal routes
│   └─ Matrix API: Calculate distance matrices
│
└─ MapTiler (Map tile provider)
    └─ Renders background maps with real-time overlays
```

### Technology Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript, MapLibre GL, Tailwind CSS | User interface, map visualization, real-time updates |
| **Backend** | Express.js, Node.js, Socket.IO, Mongoose | API handling, real-time communication, database management |
| **Database** | MongoDB Cloud (Atlas) | Data persistence for users, vehicles, routes |
| **External APIs** | OpenRouteService, MapTiler | Route optimization and map rendering |
| **Communication** | HTTP/REST, WebSocket (Socket.IO) | Synchronous and asynchronous communication |
| **Standards** | IEEE 802.11p (DSRC), IEEE 1609 (Secure V2X), IEEE 2040 | Secure vehicular communication standards |

---

## 📁 Project Structure & File Organization

### Frontend Structure (Next.js)
```
src/
├── app/
│   ├── layout.tsx                    # Global layout wrapper
│   ├── page.tsx                      # Homepage (Green Corridor welcome screen)
│   ├── globals.css                   # Global styles
│   ├── login/
│   │   └── page.tsx                  # Authentication page (Admin/Driver login)
│   ├── admin/
│   │   └── page.tsx                  # Admin dashboard (monitor all vehicles)
│   ├── driver/
│   │   └── page.tsx                  # Driver dashboard (driver-specific view)
│   └── api/
│       ├── directions/
│       │   └── route.ts              # API endpoint for route calculation (OpenRouteService)
│       └── matrix-distances/
│           └── route.ts              # API endpoint for distance matrix calculation
├── components/
│   ├── map.tsx                       # MapLibre map component (main visualization)
│   ├── toast.tsx                     # Notification/alert component
│   └── ui/
│       ├── alert.tsx                 # UI alert component
│       ├── button.tsx                # Reusable button component
│       └── card.tsx                  # Reusable card component
├── hooks/
│   └── use-route.ts                  # Custom hook for route calculation logic
└── lib/
    └── utils.ts                      # Utility functions

utils/
└── distance.ts                       # Distance calculation utilities

Config Files:
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── eslint.config.mjs                 # ESLint configuration
├── postcss.config.mjs                # PostCSS configuration
└── components.json                   # Component library configuration
```

### Backend Structure (Express + Node.js)
```
backend/
├── server.js                         # Main Express server & Socket.IO setup
├── package.json                      # Backend dependencies
├── seed.js                           # Database seeding script
└── models/
    └── user.js                       # User schema (Mongoose)
```

---

## 🔄 Data Flow & Communication Patterns

### 1. **Authentication Flow**
```
User (Frontend)
    │
    ├─ POST /api/login (username, password)
    │
Backend
    │
    ├─ Query MongoDB: User.findOne({ username })
    │
    ├─ Validate password
    │
    └─ Return { success, role, userId } to Frontend
    │
Frontend
    │
    └─ Route to /admin or /driver based on role
```

### 2. **Real-Time Location Update Flow**
```
Ambulance Driver (Frontend)
    │
    ├─ Emits: 'driverLocation' via Socket.IO
    │   └─ { vehicleId, lat, lng, heading, speed }
    │
Backend Socket Server
    │
    ├─ Receives: 'driverLocation'
    │
    └─ Broadcasts: 'adminUpdate' to all connected clients
    │
Admin Dashboard (Frontend)
    │
    └─ Updates vehicle markers on map
```

### 3. **Route Calculation Flow**
```
User clicks: "Start Simulation" (Frontend)
    │
    ├─ Generate start & end coordinates
    │
    ├─ GET /api/directions?startLng=X&startLat=Y&endLng=Z&endLat=W
    │
Backend API
    │
    ├─ Forward request to OpenRouteService
    │   └─ API Key: 5b3ce3597851110001cf62484720627ea924407099674626b693b31c
    │
    └─ Return optimized route (array of waypoints)
    │
Frontend
    │
    ├─ Display route on MapLibre map
    │
    └─ Animate ambulance along route
```

### 4. **Distance Matrix Calculation Flow**
```
Admin Dashboard (Frontend)
    │
    ├─ POST /api/matrix-distances
    │   └─ { locations: [[lng, lat], ...], metrics: ["distance", "duration"] }
    │
Backend API
    │
    ├─ Forward request to OpenRouteService Matrix API
    │
    └─ Return distance matrix for route optimization
    │
Frontend
    │
    └─ Use matrix to identify nearest hospitals, traffic options, etc.
```

---

## 💾 Database Schema

### User Model (MongoDB)
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (required),
  role: Enum['admin', 'ambulance'],
  vehicleNumber: String (only for ambulance drivers),
  createdAt: Date,
  updatedAt: Date
}
```

**Example Records:**
- Admin: `{ username: 'admin1', password: 'admin123', role: 'admin' }`
- Driver: `{ username: 'driver1', password: 'pass123', role: 'ambulance', vehicleNumber: 'MH-01-AB-1234' }`

---

## 🎨 Frontend Features

### Pages

| Page | Route | Purpose | User Role |
|------|-------|---------|-----------|
| **Homepage** | `/` | Welcome screen with "Launch System" button | Public |
| **Login** | `/login` | Authentication for Admin and Ambulance drivers | Public |
| **Admin Dashboard** | `/admin` | Monitor all ambulances, adjust traffic signals, view real-time updates | Admin |
| **Driver Dashboard** | `/driver` | View current route, vehicle status, alerts | Ambulance Driver |

### Key Components

#### **Map Component** (`map.tsx`)
- **Purpose:** Real-time visualization of emergency vehicles, routes, and traffic
- **Features:**
  - MapLibre GL for rendering (centered on Dehradun, India: 30.3165°N, 78.0322°E)
  - Route display as animated line (blue color: #3b82f6)
  - Ambulance marker animation along calculated route
  - Random vehicle generation for simulation
  - Vehicle alert notifications when approaching

#### **Toast Component** (`toast.tsx`)
- **Purpose:** Display real-time notifications
- **Features:**
  - Notifications for vehicle alerts, route changes, signal adjustments

#### **useRoute Hook** (`use-route.ts`)
- **Purpose:** Encapsulate route calculation logic
- **Features:**
  - Takes start and end coordinates as input
  - Calculates route with 10 intermediate waypoints
  - Handles loading and error states
  - Currently uses linear interpolation; can be replaced with actual API calls

---

## 🔌 API Endpoints

### Authentication
```
POST /api/login
Request: { username: string, password: string }
Response: { success: boolean, role: 'admin' | 'ambulance', userId: string }
Status Codes: 200 (success), 401 (unauthorized), 500 (server error)
```

### Route Calculation
```
GET /api/directions
Query Params: startLng, startLat, endLng, endLat
Response: { type: 'Feature', routes: [...] }
External: OpenRouteService v2/directions/driving-car
Status Codes: 200 (success), 400 (missing params), 500 (server error)
```

### Distance Matrix
```
POST /api/matrix-distances
Request Body: { locations: [[lng, lat], ...], metrics: ['distance', 'duration'] }
Response: { distances: [[...]], durations: [[...]] }
External: OpenRouteService v2/matrix/driving-car
Status Codes: 200 (success), 400 (bad request), 500 (server error)
```

### Real-Time Events (WebSocket)
```
Socket Events (Socket.IO):
- 'driverLocation' (emit from Driver → Backend)
  Payload: { vehicleId: string, lat: number, lng: number }
  
- 'adminUpdate' (broadcast from Backend → All clients)
  Payload: { vehicleId: string, lat: number, lng: number }
  
- 'connection' (new client connects)
  Payload: { socket.id: string }
  
- 'disconnect' (client disconnects)
  Payload: logs disconnection
```

---

## 🔐 Security & Current Limitations

### Current Security Measures:
- ✅ CORS enabled (only localhost:3000 allowed)
- ✅ Role-based access control (Admin vs Driver)
- ✅ MongoDB connection with Mongoose validation

### Security Gaps (To Be Addressed):
- ⚠️ **Plaintext Passwords:** Passwords stored without hashing (needs bcrypt)
- ⚠️ **No JWT/Session Tokens:** Authentication is basic; should implement JWT
- ⚠️ **Exposed API Keys:** OpenRouteService API key hardcoded in frontend
- ⚠️ **No Input Validation:** Missing data validation for API requests
- ⚠️ **No Rate Limiting:** APIs lack rate limit protection
- ⚠️ **No HTTPS/TLS:** Currently HTTP-only; needs SSL/TLS in production

---

## 🚀 Technology Details

### Frontend Technologies

**Next.js 15**
- Server-side rendering and static generation
- File-based routing system
- Built-in API routes for backend calls

**React 19 + TypeScript**
- Component-based UI
- Type safety throughout codebase
- Custom hooks for logic reusability

**MapLibre GL 4.7.1**
- Open-source alternative to Mapbox GL
- Vector tile rendering
- GeoJSON support for displaying routes

**Tailwind CSS 3.4.1**
- Utility-first CSS framework
- Integrated with PostCSS for processing
- Responsive design utilities

**Socket.IO 4.8.3**
- Real-time, bidirectional communication
- Fallback to polling if WebSocket unavailable
- Automatic reconnection handling

### Backend Technologies

**Express.js 5.2.1**
- Lightweight web application framework
- Middleware support for CORS, JSON parsing
- RESTful API design

**Node.js**
- Asynchronous, event-driven runtime
- Non-blocking I/O for scalability

**MongoDB + Mongoose 9.1.2**
- NoSQL document database
- Schema validation via Mongoose ODM
- Cloud hosting on MongoDB Atlas

**Socket.IO 4.8.3**
- Handles WebSocket connections
- Broadcasts events to multiple clients

---

## 📊 Current Simulation Features

### Map Simulation
- **Location:** Dehradun, India (30.3165°N, 78.0322°E)
- **Route Generation:** Randomly generated routes within city bounds
- **Vehicle Animation:** Ambulance moves along calculated route in real-time
- **Vehicle Alerts:** Random vehicle generation simulates nearby traffic

### What Happens During Simulation:
1. Start coordinate is randomly generated near user
2. End coordinate is randomly generated at distance
3. Route is calculated (currently linear interpolation with 10 waypoints)
4. Ambulance marker animates along route
5. Background vehicles update periodically
6. Real-time notifications alert when vehicles approach

---

## 🔄 Use Case Workflows

### Workflow 1: Ambulance Routes Emergency Call
```
1. Admin receives emergency alert
2. Clicks "Start Simulation" on admin dashboard
3. System calculates optimal route to destination
4. Ambulance driver receives directions
5. Map displays route in blue
6. Real-time notifications sent to nearby vehicles
7. Traffic lights adjust in route corridor
8. Ambulance reaches destination (alert cleared)
```

### Workflow 2: Multi-Vehicle Coordination
```
1. Multiple ambulances available
2. Admin uses distance matrix API to calculate ETA from each
3. Nearest ambulance is dispatched
4. Multiple routes displayed on map (different colors)
5. Admin monitors all vehicles in real-time via Socket.IO
6. Notifications sent to nearby drivers within 10 km radius
```

---

## 🚦 V2X Communication Standards

### IEEE 802.11p (DSRC - Dedicated Short Range Communications)
- **Frequency:** 5.9 GHz band
- **Range:** 300-1000 meters
- **Purpose:** Low-latency emergency vehicle communication
- **Use Case:** Direct ambulance-to-traffic light communication

### IEEE 1609.x (Wireless Standards for Vehicular Communication)
- **Standard Set:** Security, Message Operations, Resource Management
- **Purpose:** Secure V2X data exchange
- **Implementation:** Ensures authenticity and privacy of emergency alerts

### IEEE 2040 (Traffic Management Automation)
- **Purpose:** Automated coordination between vehicles and infrastructure
- **Use Case:** Dynamic traffic signal adjustment based on vehicle proximity

### 5G-V2X (Cellular V2X)
- **Architecture:** Leverages 5G networks for wider coverage
- **Advantage:** Better coverage than DSRC in dense urban areas
- **Future Enhancement:** Integrate for nationwide connectivity

---

## 📈 Performance Considerations

### Current Limitations:
- Map simulation may be CPU-intensive with many vehicles
- Socket.IO broadcasts to all connected clients (scales O(n) with connections)
- Linear interpolation route calculation is simplistic

### Optimization Opportunities:
1. **Client-side map rendering:** Use Web Workers for animation calculations
2. **Efficient broadcasting:** Implement spatial partitioning to broadcast only to nearby clients
3. **Route caching:** Cache frequently requested routes
4. **Geospatial indexing:** Use MongoDB geospatial indexes for proximity queries
5. **Message compression:** Compress Socket.IO payloads for reduced bandwidth

---

## 🛠️ Development Setup

### Prerequisites:
- Node.js 18+ (LTS recommended)
- MongoDB Cloud account (Atlas)
- Next.js 15 installed
- npm or yarn package manager

### Frontend Installation:
```bash
npm install
npm run dev  # Runs on http://localhost:3000
```

### Backend Installation:
```bash
cd backend
npm install
npm run dev  # Runs on http://localhost:5000
```

### Environment Variables (.env):
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/emergency-vehicle-db
```

---

## 🎯 Future Development Roadmap

### Phase 1 (Current):
- ✅ Basic authentication
- ✅ Real-time map visualization
- ✅ Socket.IO communication
- ⏳ Route calculation UI

### Phase 2 (Planned):
- [ ] JWT authentication + password hashing (bcrypt)
- [ ] Advanced route optimization (Dijkstra, A*)
- [ ] Traffic light API integration
- [ ] Geofencing for alerts
- [ ] Multi-language support

### Phase 3 (Future):
- [ ] Mobile application (React Native)
- [ ] ML-based traffic prediction
- [ ] Hardware integration (IoT sensors, traffic lights)
- [ ] Compliance with IEEE V2X standards
- [ ] Scalability for multiple cities

---

## 📚 References & Standards

1. **IEEE 802.11p:** Wireless Access in Vehicular Environments (WAVE)
2. **IEEE 1609:** Wireless Standards for Vehicular Communication
3. **IEEE 2040:** Automation for Traffic Management Systems
4. **5G-V2X:** 3GPP Cellular Vehicle-to-Everything standard
5. **OpenRouteService:** OSRM-compatible open-source routing engine
6. **MapLibre GL:** Open-source web mapping library

---

## 🤝 Key Stakeholders & Roles

| Role | Responsibilities | Dashboard |
|------|-----------------|-----------|
| **Admin** | Monitor all ambulances, manage traffic coordination, view real-time metrics | `/admin` |
| **Ambulance Driver** | Receive route guidance, respond to navigation alerts | `/driver` |
| **Traffic Management Authority** | Configure traffic signal adjustments, manage priority corridors | `/admin` (extended) |
| **General Public** | Receive notifications when ambulance approaching | Mobile alerts (future) |

---

## 📞 Support & Debugging

### Common Issues:
1. **Map not loading:** Check MapTiler API key in `map.tsx`
2. **Cannot connect to backend:** Verify `http://localhost:5000` is running
3. **MongoDB connection error:** Confirm `MONGO_URI` in `.env` file
4. **Socket.IO not updating:** Check browser console for WebSocket errors

### Debugging Commands:
```bash
# Check if backend is running
curl http://localhost:5000/

# Test login API
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123"}'

# Check MongoDB connection
node backend/server.js  # Should show "MongoDB Connected Successfully!"
```

---

## 📄 Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | April 23, 2026 | Initial comprehensive codebase documentation |

---

**Generated:** April 23, 2026  
**Last Updated:** April 23, 2026  
**Status:** Ready for Multi-Agent Collaboration
