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
  confirmImageRings: (id: string, ringCount: number) => void
  addImage: (image: OysterImage) => void
  
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
  confirmImageRings: (id, ringCount) => set((state) => ({
    images: state.images.map(img => 
      img.id === id 
        ? { ...img, ringCount, status: 'confirmed' as const } 
        : img
    ),
    batches: state.batches.map(batch => {
      const batchImages = state.images.filter(img => img.batchId === batch.id)
      const confirmedImages = batchImages.filter(img => img.status === 'confirmed' || img.id === id)
      return {
        ...batch,
        confirmedCount: confirmedImages.length,
      }
    })
  })),
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
