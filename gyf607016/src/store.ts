import type {
  AuthRecord,
  Material,
  HistoryVersion,
  AuthJudgment,
  ChangeType,
  RecordStatus,
  AuditNoteType,
  AuthRecordStore,
  RecordStats,
} from './types';
import { nanoid } from './nanoid';

const STORAGE_KEY = 'erbao_photo_auth_inspection_v1';
const SEED_VERSION = 2;

function nowISO(): string {
  return new Date().toISOString();
}

function readStore(): AuthRecordStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { records: [], initialized: false, seedVersion: 0 };
    const parsed = JSON.parse(raw) as AuthRecordStore;
    if (!parsed.records) return { records: [], initialized: false, seedVersion: 0 };
    return parsed;
  } catch {
    return { records: [], initialized: false, seedVersion: 0 };
  }
}

function writeStore(store: AuthRecordStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent('erbao-store-updated'));
}

function snapshotFromRecord(r: AuthRecord): HistoryVersion['snapshot'] {
  return {
    babyName: r.babyName,
    guardianName: r.guardianName,
    authJudgment: r.authJudgment,
    materials: JSON.parse(JSON.stringify(r.materials)),
    status: r.status,
  };
}

function makeDiffSummary(prev: HistoryVersion['snapshot'], next: HistoryVersion['snapshot']): string {
  const changes: string[] = [];
  if (prev.babyName !== next.babyName) changes.push(`婴幼儿姓名: ${prev.babyName} → ${next.babyName}`);
  if (prev.guardianName !== next.guardianName) changes.push(`监护人: ${prev.guardianName} → ${next.guardianName}`);
  if (prev.authJudgment !== next.authJudgment) changes.push(`授权判断: ${labelJudgment(prev.authJudgment)} → ${labelJudgment(next.authJudgment)}`);
  if (prev.status !== next.status) changes.push(`状态: ${labelStatus(prev.status)} → ${labelStatus(next.status)}`);
  const added = next.materials.filter(m => !prev.materials.find(pm => pm.id === m.id));
  const removed = prev.materials.filter(m => !next.materials.find(pm => pm.id === m.id));
  if (added.length) changes.push(`新增材料 ${added.length} 项`);
  if (removed.length) changes.push(`移除材料 ${removed.length} 项`);
  return changes.length ? changes.join('；') : '无实质字段变更';
}

export function labelJudgment(j: AuthJudgment): string {
  return { authorized: '已授权', rejected: '未授权', pending: '待确认' }[j];
}

export function labelStatus(s: RecordStatus): string {
  return { open: '进行中', closed: '已关闭', supplemented: '已补录', corrupted: '数据异常' }[s];
}

export function labelMaterialType(t: string): string {
  return { photo: '课堂照片', consent_form: '知情同意书', id_copy: '身份证件', other: '其他材料' }[t] || t;
}

export function labelChangeType(c: ChangeType): string {
  return { create: '初次登记', update: '修改记录', supplement: '补录材料', close: '关闭记录', reopen: '重新打开' }[c];
}

export function labelAuditNoteType(t: AuditNoteType): string {
  return {
    corrupted_data: '坏数据隔离',
    missing_handler: '处理人缺失',
    closed_supplement: '关闭后追加',
    manual_entry: '手工补录',
    data_integrity: '数据完整性',
    other: '其他说明',
  }[t];
}

function buildHistoryVersion(
  record: AuthRecord,
  changeType: ChangeType,
  changedBy: string,
  changeReason?: string,
  reviewBy?: string
): HistoryVersion {
  const prev = record.history[record.history.length - 1];
  const snapshot = snapshotFromRecord(record);
  const version = record.currentVersion + 1;
  return {
    id: nanoid(),
    version,
    snapshot,
    changedBy,
    changedAt: nowISO(),
    reviewBy,
    reviewAt: reviewBy ? nowISO() : undefined,
    changeType,
    changeReason,
    diffSummary: prev ? makeDiffSummary(prev.snapshot, snapshot) : '初始登记',
  };
}

function validateRecordIntegrity(r: AuthRecord): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!r.babyName || r.babyName.trim().length === 0) issues.push('婴幼儿姓名缺失');
  if (!r.guardianName || r.guardianName.trim().length === 0) issues.push('监护人姓名缺失');
  if (!r.createdBy) issues.push('登记处理人缺失（审计异常）');
  const seenOrder = new Set<number>();
  for (const m of r.materials) {
    if (seenOrder.has(m.order)) issues.push(`材料顺序冲突: ${m.name}`);
    seenOrder.add(m.order);
  }
  if (r.currentVersion !== r.history.length) issues.push('版本号与历史长度不一致');
  return { valid: issues.length === 0, issues };
}

export function getAllRecords(): AuthRecord[] {
  const store = readStore();
  if (!store.initialized || store.seedVersion < SEED_VERSION) {
    const seeded = ensureSeedData(store);
    return seeded;
  }
  return store.records;
}

export function getRecord(id: string): AuthRecord | undefined {
  return getAllRecords().find(r => r.id === id);
}

export function getValidRecords(): AuthRecord[] {
  return getAllRecords().filter(r => !r.isCorrupted);
}

export function getCorruptedRecords(): AuthRecord[] {
  return getAllRecords().filter(r => r.isCorrupted);
}

export function createRecord(input: {
  babyName: string;
  guardianName: string;
  authJudgment: AuthJudgment;
  materials: Omit<Material, 'id' | 'uploadedAt' | 'source'>[];
  createdBy: string;
}): AuthRecord {
  const store = readStore();
  const ts = nowISO();
  const materials: Material[] = input.materials.map((m, idx) => ({
    id: nanoid(),
    type: m.type,
    name: m.name,
    order: m.order ?? idx,
    uploadedAt: ts,
    source: 'original',
  }));
  const id = nanoid();
  const record: AuthRecord = {
    id,
    babyName: input.babyName,
    guardianName: input.guardianName,
    authJudgment: input.authJudgment,
    materials,
    status: 'open',
    createdAt: ts,
    createdBy: input.createdBy,
    updatedAt: ts,
    history: [],
    auditNotes: [],
    isCorrupted: false,
    currentVersion: 0,
  };
  const firstVersion: HistoryVersion = {
    id: nanoid(),
    version: 1,
    snapshot: snapshotFromRecord(record),
    changedBy: input.createdBy,
    changedAt: ts,
    changeType: 'create',
    changeReason: '初次登记',
    diffSummary: '初始登记',
  };
  record.history.push(firstVersion);
  record.currentVersion = 1;
  const validation = validateRecordIntegrity(record);
  if (!validation.valid) {
    record.isCorrupted = true;
    record.auditNotes.push({
      id: nanoid(),
      type: 'data_integrity',
      reason: '创建时校验未通过: ' + validation.issues.join('；'),
      createdAt: ts,
    });
  }
  store.records.push(record);
  writeStore(store);
  return record;
}

export function updateRecord(params: {
  id: string;
  babyName?: string;
  guardianName?: string;
  authJudgment?: AuthJudgment;
  materials?: Omit<Material, 'id' | 'uploadedAt' | 'source'>[];
  status?: RecordStatus;
  changedBy: string;
  changeReason?: string;
  reviewBy?: string;
}): AuthRecord | undefined {
  const store = readStore();
  const idx = store.records.findIndex(r => r.id === params.id);
  if (idx === -1) return undefined;
  const r = store.records[idx];
  if (r.isCorrupted) {
    r.auditNotes.push({
      id: nanoid(),
      type: 'corrupted_data',
      reason: '尝试修改已标记为异常的记录，操作被拒绝',
      createdAt: nowISO(),
      notedBy: params.changedBy,
    });
    writeStore(store);
    return { ...r };
  }
  if (r.status === 'closed') {
    r.auditNotes.push({
      id: nanoid(),
      type: 'closed_supplement',
      reason: `记录已关闭，${params.changedBy} 执行追加/修改操作：${params.changeReason || '未说明原因'}`,
      createdAt: nowISO(),
      notedBy: params.changedBy,
    });
  }
  if (params.babyName !== undefined) r.babyName = params.babyName;
  if (params.guardianName !== undefined) r.guardianName = params.guardianName;
  if (params.authJudgment !== undefined) r.authJudgment = params.authJudgment;
  if (params.status !== undefined) r.status = params.status;
  if (params.materials) {
    r.materials = params.materials.map((m, i) => ({
      id: nanoid(),
      type: m.type,
      name: m.name,
      order: m.order ?? i,
      uploadedAt: nowISO(),
      source: 'original',
    }));
  }
  r.updatedAt = nowISO();
  const changeType: ChangeType =
    params.status === 'closed' ? 'close' :
    params.status === 'open' && r.status === 'open' ? 'update' :
    params.status ? 'reopen' : 'update';
  const version = buildHistoryVersion(r, changeType, params.changedBy, params.changeReason, params.reviewBy);
  r.history.push(version);
  r.currentVersion = version.version;
  const validation = validateRecordIntegrity(r);
  if (!validation.valid) {
    r.isCorrupted = true;
    r.auditNotes.push({
      id: nanoid(),
      type: 'corrupted_data',
      reason: '更新后数据校验失败: ' + validation.issues.join('；'),
      createdAt: nowISO(),
    });
  }
  if (!params.changedBy || params.changedBy.trim().length === 0) {
    r.auditNotes.push({
      id: nanoid(),
      type: 'missing_handler',
      reason: `本次变更（${labelChangeType(changeType)}）未找到处理人信息，已标记审计异常`,
      createdAt: nowISO(),
    });
  }
  writeStore(store);
  return { ...r };
}

export function supplementMaterials(params: {
  id: string;
  materials: Omit<Material, 'id' | 'uploadedAt' | 'source'>[];
  changedBy: string;
  changeReason?: string;
  reviewBy?: string;
  manualEntry?: boolean;
}): AuthRecord | undefined {
  const store = readStore();
  const idx = store.records.findIndex(r => r.id === params.id);
  if (idx === -1) return undefined;
  const r = store.records[idx];
  if (r.isCorrupted) {
    r.auditNotes.push({
      id: nanoid(),
      type: 'corrupted_data',
      reason: '尝试向异常记录补录材料，操作被拒绝',
      createdAt: nowISO(),
      notedBy: params.changedBy,
    });
    writeStore(store);
    return { ...r };
  }
  const wasClosed = r.status === 'closed';
  const ts = nowISO();
  const baseOrder = r.materials.length > 0 ? Math.max(...r.materials.map(m => m.order)) + 1 : 0;
  const newMaterials: Material[] = params.materials.map((m, i) => ({
    id: nanoid(),
    type: m.type,
    name: m.name,
    order: baseOrder + (m.order ?? i),
    uploadedAt: ts,
    source: 'supplement',
  }));
  r.materials = [...r.materials, ...newMaterials];
  if (wasClosed) {
    r.status = 'supplemented';
    r.auditNotes.push({
      id: nanoid(),
      type: 'closed_supplement',
      reason: `记录已关闭，${params.changedBy} 追加材料 ${newMaterials.length} 项：${params.changeReason || '未说明原因'}`,
      createdAt: ts,
      notedBy: params.changedBy,
    });
  }
  if (params.manualEntry) {
    r.auditNotes.push({
      id: nanoid(),
      type: 'manual_entry',
      reason: `手工补录：${params.changeReason || '手工录入追溯材料'}（处理人：${params.changedBy}）`,
      createdAt: ts,
      notedBy: params.changedBy,
    });
  }
  r.updatedAt = ts;
  const version = buildHistoryVersion(r, 'supplement', params.changedBy, params.changeReason, params.reviewBy);
  r.history.push(version);
  r.currentVersion = version.version;
  if (!params.changedBy || params.changedBy.trim().length === 0) {
    r.auditNotes.push({
      id: nanoid(),
      type: 'missing_handler',
      reason: `本次补录未找到处理人信息，已标记审计异常`,
      createdAt: ts,
    });
  }
  writeStore(store);
  return { ...r };
}

export function addAuditNote(params: {
  id: string;
  type: AuditNoteType;
  reason: string;
  notedBy?: string;
}): AuthRecord | undefined {
  const store = readStore();
  const idx = store.records.findIndex(r => r.id === params.id);
  if (idx === -1) return undefined;
  const r = store.records[idx];
  r.auditNotes.push({
    id: nanoid(),
    type: params.type,
    reason: params.reason,
    createdAt: nowISO(),
    notedBy: params.notedBy,
  });
  writeStore(store);
  return { ...r };
}

export function computeStats(records?: AuthRecord[]): RecordStats {
  const list = records ?? getAllRecords();
  const valid = list.filter(r => !r.isCorrupted);
  return {
    total: list.length,
    valid: valid.length,
    corrupted: list.filter(r => r.isCorrupted).length,
    authorized: valid.filter(r => r.authJudgment === 'authorized').length,
    rejected: valid.filter(r => r.authJudgment === 'rejected').length,
    pending: valid.filter(r => r.authJudgment === 'pending').length,
    open: valid.filter(r => r.status === 'open').length,
    closed: valid.filter(r => r.status === 'closed').length,
    supplemented: valid.filter(r => r.status === 'supplemented').length,
    totalHistoryVersions: list.reduce((s, r) => s + r.history.length, 0),
    totalSupplementMaterials: list.reduce((s, r) => s + r.materials.filter(m => m.source === 'supplement').length, 0),
  };
}

function ensureSeedData(store: AuthRecordStore): AuthRecord[] {
  if (store.seedVersion >= SEED_VERSION) return store.records;

  if (store.seedVersion < 1) {
    const r1 = buildSeedRecord({
      babyName: '李小宝',
      guardianName: '李妈妈',
      authJudgment: 'authorized',
      createdBy: '张护士',
      baseMinutesAgo: 60 * 24 * 2,
      materials: [
        { type: 'photo' as const, name: '课堂活动照-1' },
        { type: 'photo' as const, name: '课堂活动照-2' },
        { type: 'consent_form' as const, name: '监护人知情同意书' },
      ],
      status: 'open' as const,
    });
    store.records.push(r1);

    const r2 = buildSeedRecord({
      babyName: '王乐乐',
      guardianName: '王爸爸',
      authJudgment: 'pending',
      createdBy: '赵护士',
      baseMinutesAgo: 60 * 20,
      materials: [
        { type: 'photo' as const, name: '课堂活动照-1' },
      ],
      status: 'open' as const,
    });
    store.records.push(r2);

    const r3 = buildSeedRecord({
      babyName: '陈豆豆',
      guardianName: '陈奶奶',
      authJudgment: 'rejected',
      createdBy: '张护士',
      baseMinutesAgo: 60 * 36,
      materials: [
        { type: 'photo' as const, name: '课堂活动照-1' },
        { type: 'id_copy' as const, name: '监护人身份证明' },
      ],
      status: 'closed' as const,
      extraHistory: [
        {
          changeType: 'close' as const,
          changedBy: '张护士',
          reviewBy: '李护士长',
          changeReason: '家长暂不同意授权，已关闭',
          minutesAfter: 60 * 12,
        },
      ],
    });
    store.records.push(r3);

    const r4 = buildSeedRecord({
      babyName: '刘一一',
      guardianName: '刘妈妈',
      authJudgment: 'authorized',
      createdBy: '',
      baseMinutesAgo: 60 * 48,
      materials: [
        { type: 'photo' as const, name: '课堂活动照-1' },
        { type: 'consent_form' as const, name: '知情同意书（扫描件）' },
      ],
      status: 'closed' as const,
      forceCorrupted: true,
      forceMissingHandler: true,
      extraHistory: [
        {
          changeType: 'close' as const,
          changedBy: '',
          changeReason: '系统自动关闭',
          minutesAfter: 60 * 6,
        },
      ],
      extraAuditNotes: [
        { type: 'missing_handler' as const, reason: '原始登记记录中处理人字段为空，审计未找到对应操作人，已标记。请联系当值护士补全。' },
        { type: 'corrupted_data' as const, reason: '导入时发现课堂照片顺序字段与材料列表不一致，已隔离该记录不参与统计，保留原始数据以便追溯。' },
      ],
    });
    store.records.push(r4);
  }

  if (store.seedVersion < 2) {
    const existing = store.records.find(r => r.babyName === '陈豆豆');
    if (existing && !existing.materials.some(m => m.source === 'supplement')) {
      const supplementTs = new Date(Date.now() - 1000 * 60 * 30);
      const baseOrder = existing.materials.length > 0 ? Math.max(...existing.materials.map(m => m.order)) + 1 : 0;
      existing.materials.push({
        id: nanoid(),
        type: 'consent_form',
        name: '补录-家属补充授权说明',
        order: baseOrder,
        uploadedAt: supplementTs.toISOString(),
        source: 'supplement',
      }, {
        id: nanoid(),
        type: 'other',
        name: '补录-电话沟通记录截图',
        order: baseOrder + 1,
        uploadedAt: supplementTs.toISOString(),
        source: 'supplement',
      });
      existing.status = 'supplemented';
      existing.updatedAt = supplementTs.toISOString();
      existing.auditNotes.push({
        id: nanoid(),
        type: 'manual_entry',
        reason: '手工补录：家属前日来电表示重新考虑后同意授权，因原记录已关闭，按流程手工补录两份追溯材料（处理人：赵护士；复核人：李护士长）。可对比补录前后材料列表。',
        createdAt: supplementTs.toISOString(),
        notedBy: '赵护士',
      }, {
        id: nanoid(),
        type: 'closed_supplement',
        reason: '记录已关闭，赵护士追加材料 2 项：手工补录家属授权说明及沟通记录',
        createdAt: supplementTs.toISOString(),
        notedBy: '赵护士',
      });
      const prevSnap = existing.history[existing.history.length - 1].snapshot;
      const newSnap: HistoryVersion['snapshot'] = {
        babyName: existing.babyName,
        guardianName: existing.guardianName,
        authJudgment: existing.authJudgment,
        materials: JSON.parse(JSON.stringify(existing.materials)),
        status: existing.status,
      };
      existing.history.push({
        id: nanoid(),
        version: existing.currentVersion + 1,
        snapshot: newSnap,
        changedBy: '赵护士',
        changedAt: supplementTs.toISOString(),
        reviewBy: '李护士长',
        reviewAt: supplementTs.toISOString(),
        changeType: 'supplement',
        changeReason: '手工补录家属授权说明及电话沟通记录',
        diffSummary: makeDiffSummary(prevSnap, newSnap),
      });
      existing.currentVersion = existing.history.length;
    }
  }

  store.initialized = true;
  store.seedVersion = SEED_VERSION;
  writeStore(store);
  return store.records;
}

interface BuildSeedOpts {
  babyName: string;
  guardianName: string;
  authJudgment: AuthJudgment;
  createdBy: string;
  baseMinutesAgo: number;
  materials: { type: Material['type']; name: string }[];
  status: RecordStatus;
  forceCorrupted?: boolean;
  forceMissingHandler?: boolean;
  extraHistory?: { changeType: ChangeType; changedBy: string; reviewBy?: string; changeReason?: string; minutesAfter: number }[];
  extraAuditNotes?: { type: AuditNoteType; reason: string; notedBy?: string }[];
}

function buildSeedRecord(opts: BuildSeedOpts): AuthRecord {
  const base = Date.now() - opts.baseMinutesAgo * 60 * 1000;
  const ts = new Date(base).toISOString();
  const materials: Material[] = opts.materials.map((m, i) => ({
    id: nanoid(),
    type: m.type,
    name: m.name,
    order: i,
    uploadedAt: ts,
    source: 'original',
  }));
  const id = nanoid();
  const record: AuthRecord = {
    id,
    babyName: opts.babyName,
    guardianName: opts.guardianName,
    authJudgment: opts.authJudgment,
    materials,
    status: opts.status,
    createdAt: ts,
    createdBy: opts.createdBy || '(缺失)',
    updatedAt: ts,
    history: [],
    auditNotes: [],
    isCorrupted: !!opts.forceCorrupted,
    currentVersion: 0,
  };
  record.history.push({
    id: nanoid(),
    version: 1,
    snapshot: snapshotFromRecord(record),
    changedBy: opts.createdBy || '(缺失)',
    changedAt: ts,
    changeType: 'create',
    changeReason: '初次登记',
    diffSummary: '初始登记',
  });
  record.currentVersion = 1;
  if (opts.extraHistory) {
    for (const h of opts.extraHistory) {
      const eventTs = new Date(base + h.minutesAfter * 60 * 1000).toISOString();
      if (h.changeType === 'close') record.status = 'closed';
      if (h.changeType === 'reopen') record.status = 'open';
      record.updatedAt = eventTs;
      record.history.push({
        id: nanoid(),
        version: record.currentVersion + 1,
        snapshot: snapshotFromRecord(record),
        changedBy: h.changedBy || '(缺失)',
        changedAt: eventTs,
        reviewBy: h.reviewBy,
        reviewAt: h.reviewBy ? eventTs : undefined,
        changeType: h.changeType,
        changeReason: h.changeReason,
        diffSummary: `状态变更为${labelStatus(record.status)}`,
      });
      record.currentVersion++;
    }
  }
  if (opts.extraAuditNotes) {
    for (const n of opts.extraAuditNotes) {
      record.auditNotes.push({
        id: nanoid(),
        type: n.type,
        reason: n.reason,
        createdAt: new Date(base + 5 * 60 * 1000).toISOString(),
        notedBy: n.notedBy,
      });
    }
  }
  if (opts.forceMissingHandler) {
    record.createdBy = '';
  }
  return record;
}

export function subscribeStore(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener('erbao-store-updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('erbao-store-updated', handler);
    window.removeEventListener('storage', handler);
  };
}

export function resetStore(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('erbao-store-updated'));
}
