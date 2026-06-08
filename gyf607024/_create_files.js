const fs = require('fs');
const path = require('path');

const base = '/Users/guo/pro/solo/workspaces/gyf607024';

const files = {
  'src/types/index.ts': `export type RecordStatus = 'pending' | 'processed' | 'abnormal';
export type IssueSeverity = 'warning' | 'error';
export type IssueType = 'unit_mismatch' | 'boundary_value' | 'invalid_phone' | 'empty_name' | 'same_course';

export interface DataQualityIssue {
  id: string; recordId: string; type: IssueType; field: string; reason: string; severity: IssueSeverity;
}

export interface OperationLog {
  id: string; recordId: string; action: string; operator: string; note: string; timestamp: string;
}

export interface RescheduleRecord {
  id: string; sourceFile: string; handler: string; status: RecordStatus; latestNote: string;
  babyName: string; phone: string; originalCourse: string; targetCourse: string; reason: string;
  unit: string; hours: number; operator: string; createdAt: string; updatedAt: string;
  isManual: boolean; issues: DataQualityIssue[]; logs: OperationLog[];
}

export interface RecordFormData {
  babyName: string; phone: string; originalCourse: string; targetCourse: string; reason: string;
  unit: string; hours: number | ''; latestNote: string; handler: string; sourceFile: string;
}
`,

  'src/utils/validation.ts': `import type { RescheduleRecord, RecordFormData, DataQualityIssue } from '@/types';

export function generateId(): string {
  return 'REC_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function validatePhone(phone: string): boolean {
  return /^1\\d{10}$/.test(phone.trim());
}

export function validateRecord(data: RecordFormData, allRecords: RescheduleRecord[] = []): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  const recordId = 'pending';
  if (!data.babyName || data.babyName.trim().length < 2) {
    issues.push({ id: 'issue_name_' + Date.now(), recordId, type: 'empty_name', field: 'babyName', reason: '宝宝姓名不能为空或过短，至少需要 2 个字符', severity: 'error' });
  }
  if (!validatePhone(data.phone)) {
    issues.push({ id: 'issue_phone_' + Date.now(), recordId, type: 'invalid_phone', field: 'phone', reason: '手机号格式不正确，应为 11 位有效号码且以 1 开头', severity: 'error' });
  }
  const hoursNum = typeof data.hours === 'number' ? data.hours : Number(data.hours);
  if (data.hours === '' || isNaN(hoursNum) || hoursNum <= 0) {
    issues.push({ id: 'issue_bound_zero_' + Date.now(), recordId, type: 'boundary_value', field: 'hours', reason: '课时数量为 0 或空值，属于异常边界值', severity: 'error' });
  } else if (hoursNum > 30) {
    issues.push({ id: 'issue_bound_high_' + Date.now(), recordId, type: 'boundary_value', field: 'hours', reason: '课时数量 ' + hoursNum + ' 超过 30，超出单次改期正常范围，请确认', severity: 'warning' });
  }
  if (data.originalCourse && data.targetCourse && data.originalCourse === data.targetCourse) {
    issues.push({ id: 'issue_same_' + Date.now(), recordId, type: 'same_course', field: 'targetCourse', reason: '原课程与改期课程相同，疑似误操作', severity: 'warning' });
  }
  if (data.phone && data.unit) {
    const samePhoneRecords = allRecords.filter(r => r.phone === data.phone.trim() && r.unit !== data.unit);
    if (samePhoneRecords.length > 0) {
      const otherUnits = [...new Set(samePhoneRecords.map(r => r.unit))];
      issues.push({ id: 'issue_unit_' + Date.now(), recordId, type: 'unit_mismatch', field: 'unit', reason: '该学员历史记录单位为「' + otherUnits.join('/') + '」，本次为「' + data.unit + '」，存在单位混用风险', severity: 'warning' });
    }
  }
  return issues;
}
`,

  'src/utils/csv.ts': `import type { RescheduleRecord } from '@/types';

const statusMap: Record<string, string> = { pending: '待处理', processed: '已处理', abnormal: '异常数据' };

function escapeCSV(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\\n')) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

export function exportToCSV(records: RescheduleRecord[]): { filename: string; content: string; rowCount: number } {
  const headers = ['记录ID','来源文件','处理人','当前状态','宝宝姓名','手机号','原课程','改期课程','改期原因','课时单位','课时数量','最近人工说明','操作人','是否手工补录','创建时间','数据异常数'];
  const rows = records.map(r => [ r.id, r.sourceFile, r.handler, statusMap[r.status] ?? r.status, r.babyName, r.phone, r.originalCourse, r.targetCourse, r.reason, r.unit, r.hours, r.latestNote, r.operator, r.isManual ? '是' : '否', r.createdAt, r.issues.length ]);
  const csvContent = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  return { filename: '海豚泳池改期记录_' + dateStr + '.csv', content: '\\uFEFF' + csvContent, rowCount: records.length };
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.setAttribute('download', filename);
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}
`,

  'src/data/mockData.ts': `import type { RescheduleRecord } from '@/types';

export const mockRecords: RescheduleRecord[] = [
  {
    id: 'REC_mock_001',
    sourceFile: '2024-06-01-海豚改期表.xlsx',
    handler: '李教练',
    status: 'pending',
    latestNote: '等待家长确认改期时间',
    babyName: '小明',
    phone: '13800138001',
    originalCourse: '婴儿游泳启蒙班（周六10:00）',
    targetCourse: '婴儿游泳启蒙班（周日15:00）',
    reason: '本周六有事冲突',
    unit: '课时',
    hours: 2,
    operator: '前台小王',
    createdAt: '2024/6/1 09:30:00',
    updatedAt: '2024/6/1 09:30:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_001_1', recordId: 'REC_mock_001', action: 'create', operator: '前台小王', note: '新建改期申请', timestamp: '2024/6/1 09:30:00' }
    ]
  },
  {
    id: 'REC_mock_002',
    sourceFile: '2024-06-02-海豚改期表.xlsx',
    handler: '张教练',
    status: 'processed',
    latestNote: '已完成改期，家长确认',
    babyName: '小红',
    phone: '13800138002',
    originalCourse: '幼儿技能提高班（周二17:00）',
    targetCourse: '幼儿技能提高班（周四17:00）',
    reason: '周二学校活动',
    unit: '课时',
    hours: 1,
    operator: '前台小李',
    createdAt: '2024/6/2 14:00:00',
    updatedAt: '2024/6/3 10:00:00',
    isManual: false,
    issues: [],
    logs: [
      { id: 'log_mock_002_1', recordId: 'REC_mock_002', action: 'create', operator: '前台小李', note: '新建改期申请', timestamp: '2024/6/2 14:00:00' },
      { id: 'log_mock_002_2', recordId: 'REC_mock_002', action: 'status_update', operator: '张教练', note: '已完成改期，家长确认', timestamp: '2024/6/3 10:00:00' }
    ]
  },
  {
    id: 'REC_mock_003',
    sourceFile: '手工补录',
    handler: '王教练',
    status: 'abnormal',
    latestNote: '手机号格式异常，需联系家长核实',
    babyName: '小',
    phone: '123',
    originalCourse: '亲子游泳班（上午场）',
    targetCourse: '亲子游泳班（下午场）',
    reason: '上午时间不合适',
    unit: '次',
    hours: 0,
    operator: '王教练',
    createdAt: '2024/6/4 11:00:00',
    updatedAt: '2024/6/4 11:00:00',
    isManual: true,
    issues: [
      { id: 'issue_mock_003_1', recordId: 'REC_mock_003', type: 'empty_name', field: 'babyName', reason: '宝宝姓名不能为空或过短，至少需要 2 个字符', severity: 'error' },
      { id: 'issue_mock_003_2', recordId: 'REC_mock_003', type: 'invalid_phone', field: 'phone', reason: '手机号格式不正确，应为 11 位有效号码且以 1 开头', severity: 'error' },
      { id: 'issue_mock_003_3', recordId: 'REC_mock_003', type: 'boundary_value', field: 'hours', reason: '课时数量为 0 或空值，属于异常边界值', severity: 'error' }
    ],
    logs: [
      { id: 'log_mock_003_1', recordId: 'REC_mock_003', action: 'manual_create', operator: '王教练', note: '手工补录入库', timestamp: '2024/6/4 11:00:00' }
    ]
  }
];
`,

  'src/store/useRecordStore.ts': `import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RescheduleRecord, RecordFormData, OperationLog, RecordStatus } from '@/types';
import { mockRecords } from '@/data/mockData';
import { generateId, validateRecord } from '@/utils/validation';

interface RecordState {
  records: RescheduleRecord[]; initialized: boolean;
  initFromMock: () => void;
  addRecord: (data: RecordFormData, isManual: boolean) => RescheduleRecord;
  updateRecord: (id: string, updates: Partial<RescheduleRecord>) => void;
  updateStatus: (id: string, status: RecordStatus, note: string, operator: string) => void;
  getRecordById: (id: string) => RescheduleRecord | undefined;
  filterByPhone: (phone: string) => RescheduleRecord[];
}

export const useRecordStore = create<RecordState>()(persist((set, get) => ({
  records: [], initialized: false,
  initFromMock: () => { if (!get().initialized) set({ records: mockRecords, initialized: true }); },
  addRecord: (data, isManual) => {
    const existingRecords = get().records;
    const issues = validateRecord(data, existingRecords);
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const hasError = issues.some(i => i.severity === 'error');
    const status: RecordStatus = hasError ? 'abnormal' : 'pending';
    const recordId = generateId();
    issues.forEach(iss => iss.recordId = recordId);
    const newRecord: RescheduleRecord = {
      id: recordId, sourceFile: data.sourceFile || (isManual ? '手工补录' : '系统录入'),
      handler: data.handler || '当前操作用户', status,
      latestNote: data.latestNote || (isManual ? '手工补录入库' : '新建改期申请'),
      babyName: data.babyName.trim(), phone: data.phone.trim(),
      originalCourse: data.originalCourse, targetCourse: data.targetCourse, reason: data.reason,
      unit: data.unit, hours: typeof data.hours === 'number' ? data.hours : Number(data.hours) || 0,
      operator: data.handler || '当前操作用户', createdAt: now, updatedAt: now, isManual,
      issues, logs: [{ id: 'log_' + Date.now(), recordId, action: isManual ? 'manual_create' : 'create', operator: data.handler || '当前操作用户', note: isManual ? '手工补录入库' : '新建改期申请', timestamp: now }]
    };
    set(s => ({ records: [newRecord, ...s.records] }));
    return newRecord;
  },
  updateRecord: (id, updates) => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    set(s => ({ records: s.records.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r) }));
  },
  updateStatus: (id, status, note, operator) => {
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const log: OperationLog = { id: 'log_' + Date.now(), recordId: id, action: 'status_update', operator, note, timestamp: now };
    set(s => ({ records: s.records.map(r => r.id === id ? { ...r, status, latestNote: note, updatedAt: now, logs: [...r.logs, log] } : r) }));
  },
  getRecordById: (id) => get().records.find(r => r.id === id),
  filterByPhone: (phone) => {
    const keyword = phone.trim();
    if (!keyword) return get().records;
    return get().records.filter(r => r.phone.includes(keyword));
  }
}), { name: 'dolphin-pool-reschedule-store' }));
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(base, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('Created:', relPath);
}

console.log('All files created successfully!');
