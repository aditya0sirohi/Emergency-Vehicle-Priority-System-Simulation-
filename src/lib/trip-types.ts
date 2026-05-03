export type TripPhase = 'IDLE' | 'REQUESTED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED'

export type JunctionPoint = {
  id: string
  lng: number
  lat: number
}

export type RoutePayload = {
  coordinates: [number, number][]
  junctions: JunctionPoint[]
}

export type TripRequestPayload = {
  tripId: string
  driverId: string
  source: string
  destination: string
}

export type RouteDataPayload = {
  tripId: string
  driverId: string
  route: RoutePayload
}

/** Emitted by backend on vehicle_progress — clients must not derive lat/lng from the route locally */
export type VehicleProgressPayload = {
  tripId: string
  driverId: string
  index: number
  lat: number
  lng: number
  speed?: number
}

/** Marker state: only updated from VehicleProgressPayload */
export type VehicleMapPosition = {
  lat: number
  lng: number
  index: number
}

/** Emitted by backend on signal_update — do not infer RED/GREEN locally */
export type SignalUpdatePayload = {
  tripId: string
  junctionId: string
  state: string
}

/** Emitted by backend on time_saved_update */
export type TimeSavedUpdatePayload = {
  tripId: string
  timeSaved: number
}
