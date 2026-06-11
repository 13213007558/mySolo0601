import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Camera, Clock, MapPin, Check, X, AlertTriangle } from 'lucide-react'
import { useTruffleStore } from '@/store'
import { formatCountdown, haversineDistance, getStatusLabel, getStatusColor, formatDate } from '@/utils'

export default function HotspotConfirm() {
  const { hotspotId } = useParams<{ hotspotId: string }>()
  const navigate = useNavigate()
  const { hotspots, confirmHotspot, expireHotspot, tickCountdown, getDogById } = useTruffleStore()

  const hotspot = hotspots.find((h) => h.id === hotspotId)
  const dog = hotspot ? getDogById(hotspot.dogId) : undefined

  const [photoCoords, setPhotoCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const countdown = hotspot?.status === 'pending' ? hotspot.countdownRemaining : 0
  const progress = countdown / 600

  useEffect(() => {
    if (hotspot?.status !== 'pending' || confirmed) return
    const timer = setInterval(() => {
      const current = useTruffleStore.getState().hotspots.find((h) => h.id === hotspotId)
      if (!current || current.status !== 'pending' || current.countdownRemaining <= 0) {
        clearInterval(timer)
        if (current?.status === 'pending') expireHotspot(hotspotId!)
        return
      }
      tickCountdown()
    }, 1000)
    return () => clearInterval(timer)
  }, [hotspot?.status, hotspotId, confirmed, tickCountdown, expireHotspot])

  const handleConfirm = useCallback(() => {
    if (!hotspot || confirmed) return
    const lat = hotspot.lat + (Math.random() - 0.5) * 0.0006
    const lng = hotspot.lng + (Math.random() - 0.5) * 0.0006
    setPhotoCoords({ lat, lng })
    confirmHotspot(hotspot.id, 'photo-placeholder', lat, lng)
    setConfirmed(true)
  }, [hotspot, confirmed, confirmHotspot])

  const handleReject = useCallback(() => {
    if (!hotspot) return
    expireHotspot(hotspot.id)
    navigate('/')
  }, [hotspot, expireHotspot, navigate])

  useEffect(() => {
    if (confirmed) {
      const t = setTimeout(() => navigate('/'), 1500)
      return () => clearTimeout(t)
    }
  }, [confirmed, navigate])

  if (!hotspot) {
    return (
      <div className="flex items-center justify-center h-full text-bark-400">
        热点不存在
      </div>
    )
  }

  const deviation = photoCoords
    ? haversineDistance(hotspot.lat, hotspot.lng, photoCoords.lat, photoCoords.lng)
    : null
  const isMismatch = deviation !== null && deviation > 30

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="min-h-screen bg-bark-50">
      <header className="bg-forest-800 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-forest-700">
          <X size={20} />
        </button>
        <h1 className="text-lg font-semibold flex-1">热点确认</h1>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: getStatusColor(hotspot.status) + '30', color: getStatusColor(hotspot.status) }}
        >
          {getStatusLabel(hotspot.status)}
        </span>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="card flex flex-col items-center py-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e8e0d6" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={countdown < 60 ? '#dc2626' : '#1B4332'}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Clock size={16} className="text-bark-400 mb-1" />
              <span className="text-2xl font-mono font-bold text-forest-800">
                {formatCountdown(countdown)}
              </span>
            </div>
          </div>
          <p className="text-sm text-bark-400 mt-2">剩余确认时间</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3 text-forest-800 font-semibold">
            <Camera size={18} />
            <span>拍照取证</span>
          </div>
          <div className="aspect-video bg-bark-100 rounded-lg flex flex-col items-center justify-center text-bark-400 border-2 border-dashed border-bark-300">
            {confirmed ? (
              <>
                <Check size={40} className="text-forest-600 mb-2" />
                <span className="text-sm">照片已拍摄</span>
              </>
            ) : (
              <>
                <Camera size={40} className="mb-2" />
                <span className="text-sm">点击确认后模拟拍照</span>
              </>
            )}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center gap-2 text-forest-800 font-semibold">
            <MapPin size={18} />
            <span>坐标双重校验</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-forest-50 rounded-lg p-3">
              <p className="text-bark-400 mb-1">项圈 GPS</p>
              <p className="font-mono text-forest-800 text-xs">
                {hotspot.lat.toFixed(6)}
              </p>
              <p className="font-mono text-forest-800 text-xs">
                {hotspot.lng.toFixed(6)}
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-bark-400 mb-1">照片 GPS</p>
              <p className="font-mono text-amber-700 text-xs">
                {photoCoords ? photoCoords.lat.toFixed(6) : '--'}
              </p>
              <p className="font-mono text-amber-700 text-xs">
                {photoCoords ? photoCoords.lng.toFixed(6) : '--'}
              </p>
            </div>
          </div>

          {deviation !== null && (
            <div className={`flex items-center justify-between rounded-lg p-3 ${isMismatch ? 'bg-red-50' : 'bg-forest-50'}`}>
              <span className="text-sm text-bark-500">坐标偏差</span>
              <span className={`font-mono font-bold ${isMismatch ? 'text-red-600' : 'text-forest-700'}`}>
                {Math.round(deviation)} 米
              </span>
            </div>
          )}

          {isMismatch && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
              <AlertTriangle size={16} />
              <span>坐标偏差超过 30 米，存在不匹配风险</span>
            </div>
          )}
        </div>

        <div className="card text-sm text-bark-500 space-y-1">
          <p>犬只: <span className="text-forest-800 font-medium">{dog?.name ?? '未知'}</span></p>
          <p>检测时间: <span className="text-forest-800 font-medium">{formatDate(hotspot.detectedAt)}</span></p>
        </div>

        <div className="flex gap-3 pb-4">
          <button
            onClick={handleReject}
            disabled={hotspot.status !== 'pending'}
            className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <X size={18} />
            作废
          </button>
          <button
            onClick={handleConfirm}
            disabled={hotspot.status !== 'pending' || confirmed}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Check size={18} />
            {confirmed ? '已确认' : '确认'}
          </button>
        </div>
      </div>
    </div>
  )
}
