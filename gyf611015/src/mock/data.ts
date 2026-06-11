import type { Mussel, MeasurementPoint, ReInspectionOrder, NucleusBatch, Operator, PoolHistoryEntry } from '@/types';

export const NUCLEUS_BATCHES: NucleusBatch[] = [
  { id: 'NB-2026-001', label: 'NB-2026-001 (淡水珠核)', implantDate: '2025-03-15', poolId: 'P-01' },
  { id: 'NB-2026-002', label: 'NB-2026-002 (海水珠核)', implantDate: '2025-05-20', poolId: 'P-01' },
  { id: 'NB-2026-003', label: 'NB-2026-003 (淡水珠核)', implantDate: '2025-06-10', poolId: 'P-02' },
  { id: 'NB-2026-004', label: 'NB-2026-004 (海水珠核)', implantDate: '2025-07-01', poolId: 'P-02' },
  { id: 'NB-2026-005', label: 'NB-2026-005 (淡水珠核)', implantDate: '2025-08-15', poolId: 'P-03' },
];

export const OPERATORS: Operator[] = [
  { id: 'op-1', name: '张明', shift: 'A' },
  { id: 'op-2', name: '李芳', shift: 'B' },
  { id: 'op-3', name: '王强', shift: 'C' },
  { id: 'op-4', name: '赵丽', shift: 'A' },
  { id: 'op-5', name: '陈伟', shift: 'B' },
];

export const POOL_HISTORY: Record<string, PoolHistoryEntry[]> = {
  'P-01': [
    { date: '2026-01', avgThickness: 1.85, minThickness: 1.1, maxThickness: 2.6, pointCount: 96, sampleCount: 12 },
    { date: '2026-02', avgThickness: 1.92, minThickness: 1.2, maxThickness: 2.7, pointCount: 104, sampleCount: 13 },
    { date: '2026-03', avgThickness: 1.78, minThickness: 0.9, maxThickness: 2.5, pointCount: 88, sampleCount: 11 },
    { date: '2026-04', avgThickness: 2.01, minThickness: 1.3, maxThickness: 2.8, pointCount: 112, sampleCount: 14 },
    { date: '2026-05', avgThickness: 1.95, minThickness: 1.1, maxThickness: 2.6, pointCount: 96, sampleCount: 12 },
  ],
  'P-02': [
    { date: '2026-01', avgThickness: 1.72, minThickness: 0.8, maxThickness: 2.4, pointCount: 80, sampleCount: 10 },
    { date: '2026-02', avgThickness: 1.80, minThickness: 1.0, maxThickness: 2.5, pointCount: 88, sampleCount: 11 },
    { date: '2026-03', avgThickness: 1.68, minThickness: 0.7, maxThickness: 2.3, pointCount: 72, sampleCount: 9 },
    { date: '2026-04', avgThickness: 1.75, minThickness: 0.9, maxThickness: 2.5, pointCount: 84, sampleCount: 10 },
    { date: '2026-05', avgThickness: 1.82, minThickness: 1.0, maxThickness: 2.6, pointCount: 92, sampleCount: 11 },
  ],
  'P-03': [
    { date: '2026-01', avgThickness: 2.10, minThickness: 1.5, maxThickness: 2.9, pointCount: 120, sampleCount: 15 },
    { date: '2026-02', avgThickness: 2.15, minThickness: 1.4, maxThickness: 3.0, pointCount: 128, sampleCount: 16 },
    { date: '2026-03', avgThickness: 2.05, minThickness: 1.3, maxThickness: 2.8, pointCount: 112, sampleCount: 14 },
    { date: '2026-04', avgThickness: 2.20, minThickness: 1.5, maxThickness: 3.1, pointCount: 136, sampleCount: 17 },
    { date: '2026-05', avgThickness: 2.12, minThickness: 1.4, maxThickness: 2.9, pointCount: 120, sampleCount: 15 },
  ],
};

let idCounter = 0;
export function genId(prefix: string = 'id'): string {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function createEmptyMussel(poolId: string, batchId: string): Mussel {
  return {
    id: genId('m'),
    poolId,
    batchId,
    label: `蚌-${Date.now().toString(36).toUpperCase()}`,
    points: [],
    grade: null,
    canGrade: false,
    gradeReason: '',
    createdAt: Date.now(),
  };
}

export function createPoint(
  x: number,
  y: number,
  thickness: number,
  quadrant: 1 | 2 | 3 | 4,
  batchId: string | null,
): MeasurementPoint {
  const isThin = thickness < 1.2;
  return {
    id: genId('pt'),
    x,
    y,
    thickness,
    quadrant,
    isThin,
    batchId: isThin ? batchId : null,
    timestamp: Date.now(),
    isRechecked: false,
    recheckedBy: null,
    recheckedAt: null,
  };
}

export function createReInspectionOrder(
  musselId: string,
  pointId: string,
  reason: string,
  originalValue: number,
  originalOperator: string,
): ReInspectionOrder {
  return {
    id: genId('ri'),
    musselId,
    pointId,
    reason,
    originalValue,
    recheckValue: null,
    originalOperator,
    recheckOperator: null,
    status: 'pending',
    createdAt: Date.now(),
    completedAt: null,
  };
}

export function exportCertificate(mussel: Mussel, operatorName: string): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('       珍珠蚌层厚度分级证书（草稿）');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push(`证书编号：CERT-${mussel.id}`);
  lines.push(`蚌编号：${mussel.label}`);
  lines.push(`养殖池：${mussel.poolId}`);
  lines.push(`核珠批次：${mussel.batchId}`);
  lines.push(`检测日期：${new Date(mussel.createdAt).toLocaleDateString('zh-CN')}`);
  lines.push(`操作员：${operatorName}`);
  lines.push('');
  lines.push('───────────────────────────────────────────');
  lines.push('测量数据：');
  lines.push('');
  mussel.points.forEach((p, i) => {
    const thin = p.isThin ? ' ⚠ 薄层' : '';
    const recheck = p.isRechecked ? ` [复检: ${p.recheckedBy}]` : '';
    lines.push(`  测点${i + 1}: ${p.thickness.toFixed(2)}mm (象限${p.quadrant})${thin}${recheck}`);
    if (p.batchId && p.isThin) {
      lines.push(`         关联核珠批次: ${p.batchId}`);
    }
  });
  lines.push('');
  lines.push('───────────────────────────────────────────');
  lines.push('统计摘要：');
  const thicknesses = mussel.points.map((p) => p.thickness);
  const avg = thicknesses.reduce((a, b) => a + b, 0) / thicknesses.length;
  const min = Math.min(...thicknesses);
  const max = Math.max(...thicknesses);
  lines.push(`  平均厚度：${avg.toFixed(2)}mm`);
  lines.push(`  最小厚度：${min.toFixed(2)}mm`);
  lines.push(`  最大厚度：${max.toFixed(2)}mm`);
  lines.push(`  测点数量：${mussel.points.length}`);
  lines.push(`  薄层点数：${mussel.points.filter((p) => p.isThin).length}`);
  lines.push('');
  lines.push('───────────────────────────────────────────');
  lines.push(`分级结果：${mussel.grade ?? '未分级'}`);
  lines.push('');
  lines.push('═══════════════════════════════════════════');
  lines.push('  此证书为草稿，需场长签字确认后生效');
  lines.push('═══════════════════════════════════════════');
  return lines.join('\n');
}
