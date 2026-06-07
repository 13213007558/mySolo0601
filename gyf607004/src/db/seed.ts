import { db } from '@/db';
import {
  User,
  RescheduleRecord,
  AuditLog,
  AnomalyDetail,
} from '@/types';

const SEED_USERS: User[] = [
  { id: 'user-supervisor-1', name: '王主管', role: 'supervisor' },
  { id: 'user-nurse-1', name: '李护士', role: 'nurse', shift: '夜班' },
  { id: 'user-viewer-1', name: '张护士', role: 'viewer' },
];

const now = new Date();
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) =>
  new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();
const daysLater = (d: number) =>
  new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString().slice(0, 10);

const NO_ANOMALY: AnomalyDetail = { type: 'none', message: '无异常' };

const SEED_RECORDS: RescheduleRecord[] = [
  {
    id: 'rec-approved-1',
    babyName: '陈小宝',
    babyId: 'B001',
    originalShift: '白班',
    originalDate: daysLater(0),
    targetShift: '夜班',
    targetDate: daysLater(0),
    reason: '家长临时有事，需换夜班照料',
    sourceFileName: '换班申请_20260601.xlsx',
    sourceUploadedAt: hoursAgo(48),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'approved',
    latestNote: '已确认夜班床位',
    latestNoteAt: hoursAgo(36),
    latestNoteBy: '王主管',
    anomaly: NO_ANOMALY,
    isIsolated: false,
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(36),
  },
  {
    id: 'rec-approved-2',
    babyName: '刘朵朵',
    babyId: 'B002',
    originalShift: '早班',
    originalDate: daysLater(1),
    targetShift: '中班',
    targetDate: daysLater(1),
    reason: '与其他宝宝作息同步',
    sourceFileName: '换班申请_20260602.xlsx',
    sourceUploadedAt: hoursAgo(30),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'approved',
    latestNote: '已安排中班',
    latestNoteAt: hoursAgo(24),
    latestNoteBy: '王主管',
    anomaly: NO_ANOMALY,
    isIsolated: false,
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(24),
  },
  {
    id: 'rec-pending-1',
    babyName: '赵阳阳',
    babyId: 'B003',
    originalShift: '夜班',
    originalDate: daysLater(2),
    targetShift: '白班',
    targetDate: daysLater(2),
    reason: '宝宝身体不适，白天方便就医',
    sourceFileName: '换班申请_20260603.xlsx',
    sourceUploadedAt: hoursAgo(12),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'pending',
    anomaly: NO_ANOMALY,
    isIsolated: false,
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(12),
  },
  {
    id: 'rec-pending-2',
    babyName: '孙乐乐',
    babyId: 'B004',
    originalShift: '中班',
    originalDate: daysLater(3),
    targetShift: '早班',
    targetDate: daysLater(3),
    reason: '家长探视时间调整',
    sourceFileName: '换班申请_20260604.xlsx',
    sourceUploadedAt: hoursAgo(6),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'pending',
    anomaly: NO_ANOMALY,
    isIsolated: false,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'rec-crossshift-1',
    babyName: '周星星',
    babyId: 'B005',
    originalShift: '白班',
    originalDate: daysLater(0),
    targetShift: '夜班',
    targetDate: daysLater(0),
    reason: '跨班换班请求',
    sourceFileName: '换班申请_冲突.xlsx',
    sourceUploadedAt: hoursAgo(20),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'cross_shift',
    anomaly: {
      type: 'cross_shift_conflict',
      message: '夜班时段与陈小宝(B001)的换班记录冲突',
      conflictingRecordId: 'rec-approved-1',
    },
    isIsolated: false,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(18),
  },
  {
    id: 'rec-baddata-1',
    babyName: '',
    babyId: '',
    originalShift: '',
    originalDate: '',
    targetShift: '白班',
    targetDate: daysLater(5),
    reason: '数据不完整',
    sourceFileName: '坏数据_导入.xlsx',
    sourceUploadedAt: hoursAgo(10),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'bad_data',
    anomaly: {
      type: 'missing_required',
      message: '缺少宝宝姓名、宝宝ID、原班次、原日期等必填字段',
    },
    isIsolated: true,
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(8),
  },
  {
    id: 'rec-rejected-1',
    babyName: '吴天天',
    babyId: 'B006',
    originalShift: '夜班',
    originalDate: daysLater(4),
    targetShift: '白班',
    targetDate: daysLater(4),
    reason: '家长要求换班',
    sourceFileName: '换班申请_驳回.xlsx',
    sourceUploadedAt: hoursAgo(40),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'rejected',
    latestNote: '白班已满员，无法安排',
    latestNoteAt: hoursAgo(35),
    latestNoteBy: '王主管',
    anomaly: NO_ANOMALY,
    isIsolated: false,
    createdAt: hoursAgo(40),
    updatedAt: hoursAgo(35),
  },
  {
    id: 'rec-archived-1',
    babyName: '郑萌萌',
    babyId: 'B007',
    originalShift: '早班',
    originalDate: daysAgo(5).slice(0, 10),
    targetShift: '中班',
    targetDate: daysAgo(5).slice(0, 10),
    reason: '历史换班记录',
    sourceFileName: '换班申请_历史.xlsx',
    sourceUploadedAt: daysAgo(10),
    handlerId: 'user-nurse-1',
    handlerName: '李护士',
    status: 'archived',
    latestNote: '换班已完成，自动归档',
    latestNoteAt: daysAgo(3),
    latestNoteBy: '系统',
    anomaly: NO_ANOMALY,
    isIsolated: false,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(3),
  },
];

function buildAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = [];

  logs.push({
    id: 'audit-1',
    recordId: 'rec-approved-1',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(48),
  });
  logs.push({
    id: 'audit-2',
    recordId: 'rec-approved-1',
    action: 'add_note',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    note: '已确认夜班床位',
    createdAt: hoursAgo(36),
  });
  logs.push({
    id: 'audit-3',
    recordId: 'rec-approved-1',
    action: 'approve',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    oldStatus: 'pending',
    newStatus: 'approved',
    createdAt: hoursAgo(36),
  });

  logs.push({
    id: 'audit-4',
    recordId: 'rec-approved-2',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(30),
  });
  logs.push({
    id: 'audit-5',
    recordId: 'rec-approved-2',
    action: 'approve',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    oldStatus: 'pending',
    newStatus: 'approved',
    note: '已安排中班',
    createdAt: hoursAgo(24),
  });

  logs.push({
    id: 'audit-6',
    recordId: 'rec-pending-1',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(12),
  });

  logs.push({
    id: 'audit-7',
    recordId: 'rec-pending-2',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(6),
  });

  logs.push({
    id: 'audit-8',
    recordId: 'rec-crossshift-1',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(20),
  });
  logs.push({
    id: 'audit-9',
    recordId: 'rec-crossshift-1',
    action: 'update_status',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    oldStatus: 'pending',
    newStatus: 'cross_shift',
    note: '检测到与 rec-approved-1 的跨班冲突',
    createdAt: hoursAgo(18),
  });

  logs.push({
    id: 'audit-10',
    recordId: 'rec-baddata-1',
    action: 'import',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(10),
  });
  logs.push({
    id: 'audit-11',
    recordId: 'rec-baddata-1',
    action: 'isolate',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    oldStatus: 'pending',
    newStatus: 'bad_data',
    note: '字段缺失，已隔离',
    createdAt: hoursAgo(8),
  });

  logs.push({
    id: 'audit-12',
    recordId: 'rec-rejected-1',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: hoursAgo(40),
  });
  logs.push({
    id: 'audit-13',
    recordId: 'rec-rejected-1',
    action: 'reject',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    oldStatus: 'pending',
    newStatus: 'rejected',
    note: '白班已满员，无法安排',
    createdAt: hoursAgo(35),
  });

  logs.push({
    id: 'audit-14',
    recordId: 'rec-archived-1',
    action: 'create',
    operatorId: 'user-nurse-1',
    operatorName: '李护士',
    createdAt: daysAgo(10),
  });
  logs.push({
    id: 'audit-15',
    recordId: 'rec-archived-1',
    action: 'approve',
    operatorId: 'user-supervisor-1',
    operatorName: '王主管',
    oldStatus: 'pending',
    newStatus: 'approved',
    createdAt: daysAgo(9),
  });
  logs.push({
    id: 'audit-16',
    recordId: 'rec-archived-1',
    action: 'update_status',
    operatorId: 'user-supervisor-1',
    operatorName: '系统',
    oldStatus: 'approved',
    newStatus: 'archived',
    note: '换班已完成，自动归档',
    createdAt: daysAgo(3),
  });

  return logs;
}

export async function seedDatabase(): Promise<void> {
  const userCount = await db.users.count();
  if (userCount > 0) return;

  await db.transaction(
    'rw',
    [db.users, db.reschedule_records, db.audit_logs, db.access_denied_logs],
    async () => {
      await db.users.bulkAdd(SEED_USERS);
      await db.reschedule_records.bulkAdd(SEED_RECORDS);
      await db.audit_logs.bulkAdd(buildAuditLogs());
    }
  );
}

export async function clearDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [db.users, db.reschedule_records, db.audit_logs, db.access_denied_logs],
    async () => {
      await db.users.clear();
      await db.reschedule_records.clear();
      await db.audit_logs.clear();
      await db.access_denied_logs.clear();
    }
  );
}
