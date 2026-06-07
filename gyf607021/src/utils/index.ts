import dayjs from 'dayjs';
import type { MorningCheckRecord, Baby, BatchOperationResult, Appointment } from '../types';

export function exportToCSV(
  records: MorningCheckRecord[],
  babyMap: Record<string, Baby>
): { csv: string; count: number; filename: string } {
  const headers = [
    '记录ID',
    '日期',
    '宝宝姓名',
    '宝宝昵称',
    '性别',
    '月龄',
    '班级',
    '家长姓名',
    '家长手机',
    '体温(℃)',
    '状态',
    '快速备注',
    '详细说明',
    '数据来源',
    '数据质量',
    '操作人',
    '确认时间',
    '是否手工补录',
  ];

  const statusMap: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    recheck_required: '需复核',
    leave: '请假',
    absent: '缺勤',
    withdrawn: '已撤回',
  };

  const sourceMap: Record<string, string> = {
    thermometer: '体温枪',
    manual: '手工录入',
    import: '系统导入',
  };

  const qualityMap: Record<string, string> = {
    empty: '空数据',
    dirty: '脏数据',
    normal: '正常',
  };

  const rows = records.map((r) => {
    const b = babyMap[r.babyId];
    return [
      r.id,
      r.checkDate,
      b?.name ?? '',
      b?.nickname ?? '',
      b?.gender === 'male' ? '男' : '女',
      b?.ageMonths ?? '',
      b?.className ?? '',
      b?.parentName ?? '',
      b?.parentPhone ?? '',
      r.temperature?.toString() ?? '',
      statusMap[r.status] ?? r.status,
      r.quickNote ?? '',
      r.remark ?? '',
      sourceMap[r.source] ?? r.source,
      qualityMap[r.dataQuality] ?? r.dataQuality,
      r.operator,
      r.confirmedAt ?? '',
      r.isManualSupplement ? '是' : '否',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const filename = `晨检复核_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
  return { csv, count: records.length, filename };
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function batchCreateAppointments(
  appointments: Array<Omit<Appointment, 'id' | 'status' | 'createdAt'>>,
  existing: Appointment[]
): BatchOperationResult {
  const result: BatchOperationResult = {
    success: 0,
    failed: 0,
    total: appointments.length,
    details: [],
  };
  appointments.forEach((a, idx) => {
    const conflict = existing.find(
      (e) =>
        e.babyId === a.babyId &&
        e.scheduledAt === a.scheduledAt &&
        e.status !== 'cancelled'
    );
    if (conflict) {
      result.failed += 1;
      result.details.push({
        id: `NEW-${idx}`,
        babyName: a.babyId,
        ok: false,
        reason: `与已有预约(${conflict.id})时间冲突，已标记冲突`,
      });
    } else {
      result.success += 1;
      result.details.push({
        id: `NEW-${idx}`,
        babyName: a.babyId,
        ok: true,
      });
    }
  });
  return result;
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'recheck_required':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'leave':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'absent':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'withdrawn':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    recheck_required: '需复核',
    leave: '请假',
    absent: '缺勤',
    withdrawn: '已撤回',
  };
  return map[status] ?? status;
}

export function getQualityLabel(q: string) {
  const map: Record<string, string> = {
    empty: '空数据',
    dirty: '脏数据',
    normal: '正常',
  };
  return map[q] ?? q;
}

export function getQualityBadgeColor(q: string) {
  switch (q) {
    case 'empty':
      return 'bg-gray-100 text-gray-600 border border-gray-300';
    case 'dirty':
      return 'bg-red-50 text-red-600 border border-red-300';
    case 'normal':
      return 'bg-green-50 text-green-600 border border-green-300';
    default:
      return 'bg-gray-100 text-gray-600 border border-gray-300';
  }
}
