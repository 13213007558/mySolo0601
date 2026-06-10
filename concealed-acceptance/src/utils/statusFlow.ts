import type { AcceptanceRecord, StatusHistory, User } from '@/types';
import { STATUS_TRANSITIONS } from '@/types';
import { canTransitionStatus } from './validator';
import { generateId } from './validator';
import { getNowString } from './date';

export interface StatusTransitionResult {
  success: boolean;
  record?: AcceptanceRecord;
  history?: StatusHistory;
  error?: string;
}

export function transitionStatus(
  record: AcceptanceRecord,
  toStatus: string,
  user: User,
  reason?: string
): StatusTransitionResult {
  if (!canTransitionStatus(record.status, toStatus, user.role)) {
    return {
      success: false,
      error: `您的角色（${user.role}）无权执行此状态变更`
    };
  }

  const allowedTransitions = STATUS_TRANSITIONS[record.status] || [];
  if (!allowedTransitions.includes(toStatus as any)) {
    return {
      success: false,
      error: `无法从「${record.status}」变更为「${toStatus}」`
    };
  }

  const fromStatus = record.status;
  const updatedRecord: AcceptanceRecord = {
    ...record,
    status: toStatus as any,
    rejectReason: toStatus === 'REJECTED' ? reason : undefined,
    updatedAt: getNowString()
  };

  const history: StatusHistory = {
    id: generateId(),
    recordId: record.id,
    fromStatus,
    toStatus: toStatus as any,
    reason,
    operator: user.name,
    operatorRole: user.role,
    timestamp: getNowString()
  };

  return {
    success: true,
    record: updatedRecord,
    history
  };
}

export function getAvailableTransitions(status: string, userRole: string): string[] {
  const allowedTransitions: Record<string, Record<string, string[]>> = {
    PROJECT_MANAGER: {
      DRAFT: ['SUBMITTED'],
      REJECTED: ['SUBMITTED'],
      PENDING_EVIDENCE: ['SUBMITTED']
    },
    SUPERVISOR: {
      SUBMITTED: ['PENDING_EVIDENCE', 'REJECTED', 'ARCHIVABLE'],
      PENDING_EVIDENCE: ['REJECTED', 'ARCHIVABLE']
    },
    DOCUMENT_CONTROLLER: {}
  };

  return allowedTransitions[userRole]?.[status] || [];
}

export function getStatusTransitionText(fromStatus: string, toStatus: string): string {
  const texts: Record<string, string> = {
    'DRAFT->SUBMITTED': '提交审核',
    'SUBMITTED->PENDING_EVIDENCE': '要求补证',
    'SUBMITTED->REJECTED': '退回整改',
    'SUBMITTED->ARCHIVABLE': '通过归档',
    'PENDING_EVIDENCE->SUBMITTED': '补证后重提',
    'PENDING_EVIDENCE->REJECTED': '退回整改',
    'PENDING_EVIDENCE->ARCHIVABLE': '通过归档',
    'REJECTED->SUBMITTED': '整改后重提'
  };
  return texts[`${fromStatus}->${toStatus}`] || '状态变更';
}
