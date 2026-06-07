import type { UserRole, Baby } from '@/types';

const FIELD_ALIASES: Record<string, string> = {
  babyName: 'baby.name',
  babyNameFull: 'baby.name',
  guardian: 'guardianName',
  phone: 'guardianPhone',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  staff: [],
  nurse: ['baby.name', 'guardianName', 'allergies'],
  supervisor: ['baby.name', 'guardianPhone', 'guardianName', 'allergies'],
};

function normalizeField(field: string): string {
  return FIELD_ALIASES[field] ?? field;
}

export const ROLE_NAMES: Record<UserRole, string> = {
  staff: '门店同事',
  nurse: '护士',
  supervisor: '主管',
};

export function maskName(name: string): string {
  if (!name) return '';
  if (name.length <= 1) return '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

export function maskPhone(phone: string): string {
  if (!phone) return '';
  if (phone.length < 7) return '*'.repeat(phone.length);
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function canViewField(role: UserRole, field: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(normalizeField(field)) ?? false;
}

export interface MaskOptions {
  role: UserRole;
  field: string;
  value: string;
}

export function maskByRole({ role, field, value }: MaskOptions): string {
  if (!value) return '';
  const normalizedField = normalizeField(field);
  if (canViewField(role, field)) return value;

  if (normalizedField === 'baby.name' || normalizedField === 'guardianName') {
    return maskName(value);
  }
  if (normalizedField === 'guardianPhone') {
    if (role === 'nurse') {
      return maskPhone(value);
    }
    return '*'.repeat(value.length);
  }
  if (normalizedField === 'allergies') {
    return '***';
  }
  return '*'.repeat(value.length);
}

export function maskBaby(baby: Baby, role: UserRole): Baby {
  return {
    ...baby,
    name: maskByRole({ role, field: 'baby.name', value: baby.name }),
    guardianPhone: baby.guardianPhone
      ? maskByRole({ role, field: 'guardianPhone', value: baby.guardianPhone })
      : undefined,
    guardianName: baby.guardianName
      ? maskByRole({ role, field: 'guardianName', value: baby.guardianName })
      : undefined,
  };
}

export function getFieldPermissionHint(field: string): string {
  const normalized = normalizeField(field);
  const roles = (Object.keys(ROLE_PERMISSIONS) as UserRole[])
    .filter((r) => ROLE_PERMISSIONS[r].includes(normalized))
    .map((r) => ROLE_NAMES[r]);
  return roles.length > 0 ? `可见角色：${roles.join('、')}` : '无权限查看';
}
