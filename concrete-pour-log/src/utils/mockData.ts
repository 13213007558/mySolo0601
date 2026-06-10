import dayjs from 'dayjs'
import type { PourRecord, CubeSample, AbnormalRecord } from '@/types'
import { generateId, getNowString, validateRecord, determineStatus } from '@/utils/calc'

const BASE_DATE = dayjs().subtract(2, 'day').hour(22).minute(0).second(0)

function addHours(base: dayjs.Dayjs, hours: number) {
  return base.add(hours, 'hour').format('YYYY-MM-DD HH:mm:ss')
}

export function generateMockData(): PourRecord[] {
  const records: PourRecord[] = []

  const firstFloor: PourRecord[] = [
    {
      id: generateId(),
      truckNo: '沪A·12345',
      batchNo: 'B20240608-001',
      arriveTime: addHours(BASE_DATE, 0),
      startPourTime: addHours(BASE_DATE, 0.5),
      endPourTime: addHours(BASE_DATE, 2),
      position: '2号楼',
      component: '三层梁板',
      grade: 'C30',
      volume: 12.5,
      slump: 180,
      slumpUnit: 'mm',
      temperature: 28,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '王试验',
      supervisor: '李监理',
      remark: '首车正常，坍落度适中',
      samples: [],
      abnormals: [],
      status: 'normal',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪A·23456',
      batchNo: 'B20240608-002',
      arriveTime: addHours(BASE_DATE, 1.5),
      startPourTime: addHours(BASE_DATE, 2),
      endPourTime: addHours(BASE_DATE, 3.5),
      position: '2号楼',
      component: '三层梁板',
      grade: 'C30',
      volume: 11.8,
      slump: 230,
      slumpUnit: 'mm',
      temperature: 30,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '王试验',
      supervisor: '李监理',
      remark: '坍落度偏大，已通知搅拌站调整',
      samples: [],
      abnormals: [],
      status: 'warning',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪A·34567',
      batchNo: 'B20240608-003',
      arriveTime: addHours(BASE_DATE, 3),
      startPourTime: addHours(BASE_DATE, 3.5),
      endPourTime: addHours(BASE_DATE, 5),
      position: '2号楼',
      component: '三层梁板',
      grade: 'C30',
      volume: 12.0,
      slump: 195,
      slumpUnit: 'mm',
      temperature: 29,
      hasPhoto: false,
      gradeMatch: true,
      inspector: '王试验',
      supervisor: '李监理',
      remark: '夜间浇筑，照片漏拍',
      manualCorrection: '现场太忙忘记拍，第二天补拍归档',
      correctedBy: '王试验',
      correctedAt: addHours(BASE_DATE, 10),
      samples: [],
      abnormals: [],
      status: 'missing_photo',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪A·45678',
      batchNo: 'B20240608-004',
      arriveTime: addHours(BASE_DATE, 4.5),
      startPourTime: addHours(BASE_DATE, 5.5),
      endPourTime: addHours(BASE_DATE, 7),
      position: '2号楼',
      component: '三层梁板',
      grade: 'C35',
      volume: 10.5,
      slump: 160,
      slumpUnit: 'mm',
      temperature: 27,
      hasPhoto: true,
      gradeMatch: false,
      inspector: '王试验',
      supervisor: '李监理',
      remark: '设计C30，送来C35，已退回？不，现场决定照用',
      samples: [],
      abnormals: [],
      status: 'abnormal',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪A·56789',
      batchNo: 'B20240608-005',
      arriveTime: addHours(BASE_DATE, 6),
      startPourTime: addHours(BASE_DATE, 7),
      endPourTime: addHours(BASE_DATE, 8.5),
      position: '2号楼',
      component: '三层柱',
      grade: 'C40',
      volume: 8.5,
      slump: 170,
      slumpUnit: 'mm',
      temperature: 26,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '王试验',
      supervisor: '李监理',
      remark: '柱混凝土单独浇筑',
      samples: [],
      abnormals: [],
      status: 'normal',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪A·67890',
      batchNo: 'B20240608-006',
      arriveTime: addHours(BASE_DATE, 7.5),
      startPourTime: addHours(BASE_DATE, 8.5),
      endPourTime: addHours(BASE_DATE, 10),
      position: '2号楼',
      component: '三层梁板',
      grade: 'C30',
      volume: 11.0,
      slump: 185,
      slumpUnit: 'mm',
      temperature: 25,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '王试验',
      supervisor: '李监理',
      remark: '中间停泵 40 分钟，管道堵了',
      samples: [],
      abnormals: [],
      status: 'warning',
      createdAt: getNowString(),
      updatedAt: getNowString()
    }
  ]

  const secondFloor: PourRecord[] = [
    {
      id: generateId(),
      truckNo: '沪A·12345',
      batchNo: 'B20240609-001',
      arriveTime: dayjs().subtract(1, 'day').hour(6).minute(30).second(0).format('YYYY-MM-DD HH:mm:ss'),
      startPourTime: dayjs().subtract(1, 'day').hour(7).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
      endPourTime: dayjs().subtract(1, 'day').hour(8).minute(30).second(0).format('YYYY-MM-DD HH:mm:ss'),
      position: '1号楼',
      component: '地下室墙',
      grade: 'C35P8',
      volume: 15.0,
      slump: 200,
      slumpUnit: 'mm',
      temperature: 24,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '张工',
      supervisor: '赵监理',
      remark: '抗渗混凝土，掺膨胀剂',
      samples: [],
      abnormals: [],
      status: 'normal',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪B·77777',
      batchNo: 'B20240609-002',
      arriveTime: dayjs().subtract(1, 'day').hour(8).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
      startPourTime: dayjs().subtract(1, 'day').hour(8).minute(30).second(0).format('YYYY-MM-DD HH:mm:ss'),
      endPourTime: dayjs().subtract(1, 'day').hour(10).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
      position: '1号楼',
      component: '基础筏板',
      grade: 'C40P10',
      volume: 18.5,
      slump: 110,
      slumpUnit: 'mm',
      temperature: 22,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '张工',
      supervisor: '赵监理',
      remark: '坍落度偏小，需振动到位',
      samples: [],
      abnormals: [],
      status: 'warning',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪B·88888',
      batchNo: 'B20240609-003',
      arriveTime: dayjs().subtract(1, 'day').hour(9).minute(30).second(0).format('YYYY-MM-DD HH:mm:ss'),
      startPourTime: dayjs().subtract(1, 'day').hour(10).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
      endPourTime: dayjs().subtract(1, 'day').hour(11).minute(30).second(0).format('YYYY-MM-DD HH:mm:ss'),
      position: '1号楼',
      component: '基础筏板',
      grade: 'C40P10',
      volume: 17.0,
      slump: 190,
      slumpUnit: 'mm',
      temperature: 23,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '张工',
      supervisor: '赵监理',
      remark: '正常浇筑',
      samples: [],
      abnormals: [],
      status: 'normal',
      createdAt: getNowString(),
      updatedAt: getNowString()
    },
    {
      id: generateId(),
      truckNo: '沪B·88888',
      batchNo: 'B20240609-003-补',
      arriveTime: dayjs().subtract(1, 'day').hour(11).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss'),
      position: '1号楼',
      component: '基础筏板',
      grade: 'C40P10',
      volume: 17.0,
      slump: 190,
      slumpUnit: 'mm',
      temperature: 23,
      hasPhoto: true,
      gradeMatch: true,
      inspector: '张工',
      supervisor: '赵监理',
      remark: '重复补录测试（同日同车号）',
      samples: [],
      abnormals: [],
      status: 'normal',
      createdAt: getNowString(),
      updatedAt: getNowString()
    }
  ]

  records.push(...firstFloor, ...secondFloor)

  records.forEach((r) => {
    const baseAbnormals = validateRecord(r)
    baseAbnormals.forEach((a) => { a.recordId = r.id })

    if (r.remark?.includes('停泵')) {
      baseAbnormals.push({
        id: generateId(),
        recordId: r.id,
        type: 'pump_stop',
        typeLabel: '停泵异常',
        description: '浇筑中途停泵约 40 分钟，疑似管道堵塞',
        severity: 'medium',
        handled: true,
        handleReason: '已疏通管道，继续浇筑，混凝土未初凝',
        handler: '王试验',
        handleTime: addHours(BASE_DATE, 9)
      })
    }

    const stdSamples: CubeSample[] = [
      {
        id: generateId(),
        recordId: r.id,
        type: '标准养护',
        groupNo: `${r.batchNo}-标-1`,
        count: 3,
        madeTime: r.arriveTime,
        remark: '每车一组'
      }
    ]

    if (r.component.includes('梁板') || r.component.includes('筏板')) {
      stdSamples.push({
        id: generateId(),
        recordId: r.id,
        type: '同条件养护',
        groupNo: `${r.batchNo}-同-1`,
        count: 3,
        madeTime: r.arriveTime,
        remark: '拆模强度用'
      })
    }

    if (r.grade.includes('P')) {
      stdSamples.push({
        id: generateId(),
        recordId: r.id,
        type: '抗渗',
        groupNo: `${r.batchNo}-渗-1`,
        count: 6,
        madeTime: r.arriveTime,
        remark: '抗渗试件'
      })
    }

    r.samples = stdSamples
    r.abnormals = baseAbnormals
    r.status = determineStatus(r, r.abnormals)
  })

  return records
}

export const MOCK_RECORDS = generateMockData()
