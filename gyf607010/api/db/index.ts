import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MilkRecord, ChangeHistory } from '../../shared/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

interface RecordsDB {
  records: MilkRecord[];
}

interface HistoryDB {
  history: ChangeHistory[];
}

const seedRecords: MilkRecord[] = [
  {
    id: 'rec-001',
    babyName: '张小宝',
    recordDate: '2026-06-05',
    shift: 'morning',
    milkAmountMl: 120,
    feedingMethod: 'mixed',
    remark: '家长微信群留言120ml，已与纸质交接单核对',
    status: 'confirmed',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    reviewedBy: 'user-nurse',
    reviewedByName: '张护士',
    reviewedAt: '2026-06-05T09:30:00.000Z',
    createdAt: '2026-06-05T08:10:00.000Z',
    updatedAt: '2026-06-05T09:30:00.000Z',
  },
  {
    id: 'rec-002',
    babyName: '李小贝',
    recordDate: '2026-06-05',
    shift: 'afternoon',
    milkAmountMl: 90,
    feedingMethod: 'formula',
    remark: '午班奶量，略低于平日',
    status: 'pending',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    createdAt: '2026-06-05T13:20:00.000Z',
    updatedAt: '2026-06-05T13:20:00.000Z',
  },
  {
    id: 'rec-003',
    babyName: '王一一',
    recordDate: '2026-06-05',
    shift: 'night',
    milkAmountMl: 150,
    feedingMethod: 'breast',
    remark: '',
    status: 'withdrawn',
    withdrawReason: '与家长电话确认后，实际为 130ml，已重新录入 rec-006',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    reviewedBy: 'user-supervisor',
    reviewedByName: '李主管',
    reviewedAt: '2026-06-05T21:00:00.000Z',
    createdAt: '2026-06-05T20:15:00.000Z',
    updatedAt: '2026-06-06T08:00:00.000Z',
  },
  {
    id: 'rec-004',
    babyName: '赵乐乐',
    recordDate: '2026-06-06',
    shift: 'morning',
    milkAmountMl: 140,
    feedingMethod: 'formula',
    remark: '',
    status: 'conflict',
    conflictReason: '同一婴儿同一日期同一班次已存在记录 rec-001，疑似重复录入',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    createdAt: '2026-06-06T08:05:00.000Z',
    updatedAt: '2026-06-06T08:05:00.000Z',
  },
  {
    id: 'rec-005',
    babyName: '孙朵朵',
    recordDate: '2026-06-06',
    shift: 'morning',
    milkAmountMl: 100,
    feedingMethod: 'breast',
    remark: '亲喂约 15 分钟',
    status: 'confirmed',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    reviewedBy: 'user-supervisor',
    reviewedByName: '李主管',
    reviewedAt: '2026-06-06T10:15:00.000Z',
    createdAt: '2026-06-06T08:30:00.000Z',
    updatedAt: '2026-06-06T10:15:00.000Z',
  },
  {
    id: 'rec-006',
    babyName: '王一一',
    recordDate: '2026-06-05',
    shift: 'night',
    milkAmountMl: 130,
    feedingMethod: 'breast',
    remark: '更正 rec-003 数据',
    status: 'confirmed',
    createdBy: 'user-supervisor',
    createdByName: '李主管',
    reviewedBy: 'user-supervisor',
    reviewedByName: '李主管',
    reviewedAt: '2026-06-06T08:10:00.000Z',
    createdAt: '2026-06-06T08:05:00.000Z',
    updatedAt: '2026-06-06T08:10:00.000Z',
  },
  {
    id: 'rec-007',
    babyName: '周萌萌',
    recordDate: '2026-06-06',
    shift: 'afternoon',
    milkAmountMl: 110,
    feedingMethod: 'mixed',
    remark: '',
    status: 'pending',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    createdAt: '2026-06-06T14:00:00.000Z',
    updatedAt: '2026-06-06T14:00:00.000Z',
  },
  {
    id: 'rec-008',
    babyName: '吴浩浩',
    recordDate: '2026-06-07',
    shift: 'morning',
    milkAmountMl: 135,
    feedingMethod: 'formula',
    remark: '今日精神好，奶量恢复',
    status: 'confirmed',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    reviewedBy: 'user-nurse',
    reviewedByName: '张护士',
    reviewedAt: '2026-06-07T09:45:00.000Z',
    createdAt: '2026-06-07T08:20:00.000Z',
    updatedAt: '2026-06-07T09:45:00.000Z',
  },
  {
    id: 'rec-009',
    babyName: '郑西西',
    recordDate: '2026-06-07',
    shift: 'morning',
    milkAmountMl: 80,
    feedingMethod: 'breast',
    remark: '晨间进食量少',
    status: 'pending',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    createdAt: '2026-06-07T08:40:00.000Z',
    updatedAt: '2026-06-07T08:40:00.000Z',
  },
  {
    id: 'rec-010',
    babyName: '冯天天',
    recordDate: '2026-06-07',
    shift: 'afternoon',
    milkAmountMl: 145,
    feedingMethod: 'formula',
    remark: '',
    status: 'pending',
    createdBy: 'user-nurse',
    createdByName: '张护士',
    createdAt: '2026-06-07T13:30:00.000Z',
    updatedAt: '2026-06-07T13:30:00.000Z',
  },
];

const seedHistory: ChangeHistory[] = [
  {
    id: 'his-001',
    recordId: 'rec-001',
    field: 'status',
    oldValue: 'pending',
    newValue: 'confirmed',
    operatedBy: 'user-nurse',
    operatedByName: '张护士',
    operatedAt: '2026-06-05T09:30:00.000Z',
    reviewedAt: '2026-06-05T09:30:00.000Z',
    action: 'review',
    reason: '与家长留言、纸质单三方一致',
  },
  {
    id: 'his-002',
    recordId: 'rec-003',
    field: 'status',
    oldValue: 'pending',
    newValue: 'confirmed',
    operatedBy: 'user-supervisor',
    operatedByName: '李主管',
    operatedAt: '2026-06-05T21:00:00.000Z',
    reviewedAt: '2026-06-05T21:00:00.000Z',
    action: 'review',
  },
  {
    id: 'his-003',
    recordId: 'rec-003',
    field: 'status',
    oldValue: 'confirmed',
    newValue: 'withdrawn',
    operatedBy: 'user-supervisor',
    operatedByName: '李主管',
    operatedAt: '2026-06-06T08:00:00.000Z',
    action: 'withdraw',
    reason: '与家长电话确认后，实际为 130ml，已重新录入 rec-006',
  },
  {
    id: 'his-004',
    recordId: 'rec-005',
    field: 'status',
    oldValue: 'pending',
    newValue: 'confirmed',
    operatedBy: 'user-supervisor',
    operatedByName: '李主管',
    operatedAt: '2026-06-06T10:15:00.000Z',
    reviewedAt: '2026-06-06T10:15:00.000Z',
    action: 'review',
  },
  {
    id: 'his-005',
    recordId: 'rec-008',
    field: 'milkAmountMl',
    oldValue: 120,
    newValue: 135,
    operatedBy: 'user-nurse',
    operatedByName: '张护士',
    operatedAt: '2026-06-07T09:00:00.000Z',
    action: 'update',
    reason: '护士现场复核发现实际多喂 15ml',
  },
  {
    id: 'his-006',
    recordId: 'rec-008',
    field: 'status',
    oldValue: 'pending',
    newValue: 'confirmed',
    operatedBy: 'user-nurse',
    operatedByName: '张护士',
    operatedAt: '2026-06-07T09:45:00.000Z',
    reviewedAt: '2026-06-07T09:45:00.000Z',
    action: 'review',
  },
];

export async function getRecordsDB(): Promise<Low<RecordsDB>> {
  const adapter = new JSONFile<RecordsDB>(RECORDS_FILE);
  const db = new Low(adapter, { records: [] });
  await db.read();
  if (!db.data || !db.data.records || db.data.records.length === 0) {
    db.data = { records: seedRecords };
    await db.write();
  }
  return db;
}

export async function getHistoryDB(): Promise<Low<HistoryDB>> {
  const adapter = new JSONFile<HistoryDB>(HISTORY_FILE);
  const db = new Low(adapter, { history: [] });
  await db.read();
  if (!db.data || !db.data.history || db.data.history.length === 0) {
    db.data = { history: seedHistory };
    await db.write();
  }
  return db;
}
