import dayjs from 'dayjs'
import type { InspectionRecord, ScaffoldType, ProblemLevel, PhotoAttachment } from '@/types'
import { SCAFFOLD_LABELS } from '@/types'
import { generateId, getNowString } from '@/utils/helpers'

interface MockSeed {
  building: string
  floor: string
  location: string
  scaffoldType: ScaffoldType
  problemLevel: ProblemLevel
  problemTitle: string
  problemDescription: string
  status: any
  responsibleTeam: string
  foreman: string
  deadlineDays: number
  foundDaysAgo: number
  foundBy: string
  hasBeforePhoto?: boolean
  hasAfterPhoto?: boolean
  hasDuringPhoto?: boolean
  returnCount?: number
  hasDemolition?: boolean
  rectificationNote?: string
  recheckNote?: string
}

const seeds: MockSeed[] = [
  // 1号楼
  {
    building: '1号楼',
    floor: '8层',
    location: '南侧外架 3-5轴',
    scaffoldType: 'external',
    problemLevel: 'major',
    problemTitle: '连墙件缺失',
    problemDescription: '外架连墙件间距过大，部分区域超过3步3跨设置要求，需补设连墙件。',
    status: 'found',
    responsibleTeam: '外架一班',
    foreman: '王工长',
    deadlineDays: 2,
    foundDaysAgo: 1,
    foundBy: '李安全',
    hasBeforePhoto: true
  },
  {
    building: '1号楼',
    floor: '6层',
    location: '北侧卸料平台',
    scaffoldType: 'landing',
    problemLevel: 'critical',
    problemTitle: '卸料平台超载',
    problemDescription: '卸料平台堆放材料过多，目测超载约30%，且未挂设限载标识牌。',
    status: 'rectifying',
    responsibleTeam: '外架一班',
    foreman: '王工长',
    deadlineDays: 1,
    foundDaysAgo: 3,
    foundBy: '李安全',
    hasBeforePhoto: true,
    hasDuringPhoto: true,
    rectificationNote: '正在清运材料，预计今天完成'
  },
  {
    building: '1号楼',
    floor: '10层',
    location: '东侧外架',
    scaffoldType: 'external',
    problemLevel: 'minor',
    problemTitle: '安全网破损',
    problemDescription: '东侧外架安全网有2处破损，约0.5平米，需及时修补。',
    status: 'rechecking',
    responsibleTeam: '外架二班',
    foreman: '张工长',
    deadlineDays: 3,
    foundDaysAgo: 4,
    foundBy: '赵安全',
    hasBeforePhoto: true,
    hasAfterPhoto: true
  },
  {
    building: '1号楼',
    floor: '5层',
    location: 'A-B轴内架',
    scaffoldType: 'internal',
    problemLevel: 'major',
    problemTitle: '立杆底座悬空',
    problemDescription: '部分立杆底部未垫木方，直接落在楼板上，个别立杆悬空约2-3cm。',
    status: 'passed',
    responsibleTeam: '内架一班',
    foreman: '刘工长',
    deadlineDays: 2,
    foundDaysAgo: 7,
    foundBy: '李安全',
    hasBeforePhoto: true,
    hasAfterPhoto: true,
    recheckNote: '已全部垫实，复查通过'
  },
  {
    building: '1号楼',
    floor: '12层',
    location: '南侧外架',
    scaffoldType: 'wall_anchor',
    problemLevel: 'critical',
    problemTitle: '连墙件被拆除',
    problemDescription: '拆模板时误拆3处连墙件未恢复，外架有失稳风险，必须立即整改。',
    status: 'returned',
    responsibleTeam: '外架一班',
    foreman: '王工长',
    deadlineDays: 0,
    foundDaysAgo: 5,
    foundBy: '李安全',
    hasBeforePhoto: true,
    hasAfterPhoto: true,
    returnCount: 1,
    recheckNote: '上次整改不彻底，仅恢复了2处，退回重改',
    hasDemolition: true
  },
  {
    building: '1号楼',
    floor: '7层',
    location: '楼梯间爬梯',
    scaffoldType: 'stair',
    problemLevel: 'minor',
    problemTitle: '爬梯缺扶手',
    problemDescription: '7层爬梯中段少了一段扶手，上下存在安全隐患。',
    status: 'rectifying',
    responsibleTeam: '外架二班',
    foreman: '张工长',
    deadlineDays: 2,
    foundDaysAgo: 2,
    foundBy: '赵安全'
  },

  // 2号楼
  {
    building: '2号楼',
    floor: '4层',
    location: '西侧外架',
    scaffoldType: 'external',
    problemLevel: 'major',
    problemTitle: '脚手板未满铺',
    problemDescription: '4层外架操作层脚手板未满铺，存在探头板，约有3处空档。',
    status: 'found',
    responsibleTeam: '外架三班',
    foreman: '陈工长',
    deadlineDays: -1,
    foundDaysAgo: 4,
    foundBy: '王安全',
    hasBeforePhoto: true
  },
  {
    building: '2号楼',
    floor: '3层',
    location: '内架支撑',
    scaffoldType: 'internal',
    problemLevel: 'critical',
    problemTitle: '剪刀撑缺失',
    problemDescription: '3层高支模区域剪刀撑设置不足，纵横向均未连续设置，重大隐患。',
    status: 'rectifying',
    responsibleTeam: '内架二班',
    foreman: '周工长',
    deadlineDays: -2,
    foundDaysAgo: 6,
    foundBy: '王安全',
    hasBeforePhoto: true,
    hasDuringPhoto: true,
    rectificationNote: '正在搭设剪刀撑，班组增加了人手',
    hasDemolition: true
  },
  {
    building: '2号楼',
    floor: '5层',
    location: '卸料平台2',
    scaffoldType: 'landing',
    problemLevel: 'major',
    problemTitle: '平台钢丝绳磨损',
    problemDescription: '卸料平台钢丝绳有断丝现象，且未设保险绳，需更换检查。',
    status: 'rechecking',
    responsibleTeam: '外架三班',
    foreman: '陈工长',
    deadlineDays: 1,
    foundDaysAgo: 3,
    foundBy: '王安全',
    hasBeforePhoto: true,
    hasAfterPhoto: true
  },
  {
    building: '2号楼',
    floor: '6层',
    location: '北侧外架',
    scaffoldType: 'safetynet',
    problemLevel: 'minor',
    problemTitle: '水平安全网破损',
    problemDescription: '6层水平安全网有多处破损，洞口未及时封堵。',
    status: 'passed',
    responsibleTeam: '外架三班',
    foreman: '陈工长',
    deadlineDays: 3,
    foundDaysAgo: 8,
    foundBy: '赵安全',
    hasBeforePhoto: true,
    hasAfterPhoto: true
  },

  // 重复问题（1号楼8层连墙件）
  {
    building: '1号楼',
    floor: '8层',
    location: '南侧外架 3-5轴',
    scaffoldType: 'wall_anchor',
    problemLevel: 'major',
    problemTitle: '连墙件缺失',
    problemDescription: '上周整改后复查又发现新拆的连墙件未恢复，属于重复问题。',
    status: 'found',
    responsibleTeam: '外架一班',
    foreman: '王工长',
    deadlineDays: 2,
    foundDaysAgo: 0,
    foundBy: '李安全',
    hasBeforePhoto: true
  },

  // 空记录（无照片）
  {
    building: '2号楼',
    floor: '2层',
    location: '南侧外架',
    scaffoldType: 'external',
    problemLevel: 'minor',
    problemTitle: '外架垃圾未清理',
    problemDescription: '2层外架操作层建筑垃圾较多，需及时清理。',
    status: 'found',
    responsibleTeam: '外架三班',
    foreman: '陈工长',
    deadlineDays: 3,
    foundDaysAgo: 1,
    foundBy: '王安全'
  },

  // 已闭环
  {
    building: '1号楼',
    floor: '3层',
    location: '内架',
    scaffoldType: 'internal',
    problemLevel: 'minor',
    problemTitle: '扫地杆设置不规范',
    problemDescription: '3层部分区域扫地杆离地高度超过200mm。',
    status: 'closed',
    responsibleTeam: '内架一班',
    foreman: '刘工长',
    deadlineDays: 3,
    foundDaysAgo: 14,
    foundBy: '李安全',
    hasBeforePhoto: true,
    hasAfterPhoto: true,
    recheckNote: '已按规范设置，闭环'
  }
]

export function generateMockRecords(): InspectionRecord[] {
  return seeds.map((s, idx) => {
    const id = generateId()
    const foundAt = dayjs().subtract(s.foundDaysAgo, 'day').format('YYYY-MM-DD HH:mm:ss')
    const deadline = dayjs().add(s.deadlineDays, 'day').format('YYYY-MM-DD 18:00:00')

    const photos: PhotoAttachment[] = []
    if (s.hasBeforePhoto) {
      photos.push({
        id: generateId(),
        inspectionId: id,
        dataUrl: '',
        uploadedAt: foundAt,
        uploadedBy: s.foundBy,
        caption: '整改前照片',
        phase: 'before'
      })
    }
    if (s.hasDuringPhoto) {
      photos.push({
        id: generateId(),
        inspectionId: id,
        dataUrl: '',
        uploadedAt: dayjs(foundAt).add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        uploadedBy: s.foreman,
        caption: '整改中照片',
        phase: 'during'
      })
    }
    if (s.hasAfterPhoto) {
      photos.push({
        id: generateId(),
        inspectionId: id,
        dataUrl: '',
        uploadedAt: dayjs(foundAt).add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        uploadedBy: s.foreman,
        caption: '整改后照片',
        phase: 'after'
      })
    }

    const demolitionRequests = s.hasDemolition
      ? [
          {
            id: generateId(),
            inspectionId: id,
            requestedBy: s.foreman,
            requestedAt: dayjs(foundAt).add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
            location: s.location,
            reason: '混凝土浇筑完成，申请拆除局部脚手架',
            scope: '局部拆除约2跨',
            status: 'pending' as const
          }
        ]
      : []

    const auditLog = [
      {
        id: generateId(),
        inspectionId: id,
        timestamp: foundAt,
        operator: s.foundBy,
        action: '问题录入',
        oldStatus: undefined,
        newStatus: 'found',
        note: '巡检发现问题'
      }
    ]

    if (s.status !== 'found') {
      auditLog.push({
        id: generateId(),
        inspectionId: id,
        timestamp: dayjs(foundAt).add(0.5, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: s.foreman,
        action: '状态变更',
        oldStatus: 'found',
        newStatus: 'rectifying',
        note: '班组开始整改'
      })
    }
    if (s.status === 'rechecking' || s.status === 'passed' || s.status === 'returned' || s.status === 'closed') {
      auditLog.push({
        id: generateId(),
        inspectionId: id,
        timestamp: dayjs(foundAt).add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: s.foreman,
        action: '申请复查',
        oldStatus: 'rectifying',
        newStatus: 'rechecking',
        note: s.rectificationNote || '整改完成，申请复查'
      })
    }
    if (s.status === 'passed' || s.status === 'closed') {
      auditLog.push({
        id: generateId(),
        inspectionId: id,
        timestamp: dayjs(foundAt).add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: s.foundBy,
        action: '复查通过',
        oldStatus: 'rechecking',
        newStatus: 'passed',
        note: s.recheckNote || '复查合格'
      })
    }
    if (s.status === 'returned') {
      auditLog.push({
        id: generateId(),
        inspectionId: id,
        timestamp: dayjs(foundAt).add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
        operator: s.foundBy,
        action: '退回重改',
        oldStatus: 'rechecking',
        newStatus: 'returned',
        note: s.recheckNote || '整改不合格，退回重改'
      })
    }

    const buildingNum = s.building.replace(/\D/g, '')
    const code = `SJ-${buildingNum}-${String(idx + 1).padStart(3, '0')}`

    return {
      id,
      code,
      building: s.building,
      floor: s.floor,
      location: s.location,
      scaffoldType: s.scaffoldType,
      scaffoldTypeLabel: SCAFFOLD_LABELS[s.scaffoldType],
      problemLevel: s.problemLevel,
      problemTitle: s.problemTitle,
      problemDescription: s.problemDescription,
      status: s.status,
      responsibleTeam: s.responsibleTeam,
      foreman: s.foreman,
      deadline,
      foundAt,
      foundBy: s.foundBy,
      rectificationNote: s.rectificationNote,
      rectifiedAt: s.status !== 'found' ? dayjs(foundAt).add(1, 'day').format('YYYY-MM-DD HH:mm:ss') : undefined,
      rectifiedBy: s.status !== 'found' ? s.foreman : undefined,
      recheckNote: s.recheckNote,
      recheckedAt: s.status === 'passed' || s.status === 'returned' || s.status === 'closed'
        ? dayjs(foundAt).add(3, 'day').format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      recheckedBy: s.status === 'passed' || s.status === 'returned' || s.status === 'closed' ? s.foundBy : undefined,
      returnCount: s.returnCount || 0,
      createdAt: foundAt,
      updatedAt: getNowString(),
      photos,
      demolitionRequests,
      auditLog
    } as InspectionRecord
  })
}
