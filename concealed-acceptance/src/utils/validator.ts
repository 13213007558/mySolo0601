import type { AcceptanceRecord, Evidence } from '@/types';
import { REQUIRED_EVIDENCE_TYPES } from '@/types';
import { isAcceptanceAfterFormwork, isValidDate, getNowString } from './date';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateRecord(record: AcceptanceRecord, allRecords: AcceptanceRecord[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!record.projectName?.trim()) {
    errors.push({ field: 'projectName', message: '项目名称不能为空', severity: 'error' });
  }

  if (!record.axis?.trim()) {
    errors.push({ field: 'axis', message: '轴线不能为空', severity: 'error' });
  }

  if (!record.workType?.trim()) {
    errors.push({ field: 'workType', message: '工序类型不能为空', severity: 'error' });
  }

  if (!isValidDate(record.acceptanceDate)) {
    errors.push({ field: 'acceptanceDate', message: '请选择有效的验收日期', severity: 'error' });
  }

  if (!isValidDate(record.formworkDate)) {
    errors.push({ field: 'formworkDate', message: '请选择有效的封模日期', severity: 'error' });
  }

  if (isValidDate(record.acceptanceDate) && isValidDate(record.formworkDate)) {
    if (!isAcceptanceAfterFormwork(record.acceptanceDate, record.formworkDate)) {
      errors.push({
        field: 'acceptanceDate',
        message: '验收日期不能早于封模日期，封模后无法再检查隐蔽工程',
        severity: 'error'
      });
    }
  }

  const axisErrors = validateDuplicateAxis(record, allRecords);
  errors.push(...axisErrors);

  const evidenceErrors = validateEvidence(record.evidence);
  errors.push(...evidenceErrors);

  return errors;
}

export function validateDuplicateAxis(record: AcceptanceRecord, allRecords: AcceptanceRecord[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const duplicate = allRecords.find(
    (r) =>
      r.id !== record.id &&
      r.axis === record.axis &&
      r.location === record.location &&
      r.workType === record.workType &&
      r.status !== 'REJECTED'
  );

  if (duplicate) {
    errors.push({
      field: 'axis',
      message: `该轴线部位「${record.axis} ${record.location}」的「${record.workType}」已存在验收记录`,
      severity: 'warning'
    });
  }

  return errors;
}

export function validateEvidence(evidence: Evidence[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const evidenceTypes = new Set(evidence.map((e) => e.type));

  for (const requiredType of REQUIRED_EVIDENCE_TYPES) {
    if (!evidenceTypes.has(requiredType)) {
      const typeNames: Record<string, string> = {
        ACCEPTANCE_FORM: '验收单扫描件',
        SITE_PHOTO: '现场照片'
      };
      errors.push({
        field: 'evidence',
        message: `缺少关键证据：${typeNames[requiredType]}`,
        severity: 'warning'
      });
    }
  }

  return errors;
}

export function canTransitionStatus(
  fromStatus: string,
  toStatus: string,
  userRole: string
): boolean {
  const rolePermissions: Record<string, string[]> = {
    PROJECT_MANAGER: ['DRAFT->SUBMITTED', 'REJECTED->SUBMITTED', 'PENDING_EVIDENCE->SUBMITTED'],
    SUPERVISOR: [
      'SUBMITTED->PENDING_EVIDENCE',
      'SUBMITTED->REJECTED',
      'SUBMITTED->ARCHIVABLE',
      'PENDING_EVIDENCE->REJECTED',
      'PENDING_EVIDENCE->ARCHIVABLE'
    ],
    DOCUMENT_CONTROLLER: []
  };

  const transition = `${fromStatus}->${toStatus}`;
  return rolePermissions[userRole]?.includes(transition) || false;
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
