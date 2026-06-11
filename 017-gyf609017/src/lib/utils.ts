import type { Batch, DoorWindowRecord, MissingPart, ReplenishHistory } from './types';

export function normalizeOpeningCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function exportCSV(
  records: DoorWindowRecord[],
  batches: Batch[],
  missingParts: MissingPart[],
  replenishHistories: ReplenishHistory[],
  settings: { currentResponsible: string }
): string {
  const batchMap = new Map(batches.map(b => [b.id, b]));

  const sorted = [...records].sort((a, b) => {
    const bd = a.buildingNo.localeCompare(b.buildingNo, 'zh-CN');
    if (bd !== 0) return bd;
    return a.unitNo.localeCompare(b.unitNo, 'zh-CN');
  });

  const headers = [
    '楼栋号', '单元号', '楼层', '房间号', '洞口编码', '规格', '玻璃类型',
    '五金清单', '批次号', '供应商', '验收状态', '缺件信息'
  ];

  const rows = sorted.map(r => {
    const batch = batchMap.get(r.batchId);
    const parts = missingParts.filter(m => m.recordId === r.id);
    const missingInfo = parts.map(p => {
      const histories = replenishHistories.filter(h => h.missingId === p.id);
      const replenishedTotal = histories.reduce((sum, h) => sum + h.replenishedQty, 0);
      const statusLabel = getMissingStatusLabel(p.status);
      return `${p.partName}(缺${p.quantity}件,已补${replenishedTotal}件,${statusLabel})`;
    }).join('; ');

    return [
      r.buildingNo, r.unitNo, r.floorNo, r.roomNo, r.openingCode,
      r.spec, r.glassType, r.hardwareList,
      batch?.batchNo ?? '', batch?.supplier ?? '',
      getRecordStatusLabel(r.status),
      missingInfo
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getRecordStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: '待验收', accepted: '已验收', rejected: '已退回' };
  return map[status] || status;
}

export function getMissingStatusLabel(status: string): string {
  const map: Record<string, string> = { missing: '缺件', partial: '部分补货', resolved: '已补齐' };
  return map[status] || status;
}

export function getBatchStatusLabel(status: string): string {
  const map: Record<string, string> = { in_transit: '在途', delivered: '已到货', accepted: '已验收', partial_accepted: '部分验收' };
  return map[status] || status;
}
