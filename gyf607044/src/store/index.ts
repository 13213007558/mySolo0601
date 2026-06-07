import { create } from 'zustand';
import type {
  DraftForm,
  ExportLog,
  FreezerSlot,
  PhotoItem,
  RecordStatus,
  RescheduleRecord,
  SourceType,
} from '@/types';
import { buildMockFreezerSlots, buildMockRecords } from '@/data/mock';
import {
  clearDraftLS,
  loadDraftFromLS,
  loadExportLogsFromLS,
  loadFreezerFromLS,
  loadRecordsFromLS,
  saveAllPhotosToIDB,
  saveDraftToLS,
  saveExportLogsToLS,
  saveFreezerToLS,
  saveRecordsToLS,
} from '@/utils/storage';
import { nowIso, uid } from '@/utils/helpers';
import {
  detectDuplicate,
  detectRollback,
  makeDuplicateLog,
  makeRollbackLog,
  makeStatusLog,
} from '@/utils/detectors';

interface AppState {
  records: RescheduleRecord[];
  freezerSlots: FreezerSlot[];
  exportLogs: ExportLog[];
  draft: DraftForm;
  currentUser: string;
  initialized: boolean;
  init: () => void;
  submitRecord: (
    input: Omit<
      RescheduleRecord,
      | 'id'
      | 'createdAt'
      | 'updatedAt'
      | 'currentStatus'
      | 'isCorrupted'
      | 'sourceType'
      | 'statusLogs'
      | 'photos'
      | 'rectifications'
      | 'corruptionLogs'
    > & {
      photos: { dataUrl: string; description: string }[];
      sourceType?: SourceType;
    }
  ) => { id: string; duplicated: boolean };
  updateRecordStatus: (
    id: string,
    to: RecordStatus,
    reason: string,
    operator: string
  ) => void;
  addNote: (id: string, note: string, handler?: string) => void;
  addRectification: (
    id: string,
    problem: string,
    measure: string,
    operator: string
  ) => void;
  reviewRectification: (
    id: string,
    rectId: string,
    reviewer: string
  ) => void;
  repairCorrupted: (id: string, operator: string) => void;
  saveDraft: (draft: Partial<DraftForm>) => void;
  clearDraft: () => void;
  updateFreezerSlot: (
    slotId: string,
    patch: Partial<FreezerSlot>,
    log: { action: 'hold' | 'confirm' | 'release'; operator: string; remark?: string }
  ) => void;
  appendExportLog: (log: Omit<ExportLog, 'id' | 'createdAt'>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  records: [],
  freezerSlots: [],
  exportLogs: [],
  draft: { photos: [] },
  currentUser: '当前用户',
  initialized: false,

  init: () => {
    if (get().initialized) return;
    let records = loadRecordsFromLS<RescheduleRecord>();
    if (!records.length) {
      records = buildMockRecords();
      saveRecordsToLS(records);
      const photoEntries: { id: string; dataUrl: string }[] = [];
      records.forEach((r) =>
        r.photos.forEach((p) => photoEntries.push({ id: p.id, dataUrl: p.dataUrl }))
      );
      saveAllPhotosToIDB(photoEntries).catch(() => {});
    }
    let freezerSlots = loadFreezerFromLS<FreezerSlot[] | null>(null);
    if (!freezerSlots || !freezerSlots.length) {
      freezerSlots = buildMockFreezerSlots();
      saveFreezerToLS(freezerSlots);
    }
    const exportLogs = loadExportLogsFromLS<ExportLog>();
    const draft = loadDraftFromLS<DraftForm>({ photos: [] });
    set({ records, freezerSlots, exportLogs, draft, initialized: true });
  },

  submitRecord: (input) => {
    const { records } = get();
    const id = uid('rec_');
    const now = nowIso();
    const duplicated = detectDuplicate(input, records);
    const photos: PhotoItem[] = input.photos.map((p) => ({
      id: uid('ph_'),
      recordId: id,
      dataUrl: p.dataUrl,
      description: p.description,
      uploadedAt: now,
    }));
    const corruptionLogs = duplicated ? [makeDuplicateLog(id)] : [];
    const record: RescheduleRecord = {
      id,
      babyName: input.babyName,
      courseName: input.courseName,
      originalTime: input.originalTime,
      expectedTime: input.expectedTime,
      reason: input.reason,
      sourceFile: input.sourceFile,
      submitter: input.submitter,
      handler: input.handler,
      currentStatus: 'pending',
      latestNote: undefined,
      createdAt: now,
      updatedAt: now,
      isCorrupted: duplicated,
      corruptionReason: duplicated ? '检测到重复提交' : undefined,
      sourceType: input.sourceType ?? 'parent_submit',
      statusLogs: [],
      photos,
      rectifications: [],
      corruptionLogs,
    };
    const next = [record, ...records];
    saveRecordsToLS(next);
    saveAllPhotosToIDB(photos.map((p) => ({ id: p.id, dataUrl: p.dataUrl }))).catch(
      () => {}
    );
    set({ records: next });
    return { id, duplicated };
  },

  updateRecordStatus: (id, to, reason, operator) => {
    const { records } = get();
    const next = records.map((r) => {
      if (r.id !== id) return r;
      const isRollback = detectRollback(r.currentStatus, to);
      const log = makeStatusLog(id, r.currentStatus, to, operator, reason, isRollback);
      const corruptionLogs = isRollback
        ? [...r.corruptionLogs, makeRollbackLog(id, r.currentStatus, to, operator)]
        : r.corruptionLogs;
      return {
        ...r,
        currentStatus: to,
        handler: r.handler || operator,
        latestNote: reason,
        updatedAt: nowIso(),
        isCorrupted: isRollback ? true : r.isCorrupted,
        corruptionReason: isRollback
          ? `检测到状态回退：由「${r.currentStatus}」回退至「${to}」`
          : r.corruptionReason,
        statusLogs: [...r.statusLogs, log],
        corruptionLogs,
      };
    });
    saveRecordsToLS(next);
    set({ records: next });
  },

  addNote: (id, note, handler) => {
    const { records } = get();
    const next = records.map((r) =>
      r.id === id
        ? { ...r, latestNote: note, handler: handler ?? r.handler, updatedAt: nowIso() }
        : r
    );
    saveRecordsToLS(next);
    set({ records: next });
  },

  addRectification: (id, problem, measure, operator) => {
    const { records } = get();
    const next = records.map((r) =>
      r.id === id
        ? {
            ...r,
            rectifications: [
              ...r.rectifications,
              {
                id: uid('rc_'),
                recordId: id,
                problem,
                measure,
                operator,
                createdAt: nowIso(),
              },
            ],
            updatedAt: nowIso(),
          }
        : r
    );
    saveRecordsToLS(next);
    set({ records: next });
  },

  reviewRectification: (id, rectId, reviewer) => {
    const { records } = get();
    const next = records.map((r) =>
      r.id === id
        ? {
            ...r,
            rectifications: r.rectifications.map((rr) =>
              rr.id === rectId
                ? { ...rr, reviewer, reviewedAt: nowIso() }
                : rr
            ),
            updatedAt: nowIso(),
          }
        : r
    );
    saveRecordsToLS(next);
    set({ records: next });
  },

  repairCorrupted: (id, operator) => {
    const { records } = get();
    const next = records.map((r) =>
      r.id === id
        ? {
            ...r,
            isCorrupted: false,
            corruptionReason: undefined,
            corruptionLogs: [
              ...r.corruptionLogs,
              {
                id: uid('cl_'),
                recordId: id,
                type: 'data_integrity' as const,
                reason: `${operator} 确认该数据无误，解除异常标记`,
                detectedBy: 'manual' as const,
                createdAt: nowIso(),
              },
            ],
            updatedAt: nowIso(),
          }
        : r
    );
    saveRecordsToLS(next);
    set({ records: next });
  },

  saveDraft: (partial) => {
    const draft = { ...get().draft, ...partial, savedAt: nowIso() };
    saveDraftToLS(draft);
    set({ draft });
  },

  clearDraft: () => {
    clearDraftLS();
    set({ draft: { photos: [] } });
  },

  updateFreezerSlot: (slotId, patch, log) => {
    const { freezerSlots } = get();
    const next = freezerSlots.map((s) =>
      s.id === slotId
        ? {
            ...s,
            ...patch,
            logs: [
              ...s.logs,
              {
                id: uid('fl_'),
                slotId,
                action: log.action,
                operator: log.operator,
                remark: log.remark,
                createdAt: nowIso(),
              },
            ],
          }
        : s
    );
    saveFreezerToLS(next);
    set({ freezerSlots: next });
  },

  appendExportLog: (partial) => {
    const log: ExportLog = { ...partial, id: uid('el_'), createdAt: nowIso() };
    const next = [log, ...get().exportLogs].slice(0, 50);
    saveExportLogsToLS(next);
    set({ exportLogs: next });
  },
}));
