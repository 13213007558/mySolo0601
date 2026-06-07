import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type {
  Baby,
  ThermometerRawRecord,
  LeaveRequest,
  Appointment,
  MorningCheckRecord,
  AuditLog,
} from '../types';
import {
  babies as mockBabies,
  thermometerRawRecords as mockThermo,
  leaveRequests as mockLeaves,
  appointments as mockAppts,
  initialMorningChecks,
  initialAuditLogs,
} from '../mock/data';
import dayjs from 'dayjs';

interface StoreState {
  babies: Baby[];
  thermometerRecords: ThermometerRawRecord[];
  leaveRequests: LeaveRequest[];
  appointments: Appointment[];
  morningChecks: MorningCheckRecord[];
  auditLogs: AuditLog[];
  currentOperator: string;
}

interface StoreActions {
  supplementRecord: (
    recordId: string,
    patch: Partial<MorningCheckRecord>
  ) => void;
  withdrawRecord: (recordId: string, reason: string) => void;
  confirmRecord: (recordId: string) => void;
  recheckRecord: (recordId: string, remark?: string) => void;
  filterByPhone: (phone: string) => MorningCheckRecord[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'operatedAt'>) => void;
}

type Store = StoreState & StoreActions;

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [babies] = useState<Baby[]>(mockBabies);
  const [thermometerRecords] = useState<ThermometerRawRecord[]>(mockThermo);
  const [leaveRequests] = useState<LeaveRequest[]>(mockLeaves);
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppts);
  const [morningChecks, setMorningChecks] = useState<MorningCheckRecord[]>(initialMorningChecks);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const currentOperator = '李店长';

  const addAuditLog: StoreActions['addAuditLog'] = (log) => {
    setAuditLogs((prev) => [
      ...prev,
      {
        ...log,
        id: `LOG${String(prev.length + 1).padStart(3, '0')}`,
        operatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      },
    ]);
  };

  const supplementRecord: StoreActions['supplementRecord'] = (recordId, patch) => {
    setMorningChecks((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const beforeSnapshot = { ...r };
        const next: MorningCheckRecord = {
          ...r,
          ...patch,
          isManualSupplement: true,
          supplementBeforeSnapshot: beforeSnapshot,
          dataQuality: patch.temperature && patch.temperature > 35 && patch.temperature < 42 ? 'normal' : r.dataQuality,
          source: 'manual',
        };
        addAuditLog({
          action: 'supplement',
          targetType: 'morning_check',
          targetId: recordId,
          beforeSnapshot: beforeSnapshot as unknown as Record<string, unknown>,
          afterSnapshot: next as unknown as Record<string, unknown>,
          operator: currentOperator,
          reason: '手工补录晨检记录',
        });
        return next;
      })
    );
  };

  const withdrawRecord: StoreActions['withdrawRecord'] = (recordId, reason) => {
    setMorningChecks((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const beforeSnapshot = { ...r };
        const next: MorningCheckRecord = {
          ...r,
          status: 'withdrawn',
          remark: r.remark ? `${r.remark}（已撤回：${reason}）` : `已撤回：${reason}`,
        };
        addAuditLog({
          action: 'withdraw',
          targetType: 'morning_check',
          targetId: recordId,
          beforeSnapshot: beforeSnapshot as unknown as Record<string, unknown>,
          afterSnapshot: next as unknown as Record<string, unknown>,
          operator: currentOperator,
          reason,
        });
        return next;
      })
    );
  };

  const confirmRecord: StoreActions['confirmRecord'] = (recordId) => {
    setMorningChecks((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const beforeSnapshot = { ...r };
        const next: MorningCheckRecord = {
          ...r,
          status: 'confirmed',
          confirmedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          operator: currentOperator,
          dataQuality: r.temperature && r.temperature > 35 && r.temperature < 42 ? 'normal' : r.dataQuality,
        };
        addAuditLog({
          action: 'confirm',
          targetType: 'morning_check',
          targetId: recordId,
          beforeSnapshot: beforeSnapshot as unknown as Record<string, unknown>,
          afterSnapshot: next as unknown as Record<string, unknown>,
          operator: currentOperator,
        });
        return next;
      })
    );
  };

  const recheckRecord: StoreActions['recheckRecord'] = (recordId, remark) => {
    setMorningChecks((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const beforeSnapshot = { ...r };
        const next: MorningCheckRecord = {
          ...r,
          status: 'recheck_required',
          remark: remark ?? r.remark,
        };
        addAuditLog({
          action: 'update',
          targetType: 'morning_check',
          targetId: recordId,
          beforeSnapshot: beforeSnapshot as unknown as Record<string, unknown>,
          afterSnapshot: next as unknown as Record<string, unknown>,
          operator: currentOperator,
        });
        return next;
      })
    );
  };

  const filterByPhone: StoreActions['filterByPhone'] = (phone) => {
    if (!phone.trim()) return morningChecks;
    const matchedBabyIds = babies
      .filter((b) => b.parentPhone.includes(phone.trim()))
      .map((b) => b.id);
    return morningChecks.filter((r) => matchedBabyIds.includes(r.babyId));
  };

  const value = useMemo<Store>(
    () => ({
      babies,
      thermometerRecords,
      leaveRequests,
      appointments,
      morningChecks,
      auditLogs,
      currentOperator,
      supplementRecord,
      withdrawRecord,
      confirmRecord,
      recheckRecord,
      filterByPhone,
      addAuditLog,
    }),
    [babies, thermometerRecords, leaveRequests, appointments, morningChecks, auditLogs, currentOperator]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useBabyMap(): Record<string, Baby> {
  const { babies } = useStore();
  return useMemo(() => {
    const m: Record<string, Baby> = {};
    babies.forEach((b) => (m[b.id] = b));
    return m;
  }, [babies]);
}
