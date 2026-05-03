'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { JunctionPoint, VehicleMapPosition } from '@/lib/trip-types'

type SignalState = 'GREEN' | 'RED' | string

type LiveTripMapProps = {
  routeCoordinates: [number, number][]
  junctions: JunctionPoint[]
  /** From vehicle_progress only; null clears the vehicle marker */
  vehiclePosition: VehicleMapPosition | null
  signalStates: Record<string, SignalState>
  /** When false, map still centers but shows empty route */
  fitRoute?: boolean
}

export default function LiveTripMap({
  routeCoordinates,
  junctions,
  vehiclePosition,
  signalStates,
  fitRoute = true,
}: LiveTripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const vehicleMarker = useRef<maplibregl.Marker | null>(null)
  const junctionMarkersRef = useRef<maplibregl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    const mapStyle = 'https://api.maptiler.com/maps/basic-v2/style.json?key=BgoYrCzPegevrMw1X6ME'
    const fallbackStyle = 'https://demotiles.maplibre.org/style.json'

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [78.0322, 30.3165],
      zoom: 13,
    })

    map.current.on('error', (e) => {
      console.warn('Map style error, falling back to default:', e)
      if (map.current && map.current.getStyle().name !== 'fallback') {
        map.current.setStyle(fallbackStyle)
      }
    })

    map.current.on('load', () => {
      if (!map.current) return
      map.current.addSource('live-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] },
        },
      })
      map.current.addLayer({
        id: 'live-route-line',
        type: 'line',
        source: 'live-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 6 },
      })
      setMapReady(true)
    })

    return () => {
      junctionMarkersRef.current.forEach((m) => m.remove())
      junctionMarkersRef.current = []
      vehicleMarker.current?.remove()
      vehicleMarker.current = null
      map.current?.remove()
      map.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !map.current) return

    const coords = routeCoordinates.length
      ? routeCoordinates
      : []
    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: coords,
      },
    }
    const src = map.current.getSource('live-route') as maplibregl.GeoJSONSource
    src.setData(geojson)

    if (fitRoute && coords.length > 1) {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as maplibregl.LngLatLike),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      )
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 })
    }
  }, [mapReady, routeCoordinates, fitRoute])

  useEffect(() => {
    if (!mapReady || !map.current) return

    junctionMarkersRef.current.forEach((m) => m.remove())
    junctionMarkersRef.current = []

    junctions.forEach((j) => {
      const state = signalStates[j.id]
      let fill = '#94a3b8'
      if (state === 'GREEN') fill = '#22c55e'
      else if (state === 'RED') fill = '#ef4444'
      const el = document.createElement('div')
      el.style.width = '14px'
      el.style.height = '14px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid #0f172a'
      el.style.backgroundColor = fill
      el.title = state != null ? `Signal: ${state} (server)` : 'Signal: not yet reported'

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([j.lng, j.lat])
        .addTo(map.current!)
      junctionMarkersRef.current.push(marker)
    })
  }, [mapReady, junctions, signalStates])

  useEffect(() => {
    if (!mapReady || !map.current) return

    if (!vehiclePosition) {
      vehicleMarker.current?.remove()
      vehicleMarker.current = null
      return
    }

    if (!vehicleMarker.current) {
      const el = document.createElement('div')
      el.style.width = '18px'
      el.style.height = '18px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = '#ef4444'
      el.style.border = '3px solid #fff'
      el.style.boxShadow = '0 0 12px rgba(239,68,68,0.8)'
      el.title = `Vehicle · route index ${vehiclePosition.index} (from server)`

      vehicleMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([vehiclePosition.lng, vehiclePosition.lat])
        .addTo(map.current)
    } else {
      vehicleMarker.current.getElement().title = `Vehicle · route index ${vehiclePosition.index} (from server)`
      vehicleMarker.current.setLngLat([vehiclePosition.lng, vehiclePosition.lat])
    }
  }, [mapReady, vehiclePosition])

  return <div ref={mapContainer} className="h-full min-h-[420px] w-full rounded-md" />
}
