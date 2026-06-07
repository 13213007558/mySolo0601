import type { UserRole, Baby, User } from '../../src/types/index.js';

function maskLastName(fullName: string): string {
  if (!fullName) return '';
  if (fullName.length <= 1) return fullName;
  return fullName.charAt(0) + '*'.repeat(fullName.length - 1);
}

function maskPhoneMiddle(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function desensitizeBaby(baby: Baby, role: UserRole): Baby {
  if (!baby) return baby;
  const result: Baby = { ...baby };

  switch (role) {
    case 'supervisor':
      return result;
    case 'nurse':
      if (result.guardianPhone) {
        result.guardianPhone = maskPhoneMiddle(result.guardianPhone);
      }
      return result;
    case 'staff':
    default:
      result.name = maskLastName(result.name);
      if (result.guardianPhone) {
        result.guardianPhone = '*'.repeat(11);
      }
      if (result.guardianName) {
        result.guardianName = maskLastName(result.guardianName);
      }
      result.allergies = '***';
      return result;
  }
}

export function desensitizeUser(user: User, role: UserRole): User {
  if (!user) return user;
  const result: User = { ...user };

  if (role !== 'supervisor' && role !== 'nurse') {
    delete result.phone;
  }
  return result;
}

export function desensitizeBabyList(babies: Baby[], role: UserRole): Baby[] {
  return babies.map((b) => desensitizeBaby(b, role));
}

export function desensitizeUserList(users: User[], role: UserRole): User[] {
  return users.map((u) => desensitizeUser(u, role));
}

export function desensitizeObject(
  data: unknown,
  role: UserRole,
): unknown {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => desensitizeObject(item, role));
  }

  if (typeof data !== 'object') return data;

  const obj = data as Record<string, unknown>;

  if ('birthday' in obj && 'guardianPhone' in obj && 'name' in obj) {
    return desensitizeBaby(obj as unknown as Baby, role);
  }

  if ('role' in obj && 'phone' in obj && 'name' in obj) {
    return desensitizeUser(obj as unknown as User, role);
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    result[key] = desensitizeObject(obj[key], role);
  }
  return result;
}
