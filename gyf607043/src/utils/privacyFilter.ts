import type { Role, User, Baby, DisinfectionRecord, AuditLog, ClassInfo } from '@/types';

export type FilterableEntity = User | Baby | DisinfectionRecord | AuditLog | ClassInfo;

const maskName = (name: string): string => {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(Math.max(1, name.length - 1));
};

const maskEmployeeNo = (no: string): string => {
  if (!no) return '';
  if (no.length <= 4) return no;
  return no.slice(0, 2) + '****' + no.slice(-2);
};

export function filterUserByRole(user: User, role: Role): Partial<User> {
  if (role === 'supervisor' || role === 'admin') {
    return { ...user };
  }
  return {
    id: user.id,
    name: maskName(user.name),
    role: user.role,
    employeeNo: maskEmployeeNo(user.employeeNo),
  };
}

export function filterBabyByRole(baby: Baby, role: Role): Partial<Baby> {
  if (role === 'supervisor' || role === 'admin') {
    return { ...baby };
  }
  const filtered: Partial<Baby> = {
    id: baby.id,
    classId: baby.classId,
    name: maskName(baby.name),
    bedNo: baby.bedNo,
    allergies: baby.allergies,
    avatar: baby.avatar,
    admissionDate: baby.admissionDate,
  };
  return filtered;
}

export function filterRecordByRole(
  record: DisinfectionRecord,
  role: Role
): Partial<DisinfectionRecord> {
  if (role === 'supervisor' || role === 'admin') {
    return { ...record };
  }
  const { operatorId, manualCreatedBy, ...rest } = record;
  return {
    ...rest,
    operatorId: maskEmployeeNo(operatorId),
    manualCreatedBy: manualCreatedBy ? maskEmployeeNo(manualCreatedBy) : undefined,
  };
}

export function filterAuditByRole(
  log: AuditLog,
  role: Role
): Partial<AuditLog> {
  if (role === 'supervisor' || role === 'admin') {
    return { ...log };
  }
  return {
    id: log.id,
    recordId: log.recordId,
    action: log.action,
    operatorId: maskEmployeeNo(log.operatorId),
    operatorRole: log.operatorRole,
    timestamp: log.timestamp,
    reason: log.reason,
  };
}

export function sanitizeForLog<T>(data: T, role: Role = 'nurse'): string {
  try {
    const sanitized = JSON.parse(JSON.stringify(data));
    if (sanitized && typeof sanitized === 'object') {
      if ('name' in sanitized && typeof sanitized.name === 'string') {
        sanitized.name = maskName(sanitized.name);
      }
      if ('employeeNo' in sanitized) {
        sanitized.employeeNo = maskEmployeeNo(String(sanitized.employeeNo));
      }
      if ('motherName' in sanitized && typeof sanitized.motherName === 'string') {
        sanitized.motherName = maskName(sanitized.motherName);
      }
    }
    return JSON.stringify(sanitized);
  } catch {
    return '[SANITIZED DATA]';
  }
}

export function applyPrivacyFilter<T extends FilterableEntity>(
  entity: T,
  role: Role
): Partial<T>;
export function applyPrivacyFilter<T extends FilterableEntity>(
  entities: T[],
  role: Role
): Partial<T>[];
export function applyPrivacyFilter(
  input: unknown,
  role: Role
): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => applyPrivacyFilter(item as FilterableEntity, role));
  }
  const entity = input as FilterableEntity;
  if ('employeeNo' in entity && 'role' in entity) {
    return filterUserByRole(entity as User, role);
  }
  if ('bedNo' in entity && 'allergies' in entity) {
    return filterBabyByRole(entity as Baby, role);
  }
  if ('action' in entity && 'operatorRole' in entity) {
    return filterAuditByRole(entity as AuditLog, role);
  }
  if ('itemType' in entity && 'operatedAt' in entity) {
    return filterRecordByRole(entity as DisinfectionRecord, role);
  }
  return entity;
}
