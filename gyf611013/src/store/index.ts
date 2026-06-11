import { create } from 'zustand'
import type { Dog, Hotspot, Trajectory, HotspotStatus, MapLayerType } from '@/types'
import { dogs as mockDogs, hotspots as mockHotspots, trajectories as mockTrajectories, cooperative } from '@/data/mock'
import { haversineDistance } from '@/utils'

interface TruffleStore {
  dogs: Dog[]
  hotspots: Hotspot[]
  trajectories: Trajectory[]
  selectedDate: string
  selectedDogId: string | null
  visibleLayers: MapLayerType[]
  sidePanelOpen: boolean

  setSelectedDate: (date: string) => void
  setSelectedDogId: (id: string | null) => void
  toggleLayer: (layer: MapLayerType) => void
  setSidePanelOpen: (open: boolean) => void

  confirmHotspot: (hotspotId: string, photoUrl: string, photoLat: number, photoLng: number) => void
  expireHotspot: (hotspotId: string) => void
  tickCountdown: () => void

  getDogById: (id: string) => Dog | undefined
  getHotspotsByDog: (dogId: string, date?: string) => Hotspot[]
  getTrajectoryByDog: (dogId: string, date: string) => Trajectory | undefined
  getTodayConfirmedCount: (dogId: string) => number
  getDailyLimit: (dogId: string) => number
}

const today = new Date().toISOString().split('T')[0]

export const useTruffleStore = create<TruffleStore>((set, get) => ({
  dogs: mockDogs,
  hotspots: mockHotspots.map(h => ({
    ...h,
    countdownRemaining: h.status === 'pending' ? h.countdownRemaining : 0,
  })),
  trajectories: mockTrajectories,
  selectedDate: today,
  selectedDogId: null,
  visibleLayers: ['trajectory', 'heatmap', 'hotspots'],
  sidePanelOpen: true,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedDogId: (id) => set({ selectedDogId: id }),
  toggleLayer: (layer) =>
    set((state) => ({
      visibleLayers: state.visibleLayers.includes(layer)
        ? state.visibleLayers.filter((l) => l !== layer)
        : [...state.visibleLayers, layer],
    })),
  setSidePanelOpen: (open) => set({ sidePanelOpen: open }),

  confirmHotspot: (hotspotId, photoUrl, photoLat, photoLng) =>
    set((state) => {
      const hotspot = state.hotspots.find((h) => h.id === hotspotId)
      if (!hotspot) return state

      const deviation = haversineDistance(hotspot.lat, hotspot.lng, photoLat, photoLng)
      const dogId = hotspot.dogId
      const todayStr = state.selectedDate
      const dailyLimit = get().getDailyLimit(dogId)
      const todayConfirmed = state.hotspots.filter(
        (h) => h.dogId === dogId && h.status === 'confirmed' && h.detectedAt >= new Date(todayStr).getTime()
      ).length

      let newStatus: HotspotStatus
      if (deviation > 30) {
        newStatus = 'mismatch'
      } else if (todayConfirmed >= dailyLimit) {
        newStatus = 'over_limit'
      } else {
        newStatus = 'confirmed'
      }

      return {
        hotspots: state.hotspots.map((h) =>
          h.id === hotspotId
            ? {
                ...h,
                status: newStatus,
                confirmedAt: Date.now(),
                photoUrl,
                photoLat,
                photoLng,
                coordDeviation: Math.round(deviation),
                countdownRemaining: 0,
              }
            : h
        ),
      }
    }),

  expireHotspot: (hotspotId) =>
    set((state) => ({
      hotspots: state.hotspots.map((h) =>
        h.id === hotspotId && h.status === 'pending'
          ? { ...h, status: 'expired' as HotspotStatus, countdownRemaining: 0 }
          : h
      ),
    })),

  tickCountdown: () =>
    set((state) => ({
      hotspots: state.hotspots.map((h) => {
        if (h.status !== 'pending') return h
        const newCountdown = h.countdownRemaining - 1
        if (newCountdown <= 0) {
          return { ...h, status: 'expired' as HotspotStatus, countdownRemaining: 0 }
        }
        return { ...h, countdownRemaining: newCountdown }
      }),
    })),

  getDogById: (id) => get().dogs.find((d) => d.id === id),
  getHotspotsByDog: (dogId, date) =>
    get().hotspots.filter((h) => {
      if (h.dogId !== dogId) return false
      if (date) {
        const hDate = new Date(h.detectedAt).toISOString().split('T')[0]
        return hDate === date
      }
      return true
    }),
  getTrajectoryByDog: (dogId, date) =>
    get().trajectories.find((t) => t.dogId === dogId && t.date === date),
  getTodayConfirmedCount: (dogId) => {
    const date = get().selectedDate
    return get().hotspots.filter(
      (h) => h.dogId === dogId && h.status === 'confirmed' && new Date(h.detectedAt).toISOString().split('T')[0] === date
    ).length
  },
  getDailyLimit: (dogId) => {
    const dog = get().dogs.find((d) => d.id === dogId)
    return dog?.dailyHotspotLimit ?? cooperative.defaultDailyLimit
  },
}))
