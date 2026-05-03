"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { cloneRoutePayloadForState } from "@/lib/route-sync";
import type {
  JunctionPoint,
  RouteDataPayload,
  SignalUpdatePayload,
  TripPhase,
  VehicleMapPosition,
  VehicleProgressPayload,
} from "@/lib/trip-types";

const LiveTripMap = dynamic(() => import("@/components/live-trip-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-md bg-slate-900 text-slate-500">
      Loading map…
    </div>
  ),
});

const SOCKET_URL = "http://localhost:5000";
const MIN_PLACE_LEN = 2;
/** Target wall-clock time to traverse the polyline (movement pacing scales with point count) */
const EXPECTED_TRIP_DURATION_MS = 58_000;
const MIN_TICK_MS = 380;

const transitions: Record<TripPhase, TripPhase[]> = {
  IDLE: ["REQUESTED"],
  REQUESTED: ["APPROVED", "IDLE", "COMPLETED"],
  APPROVED: ["ACTIVE", "IDLE", "COMPLETED"],
  ACTIVE: ["COMPLETED", "IDLE"],
  COMPLETED: ["IDLE"],
};

function canTransition(from: TripPhase, to: TripPhase): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export default function DriverPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const phaseRef = useRef<TripPhase>("IDLE");
  const tripIdRef = useRef<string | null>(null);
  const routeCoordsRef = useRef<[number, number][]>([]);
  const junctionsRef = useRef<JunctionPoint[]>([]);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beginTripLockRef = useRef(false);
  const requestInFlightRef = useRef(false);

  const [phase, setPhase] = useState<TripPhase>("IDLE");
  const [tripStartCommitted, setTripStartCommitted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [junctions, setJunctions] = useState<JunctionPoint[]>([]);
  /** Remount map when backend sends a new trip route so prior geometry/markers never linger */
  const [routeSyncTripId, setRouteSyncTripId] = useState<string | null>(null);
  const [vehiclePosition, setVehiclePosition] = useState<VehicleMapPosition | null>(null);
  const [signalStates, setSignalStates] = useState<Record<string, string>>({});

  const safeSetPhase = useCallback((next: TripPhase) => {
    setPhase((prev) => {
      if (!canTransition(prev, next)) return prev;
      phaseRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTickInterval = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  const resetTripUi = useCallback(() => {
    clearTickInterval();
    tripIdRef.current = null;
    routeCoordsRef.current = [];
    junctionsRef.current = [];
    beginTripLockRef.current = false;
    requestInFlightRef.current = false;
    setTripStartCommitted(false);
    setRouteCoordinates([]);
    setJunctions([]);
    setRouteSyncTripId(null);
    setVehiclePosition(null);
    setSignalStates({});
    setSource("");
    setDestination("");
    setError(null);
    phaseRef.current = "IDLE";
    setPhase("IDLE");
  }, [clearTickInterval]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role !== "ambulance") {
      router.push("/login");
      return;
    }

    const driverId = localStorage.getItem("username") || "";
    const socket = io(SOCKET_URL, { autoConnect: true });
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      socket.emit("register", { role: "driver", driverId });
    };
    const onDisconnect = () => setConnected(false);

    const onRouteData = (payload: RouteDataPayload) => {
      if (payload.driverId !== driverId) return;
      if (phaseRef.current !== "REQUESTED") return;

      setVehiclePosition(null);
      setSignalStates({});
      setRouteCoordinates([]);
      setJunctions([]);

      const route = cloneRoutePayloadForState(payload.route);
      tripIdRef.current = payload.tripId;
      routeCoordsRef.current = route.coordinates;
      junctionsRef.current = route.junctions;

      setRouteSyncTripId(payload.tripId);
      setRouteCoordinates(route.coordinates);
      setJunctions(route.junctions);
      setSubmitting(false);
      requestInFlightRef.current = false;
      safeSetPhase("APPROVED");
    };

    const onTripRejected = (payload: { tripId?: string; driverId?: string; reason?: string }) => {
      if (payload.driverId && payload.driverId !== driverId) return;
      const ph = phaseRef.current;
      if (ph !== "REQUESTED" && ph !== "APPROVED" && ph !== "ACTIVE") return;

      clearTickInterval();
      setSubmitting(false);
      requestInFlightRef.current = false;
      beginTripLockRef.current = false;
      setTripStartCommitted(false);
      tripIdRef.current = null;
      setRouteSyncTripId(null);
      setRouteCoordinates([]);
      setJunctions([]);
      setVehiclePosition(null);
      safeSetPhase("IDLE");
      setError(payload.reason || "Trip was rejected or route could not be built.");
    };

    const onVehicleProgress = (data: VehicleProgressPayload) => {
      if (data.driverId !== driverId) return;
      if (data.tripId !== tripIdRef.current) return;
      setVehiclePosition({
        lat: data.lat,
        lng: data.lng,
        index: data.index,
      });
    };

    const onSignalUpdate = (data: SignalUpdatePayload) => {
      if (data.tripId !== tripIdRef.current) return;
      setSignalStates((prev) => ({ ...prev, [data.junctionId]: data.state }));
    };

    const onCleanup = (data: { tripId: string; driverId: string }) => {
      if (data.driverId !== driverId) return;
      setVehiclePosition(null);
      resetTripUi();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("route_data", onRouteData);
    socket.on("trip_rejected", onTripRejected);
    socket.on("vehicle_progress", onVehicleProgress);
    socket.on("signal_update", onSignalUpdate);
    socket.on("trip_cleanup", onCleanup);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("route_data", onRouteData);
      socket.off("trip_rejected", onTripRejected);
      socket.off("vehicle_progress", onVehicleProgress);
      socket.off("signal_update", onSignalUpdate);
      socket.off("trip_cleanup", onCleanup);
      socket.disconnect();
      socketRef.current = null;
      clearTickInterval();
    };
  }, [router, resetTripUi, safeSetPhase, clearTickInterval]);

  const requestRoute = () => {
    setError(null);
    const s = source.trim();
    const d = destination.trim();
    if (!s || !d) {
      setError("Enter both source and destination.");
      return;
    }
    if (s.length < MIN_PLACE_LEN || d.length < MIN_PLACE_LEN) {
      setError(`Source and destination must be at least ${MIN_PLACE_LEN} characters.`);
      return;
    }
    if (s.toLowerCase() === d.toLowerCase()) {
      setError("Source and destination must be different.");
      return;
    }
    const socket = socketRef.current;
    const driverId = localStorage.getItem("username") || "";
    if (!socket?.connected) {
      setError("Not connected to server.");
      return;
    }
    if (phaseRef.current !== "IDLE") return;
    if (submitting || requestInFlightRef.current) return;

    requestInFlightRef.current = true;
    setSubmitting(true);
    tripIdRef.current = null;
    safeSetPhase("REQUESTED");

    console.log('🚑 DRIVER EMITTING trip_request:', { source: s, destination: d, driverId });
    socket.emit("trip_request", {
      source: s,
      destination: d,
      driverId,
    });
  };

  const beginTrip = () => {
    if (beginTripLockRef.current) return;
    const socket = socketRef.current;
    const driverId = localStorage.getItem("username") || "";
    const tid = tripIdRef.current;
    if (!socket?.connected || !tid) return;
    if (phaseRef.current !== "APPROVED") return;

    beginTripLockRef.current = true;
    setTripStartCommitted(true);
    socket.emit("trip_active", { tripId: tid, driverId });
    safeSetPhase("ACTIVE");

    const n = routeCoordsRef.current.length;
    const tickMs = Math.max(MIN_TICK_MS, Math.floor(EXPECTED_TRIP_DURATION_MS / Math.max(1, n - 1)));

    clearTickInterval();
    tickIntervalRef.current = setInterval(() => {
      const sock = socketRef.current;
      const id = tripIdRef.current;
      const did = localStorage.getItem("username") || "";
      if (!sock?.connected || !id) {
        clearTickInterval();
        return;
      }
      if (phaseRef.current !== "ACTIVE") {
        clearTickInterval();
        return;
      }
      sock.emit("trip_tick", { tripId: id, driverId: did });
    }, tickMs);
  };

  const statusLabel =
    phase === "IDLE"
      ? "IDLE"
      : phase === "REQUESTED"
        ? "REQUESTED"
        : phase === "APPROVED"
          ? "APPROVED"
          : phase === "ACTIVE"
            ? "ACTIVE"
            : "COMPLETED";

  return (
    <div className="flex min-h-screen flex-col bg-black p-6 text-white">
      <div className="mb-6 flex w-full items-center justify-between border-b border-gray-800 pb-4">
        <h1 className="text-xl font-bold text-slate-400">AMBULANCE INTERFACE</h1>
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${connected ? "animate-pulse bg-green-500" : "bg-red-500"}`}
          />
          <span className="font-mono text-sm text-green-500">
            {connected ? "SOCKET CONNECTED" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Trip state</p>
            <p className="font-mono text-2xl font-bold text-red-400">{statusLabel}</p>
            <p className="mt-2 text-sm text-slate-400">
              Driver:{" "}
              <span className="font-mono text-white">
                {typeof window !== "undefined" ? localStorage.getItem("username") : "—"}
              </span>
            </p>
          </div>

          {phase === "IDLE" || phase === "REQUESTED" ? (
            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Request route
              </h2>
              <p className="text-xs text-slate-500">
                Enter pickup and drop-off. Admin approves before navigation starts.
              </p>
              <div className="space-y-1">
                <label htmlFor="driver-source" className="block text-sm text-slate-400">
                  Source
                </label>
                <input
                  id="driver-source"
                  name="source"
                  type="text"
                  autoComplete="off"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white placeholder-slate-600 focus:border-red-500 focus:outline-none disabled:opacity-60"
                  placeholder="e.g. Clock Tower Dehradun"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={phase === "REQUESTED"}
                  aria-invalid={!!error}
                  aria-describedby={error ? "driver-trip-error" : undefined}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="driver-destination" className="block text-sm text-slate-400">
                  Destination
                </label>
                <input
                  id="driver-destination"
                  name="destination"
                  type="text"
                  autoComplete="off"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white placeholder-slate-600 focus:border-red-500 focus:outline-none disabled:opacity-60"
                  placeholder="e.g. Graphic Era University"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  disabled={phase === "REQUESTED"}
                  aria-invalid={!!error}
                  aria-describedby={error ? "driver-trip-error" : undefined}
                />
              </div>
              {error ? (
                <p id="driver-trip-error" className="text-sm text-amber-400" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={requestRoute}
                disabled={
                  !connected ||
                  phase !== "IDLE" ||
                  submitting ||
                  requestInFlightRef.current ||
                  !source.trim() ||
                  !destination.trim()
                }
                className="w-full rounded-lg bg-red-600 py-3 font-bold text-white transition enabled:hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === "REQUESTED" ? "Request sent — waiting for approval…" : "Request Route"}
              </button>
            </div>
          ) : null}

          {phase === "APPROVED" ? (
            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-slate-300">
                Route approved. Start when ready — the server will own position and junction signals.
              </p>
              <button
                type="button"
                onClick={beginTrip}
                disabled={!connected || tripStartCommitted}
                className="w-full rounded-lg bg-red-600 py-3 font-bold text-white enabled:hover:bg-red-700 disabled:opacity-50"
              >
                Start Trip
              </button>
            </div>
          ) : null}

          {phase === "ACTIVE" ? (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
              <p className="animate-pulse font-bold text-red-400">LIVE — server-synced position</p>
              <p className="mt-2 text-sm text-slate-400">
                Map marker and route index update only from <span className="font-mono">vehicle_progress</span>{" "}
                (no client-side path interpolation).
              </p>
              {vehiclePosition != null ? (
                <p className="mt-2 font-mono text-xs text-slate-500">
                  Server route index: {vehiclePosition.index}
                </p>
              ) : null}
            </div>
          ) : null}

          {phase === "COMPLETED" ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-slate-300">
              Trip completed. Resetting…
            </div>
          ) : null}
        </div>

        <div className="min-h-[420px] overflow-hidden rounded-lg border border-slate-800">
          <LiveTripMap
            key={routeSyncTripId ?? "driver-no-route"}
            routeCoordinates={routeCoordinates}
            junctions={junctions}
            vehiclePosition={vehiclePosition}
            signalStates={signalStates}
            fitRoute={routeCoordinates.length > 0}
          />
        </div>
      </div>
    </div>
  );
}
