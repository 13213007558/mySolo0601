export type HotspotStatus = 'pending' | 'confirmed' | 'expired' | 'mismatch' | 'over_limit'

export interface GpsPoint {
  lat: number
  lng: number
  timestamp: number
  altitude?: number
  speed?: number
}

export interface Trajectory {
  id: string
  dogId: string
  date: string
  points: GpsPoint[]
}

export interface Hotspot {
  id: string
  dogId: string
  trajectoryId: string
  lat: number
  lng: number
  detectedAt: number
  confirmedAt: number | null
  photoUrl: string | null
  photoLat: number | null
  photoLng: number | null
  coordDeviation: number | null
  status: HotspotStatus
  countdownRemaining: number
}

export interface Dog {
  id: string
  name: string
  breed: string
  collarId: string
  farmerId: string
  age: number
  shareRatio: number
  dailyHotspotLimit: number
  avatarColor: string
}

export interface Farmer {
  id: string
  name: string
  phone: string
  cooperativeId: string
}

export interface Cooperative {
  id: string
  name: string
  leaderId: string
  defaultDailyLimit: number
  defaultShareRatio: number
}

export interface DailySummary {
  id: string
  cooperativeId: string
  date: string
  totalHotspots: number
  confirmedHotspots: number
  rejectedHotspots: number
  pushed: boolean
  dogSummaries: DogDaySummary[]
}

export interface DogDaySummary {
  dogId: string
  dogName: string
  totalHotspots: number
  confirmedHotspots: number
  rejectedHotspots: number
  overLimitHotspots: number
}

export interface ArbitrationPackage {
  id: string
  cooperativeId: string
  date: string
  trajectoryGpxUrl: string | null
  photoUrls: string[]
  exportedAt: number
}

export type MapLayerType = 'trajectory' | 'heatmap' | 'hotspots'

export interface OfflineTileRegion {
  id: string
  name: string
  bounds: { south: number; west: number; north: number; east: number }
  minZoom: number
  maxZoom: number
  cachedAt: number
  tileCount: number
}
