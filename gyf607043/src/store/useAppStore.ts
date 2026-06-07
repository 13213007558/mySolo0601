import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Role,
  ClassInfo,
  Baby,
  DisinfectionRecord,
  Anomaly,
  AuditLog,
  ResolveAnomalyResult,
  Correction,
} from '@/types';
import { USERS, CLASSES, BABIES, RECORDS, ANOMALIES, AUDIT_LOGS } from '@/data/mockData';
import { sanitizeForLog } from '@/utils/privacyFilter';

interface AppState {
  currentUserId: string;
  users: User[];
  classes: ClassInfo[];
  babies: Baby[];
  records: DisinfectionRecord[];
  anomalies: Anomaly[];
  auditLogs: AuditLog[];

  getCurrentUser: () => User | undefined;
  getCurrentRole: () => Role;
  getClassById: (id: string) => ClassInfo | undefined;
  getBabyById: (id: string) => Baby | undefined;
  getRecordsByBaby: (babyId: string) => DisinfectionRecord[];
  getAnomalyById: (id: string) => Anomaly | undefined;
  getAnomaliesByBaby: (babyId: string) => Anomaly[];
  getAuditByRecord: (recordId: string) => AuditLog[];
  getBabiesByClass: (classId: string) => Baby[];
  getUserById: (id: string) => User | undefined;

  setCurrentUser: (userId: string) => void;
  resolveAnomaly: (
    anomalyId: string,
    resolution: { note: string; photos?: string[] }
  ) => ResolveAnomalyResult;
  withdrawRecord: (recordId: string, reason: string) => boolean;
  createManualRecord: (
    record: Omit<
      DisinfectionRecord,
      'id' | 'isManual' | 'manualCreatedBy' | 'manualCreatedAt' | 'status'
    >
  ) => DisinfectionRecord;
  resetToDefaults: () => void;
}

const genId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUserId: 'u_sup_01',
      users: USERS,
      classes: CLASSES,
      babies: BABIES,
      records: RECORDS,
      anomalies: ANOMALIES,
      auditLogs: AUDIT_LOGS,

      getCurrentUser: () => get().users.find((u) => u.id === get().currentUserId),
      getCurrentRole: () => get().getCurrentUser()?.role ?? 'nurse',
      getClassById: (id) => get().classes.find((c) => c.id === id),
      getBabyById: (id) => get().babies.find((b) => b.id === id),
      getRecordsByBaby: (babyId) =>
        get()
          .records.filter((r) => r.babyId === babyId)
          .sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime()),
      getAnomalyById: (id) => get().anomalies.find((a) => a.id === id),
      getAnomaliesByBaby: (babyId) => {
        const recordIds = new Set(
          get().records.filter((r) => r.babyId === babyId).map((r) => r.id)
        );
        return get().anomalies.filter((a) => recordIds.has(a.recordId));
      },
      getAuditByRecord: (recordId) =>
        get()
          .auditLogs.filter((l) => l.recordId === recordId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      getBabiesByClass: (classId) => get().babies.filter((b) => b.classId === classId),
      getUserById: (id) => get().users.find((u) => u.id === id),

      setCurrentUser: (userId) => set({ currentUserId: userId }),

      resolveAnomaly: (anomalyId, resolution) => {
        const state = get();
        const anomaly = state.anomalies.find((a) => a.id === anomalyId);
        if (!anomaly) {
          return {
            success: false,
            resolvedIds: [],
            conflictedIds: [],
            message: '异常记录不存在',
          };
        }

        const currentUser = state.getCurrentUser()!;
        const now = new Date().toISOString();

        const conflictedIds: string[] = anomaly.conflictedRecordIds ?? [];
        const hasConflict = conflictedIds.length > 0;

        let resolvedRecordIds: string[] = [];
        const newAudits: AuditLog[] = [];
        let newRecords = [...state.records];
        let newAnomalies = [...state.anomalies];

        if (!hasConflict) {
          const record = state.records.find((r) => r.id === anomaly.recordId);
          if (record) {
            const correction: Correction = {
              id: genId('corr'),
              recordId: record.id,
              description: resolution.note,
              photos: resolution.photos ?? [],
              correctedBy: currentUser.id,
              correctedAt: now,
            };
            newRecords = newRecords.map((r) =>
              r.id === record.id
                ? { ...r, status: 'anomaly_resolved', correction }
                : r
            );
            resolvedRecordIds.push(record.id);

            newAudits.push({
              id: genId('audit'),
              recordId: record.id,
              action: 'correct',
              operatorId: currentUser.id,
              operatorRole: currentUser.role,
              timestamp: now,
              reason: resolution.note,
            });
          }

          newAnomalies = newAnomalies.map((a) =>
            a.id === anomalyId
              ? {
                  ...a,
                  status: 'resolved',
                  resolvedAt: now,
                  resolverId: currentUser.id,
                  resolutionNote: resolution.note,
                }
              : a
          );
        } else {
          const record = state.records.find((r) => r.id === anomaly.recordId);
          if (record) {
            const correction: Correction = {
              id: genId('corr'),
              recordId: record.id,
              description: resolution.note,
              photos: resolution.photos ?? [],
              correctedBy: currentUser.id,
              correctedAt: now,
            };
            newRecords = newRecords.map((r) =>
              r.id === record.id
                ? { ...r, status: 'anomaly_resolved', correction }
                : r
            );
            resolvedRecordIds.push(record.id);

            newAudits.push({
              id: genId('audit'),
              recordId: record.id,
              action: 'correct',
              operatorId: currentUser.id,
              operatorRole: currentUser.role,
              timestamp: now,
              reason: `部分成功：${resolution.note}`,
            });
          }

          newAnomalies = newAnomalies.map((a) =>
            a.id === anomalyId
              ? {
                  ...a,
                  status: 'partial_resolved',
                  resolvedAt: now,
                  resolverId: currentUser.id,
                  resolutionNote: resolution.note,
                }
              : a
          );
        }

        const newClasses = state.classes.map((c) => {
          const classBabyIds = new Set(
            state.babies.filter((b) => b.classId === c.id).map((b) => b.id)
          );
          const pendingCount = newAnomalies.filter((a) => {
            const rec = newRecords.find((r) => r.id === a.recordId);
            return rec && classBabyIds.has(rec.babyId) && a.status === 'pending';
          }).length;
          return { ...c, todayAnomalyCount: pendingCount, lastUpdatedAt: now };
        });

        set({
          records: newRecords,
          anomalies: newAnomalies,
          auditLogs: [...state.auditLogs, ...newAudits],
          classes: newClasses,
        });

        console.log(
          '[AUDIT] resolveAnomaly',
          sanitizeForLog(
            { anomalyId, resolution, resolvedRecordIds, conflictedIds },
            currentUser.role
          )
        );

        return {
          success: true,
          resolvedIds: resolvedRecordIds,
          conflictedIds,
          message: hasConflict
            ? `部分成功：已处理 ${resolvedRecordIds.length} 项，仍有 ${conflictedIds.length} 项预约冲突待单独处理`
            : '异常已完成整改',
        };
      },

      withdrawRecord: (recordId, reason) => {
        const state = get();
        const record = state.records.find((r) => r.id === recordId);
        if (!record) return false;
        if (record.status === 'withdrawn') return false;

        const currentUser = state.getCurrentUser()!;
        if (currentUser.role !== 'supervisor' && currentUser.role !== 'admin') {
          return false;
        }

        const now = new Date().toISOString();
        const beforeSnapshot: Partial<DisinfectionRecord> = {
          status: record.status,
          itemType: record.itemType,
        };

        const newRecords = state.records.map((r) =>
          r.id === recordId ? { ...r, status: 'withdrawn' as const } : r
        );

        const newAudit: AuditLog = {
          id: genId('audit'),
          recordId,
          action: 'withdraw',
          operatorId: currentUser.id,
          operatorRole: currentUser.role,
          timestamp: now,
          reason,
          beforeSnapshot,
          afterSnapshot: { status: 'withdrawn' },
        };

        const now2 = new Date().toISOString();
        const newClasses = state.classes.map((c) => ({
          ...c,
          lastUpdatedAt: now2,
        }));

        set({
          records: newRecords,
          auditLogs: [...state.auditLogs, newAudit],
          classes: newClasses,
        });

        console.log(
          '[AUDIT] withdrawRecord',
          sanitizeForLog({ recordId, reason }, currentUser.role)
        );
        return true;
      },

      createManualRecord: (recordData) => {
        const state = get();
        const currentUser = state.getCurrentUser()!;
        const now = new Date().toISOString();

        const newRecord: DisinfectionRecord = {
          ...recordData,
          id: genId('r_manual'),
          status: 'confirmed',
          isManual: true,
          manualCreatedBy: currentUser.id,
          manualCreatedAt: now,
        };

        const newAudit: AuditLog = {
          id: genId('audit'),
          recordId: newRecord.id,
          action: 'manual_create',
          operatorId: currentUser.id,
          operatorRole: currentUser.role,
          timestamp: now,
          reason: `手工补录：${recordData.photoRemark ?? '未备注'}`,
        };

        const newClasses = state.classes.map((c) => ({
          ...c,
          lastUpdatedAt: now,
        }));

        set({
          records: [...state.records, newRecord],
          auditLogs: [...state.auditLogs, newAudit],
          classes: newClasses,
        });

        console.log(
          '[AUDIT] createManualRecord',
          sanitizeForLog(newRecord, currentUser.role)
        );
        return newRecord;
      },

      resetToDefaults: () =>
        set({
          currentUserId: 'u_sup_01',
          users: USERS,
          classes: CLASSES,
          babies: BABIES,
          records: RECORDS,
          anomalies: ANOMALIES,
          auditLogs: AUDIT_LOGS,
        }),
    }),
    {
      name: 'disinfection-review-wall',
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        users: state.users,
        classes: state.classes,
        babies: state.babies,
        records: state.records,
        anomalies: state.anomalies,
        auditLogs: state.auditLogs,
      }),
    }
  )
);
