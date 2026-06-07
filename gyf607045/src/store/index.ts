import {
  AppState,
  AuditLog,
  PackageFlow,
  PhotoEvidence,
  RectificationRecord,
  Role,
  User,
  VerificationRecord,
  VerificationStatus,
} from '../types';

const STORAGE_KEY = 'infant_expense_maternity_v1';
const IMPORT_BATCH_KEY = 'infant_expense_last_batch';

const USERS: User[] = [
  { id: 'u_nurse_1', name: '李护理', role: 'nurse' },
  { id: 'u_supervisor_1', name: '王主管', role: 'supervisor' },
];

export function login(userId: string): User | null {
  const user = USERS.find((u) => u.id === userId);
  if (user) {
    const state = loadState();
    state.currentUser = user;
    saveState(state);
  }
  return user ?? null;
}

export function logout() {
  const state = loadState();
  state.currentUser = null;
  saveState(state);
}

export function getCurrentUser(): User | null {
  return loadState().currentUser;
}

export function getUsers(): User[] {
  return USERS;
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppState;
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return {
    currentUser: null,
    packageFlows: [],
    verificationRecords: [],
    lastImportBatchId: null,
  };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(IMPORT_BATCH_KEY);
}

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getLastBatchId(): string | null {
  return localStorage.getItem(IMPORT_BATCH_KEY);
}

function setLastBatchId(batchId: string) {
  localStorage.setItem(IMPORT_BATCH_KEY, batchId);
}

function generateSampleFlows(batchId: string): PackageFlow[] {
  return [
    {
      id: uid('flow'),
      babyName: '张小宝',
      packageName: '新生儿基础护理套餐',
      packageType: '日常护理',
      flowDate: '2026-06-01',
      amount: 3800,
      remainingSessions: 8,
      totalSessions: 10,
      source: 'system_import',
      importBatchId: batchId,
    },
    {
      id: uid('flow'),
      babyName: '刘小贝',
      packageName: '婴幼儿游泳抚触套餐',
      packageType: '特色护理',
      flowDate: '2026-06-02',
      amount: 2400,
      remainingSessions: 5,
      totalSessions: 8,
      source: 'system_import',
      importBatchId: batchId,
    },
    {
      id: uid('flow'),
      babyName: '陈朵朵',
      packageName: '月子中心特级照护',
      packageType: '特级护理',
      flowDate: '2026-06-03',
      amount: 6800,
      remainingSessions: 12,
      totalSessions: 15,
      source: 'system_import',
      importBatchId: batchId,
    },
    {
      id: uid('flow'),
      babyName: '王一乐',
      packageName: '产后康复婴儿配套',
      packageType: '康复配套',
      flowDate: '2026-06-05',
      amount: 3200,
      remainingSessions: 6,
      totalSessions: 10,
      source: 'system_import',
      importBatchId: batchId,
    },
    {
      id: uid('flow'),
      babyName: '赵星星',
      packageName: '早产儿专项护理',
      packageType: '专项护理',
      flowDate: '2026-06-04',
      amount: 8800,
      remainingSessions: 20,
      totalSessions: 25,
      source: 'system_import',
      importBatchId: batchId,
    },
    {
      id: uid('flow'),
      babyName: '孙暖暖',
      packageName: '手工补录夜间照护',
      packageType: '补录护理',
      flowDate: '2026-06-06',
      amount: 1200,
      remainingSessions: 3,
      totalSessions: 3,
      source: 'manual_entry',
      importBatchId: batchId,
    },
  ];
}

function generateSampleRecords(batchId: string, flows: PackageFlow[], operator: User): VerificationRecord[] {
  const records: VerificationRecord[] = [];

  flows.forEach((flow, idx) => {
    const statuses: VerificationStatus[] = [
      'verified',
      'pending',
      'rejected',
      'partially_verified',
      'pending',
      'manual_override',
    ];
    const reasons = [
      '护理记录完整，照片齐全，核销通过',
      '等待护理员补充照片说明',
      '实际执行次数与系统不符，已驳回整改',
      '日期倒序，部分核销记录已确认有效',
      '待主管复核',
      '经人工核实，家长确认服务已执行，改判通过',
    ];
    const status = statuses[idx] ?? 'pending';
    const hasDateOrderIssue = idx === 3;

    const photos: PhotoEvidence[] = [
      {
        id: uid('photo'),
        url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('postpartum care nurse taking care of newborn baby in maternity center, professional, warm lighting')}&image_size=square`,
        description: `${flow.babyName} 护理执行现场照 - 第${idx + 1}次服务`,
        uploadedBy: operator.id,
        uploadedAt: '2026-06-07 10:30:00',
      },
    ];

    const audits: AuditLog[] = [
      {
        id: uid('audit'),
        recordId: '',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: '创建核销记录',
        newStatus: status,
        newValue: reasons[idx],
        timestamp: '2026-06-07 10:30:00',
      },
    ];

    if (status === 'manual_override') {
      audits.push({
        id: uid('audit'),
        recordId: '',
        operatorId: 'u_supervisor_1',
        operatorName: '王主管',
        operatorRole: 'supervisor',
        action: '人工改判覆盖原驳回理由',
        oldStatus: 'rejected',
        newStatus: 'manual_override',
        oldValue: '原驳回：执行记录缺失',
        newValue: reasons[idx],
        timestamp: '2026-06-07 14:20:00',
      });
    }

    const rectifications: RectificationRecord[] =
      status === 'rejected'
        ? [
            {
              id: uid('rect'),
              recordId: '',
              operatorId: operator.id,
              operatorName: operator.name,
              operatorRole: operator.role,
              action: '提交整改：补充了3张执行照片并核对实际次数',
              remark: '已重新核对护理日志，实际执行7次，系统显示6次，已修正',
              createdAt: '2026-06-07 16:45:00',
            },
          ]
        : [];

    const record: VerificationRecord = {
      id: uid('rec'),
      packageFlowId: flow.id,
      babyName: flow.babyName,
      packageName: flow.packageName,
      verifyDate: '2026-06-07',
      actualSessions: idx === 3 ? Math.floor((flow.totalSessions - flow.remainingSessions) * 0.7) : flow.totalSessions - flow.remainingSessions,
      status,
      reason: reasons[idx],
      source: flow.source,
      photos,
      rectifications,
      audits,
      isActive: true,
      importBatchId: batchId,
      createdBy: operator.id,
      createdAt: '2026-06-07 10:30:00',
      updatedAt: '2026-06-07 10:30:00',
      dateOrderIssue: hasDateOrderIssue,
      partialSuccessNote: hasDateOrderIssue ? '发现日期倒序，已确认其中5条记录有效，其余待补充凭证' : undefined,
    };

    audits.forEach((a) => (a.recordId = record.id));
    rectifications.forEach((r) => (r.recordId = record.id));

    records.push(record);
  });

  return records;
}

export function importSampleData(operator: User): { batchId: string; flowsCount: number; recordsCount: number; isReimport: boolean } {
  const state = loadState();
  const existingBatch = getLastBatchId();
  const batchId = existingBatch ?? `batch_${Date.now()}`;

  if (existingBatch) {
    state.verificationRecords = state.verificationRecords.map((r) =>
      r.importBatchId === existingBatch ? { ...r, isActive: false } : r,
    );
  }

  const flows = generateSampleFlows(batchId);
  const records = generateSampleRecords(batchId, flows, operator);

  state.packageFlows = [...state.packageFlows.filter((f) => f.importBatchId !== batchId), ...flows];
  state.verificationRecords = [...state.verificationRecords, ...records];
  state.lastImportBatchId = batchId;

  setLastBatchId(batchId);
  saveState(state);

  return {
    batchId,
    flowsCount: flows.length,
    recordsCount: records.length,
    isReimport: !!existingBatch,
  };
}

export function hasImportedData(): boolean {
  return !!getLastBatchId();
}

export function getPackageFlows(): PackageFlow[] {
  return loadState().packageFlows;
}

export function getVerificationRecords(role: Role): VerificationRecord[] {
  const state = loadState();
  let records = state.verificationRecords.filter((r) => r.isActive);
  if (role === 'nurse') {
    records = records.map((r) => ({
      ...r,
      audits: [],
    }));
  }
  return records;
}

export function getVerificationRecordById(id: string, role: Role): VerificationRecord | null {
  const state = loadState();
  const record = state.verificationRecords.find((r) => r.id === id && r.isActive);
  if (!record) return null;
  if (role === 'nurse') {
    return { ...record, audits: [] };
  }
  return record;
}

export function getFlowRecordLink(flowId: string, role: Role): { flow: PackageFlow | null; records: VerificationRecord[] } {
  const state = loadState();
  const flow = state.packageFlows.find((f) => f.id === flowId) ?? null;
  let records = state.verificationRecords.filter(
    (r) => r.packageFlowId === flowId && r.isActive,
  );
  if (role === 'nurse') {
    records = records.map((r) => ({ ...r, audits: [] }));
  }
  return { flow, records };
}

export function getStatistics(role: Role): {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  manualOverride: number;
  partiallyVerified: number;
} {
  const records = getVerificationRecords(role);
  return {
    total: records.length,
    verified: records.filter((r) => r.status === 'verified').length,
    pending: records.filter((r) => r.status === 'pending').length,
    rejected: records.filter((r) => r.status === 'rejected').length,
    manualOverride: records.filter((r) => r.status === 'manual_override').length,
    partiallyVerified: records.filter((r) => r.status === 'partially_verified').length,
  };
}

export function createManualFlowEntry(
  data: {
    babyName: string;
    packageName: string;
    packageType: string;
    flowDate: string;
    amount: number;
    totalSessions: number;
  },
  operator: User,
): PackageFlow {
  const state = loadState();
  const flow: PackageFlow = {
    id: uid('flow'),
    babyName: data.babyName,
    packageName: data.packageName,
    packageType: data.packageType,
    flowDate: data.flowDate,
    amount: data.amount,
    remainingSessions: data.totalSessions,
    totalSessions: data.totalSessions,
    source: 'manual_entry',
    importBatchId: state.lastImportBatchId ?? undefined,
  };
  state.packageFlows.push(flow);
  saveState(state);
  return flow;
}

export function createVerificationRecord(
  data: {
    packageFlowId: string;
    babyName: string;
    packageName: string;
    verifyDate: string;
    actualSessions: number;
    reason: string;
    photoDescriptions: string[];
  },
  operator: User,
): VerificationRecord {
  const state = loadState();

  const photos: PhotoEvidence[] = data.photoDescriptions.map((desc) => ({
    id: uid('photo'),
    url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('maternity nurse newborn care professional photo')}&image_size=square`,
    description: desc,
    uploadedBy: operator.id,
    uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  }));

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const record: VerificationRecord = {
    id: uid('rec'),
    packageFlowId: data.packageFlowId,
    babyName: data.babyName,
    packageName: data.packageName,
    verifyDate: data.verifyDate,
    actualSessions: data.actualSessions,
    status: 'pending',
    reason: data.reason,
    source: 'manual_entry',
    photos,
    rectifications: [],
    audits: [
      {
        id: uid('audit'),
        recordId: '',
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        action: '手工补录创建核销记录',
        newStatus: 'pending',
        newValue: data.reason,
        timestamp: now,
      },
    ],
    isActive: true,
    importBatchId: state.lastImportBatchId ?? undefined,
    createdBy: operator.id,
    createdAt: now,
    updatedAt: now,
  };

  record.audits.forEach((a) => (a.recordId = record.id));
  state.verificationRecords.push(record);
  saveState(state);

  return record;
}

export function overrideRecordStatus(
  recordId: string,
  newStatus: VerificationStatus,
  newReason: string,
  operator: User,
): VerificationRecord | null {
  if (operator.role !== 'supervisor') return null;

  const state = loadState();
  const idx = state.verificationRecords.findIndex((r) => r.id === recordId && r.isActive);
  if (idx === -1) return null;

  const record = state.verificationRecords[idx];
  const oldStatus = record.status;
  const oldReason = record.reason;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const audit: AuditLog = {
    id: uid('audit'),
    recordId: record.id,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: '人工改判覆盖旧理由',
    oldStatus,
    newStatus,
    oldValue: oldReason,
    newValue: newReason,
    timestamp: now,
  };

  const updated: VerificationRecord = {
    ...record,
    status: newStatus,
    reason: newReason,
    audits: [...record.audits, audit],
    updatedAt: now,
  };

  state.verificationRecords[idx] = updated;
  saveState(state);
  return updated;
}

export function addRectification(
  recordId: string,
  action: string,
  remark: string,
  operator: User,
): VerificationRecord | null {
  const state = loadState();
  const idx = state.verificationRecords.findIndex((r) => r.id === recordId && r.isActive);
  if (idx === -1) return null;

  const record = state.verificationRecords[idx];
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const rect: RectificationRecord = {
    id: uid('rect'),
    recordId: record.id,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    action,
    remark,
    createdAt: now,
  };

  const audit: AuditLog = {
    id: uid('audit'),
    recordId: record.id,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: '提交整改记录',
    newValue: `${action} | ${remark}`,
    timestamp: now,
  };

  const updated: VerificationRecord = {
    ...record,
    rectifications: [...record.rectifications, rect],
    audits: [...record.audits, audit],
    updatedAt: now,
  };

  state.verificationRecords[idx] = updated;
  saveState(state);
  return updated;
}

export function updatePhotoDescription(
  recordId: string,
  photoId: string,
  description: string,
  operator: User,
): VerificationRecord | null {
  const state = loadState();
  const idx = state.verificationRecords.findIndex((r) => r.id === recordId && r.isActive);
  if (idx === -1) return null;

  const record = state.verificationRecords[idx];
  const photoIdx = record.photos.findIndex((p) => p.id === photoId);
  if (photoIdx === -1) return null;

  const oldDescription = record.photos[photoIdx].description;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const audit: AuditLog = {
    id: uid('audit'),
    recordId: record.id,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: '更新照片说明',
    oldValue: oldDescription,
    newValue: description,
    timestamp: now,
  };

  const newPhotos = [...record.photos];
  newPhotos[photoIdx] = { ...newPhotos[photoIdx], description };

  const updated: VerificationRecord = {
    ...record,
    photos: newPhotos,
    audits: [...record.audits, audit],
    updatedAt: now,
  };

  state.verificationRecords[idx] = updated;
  saveState(state);
  return updated;
}

export function handleDateReverseOrder(
  recordId: string,
  verifiedCount: number,
  note: string,
  operator: User,
): VerificationRecord | null {
  const state = loadState();
  const idx = state.verificationRecords.findIndex((r) => r.id === recordId && r.isActive);
  if (idx === -1) return null;

  const record = state.verificationRecords[idx];
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const audit: AuditLog = {
    id: uid('audit'),
    recordId: record.id,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    action: '处理日期倒序 - 部分核销成功',
    oldValue: `原确认次数：${record.actualSessions}`,
    newValue: `实际有效次数：${verifiedCount}，备注：${note}`,
    oldStatus: record.status,
    newStatus: 'partially_verified',
    timestamp: now,
  };

  const updated: VerificationRecord = {
    ...record,
    status: 'partially_verified',
    actualSessions: verifiedCount,
    dateOrderIssue: true,
    partialSuccessNote: note,
    audits: [...record.audits, audit],
    updatedAt: now,
  };

  state.verificationRecords[idx] = updated;
  saveState(state);
  return updated;
}
