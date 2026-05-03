'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cloneRoutePayloadForState } from '@/lib/route-sync'
import type {
  JunctionPoint,
  RouteDataPayload,
  SignalUpdatePayload,
  TimeSavedUpdatePayload,
  TripRequestPayload,
  VehicleMapPosition,
  VehicleProgressPayload,
} from '@/lib/trip-types'

const LiveTripMap = dynamic(() => import('@/components/live-trip-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center bg-muted text-muted-foreground">
      Loading map…
    </div>
  ),
})

const SOCKET_URL = 'http://localhost:5000'

export default function AdminPage() {
  const router = useRouter()
  const socketRef = useRef<Socket | null>(null)
  const modalQueueRef = useRef<TripRequestPayload[]>([])
  const activeTripIdRef = useRef<string | null>(null)

  const [connected, setConnected] = useState(false)
  const [modalTrip, setModalTrip] = useState<TripRequestPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [unitId, setUnitId] = useState<string | null>(null)
  const [tripStatus, setTripStatus] = useState<string>('—')
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [junctions, setJunctions] = useState<JunctionPoint[]>([])
  const [vehiclePosition, setVehiclePosition] = useState<VehicleMapPosition | null>(null)
  const [signalStates, setSignalStates] = useState<Record<string, string>>({})
  const [timeSaved, setTimeSaved] = useState(0)

  useEffect(() => {
    activeTripIdRef.current = activeTripId
  }, [activeTripId])

  const enqueueOrShow = (data: TripRequestPayload) => {
    setModalTrip((current) => {
      if (current) {
        modalQueueRef.current.push(data)
        return current
      }
      return data
    })
  }

  /** Drop all queued modals after a decision so stale requests cannot surface later */
  const finalizeModalAndFlushQueue = () => {
    modalQueueRef.current = []
    setModalTrip(null)
  }

  const resetLiveTrip = () => {
    activeTripIdRef.current = null
    setActiveTripId(null)
    setUnitId(null)
    setTripStatus('—')
    setRouteCoordinates([])
    setJunctions([])
    setVehiclePosition(null)
    setSignalStates({})
    setTimeSaved(0)
  }

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin') {
      router.push('/login')
      return
    }

    const socket = io(SOCKET_URL, { autoConnect: true })
    socketRef.current = socket

    const onConnect = () => {
      console.log('🔌 ADMIN SOCKET CONNECTED');
      setConnected(true)
      console.log('👑 ADMIN EMITTING register {role: admin}');
      socket.emit('register', { role: 'admin' })
    }
    const onDisconnect = () => setConnected(false)

    const onTripRequest = (data: TripRequestPayload) => {
      console.log('👀 ADMIN RECEIVED trip_request:', data);
      enqueueOrShow(data)
    }

    const onRouteData = (payload: RouteDataPayload) => {
      modalQueueRef.current = []
      setModalTrip(null)

      setVehiclePosition(null)
      setSignalStates({})
      setTimeSaved(0)
      setRouteCoordinates([])
      setJunctions([])

      const route = cloneRoutePayloadForState(payload.route)
      activeTripIdRef.current = payload.tripId
      setActiveTripId(payload.tripId)
      setUnitId(payload.driverId)
      setRouteCoordinates(route.coordinates)
      setJunctions(route.junctions)
      setTripStatus('APPROVED')
    }

    const onVehicleProgress = (data: VehicleProgressPayload) => {
      if (data.tripId !== activeTripIdRef.current) return
      setVehiclePosition({
        lat: data.lat,
        lng: data.lng,
        index: data.index,
      })
    }

    const onSignalUpdate = (data: SignalUpdatePayload) => {
      if (data.tripId !== activeTripIdRef.current) return
      setSignalStates((prev) => ({ ...prev, [data.junctionId]: data.state }))
    }

    const onTimeSavedUpdate = (data: TimeSavedUpdatePayload) => {
      if (data.tripId !== activeTripIdRef.current) return
      setTimeSaved(data.timeSaved)
    }

    const onTripCleanup = (data: { tripId: string }) => {
      if (data.tripId !== activeTripIdRef.current) return
      resetLiveTrip()
    }

    const onTripRejectedBroadcast = (data: {
      tripId?: string
      driverId?: string
      reason?: string
    }) => {
      modalQueueRef.current = []
      setModalTrip(null)
      if (data.reason) setError(data.reason)
      if (data.tripId && data.tripId === activeTripIdRef.current) {
        resetLiveTrip()
      }
    }

    const onTripStatus = (data: { tripId: string; status: string }) => {
      if (data.tripId !== activeTripIdRef.current) return
      setTripStatus(data.status)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('trip_request', onTripRequest)
    socket.on('route_data', onRouteData)
    socket.on('vehicle_progress', onVehicleProgress)
    socket.on('signal_update', onSignalUpdate)
    socket.on('time_saved_update', onTimeSavedUpdate)
    socket.on('trip_cleanup', onTripCleanup)
    socket.on('trip_rejected', onTripRejectedBroadcast)
    socket.on('trip_status', onTripStatus)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('trip_request', onTripRequest)
      socket.off('route_data', onRouteData)
      socket.off('vehicle_progress', onVehicleProgress)
      socket.off('signal_update', onSignalUpdate)
      socket.off('time_saved_update', onTimeSavedUpdate)
      socket.off('trip_cleanup', onTripCleanup)
      socket.off('trip_rejected', onTripRejectedBroadcast)
      socket.off('trip_status', onTripStatus)
      socket.disconnect()
      socketRef.current = null
      modalQueueRef.current = []
    }
  }, [router])

  const approveTrip = () => {
    if (!modalTrip || !socketRef.current?.connected) return
    socketRef.current.emit('trip_approved', { tripId: modalTrip.tripId })
    finalizeModalAndFlushQueue()
  }

  const rejectTrip = () => {
    if (!modalTrip || !socketRef.current?.connected) return
    socketRef.current.emit('trip_rejected', { tripId: modalTrip.tripId })
    finalizeModalAndFlushQueue()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">Emergency Vehicle Priority System</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">{connected ? 'Socket connected' : 'Offline'}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <LiveTripMap
                  key={activeTripId ?? 'admin-no-route'}
                  routeCoordinates={routeCoordinates}
                  junctions={junctions}
                  vehiclePosition={vehiclePosition}
                  signalStates={signalStates}
                  fitRoute={routeCoordinates.length > 0}
                />
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  {error}
                  <Button variant="outline" size="sm" className="w-fit" onClick={() => setError(null)}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live unit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Unit ID</p>
                  <p className="font-mono font-medium">{unitId ?? '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trip status</p>
                  <p className="font-mono font-medium">{tripStatus}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time saved (sec)</p>
                  <p className="font-mono text-lg font-bold text-green-600">{timeSaved}</p>
                  <p className="text-xs text-muted-foreground">From time_saved_update only</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Route index (vehicle_progress)</p>
                  <p className="font-mono font-medium">{vehiclePosition != null ? vehiclePosition.index : '—'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signal states</CardTitle>
                <p className="text-xs font-normal text-muted-foreground">
                  Per junction from signal_update only (no local inference).
                </p>
              </CardHeader>
              <CardContent>
                {junctions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No junctions until a route is active.</p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                    {junctions.map((j) => {
                      const st = signalStates[j.id]
                      const label = st ?? '—'
                      const labelClass =
                        st === 'GREEN'
                          ? 'font-semibold text-green-600'
                          : st === 'RED'
                            ? 'font-semibold text-red-600'
                            : st != null
                              ? 'font-mono text-foreground'
                              : 'text-muted-foreground'
                      return (
                        <li key={j.id} className="flex justify-between gap-2 border-b border-border/50 py-1">
                          <span className="font-mono text-xs text-muted-foreground">{j.id}</span>
                          <span className={labelClass}>{label}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {modalTrip ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="admin-trip-request-title"
        >
          <Card className="w-full max-w-md border-2 border-blue-600 shadow-xl">
            <CardHeader>
              <CardTitle id="admin-trip-request-title">Trip request</CardTitle>
              <p className="text-sm text-muted-foreground">
                One request at a time. Approve or reject to close this dialog.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">driverId</dt>
                  <dd className="font-mono font-medium text-foreground">{modalTrip.driverId}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">source</dt>
                  <dd className="font-medium text-foreground">{modalTrip.source}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">destination</dt>
                  <dd className="font-medium text-foreground">{modalTrip.destination}</dd>
                </div>
              </dl>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="destructive" onClick={rejectTrip}>
                  Reject
                </Button>
                <Button type="button" className="bg-green-600 hover:bg-green-700" onClick={approveTrip}>
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
