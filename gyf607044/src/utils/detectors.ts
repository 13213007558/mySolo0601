import type {
  CorruptionLog,
  RecordStatus,
  RescheduleRecord,
  StatusLog,
} from '@/types';
import { nowIso, uid } from './helpers';

export const STATUS_ORDER: RecordStatus[] = [
  'pending',
  'processing',
  'completed',
  'cancelled',
  'rejected',
];

export function detectDuplicate(
  incoming: Pick<
    RescheduleRecord,
    'babyName' | 'courseName' | 'originalTime'
  >,
  existing: RescheduleRecord[],
  windowMs = 30 * 1000
): boolean {
  const now = Date.now();
  return existing.some((r) => {
    if (r.babyName !== incoming.babyName) return false;
    if (r.courseName !== incoming.courseName) return false;
    if (r.originalTime !== incoming.originalTime) return false;
    return now - new Date(r.createdAt).getTime() < windowMs;
  });
}

export function detectRollback(
  current: RecordStatus,
  target: RecordStatus
): boolean {
  const curIdx = STATUS_ORDER.indexOf(current);
  const tgtIdx = STATUS_ORDER.indexOf(target);
  if (curIdx === -1 || tgtIdx === -1) return false;
  if (current === 'pending' && target === 'pending') return false;
  return tgtIdx < curIdx;
}

export function makeDuplicateLog(recordId: string): CorruptionLog {
  return {
    id: uid('cl_'),
    recordId,
    type: 'duplicate_submit',
    reason: '30秒内检测到相同宝宝、课程、原上课时间的重复提交',
    detectedBy: 'system',
    createdAt: nowIso(),
  };
}

export function makeRollbackLog(
  recordId: string,
  from: RecordStatus,
  to: RecordStatus,
  operator: string
): CorruptionLog {
  return {
    id: uid('cl_'),
    recordId,
    type: 'status_rollback',
    reason: `${operator} 将状态从「${from}」回退到「${to}」，已记录回退原因`,
    detectedBy: 'system',
    createdAt: nowIso(),
  };
}

export function makeStatusLog(
  recordId: string,
  from: RecordStatus,
  to: RecordStatus,
  operator: string,
  reason: string,
  isRollback = false
): StatusLog {
  return {
    id: uid('sl_'),
    recordId,
    fromStatus: from,
    toStatus: to,
    operator,
    reason,
    createdAt: nowIso(),
    isRollback,
  };
}
