import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  AuthorizationRecord,
  AuthorizationRecordWithHistory,
  CreateRecordInput,
  UpdateRecordInput,
  VersionHistoryEntry,
  SummaryStats,
  ChangeReason,
} from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'authorization-data.json');

interface StorageData {
  records: AuthorizationRecord[];
  history: Record<string, VersionHistoryEntry[]>;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadData(): StorageData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const seed = getSeedData();
    saveData(seed);
    return seed;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as StorageData;
  } catch {
    const seed = getSeedData();
    saveData(seed);
    return seed;
  }
}

function saveData(data: StorageData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function validateCreateInput(input: CreateRecordInput): string | null {
  if (!input.childName?.trim()) return '儿童姓名不能为空';
  if (!input.childId?.trim()) return '儿童编号不能为空';
  if (!input.photoContext?.activityName?.trim()) return '活动名称不能为空';
  if (!input.photoContext?.activityDate?.trim()) return '活动日期不能为空';
  if (!input.guardianName?.trim()) return '监护人姓名不能为空';
  if (!Array.isArray(input.authorizedScopes) || input.authorizedScopes.length === 0) {
    return '至少选择一个授权范围';
  }
  return null;
}

function detectConflict(
  input: CreateRecordInput,
  existing: AuthorizationRecord[],
  excludeId?: string,
): AuthorizationRecord['conflictInfo'] | undefined {
  for (const rec of existing) {
    if (!rec.dataValid) continue;
    if (excludeId && rec.id === excludeId) continue;
    if (
      rec.childId === input.childId &&
      rec.photoContext.activityName === input.photoContext.activityName &&
      rec.photoContext.activityDate === input.photoContext.activityDate &&
      rec.status !== 'denied' &&
      rec.status !== 'revoked'
    ) {
      return {
        conflictingRecordId: rec.id,
        conflictDescription: `与已有记录冲突：同一儿童 ${input.childName} 在 ${input.photoContext.activityDate} 的 "${input.photoContext.activityName}" 活动已存在授权记录（状态：${rec.status}）`,
      };
    }
  }
  return undefined;
}

function createHistoryEntry(
  record: AuthorizationRecord,
  reason: ChangeReason,
  reasonNote?: string,
): VersionHistoryEntry {
  return {
    version: record.version,
    timestamp: record.updatedAt,
    snapshot: JSON.parse(JSON.stringify(record)),
    changeReason: reason,
    changeReasonNote: reasonNote,
    operatorRole: 'parent',
    operatorName: '系统管理员',
  };
}

export function getAllRecords(): AuthorizationRecord[] {
  const data = loadData();
  return data.records.filter((r) => r.dataValid);
}

export function getAllRecordsIncludingInvalid(): AuthorizationRecord[] {
  const data = loadData();
  return data.records;
}

export function getRecordById(
  id: string,
): AuthorizationRecordWithHistory | undefined {
  const data = loadData();
  const record = data.records.find((r) => r.id === id);
  if (!record) return undefined;
  return {
    current: record,
    history: data.history[id] || [],
  };
}

export function getStats(): SummaryStats {
  const records = getAllRecords();
  const stats: SummaryStats = {
    total: records.length,
    authorized: 0,
    pending: 0,
    denied: 0,
    conflicted: 0,
    revoked: 0,
    supplemented: 0,
    invalid: 0,
  };
  for (const r of records) {
    if (r.status === 'authorized') stats.authorized++;
    else if (r.status === 'pending') stats.pending++;
    else if (r.status === 'denied') stats.denied++;
    else if (r.status === 'conflicted') stats.conflicted++;
    else if (r.status === 'revoked') stats.revoked++;
    else if (r.status === 'supplemented') stats.supplemented++;
  }
  const allRecords = getAllRecordsIncludingInvalid();
  stats.invalid = allRecords.filter((r) => !r.dataValid).length;
  return stats;
}

export function createRecord(
  input: CreateRecordInput,
): { success: boolean; data?: AuthorizationRecordWithHistory; error?: string } {
  const validationError = validateCreateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const data = loadData();
  const conflict = detectConflict(input, data.records);

  const now = new Date().toISOString();
  const newRecord: AuthorizationRecord = {
    id: generateId(),
    childName: input.childName.trim(),
    childId: input.childId.trim(),
    photoContext: {
      activityName: input.photoContext.activityName.trim(),
      activityDate: input.photoContext.activityDate.trim(),
      location: input.photoContext.location?.trim(),
      photographer: input.photoContext.photographer?.trim(),
      description: input.photoContext.description?.trim(),
    },
    status: conflict ? 'conflicted' : input.status || 'pending',
    authorizedScopes: [...input.authorizedScopes],
    guardianName: input.guardianName.trim(),
    guardianContact: input.guardianContact?.trim(),
    createdAt: now,
    updatedAt: now,
    isSupplement: input.isSupplement || false,
    supplementOf: input.supplementOf,
    version: 1,
    changeReason: input.changeReason || 'initial_create',
    changeReasonNote: input.changeReasonNote,
    conflictInfo: conflict,
    dataValid: true,
  };

  data.records.push(newRecord);
  const entry = createHistoryEntry(
    newRecord,
    newRecord.changeReason || 'initial_create',
    newRecord.changeReasonNote,
  );
  data.history[newRecord.id] = [entry];
  saveData(data);

  return {
    success: true,
    data: { current: newRecord, history: [entry] },
  };
}

export function updateRecord(
  input: UpdateRecordInput,
): { success: boolean; data?: AuthorizationRecordWithHistory; error?: string } {
  const data = loadData();
  const index = data.records.findIndex((r) => r.id === input.id);
  if (index === -1) {
    return { success: false, error: '记录不存在' };
  }

  const existing = data.records[index];
  if (!existing.dataValid && input.dataValid === undefined) {
    return { success: false, error: '该记录已被标记为无效，无法修改' };
  }

  const now = new Date().toISOString();
  const updated: AuthorizationRecord = {
    ...existing,
    updatedAt: now,
    version: existing.version + 1,
    changeReason: input.changeReason || 'status_update',
    changeReasonNote: input.changeReasonNote,
  };

  if (input.status !== undefined) updated.status = input.status;
  if (input.authorizedScopes !== undefined)
    updated.authorizedScopes = [...input.authorizedScopes];
  if (input.conflictInfo !== undefined) updated.conflictInfo = input.conflictInfo;
  if (input.revocationInfo !== undefined) updated.revocationInfo = input.revocationInfo;
  if (input.dataValid !== undefined) updated.dataValid = input.dataValid;
  if (input.invalidationReason !== undefined)
    updated.invalidationReason = input.invalidationReason;

  data.records[index] = updated;

  const entry = createHistoryEntry(
    updated,
    updated.changeReason || 'status_update',
    updated.changeReasonNote,
  );
  if (!data.history[updated.id]) {
    data.history[updated.id] = [];
  }
  data.history[updated.id].push(entry);
  saveData(data);

  return {
    success: true,
    data: {
      current: updated,
      history: data.history[updated.id],
    },
  };
}

export function supplementRecord(
  originalId: string,
  input: CreateRecordInput,
): { success: boolean; data?: AuthorizationRecordWithHistory; error?: string } {
  const data = loadData();
  const original = data.records.find((r) => r.id === originalId);
  if (!original) {
    return { success: false, error: '原记录不存在' };
  }

  const supplementInput: CreateRecordInput = {
    ...input,
    isSupplement: true,
    supplementOf: originalId,
    changeReason: 'manual_supplement',
    changeReasonNote: input.changeReasonNote || '针对原记录的手工补录',
  };

  const result = createRecord(supplementInput);
  if (!result.success) return result;

  updateRecord({
    id: originalId,
    status: 'supplemented',
    changeReason: 'manual_supplement',
    changeReasonNote: `已存在补录记录：${result.data?.current.id}`,
  });

  return result;
}

export function invalidateRecord(
  id: string,
  reason: string,
): { success: boolean; data?: AuthorizationRecordWithHistory; error?: string } {
  return updateRecord({
    id,
    dataValid: false,
    invalidationReason: reason,
    changeReason: 'data_correction',
    changeReasonNote: `标记为无效数据：${reason}`,
  });
}

function getSeedData(): StorageData {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  const r1Date = new Date(now);
  r1Date.setDate(r1Date.getDate() - 7);
  const r2Date = new Date(now);
  r2Date.setDate(r2Date.getDate() - 3);
  const r3Date = new Date(now);
  r3Date.setDate(r3Date.getDate() - 1);
  const r3UpdatedDate = new Date(r3Date.getTime() + 3600 * 1000);

  const r1: AuthorizationRecord = {
    id: 'rec_seed_001',
    childName: '李小宝',
    childId: 'CHILD_001',
    photoContext: {
      activityName: '春季亲子运动会',
      activityDate: '2026-06-01',
      location: '幼儿园操场',
      photographer: '王老师',
      description: '开幕式合影及比赛瞬间',
    },
    status: 'authorized',
    authorizedScopes: ['课堂内部展示', '幼儿园公众号'],
    guardianName: '李爸爸',
    guardianContact: '138****1234',
    createdAt: iso(r1Date),
    updatedAt: iso(r1Date),
    isSupplement: false,
    version: 1,
    changeReason: 'initial_create',
    dataValid: true,
  };

  const r2: AuthorizationRecord = {
    id: 'rec_seed_002',
    childName: '张朵朵',
    childId: 'CHILD_002',
    photoContext: {
      activityName: '美术作品展',
      activityDate: '2026-06-05',
      location: '幼儿园多功能厅',
      photographer: '陈老师',
      description: '作品展示及颁奖',
    },
    status: 'conflicted',
    authorizedScopes: ['宣传册印刷'],
    guardianName: '张妈妈',
    guardianContact: '139****5678',
    createdAt: iso(r2Date),
    updatedAt: iso(r2Date),
    isSupplement: false,
    version: 1,
    changeReason: 'initial_create',
    conflictInfo: {
      conflictingRecordId: 'rec_seed_001',
      conflictDescription:
        '与已有记录存在潜在冲突：家长表示对宣传册印刷范围有异议，需进一步确认',
    },
    dataValid: true,
  };

  const r3: AuthorizationRecord = {
    id: 'rec_seed_003',
    childName: '王壮壮',
    childId: 'CHILD_003',
    photoContext: {
      activityName: '端午节手工课',
      activityDate: '2026-06-07',
      location: '中班教室',
      photographer: '刘老师',
      description: '包粽子活动',
    },
    status: 'revoked',
    authorizedScopes: ['课堂内部展示', '校园视频制作'],
    guardianName: '王奶奶',
    guardianContact: '137****9012',
    createdAt: iso(r3Date),
    updatedAt: iso(r3UpdatedDate),
    isSupplement: false,
    version: 2,
    changeReason: 'confirmation_revoked',
    changeReasonNote: '家长后续要求撤回此前授权',
    revocationInfo: {
      revokedBy: '王妈妈',
      revocationReason:
        '孩子当天请假未参加活动，照片中并非本人，要求撤回授权记录',
      revokedAt: iso(r3UpdatedDate),
    },
    dataValid: true,
  };

  const r4Original: AuthorizationRecord = {
    id: 'rec_seed_004',
    childName: '赵乐乐',
    childId: 'CHILD_004',
    photoContext: {
      activityName: '户外自然观察',
      activityDate: '2026-06-03',
      location: '社区公园',
      photographer: '孙老师',
      description: '观察植物生长',
    },
    status: 'supplemented',
    authorizedScopes: ['课堂内部展示'],
    guardianName: '赵爸爸',
    guardianContact: '136****3456',
    createdAt: iso(r2Date),
    updatedAt: iso(new Date()),
    isSupplement: false,
    version: 2,
    changeReason: 'manual_supplement',
    changeReasonNote: '已存在补录记录：rec_seed_005',
    dataValid: true,
  };

  const r5: AuthorizationRecord = {
    id: 'rec_seed_005',
    childName: '赵乐乐',
    childId: 'CHILD_004',
    photoContext: {
      activityName: '户外自然观察',
      activityDate: '2026-06-03',
      location: '社区公园',
      photographer: '孙老师',
      description: '观察植物生长 - 补录：包含特写及家长合影',
    },
    status: 'authorized',
    authorizedScopes: ['课堂内部展示', '幼儿园公众号', '宣传册印刷'],
    guardianName: '赵爸爸',
    guardianContact: '136****3456',
    createdAt: iso(new Date()),
    updatedAt: iso(new Date()),
    isSupplement: true,
    supplementOf: 'rec_seed_004',
    version: 1,
    changeReason: 'manual_supplement',
    changeReasonNote:
      '手工补录：育儿嫂发现课堂照片不完整，补充当天下午活动照片授权',
    dataValid: true,
  };

  const r6: AuthorizationRecord = {
    id: 'rec_seed_006',
    childName: '孙一一',
    childId: 'CHILD_005',
    photoContext: {
      activityName: '音乐课',
      activityDate: '2026-06-06',
      location: '音乐教室',
      photographer: '周老师',
    },
    status: 'pending',
    authorizedScopes: ['课堂内部展示', '幼儿园公众号'],
    guardianName: '孙妈妈',
    createdAt: iso(r3Date),
    updatedAt: iso(r3Date),
    isSupplement: false,
    version: 1,
    changeReason: 'initial_create',
    dataValid: true,
  };

  const records: AuthorizationRecord[] = [r1, r2, r3, r4Original, r5, r6];

  const history: Record<string, VersionHistoryEntry[]> = {};

  history['rec_seed_001'] = [
    {
      version: r1.version,
      timestamp: r1.updatedAt,
      snapshot: JSON.parse(JSON.stringify(r1)),
      changeReason: 'initial_create',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
  ];

  history['rec_seed_002'] = [
    {
      version: r2.version,
      timestamp: r2.updatedAt,
      snapshot: JSON.parse(JSON.stringify(r2)),
      changeReason: 'initial_create',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
  ];

  const r3V1Snapshot: AuthorizationRecord = {
    ...r3,
    status: 'authorized',
    version: 1,
    changeReason: 'initial_create',
    revocationInfo: undefined,
    changeReasonNote: undefined,
    updatedAt: iso(r3Date),
  };
  history['rec_seed_003'] = [
    {
      version: 1,
      timestamp: iso(r3Date),
      snapshot: r3V1Snapshot,
      changeReason: 'initial_create',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
    {
      version: 2,
      timestamp: iso(r3UpdatedDate),
      snapshot: JSON.parse(JSON.stringify(r3)),
      changeReason: 'confirmation_revoked',
      changeReasonNote: '家长后续要求撤回此前授权',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
  ];

  const r4V1Snapshot: AuthorizationRecord = {
    ...r4Original,
    status: 'authorized',
    version: 1,
    changeReason: 'initial_create',
    changeReasonNote: undefined,
    updatedAt: iso(r2Date),
  };
  history['rec_seed_004'] = [
    {
      version: 1,
      timestamp: iso(r2Date),
      snapshot: r4V1Snapshot,
      changeReason: 'initial_create',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
    {
      version: 2,
      timestamp: iso(new Date()),
      snapshot: JSON.parse(JSON.stringify(r4Original)),
      changeReason: 'manual_supplement',
      changeReasonNote: '已存在补录记录：rec_seed_005',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
  ];

  history['rec_seed_005'] = [
    {
      version: r5.version,
      timestamp: r5.updatedAt,
      snapshot: JSON.parse(JSON.stringify(r5)),
      changeReason: 'manual_supplement',
      changeReasonNote:
        '手工补录：育儿嫂发现课堂照片不完整，补充当天下午活动照片授权',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
  ];

  history['rec_seed_006'] = [
    {
      version: r6.version,
      timestamp: r6.updatedAt,
      snapshot: JSON.parse(JSON.stringify(r6)),
      changeReason: 'initial_create',
      operatorRole: 'parent',
      operatorName: '系统管理员',
    },
  ];

  return { records, history };
}
