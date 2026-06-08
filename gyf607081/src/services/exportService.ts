import * as XLSX from 'xlsx';
import {
  CheckRecord,
  Baby,
  TemperatureRecord,
  LeaveNote,
  ExportRecord,
  StatusChangeTrace,
  RecordStatus,
  DataStatus
} from '../types';
import { mockExportRecords, mockCurrentOperator } from '../data/mockData';

const EXPORT_RECORDS_KEY = 'export_records';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadExportRecords(): ExportRecord[] {
  const stored = localStorage.getItem(EXPORT_RECORDS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(EXPORT_RECORDS_KEY, JSON.stringify(mockExportRecords));
  return mockExportRecords;
}

function saveExportRecords(records: ExportRecord[]): void {
  localStorage.setItem(EXPORT_RECORDS_KEY, JSON.stringify(records));
}

function getStatusText(status: RecordStatus): string {
  const map: Record<RecordStatus, string> = {
    [RecordStatus.PENDING]: '待处理',
    [RecordStatus.REJECTED]: '已拒绝',
    [RecordStatus.REISSUED]: '已补发',
    [RecordStatus.MANUAL]: '手工补录'
  };
  return map[status];
}

function getDataStatusText(status: DataStatus): string {
  const map: Record<DataStatus, string> = {
    [DataStatus.NORMAL]: '正常',
    [DataStatus.DIRTY]: '脏数据',
    [DataStatus.EMPTY]: '空数据'
  };
  return map[status];
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export interface ExportRowData {
  序号: number;
  记录ID: string;
  宝宝姓名: string;
  年龄: number;
  班级: string;
  体温: string;
  测量时间: string;
  是否请假: string;
  请假原因: string;
  记录状态: string;
  数据状态: string;
  备注: string;
  是否手工补录: string;
  状态变更历史: string;
  创建时间: string;
  更新时间: string;
  操作人: string;
}

export function buildExportData(
  records: CheckRecord[],
  babies: Baby[],
  tempRecords: TemperatureRecord[],
  leaveNotes: LeaveNote[],
  statusChanges: StatusChangeTrace[]
): ExportRowData[] {
  const babyMap = new Map(babies.map(b => [b.id, b]));
  const tempMap = new Map(tempRecords.map(t => [t.id, t]));
  const leaveMap = new Map(leaveNotes.map(l => [l.id, l]));

  const changesByRecord = new Map<string, StatusChangeTrace[]>();
  statusChanges.forEach(change => {
    if (!changesByRecord.has(change.recordId)) {
      changesByRecord.set(change.recordId, []);
    }
    changesByRecord.get(change.recordId)!.push(change);
  });

  return records.map((record, index) => {
    const baby = babyMap.get(record.babyId);
    const tempRecord = record.temperatureRecordId
      ? tempMap.get(record.temperatureRecordId)
      : undefined;
    const leaveNote = record.leaveNoteId ? leaveMap.get(record.leaveNoteId) : undefined;
    const changes = changesByRecord.get(record.id) || [];

    const changeHistory = changes
      .sort((a, b) => new Date(a.changeTime).getTime() - new Date(b.changeTime).getTime())
      .map(
        c =>
          `${formatDate(c.changeTime)}: ${getStatusText(c.oldStatus)} → ${getStatusText(c.newStatus)} (${c.operator}: ${c.remark})`
      )
      .join('\n');

    return {
      序号: index + 1,
      记录ID: record.id,
      宝宝姓名: baby?.name || '未知',
      年龄: baby?.age || 0,
      班级: baby?.className || '未知',
      体温: tempRecord ? `${tempRecord.temperature}℃` : '无',
      测量时间: tempRecord ? formatDate(tempRecord.measureTime) : '无',
      是否请假: leaveNote ? '是' : '否',
      请假原因: leaveNote?.reason || '无',
      记录状态: getStatusText(record.status),
      数据状态: getDataStatusText(record.dataStatus),
      备注: record.currentRemark,
      是否手工补录: record.isManual ? '是' : '否',
      状态变更历史: changeHistory || '无变更',
      创建时间: formatDate(record.createdAt),
      更新时间: formatDate(record.updatedAt),
      操作人: record.operator
    };
  });
}

export async function exportToExcel(
  records: CheckRecord[],
  babies: Baby[],
  tempRecords: TemperatureRecord[],
  leaveNotes: LeaveNote[],
  statusChanges: StatusChangeTrace[]
): Promise<string> {
  const exportData = buildExportData(
    records,
    babies,
    tempRecords,
    leaveNotes,
    statusChanges
  );

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '晨检复核记录');

  const colWidths = [
    { wch: 6 },
    { wch: 12 },
    { wch: 10 },
    { wch: 6 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 8 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 30 },
    { wch: 10 },
    { wch: 50 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 }
  ];
  ws['!cols'] = colWidths;

  const exportRecord: ExportRecord = {
    id: generateId('export'),
    exportTime: new Date().toISOString(),
    operator: mockCurrentOperator,
    recordIds: records.map(r => r.id),
    statusChanges,
    downloadUrl: '#'
  };

  const allExports = loadExportRecords();
  allExports.push(exportRecord);
  saveExportRecords(allExports);

  const fileName = `晨检复核记录_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return exportRecord.id;
}

export function getAllExportRecords(): ExportRecord[] {
  return loadExportRecords().sort(
    (a, b) => new Date(b.exportTime).getTime() - new Date(a.exportTime).getTime()
  );
}

export function getExportRecordById(id: string): ExportRecord | undefined {
  return loadExportRecords().find(e => e.id === id);
}

export function getStatusChangesByRecordId(recordId: string): StatusChangeTrace[] {
  const exports = loadExportRecords();
  const changes: StatusChangeTrace[] = [];
  exports.forEach(exp => {
    exp.statusChanges.forEach(change => {
      if (change.recordId === recordId) {
        changes.push(change);
      }
    });
  });
  return changes.sort(
    (a, b) => new Date(b.changeTime).getTime() - new Date(a.changeTime).getTime()
  );
}
