import type { RoutePayload } from '@/lib/trip-types'

/** Deep-enough copy so React state does not share mutable references with the socket payload */
export function cloneRoutePayloadForState(route: RoutePayload): RoutePayload {
  return {
    coordinates: route.coordinates.map((c) => [c[0], c[1]] as [number, number]),
    junctions: route.junctions.map((j) => ({
      id: j.id,
      lng: j.lng,
      lat: j.lat,
    })),
  }
}
