import { create } from 'zustand'
import type { PageType, OysterImage, Batch, LightingPreset, GrowthRing, InspectionOrder, QueueItem } from '@/types'
import { mockImages, mockBatches, mockLightingPresets, mockInspectionOrders, mockQueueItems, generateMockGrowthRings } from '@/data/mockData'

interface AppState {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
  
  images: OysterImage[]
  selectedImageId: string | null
  setSelectedImageId: (id: string | null) => void
  updateImageStatus: (id: string, status: OysterImage['status']) => void
  confirmImageRings: (id: string, ringCount: number, growthRings?: GrowthRing[]) => void
  markImageAbnormal: (id: string, reason: string) => void
  addImage: (image: OysterImage) => void
  getBatchLightingPreset: (batchId: string) => string | null
  
  batches: Batch[]
  selectedBatchId: string | null
  setSelectedBatchId: (id: string | null) => void
  
  lightingPresets: LightingPreset[]
  currentLightingPresetId: string
  setCurrentLightingPresetId: (id: string) => void
  
  growthRings: GrowthRing[]
  setGrowthRings: (rings: GrowthRing[]) => void
  addGrowthRing: (ring: GrowthRing) => void
  updateGrowthRing: (id: string, updates: Partial<GrowthRing>) => void
  removeGrowthRing: (id: string) => void
  
  inspectionOrders: InspectionOrder[]
  addInspectionOrder: (order: Omit<InspectionOrder, 'id' | 'createTime'>) => void
  updateInspectionStatus: (id: string, status: InspectionOrder['status']) => void
  
  queueItems: QueueItem[]
  addQueueItems: (items: QueueItem[]) => void
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void
  
  isConfirmed: boolean
  setIsConfirmed: (value: boolean) => void
  
  aiProcessing: boolean
  setAiProcessing: (value: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  
  images: mockImages,
  selectedImageId: null,
  setSelectedImageId: (id) => set({ selectedImageId: id }),
  updateImageStatus: (id, status) => set((state) => ({
    images: state.images.map(img => img.id === id ? { ...img, status } : img)
  })),
  confirmImageRings: (id, ringCount, growthRings) => set((state) => {
    const currentImage = state.images.find(img => img.id === id)
    if (!currentImage) return {}

    const batchId = currentImage.batchId

    const baselineId = currentImage.baselineImageId || 
      state.images.find(img => 
        img.batchId === batchId && 
        img.id !== id && 
        img.status === 'confirmed'
      )?.id || null

    let growthRate: number | undefined
    if (growthRings && growthRings.length > 0 && baselineId) {
      const baselineImage = state.images.find(img => img.id === baselineId)
      if (baselineImage) {
        const currentAvgRadius = growthRings.reduce((sum, r) => sum + r.radius, 0) / growthRings.length
        const baselineRingCount = baselineImage.ringCount || currentImage.aiRingCount || 12
        const baselineAvgRadius = (25 + (baselineRingCount - 1) * 16) / 2
        const rawRate = ((currentAvgRadius - baselineAvgRadius) / baselineAvgRadius) * 100
        growthRate = Math.round(Math.max(0, rawRate) * 100) / 100
      }
    } else if (growthRings && growthRings.length > 0) {
      const currentAvgRadius = growthRings.reduce((sum, r) => sum + r.radius, 0) / growthRings.length
      const normalized = (currentAvgRadius / 130) * 2.5
      growthRate = Math.round(normalized * 100) / 100
    }

    const updatedImages = state.images.map(img =>
      img.id === id
        ? { ...img, ringCount, growthRate, status: 'confirmed' as const, baselineImageId: baselineId || img.baselineImageId }
        : img
    )

    const batchImages = updatedImages.filter(img => img.batchId === batchId)
    const confirmedImages = batchImages.filter(img => img.status === 'confirmed')
    
    const totalRingCount = confirmedImages.reduce((sum, img) => sum + (img.ringCount || 0), 0)
    const avgRingCount = confirmedImages.length > 0 
      ? Math.round((totalRingCount / confirmedImages.length) * 10) / 10 
      : undefined

    const totalGrowthRate = confirmedImages.reduce((sum, img) => sum + (img.growthRate || 0), 0)
    const avgGrowthRate = confirmedImages.length > 0
      ? Math.round((totalGrowthRate / confirmedImages.length) * 100) / 100
      : undefined

    const allConfirmed = batchImages.length > 0 && confirmedImages.length === batchImages.length

    const updatedBatches = state.batches.map(batch => {
      if (batch.id !== batchId) return batch
      return {
        ...batch,
        confirmedCount: confirmedImages.length,
        averageRingCount: avgRingCount,
        averageGrowthRate: avgGrowthRate,
        status: (allConfirmed ? 'completed' : batch.status) as 'active' | 'completed',
      }
    })

    return {
      images: updatedImages,
      batches: updatedBatches,
    }
  }),
  markImageAbnormal: (id, reason) => set((state) => {
    const image = state.images.find(img => img.id === id)
    if (!image) return {}

    const newOrder: Omit<InspectionOrder, 'id' | 'createTime'> = {
      imageId: id,
      batchId: image.batchId,
      reason,
      status: 'pending',
    }

    const orderId = `inspect-${Date.now()}`
    const orderCreateTime = new Date().toISOString().replace('T', ' ').substring(0, 19)

    return {
      images: state.images.map(img =>
        img.id === id
          ? { ...img, isAbnormal: true, abnormalReason: reason, status: 'reviewing' as const }
          : img
      ),
      inspectionOrders: [
        { ...newOrder, id: orderId, createTime: orderCreateTime },
        ...state.inspectionOrders,
      ],
    }
  }),
  getBatchLightingPreset: (batchId) => {
    const state = useAppStore.getState()
    const batch = state.batches.find(b => b.id === batchId)
    if (batch?.lightingPreset) return batch.lightingPreset
    const firstImage = state.images.find(img => img.batchId === batchId)
    return firstImage?.lightingPreset || null
  },
  addImage: (image) => set((state) => ({
    images: [image, ...state.images]
  })),
  
  batches: mockBatches,
  selectedBatchId: null,
  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  
  lightingPresets: mockLightingPresets,
  currentLightingPresetId: 'preset-1',
  setCurrentLightingPresetId: (id) => set({ currentLightingPresetId: id }),
  
  growthRings: [],
  setGrowthRings: (rings) => set({ growthRings: rings }),
  addGrowthRing: (ring) => set((state) => ({
    growthRings: [...state.growthRings, ring]
  })),
  updateGrowthRing: (id, updates) => set((state) => ({
    growthRings: state.growthRings.map(ring => 
      ring.id === id ? { ...ring, ...updates } : ring
    )
  })),
  removeGrowthRing: (id) => set((state) => ({
    growthRings: state.growthRings.filter(ring => ring.id !== id)
  })),
  
  inspectionOrders: mockInspectionOrders,
  addInspectionOrder: (order) => set((state) => ({
    inspectionOrders: [
      {
        ...order,
        id: `inspect-${Date.now()}`,
        createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      },
      ...state.inspectionOrders
    ]
  })),
  updateInspectionStatus: (id, status) => set((state) => ({
    inspectionOrders: state.inspectionOrders.map(order => 
      order.id === id ? { ...order, status } : order
    )
  })),
  
  queueItems: mockQueueItems,
  addQueueItems: (items) => set((state) => ({
    queueItems: [...items, ...state.queueItems]
  })),
  updateQueueItem: (id, updates) => set((state) => ({
    queueItems: state.queueItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  isConfirmed: false,
  setIsConfirmed: (value) => set({ isConfirmed: value }),
  
  aiProcessing: false,
  setAiProcessing: (value) => set({ aiProcessing: value }),
}))

export const loadImageForAnnotation = (imageId: string, centerX: number, centerY: number) => {
  const state = useAppStore.getState()
  const image = state.images.find(img => img.id === imageId)
  if (image && image.aiRingCount) {
    const rings = generateMockGrowthRings(image.aiRingCount, centerX, centerY)
    useAppStore.getState().setGrowthRings(rings)
    useAppStore.getState().setIsConfirmed(false)
  }
}
