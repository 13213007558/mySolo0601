import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTruffleStore } from '@/store'
import { mapCenter } from '@/data/mock'
import { formatTime, getStatusLabel, getStatusColor, formatCountdown } from '@/utils'
import type { Hotspot, MapLayerType } from '@/types'
import { Map, Calendar, Layers, Wifi, WifiOff, ChevronRight, ChevronLeft, Dog, CheckCircle } from 'lucide-react'

const DOG_COLORS: Record<string, string> = {
  'dog-1': '#1B4332',
  'dog-2': '#7C3AED',
  'dog-3': '#B45309',
  'dog-4': '#0369A1',
}

let heatLayerModule: any = null

async function loadHeatLayer() {
  if (heatLayerModule) return heatLayerModule
  try {
    (window as any).L = L
    await import('leaflet.heat')
    heatLayerModule = (L as any).heatLayer
    return heatLayerModule
  } catch {
    console.warn('leaflet.heat failed to load')
    return null
  }
}

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap()
  const layerRef = useRef<any>(null)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }

    let cancelled = false

    loadHeatLayer().then((heatLayerFn) => {
      if (cancelled || !heatLayerFn || points.length === 0) return
      layerRef.current = heatLayerFn(points, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.2: '#0ff', 0.4: '#0f0', 0.6: '#ff0', 0.8: '#f80', 1.0: '#f00' },
      }).addTo(map)
    })

    return () => {
      cancelled = true
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, points])

  return null
}

function HotspotMarker({ hotspot }: { hotspot: Hotspot }) {
  const color = getStatusColor(hotspot.status)
  const isPending = hotspot.status === 'pending'

  return (
    <CircleMarker
      center={[hotspot.lat, hotspot.lng]}
      radius={isPending ? 10 : 8}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.7,
        weight: 2,
        className: isPending ? 'hotspot-pending-pulse' : '',
      }}
    >
      <Popup>
        <div className="text-sm min-w-40">
          <div className="font-bold mb-1" style={{ color }}>
            {getStatusLabel(hotspot.status)}
          </div>
          <div>检测时间：{formatTime(hotspot.detectedAt)}</div>
          {hotspot.confirmedAt && <div>确认时间：{formatTime(hotspot.confirmedAt)}</div>}
          {isPending && hotspot.countdownRemaining > 0 && (
            <div className="text-orange-600 font-mono">
              倒计时：{formatCountdown(hotspot.countdownRemaining)}
            </div>
          )}
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function MapOverview() {
  const navigate = useNavigate()
  const {
    dogs, hotspots, trajectories,
    selectedDate, selectedDogId, visibleLayers, sidePanelOpen,
    setSelectedDate, setSelectedDogId, toggleLayer, setSidePanelOpen,
  } = useTruffleStore()

  const [offlineReady] = useState(true)

  const tickCountdown = useTruffleStore((s) => s.tickCountdown)

  useEffect(() => {
    const hasPending = hotspots.some(h => h.status === 'pending')
    if (!hasPending) return
    const timer = setInterval(() => tickCountdown(), 1000)
    return () => clearInterval(timer)
  }, [hotspots, tickCountdown])

  const filteredDogs = selectedDogId ? dogs.filter(d => d.id === selectedDogId) : dogs
  const dateTrajectories = trajectories.filter(t => t.date === selectedDate)
  const visibleTrajectories = dateTrajectories.filter(t =>
    filteredDogs.some(d => d.id === t.dogId)
  )
  const visibleHotspots = hotspots.filter(h => {
    const hDate = new Date(h.detectedAt).toISOString().split('T')[0]
    return hDate === selectedDate && filteredDogs.some(d => d.id === h.dogId)
  })

  const heatPoints: [number, number, number][] = visibleTrajectories.flatMap(t =>
    t.points.map(p => [p.lat, p.lng, 0.5] as [number, number, number])
  )

  const layerOptions: { key: MapLayerType; label: string }[] = [
    { key: 'trajectory', label: '轨迹' },
    { key: 'heatmap', label: '热力图' },
    { key: 'hotspots', label: '热点' },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden relative">
      <style>{`
        .hotspot-pending-pulse {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { opacity: 1; r: 10; }
          100% { opacity: 0; r: 22; }
        }
      `}</style>

      <div className={`flex-1 transition-all duration-300 ${sidePanelOpen ? 'mr-80' : 'mr-0'}`}>
        <MapContainer
          center={mapCenter}
          zoom={14}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {visibleLayers.includes('trajectory') && visibleTrajectories.map(t => (
            <Polyline
              key={t.id}
              positions={t.points.map(p => [p.lat, p.lng] as [number, number])}
              pathOptions={{
                color: DOG_COLORS[t.dogId] || '#666',
                weight: 3,
                opacity: 0.7,
              }}
            />
          ))}

          {visibleLayers.includes('heatmap') && <HeatmapLayer points={heatPoints} />}

          {visibleLayers.includes('hotspots') && visibleHotspots.map(h => (
            <HotspotMarker key={h.id} hotspot={h} />
          ))}
        </MapContainer>
      </div>

      <button
        onClick={() => setSidePanelOpen(!sidePanelOpen)}
        className="absolute top-4 right-4 z-20 bg-white shadow-md rounded-full p-2 hover:bg-gray-100 transition-colors"
        style={{ right: sidePanelOpen ? '332px' : '16px' }}
      >
        {sidePanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div
        className={`absolute top-0 right-0 h-full w-80 bg-white shadow-lg z-10 transition-transform duration-300 ${
          sidePanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Map size={18} className="text-green-800" />
              <h2 className="text-lg font-bold text-gray-800">松露猎犬追踪</h2>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-sm border border-gray-200 rounded px-2 py-1 flex-1"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              {offlineReady ? (
                <><Wifi size={14} className="text-green-600" /><span>离线缓存可用</span></>
              ) : (
                <><WifiOff size={14} className="text-red-500" /><span>离线缓存不可用</span></>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">图层</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {layerOptions.map(opt => (
                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleLayers.includes(opt.key)}
                    onChange={() => toggleLayer(opt.key)}
                    className="accent-green-700"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Dog size={14} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">猎犬列表</span>
            </div>

            <button
              onClick={() => setSelectedDogId(null)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                selectedDogId === null ? 'bg-green-50 text-green-800 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              全部猎犬
            </button>

            {dogs.map(dog => {
              const dogHotspots = visibleHotspots.filter(h => h.dogId === dog.id)
              return (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(selectedDogId === dog.id ? null : dog.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-colors flex items-center gap-2 ${
                    selectedDogId === dog.id ? 'bg-green-50 text-green-800 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: DOG_COLORS[dog.id] || '#666' }}
                  />
                  <span className="flex-1">{dog.name}</span>
                  <span className="text-xs text-gray-400">{dogHotspots.length}热点</span>
                </button>
              )
            })}

            {visibleHotspots.filter(h => h.status === 'pending').length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">待确认热点</span>
                </div>
                {visibleHotspots.filter(h => h.status === 'pending').map(h => {
                  const dogName = dogs.find(d => d.id === h.dogId)?.name
                  return (
                    <button
                      key={h.id}
                      onClick={() => navigate(`/confirm/${h.id}`)}
                      className="w-full text-left px-3 py-2 rounded-lg mb-1 text-sm bg-amber-50 hover:bg-amber-100 transition-colors flex items-center gap-2 text-amber-800"
                    >
                      <span className="flex-1">{dogName} · {formatTime(h.detectedAt)}</span>
                      <span className="text-xs font-mono text-amber-600">{formatCountdown(h.countdownRemaining)}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
