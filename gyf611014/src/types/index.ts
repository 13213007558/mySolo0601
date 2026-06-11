export interface OysterImage {
  id: string
  url: string
  name: string
  batchId: string
  uploadTime: string
  lightingPreset: string
  status: 'pending' | 'processing' | 'reviewing' | 'confirmed' | 'rejected'
  ringCount?: number
  aiRingCount?: number
  growthRate?: number
  isAbnormal?: boolean
  abnormalReason?: string
  baselineImageId?: string
}

export interface Batch {
  id: string
  name: string
  farm: string
  breed: string
  startDate: string
  endDate?: string
  totalCount: number
  confirmedCount: number
  status: 'active' | 'completed'
  lightingPreset: string
  averageRingCount?: number
  averageGrowthRate?: number
}

export interface GrowthRing {
  id: string
  x: number
  y: number
  radius: number
  isArtificial: boolean
}

export interface InspectionOrder {
  id: string
  imageId: string
  batchId: string
  reason: string
  status: 'pending' | 'processing' | 'completed'
  createTime: string
  assignee?: string
}

export interface LightingPreset {
  id: string
  name: string
  brightness: number
  contrast: number
  saturation: number
  temperature: number
}

export interface QueueItem {
  id: string
  imageId: string
  imageName: string
  batchId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
}

export type PageType = 
  | 'dashboard' 
  | 'upload' 
  | 'annotation' 
  | 'batches' 
  | 'inspection' 
  | 'queue' 
  | 'export'
