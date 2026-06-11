import type { OysterImage, Batch, LightingPreset, InspectionOrder, QueueItem, GrowthRing } from '@/types'

export const mockLightingPresets: LightingPreset[] = [
  { id: 'preset-1', name: '标准白光', brightness: 75, contrast: 55, saturation: 50, temperature: 5500 },
  { id: 'preset-2', name: '高对比度', brightness: 65, contrast: 75, saturation: 60, temperature: 5200 },
  { id: 'preset-3', name: '暖光模式', brightness: 70, contrast: 50, saturation: 55, temperature: 4200 },
  { id: 'preset-4', name: '冷光模式', brightness: 80, contrast: 60, saturation: 45, temperature: 6500 },
  { id: 'preset-5', name: '低光增强', brightness: 90, contrast: 70, saturation: 40, temperature: 5800 },
]

export const mockBatches: Batch[] = [
  {
    id: 'batch-001',
    name: '青澳湾2025春苗',
    farm: '青澳湾养殖基地',
    breed: '汕头牡蛎',
    startDate: '2025-03-15',
    totalCount: 156,
    confirmedCount: 89,
    status: 'active',
    lightingPreset: 'preset-1',
    averageRingCount: 12.5,
    averageGrowthRate: 0.85,
  },
  {
    id: 'batch-002',
    name: '南澳岛2024越冬',
    farm: '南澳岛深水养殖区',
    breed: '太平洋牡蛎',
    startDate: '2024-11-01',
    totalCount: 230,
    confirmedCount: 230,
    status: 'completed',
    lightingPreset: 'preset-2',
    averageRingCount: 18.2,
    averageGrowthRate: 1.12,
  },
  {
    id: 'batch-003',
    name: '柘林湾2025春',
    farm: '柘林湾生态养殖场',
    breed: '近江牡蛎',
    startDate: '2025-02-20',
    totalCount: 180,
    confirmedCount: 45,
    status: 'active',
    lightingPreset: 'preset-1',
    averageRingCount: 10.8,
    averageGrowthRate: 0.72,
  },
]

const generateOysterImages = (): OysterImage[] => {
  const images: OysterImage[] = []
  const statuses: OysterImage['status'][] = ['pending', 'processing', 'reviewing', 'confirmed']
  
  for (let i = 1; i <= 24; i++) {
    const batchIndex = i % 3
    const batchId = `batch-00${batchIndex + 1}`
    const status = statuses[i % 4]
    const aiRingCount = 8 + Math.floor(Math.random() * 12)
    const ringCount = status === 'confirmed' ? aiRingCount + Math.floor(Math.random() * 3) - 1 : undefined
    
    images.push({
      id: `img-${String(i).padStart(3, '0')}`,
      url: `https://picsum.photos/seed/oyster${i}/600/600`,
      name: `壳样_${String(i).padStart(3, '0')}.jpg`,
      batchId,
      uploadTime: `2025-06-${String(1 + (i % 10)).padStart(2, '0')} 14:${String(20 + i * 2).padStart(2, '0')}`,
      lightingPreset: batchIndex === 1 ? 'preset-2' : 'preset-1',
      status,
      aiRingCount,
      ringCount,
      growthRate: status === 'confirmed' ? 0.5 + Math.random() * 0.8 : undefined,
      isAbnormal: i % 7 === 0,
      abnormalReason: i % 7 === 0 ? '壳形不规则，生长纹紊乱' : undefined,
      baselineImageId: i > 12 ? `img-${String(i - 12).padStart(3, '0')}` : undefined,
    })
  }
  return images
}

export const mockImages: OysterImage[] = generateOysterImages()

export const mockInspectionOrders: InspectionOrder[] = [
  {
    id: 'inspect-001',
    imageId: 'img-007',
    batchId: 'batch-001',
    reason: '壳形不规则，生长纹紊乱，疑似病害',
    status: 'pending',
    createTime: '2025-06-08 09:30:00',
  },
  {
    id: 'inspect-002',
    imageId: 'img-014',
    batchId: 'batch-002',
    reason: '生长率异常偏低，需专家复核',
    status: 'processing',
    createTime: '2025-06-07 15:45:00',
    assignee: '李技师',
  },
  {
    id: 'inspect-003',
    imageId: 'img-021',
    batchId: 'batch-003',
    reason: '壳环间距异常，可能采样错误',
    status: 'completed',
    createTime: '2025-06-05 11:20:00',
    assignee: '王主任',
  },
]

export const mockQueueItems: QueueItem[] = [
  { id: 'queue-001', imageId: 'img-018', imageName: '壳样_018.jpg', batchId: 'batch-003', status: 'processing', progress: 65 },
  { id: 'queue-002', imageId: 'img-019', imageName: '壳样_019.jpg', batchId: 'batch-003', status: 'queued', progress: 0 },
  { id: 'queue-003', imageId: 'img-020', imageName: '壳样_020.jpg', batchId: 'batch-003', status: 'queued', progress: 0 },
  { id: 'queue-004', imageId: 'img-016', imageName: '壳样_016.jpg', batchId: 'batch-002', status: 'completed', progress: 100 },
  { id: 'queue-005', imageId: 'img-017', imageName: '壳样_017.jpg', batchId: 'batch-002', status: 'completed', progress: 100 },
]

export const generateMockGrowthRings = (count: number, centerX: number, centerY: number): GrowthRing[] => {
  const rings: GrowthRing[] = []
  for (let i = 0; i < count; i++) {
    rings.push({
      id: `ring-${i + 1}`,
      x: centerX + (Math.random() - 0.5) * 10,
      y: centerY + (Math.random() - 0.5) * 10,
      radius: 20 + i * 18 + Math.random() * 8,
      isArtificial: false,
    })
  }
  return rings
}
