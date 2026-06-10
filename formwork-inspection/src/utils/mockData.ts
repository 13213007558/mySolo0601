import type { CheckPoint, CheckItemType, Threshold } from '@/types'
import { DEFAULT_THRESHOLDS, TYPE_LABELS } from '@/types'
import { generateId, getNowString } from '@/utils/validators'

interface PointSeed {
  area: string
  subArea: string
  type: CheckItemType
  positionNote: string
  requiredValue?: string
  requiredNumeric?: number
  threshold?: Partial<Threshold>
  measured?: string
  status?: any
  hasPhoto?: boolean
  responsible?: string
  note?: string
}

const seeds: PointSeed[] = [
  // 1号楼 - 三层梁板 A 区
  {
    area: '1号楼-三层梁板',
    subArea: 'A区 1-3轴',
    type: 'pole_spacing',
    positionNote: '梁下立杆第一跨',
    requiredValue: '≤ 1200mm',
    measured: '1150',
    status: 'passed',
    hasPhoto: true,
    responsible: '张安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'A区 1-3轴',
    type: 'pole_spacing',
    positionNote: '板下跨中',
    requiredValue: '≤ 1200mm',
    measured: '1.3m',
    status: 'failed',
    hasPhoto: true,
    responsible: '张安全',
    note: '实测 1.3 米，换算 1300mm 超上限 100mm，需整改。注意米/毫米混用'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'A区 1-3轴',
    type: 'sweep_rod',
    positionNote: '扫地杆距地',
    requiredValue: '≤ 200mm',
    measured: '180',
    status: 'passed',
    hasPhoto: true,
    responsible: '张安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'A区 1-3轴',
    type: 'torque',
    positionNote: '扣件抽样',
    requiredValue: '40 ~ 65 N·m',
    measured: '52',
    status: 'passed',
    hasPhoto: true,
    responsible: '张安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'A区 1-3轴',
    type: 'cross_brace',
    positionNote: '剪刀撑',
    requiredValue: '连续设置',
    status: 'passed',
    hasPhoto: true,
    responsible: '张安全'
  },

  // 1号楼 - 三层梁板 B 区
  {
    area: '1号楼-三层梁板',
    subArea: 'B区 4-6轴',
    type: 'pole_spacing',
    positionNote: '梁下立杆',
    requiredValue: '≤ 1200mm',
    measured: '1200',
    status: 'passed',
    hasPhoto: true,
    responsible: '李安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'B区 4-6轴',
    type: 'pole_spacing',
    positionNote: '板下立杆',
    requiredValue: '≤ 1200mm',
    measured: '950',
    status: 'need_photo',
    hasPhoto: false,
    responsible: '李安全',
    note: '数据已填但忘了拍照，现场补拍'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'B区 4-6轴',
    type: 'sweep_rod',
    positionNote: '扫地杆设置',
    requiredValue: '≤ 200mm',
    status: 'pending',
    hasPhoto: false,
    responsible: '李安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'B区 4-6轴',
    type: 'torque',
    positionNote: '扣件扭矩',
    requiredValue: '40 ~ 65 N·m',
    measured: '35',
    status: 'failed',
    hasPhoto: true,
    responsible: '李安全',
    note: '扭矩不足，低于下限 40 N·m，已通知整改'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'B区 4-6轴',
    type: 'upright_vertical',
    positionNote: '立杆垂直度',
    requiredValue: '≤ 15mm/2m',
    measured: '8',
    status: 'passed',
    hasPhoto: true,
    responsible: '李安全'
  },

  // 1号楼 - 三层梁板 C 区
  {
    area: '1号楼-三层梁板',
    subArea: 'C区 7-9轴',
    type: 'pole_spacing',
    positionNote: '梁下立杆',
    requiredValue: '≤ 1200mm',
    measured: '1000',
    status: 'passed',
    hasPhoto: true,
    responsible: '王安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'C区 7-9轴',
    type: 'top_uplift',
    positionNote: '顶托外伸',
    requiredValue: '≤ 300mm',
    measured: '250',
    status: 'passed',
    hasPhoto: true,
    responsible: '王安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'C区 7-9轴',
    type: 'base_plate',
    positionNote: '立杆底座垫板',
    requiredValue: '必须设置',
    status: 'passed',
    hasPhoto: true,
    responsible: '王安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'C区 7-9轴',
    type: 'level_rod',
    positionNote: '水平杆步距',
    requiredValue: '≤ 1500mm',
    measured: '1500',
    status: 'passed',
    hasPhoto: true,
    responsible: '王安全'
  },
  {
    area: '1号楼-三层梁板',
    subArea: 'C区 7-9轴',
    type: 'torque',
    positionNote: '扭矩复测（整改后）',
    requiredValue: '40 ~ 65 N·m',
    measured: '48',
    status: 'rectified',
    hasPhoto: true,
    responsible: '王安全',
    note: '首次 35 N·m 不合格，整改后 48 N·m 合格，附整改对比照'
  },

  // 2号楼 - 地下室柱
  {
    area: '2号楼-地下室柱',
    subArea: '柱 Z1',
    type: 'pole_spacing',
    positionNote: '柱箍立杆间距',
    requiredValue: '≤ 1000mm',
    threshold: { max: 1000, requiredUnit: 'mm', description: '≤ 1000 mm' },
    measured: '900',
    status: 'passed',
    hasPhoto: true,
    responsible: '赵安全'
  },
  {
    area: '2号楼-地下室柱',
    subArea: '柱 Z1',
    type: 'sweep_rod',
    positionNote: '扫地杆距地',
    requiredValue: '≤ 200mm',
    measured: '150',
    status: 'passed',
    hasPhoto: true,
    responsible: '赵安全'
  },
  {
    area: '2号楼-地下室柱',
    subArea: '柱 Z2',
    type: 'pole_spacing',
    positionNote: '柱箍立杆间距',
    requiredValue: '≤ 1000mm',
    threshold: { max: 1000, requiredUnit: 'mm', description: '≤ 1000 mm' },
    status: 'pending',
    hasPhoto: false,
    responsible: '赵安全'
  },
  {
    area: '2号楼-地下室柱',
    subArea: '柱 Z2',
    type: 'torque',
    positionNote: '对拉螺栓扭矩',
    requiredValue: '40 ~ 65 N·m',
    measured: '70',
    status: 'failed',
    hasPhoto: true,
    responsible: '赵安全',
    note: '扭矩过高，超过上限 65 N·m'
  },
  {
    area: '2号楼-地下室柱',
    subArea: '柱 Z2',
    type: 'cross_brace',
    positionNote: '竖向剪刀撑',
    requiredValue: '连续设置',
    status: 'passed',
    hasPhoto: true,
    responsible: '赵安全'
  },

  // 重复打点测试（同区域同类型两个点 - A区1-3轴 pole_spacing 已有一个）
  {
    area: '1号楼-三层梁板',
    subArea: 'A区 1-3轴',
    type: 'pole_spacing',
    positionNote: '重复打点 - 第二跨',
    requiredValue: '≤ 1200mm',
    status: 'pending',
    hasPhoto: false,
    responsible: '测试员'
  },

  // 空点位测试
  {
    area: '2号楼-地下室柱',
    subArea: '柱 Z3',
    type: 'pole_spacing',
    positionNote: '待检查点位（空）',
    requiredValue: '≤ 1000mm',
    threshold: { max: 1000, requiredUnit: 'mm', description: '≤ 1000 mm' },
    status: 'pending',
    hasPhoto: false,
    responsible: ''
  }
]

function parseMockMeasured(raw: string | undefined): { numeric: number | null; unit: any } {
  if (!raw) return { numeric: null, unit: null }
  if (/^[\d.]+$/.test(raw)) {
    return { numeric: parseFloat(raw), unit: 'mm' }
  }
  if (/m$/.test(raw) && !/mm/.test(raw) && !/N/.test(raw)) {
    const num = parseFloat(raw)
    return { numeric: num < 10 ? num * 1000 : num, unit: 'm' }
  }
  if (/N/.test(raw)) {
    return { numeric: parseFloat(raw), unit: 'N·m' }
  }
  return { numeric: parseFloat(raw), unit: 'mm' }
}

export function generateMockPoints(): CheckPoint[] {
  const areaCounter: Record<string, number> = {}

  return seeds.map((s) => {
    const defaultThreshold = DEFAULT_THRESHOLDS[s.type] || { requiredUnit: 'mm' as any, description: '' }
    const threshold = { ...defaultThreshold, ...(s.threshold || {}) } as any

    const areaKey = s.area
    areaCounter[areaKey] = (areaCounter[areaKey] || 0) + 1
    const code = `${s.area.split('-')[0]}-${areaCounter[areaKey].toString().padStart(3, '0')}`

    const parsed = parseMockMeasured(s.measured)

    return {
      id: generateId(),
      area: s.area,
      subArea: s.subArea,
      code,
      type: s.type,
      typeLabel: TYPE_LABELS[s.type] || s.type,
      positionNote: s.positionNote,
      requiredValue: s.requiredValue || threshold.description,
      requiredNumeric: s.requiredNumeric,
      requiredUnit: threshold.requiredUnit,
      threshold,
      measuredValue: s.measured,
      measuredNumeric: parsed.numeric ?? undefined,
      measuredUnit: parsed.unit,
      measuredAt: s.measured ? getNowString() : undefined,
      measuredBy: s.measured ? s.responsible : undefined,
      status: s.status || 'pending',
      note: s.note,
      hasPhoto: s.hasPhoto || false,
      createdAt: getNowString(),
      updatedAt: getNowString(),
      rectificationHistory: s.status === 'rectified'
        ? [
            {
              id: generateId(),
              pointId: '',
              timestamp: getNowString(),
              operator: s.responsible || '安全员',
              oldValue: '35 N·m',
              newValue: s.measured,
              oldStatus: 'failed',
              newStatus: 'rectified',
              note: '扣件扭矩整改后复测合格',
              photoIds: []
            }
          ]
        : [],
      photos: [],
      responsible: s.responsible || '未指定'
    } as CheckPoint
  })
}

export const MOCK_POINTS = generateMockPoints()
