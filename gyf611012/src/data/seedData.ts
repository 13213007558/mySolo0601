import type {
  ColorCard,
  User,
  BatchInfo,
  SilkRecord,
  ReturnOrder,
  SaffronGrade,
} from '@/types';
import { SaffronGrade as Grade } from '@/types';
import dayjs from 'dayjs';

export const COLOR_CARDS: ColorCard[] = [
  {
    id: 'card-s',
    grade: Grade.GRADE_S,
    labColor: { L: 26.5, a: 48.2, b: 42.1 },
    hexColor: '#B22222',
    description: 'Super Negin 特级藏红花丝',
    gradeLabel: '特级 S',
    maxDeltaE: 2.0,
  },
  {
    id: 'card-a',
    grade: Grade.GRADE_A,
    labColor: { L: 30.1, a: 45.8, b: 40.5 },
    hexColor: '#CD2626',
    description: 'Negin 一级藏红花丝',
    gradeLabel: '一级 A',
    maxDeltaE: 3.0,
  },
  {
    id: 'card-b',
    grade: Grade.GRADE_B,
    labColor: { L: 34.2, a: 42.5, b: 38.8 },
    hexColor: '#DC143C',
    description: 'Sargol 二级藏红花丝',
    gradeLabel: '二级 B',
    maxDeltaE: 4.0,
  },
  {
    id: 'card-c',
    grade: Grade.GRADE_C,
    labColor: { L: 38.6, a: 39.2, b: 36.5 },
    hexColor: '#E03E3E',
    description: 'Pushal 三级藏红花丝',
    gradeLabel: '三级 C',
    maxDeltaE: 5.0,
  },
  {
    id: 'card-d',
    grade: Grade.GRADE_D,
    labColor: { L: 43.1, a: 35.8, b: 34.2 },
    hexColor: '#E55B5B',
    description: 'Bunch 四级藏红花丝',
    gradeLabel: '四级 D',
    maxDeltaE: 6.0,
  },
  {
    id: 'card-e',
    grade: Grade.GRADE_E,
    labColor: { L: 48.5, a: 32.0, b: 31.5 },
    hexColor: '#EB7878',
    description: '五级（不合格）',
    gradeLabel: '五级 E',
    maxDeltaE: 8.0,
  },
  {
    id: 'card-f',
    grade: Grade.GRADE_F,
    labColor: { L: 55.2, a: 26.5, b: 27.8 },
    hexColor: '#F09A9A',
    description: '六级（必须退货）',
    gradeLabel: '退货 F',
    maxDeltaE: 99.0,
  },
];

export const USERS: User[] = [
  {
    id: 'u-001',
    employeeNo: 'QC-1001',
    name: '张丽华',
    role: 'INSPECTOR',
  },
  {
    id: 'u-002',
    employeeNo: 'QC-2002',
    name: '李明远',
    role: 'SUPERVISOR',
  },
  {
    id: 'u-003',
    employeeNo: 'PM-3003',
    name: '王建国',
    role: 'MANAGER',
  },
];

function emptyGradeDist(): Record<SaffronGrade, number> {
  return {
    [Grade.GRADE_S]: 0,
    [Grade.GRADE_A]: 0,
    [Grade.GRADE_B]: 0,
    [Grade.GRADE_C]: 0,
    [Grade.GRADE_D]: 0,
    [Grade.GRADE_E]: 0,
    [Grade.GRADE_F]: 0,
  };
}

function makeMockSilkRecords(batchId: string, count: number): SilkRecord[] {
  const records: SilkRecord[] = [];
  for (let i = 1; i <= count; i++) {
    const seed = Math.random();
    let grade: SaffronGrade;
    let deltaE: number;
    if (seed < 0.35) {
      grade = Grade.GRADE_B;
      deltaE = 1.2 + Math.random() * 2.4;
    } else if (seed < 0.55) {
      grade = Grade.GRADE_C;
      deltaE = 3.0 + Math.random() * 2.5;
    } else if (seed < 0.72) {
      grade = Grade.GRADE_A;
      deltaE = 1.0 + Math.random() * 1.8;
    } else if (seed < 0.85) {
      grade = Grade.GRADE_D;
      deltaE = 4.8 + Math.random() * 2.0;
    } else if (seed < 0.93) {
      grade = Grade.GRADE_E;
      deltaE = 6.2 + Math.random() * 2.5;
    } else if (seed < 0.97) {
      grade = Grade.GRADE_S;
      deltaE = 0.6 + Math.random() * 1.2;
    } else {
      grade = Grade.GRADE_F;
      deltaE = 10 + Math.random() * 6;
    }
    const card = COLOR_CARDS.find((c) => c.grade === grade)!;
    records.push({
      id: `sr-${batchId}-${String(i).padStart(4, '0')}`,
      batchId,
      serialNumber: i,
      selectedGrade: grade,
      actualGrade: grade,
      deltaE: Number(deltaE.toFixed(2)),
      isWithinThreshold: deltaE <= card.maxDeltaE,
      labColor: {
        L: card.labColor.L + (Math.random() - 0.5) * 2,
        a: card.labColor.a + (Math.random() - 0.5) * 2,
        b: card.labColor.b + (Math.random() - 0.5) * 2,
      },
      supplierLotNo: `LOT-${batchId.toUpperCase()}-${String(i).padStart(3, '0')}`,
      inspectorId: 'u-001',
      inspectorName: '张丽华',
      inspectedAt: dayjs()
        .subtract(count - i, 'minute')
        .toISOString(),
    });
  }
  return records;
}

function buildBatchDistribution(records: SilkRecord[]): {
  dist: Record<SaffronGrade, number>;
  avgDeltaE: number;
  maxDeltaE: number;
  outOfThreshold: number;
} {
  const dist = emptyGradeDist();
  let sumDelta = 0;
  let maxDelta = 0;
  let outOfThreshold = 0;
  records.forEach((r) => {
    dist[r.actualGrade] += 1;
    sumDelta += r.deltaE;
    if (r.deltaE > maxDelta) maxDelta = r.deltaE;
    if (!r.isWithinThreshold) outOfThreshold += 1;
  });
  return {
    dist,
    avgDeltaE: records.length ? Number((sumDelta / records.length).toFixed(2)) : 0,
    maxDeltaE: Number(maxDelta.toFixed(2)),
    outOfThreshold,
  };
}

function seededRecords(batchId: string, total: number, inspected: number) {
  const records = makeMockSilkRecords(batchId, inspected);
  const stats = buildBatchDistribution(records);
  return { records, stats };
}

export const MOCK_BATCHES: BatchInfo[] = (() => {
  const data = [
    {
      id: 'b-2026-0601',
      batchNo: 'IRN-2026-0601-A',
      supplierId: 'sp-001',
      supplierName: '伊朗 Golrang 藏红花合作社',
      supplierContact: '+98 21-8877-6655',
      arrivalDate: dayjs('2026-06-01').toISOString(),
      totalQuantity: 120,
      expectedGrade: Grade.GRADE_A,
    },
    {
      id: 'b-2026-0603',
      batchNo: 'IRN-2026-0603-B',
      supplierId: 'sp-001',
      supplierName: '伊朗 Golrang 藏红花合作社',
      supplierContact: '+98 21-8877-6655',
      arrivalDate: dayjs('2026-06-03').toISOString(),
      totalQuantity: 150,
      expectedGrade: Grade.GRADE_B,
    },
    {
      id: 'b-2026-0605',
      batchNo: 'ESP-2026-0605-A',
      supplierId: 'sp-002',
      supplierName: '西班牙 La Mancha 农业集团',
      supplierContact: '+34 91-123-4567',
      arrivalDate: dayjs('2026-06-05').toISOString(),
      totalQuantity: 80,
      expectedGrade: Grade.GRADE_S,
    },
    {
      id: 'b-2026-0608',
      batchNo: 'MAR-2026-0608-A',
      supplierId: 'sp-003',
      supplierName: '摩洛哥 Taliouine 合作联社',
      supplierContact: '+212 524-88-99-00',
      arrivalDate: dayjs('2026-06-08').toISOString(),
      totalQuantity: 200,
      expectedGrade: Grade.GRADE_B,
    },
    {
      id: 'b-2026-0610',
      batchNo: 'AFG-2026-0610-A',
      supplierId: 'sp-004',
      supplierName: '阿富汗赫拉特藏红花出口公司',
      supplierContact: '+93 799-123-456',
      arrivalDate: dayjs('2026-06-10').toISOString(),
      totalQuantity: 180,
      expectedGrade: Grade.GRADE_C,
    },
  ];

  return data.map((d, idx) => {
    const inspected =
      idx === 0 ? d.totalQuantity : idx === 1 ? 96 : idx === 2 ? d.totalQuantity : idx === 3 ? 42 : 0;
    const { stats } = seededRecords(d.id, d.totalQuantity, inspected);
    let status: BatchInfo['status'] = 'INSPECTING';
    if (inspected === 0) status = 'PENDING';
    else if (inspected === d.totalQuantity && stats.outOfThreshold > d.totalQuantity * 0.2) status = 'DEGRADED';
    else if (inspected === d.totalQuantity) status = 'INSPECTED';
    return {
      ...d,
      inspectedCount: inspected,
      gradeDistribution: stats.dist,
      avgDeltaE: stats.avgDeltaE,
      maxDeltaE: stats.maxDeltaE,
      outOfThresholdCount: stats.outOfThreshold,
      status,
      createdAt: dayjs(d.arrivalDate).add(1, 'day').toISOString(),
      createdBy: 'u-001',
    };
  });
})();

export function getMockRecordsForBatch(batchId: string, total: number, inspected: number) {
  return seededRecords(batchId, total, inspected).records;
}

export const MOCK_RETURN_ORDERS: ReturnOrder[] = [
  {
    id: 'ro-0001',
    returnNo: 'RT-20260602-001',
    batchId: 'b-2026-0601',
    batchNo: 'IRN-2026-0601-A',
    supplierName: '伊朗 Golrang 藏红花合作社',
    originalGrade: Grade.GRADE_A,
    degradedToGrade: Grade.GRADE_C,
    degradationReason:
      '经逐条色卡对照，该批次共 120 条丝线中有 34 条色差 ΔE 超过 A 级阈值 3.0，平均色偏达 4.72，不符合合同约定等级标准，整批降级至三级 C。',
    avgDeltaE: 4.72,
    maxDeltaE: 11.38,
    outOfThresholdCount: 34,
    totalCount: 120,
    applicantId: 'u-001',
    applicantName: '张丽华',
    approverId: 'u-002',
    approverName: '李明远',
    secondApproverId: 'u-003',
    secondApproverName: '王建国',
    status: 'LOCKED',
    createdAt: dayjs('2026-06-10 09:30:00').toISOString(),
    firstApprovedAt: dayjs('2026-06-10 10:15:00').toISOString(),
    finalApprovedAt: dayjs('2026-06-10 11:00:00').toISOString(),
    irrevocableUntil: dayjs('2026-06-10 11:00:00').add(24, 'hour').toISOString(),
  },
  {
    id: 'ro-0002',
    returnNo: 'RT-20260605-001',
    batchId: 'b-2026-0605',
    batchNo: 'ESP-2026-0605-A',
    supplierName: '西班牙 La Mancha 农业集团',
    originalGrade: Grade.GRADE_S,
    degradedToGrade: Grade.GRADE_A,
    degradationReason:
      '整批色差实测值略高于特级 S 阈值，平均 ΔE 2.41，最大 ΔE 4.12，降级为一级 A。',
    avgDeltaE: 2.41,
    maxDeltaE: 4.12,
    outOfThresholdCount: 18,
    totalCount: 80,
    applicantId: 'u-001',
    applicantName: '张丽华',
    approverId: 'u-002',
    approverName: '李明远',
    status: 'FIRST_APPROVED',
    createdAt: dayjs('2026-06-11 08:20:00').toISOString(),
    firstApprovedAt: dayjs('2026-06-11 09:00:00').toISOString(),
    irrevocableUntil: dayjs('2026-06-12 09:00:00').toISOString(),
  },
];
