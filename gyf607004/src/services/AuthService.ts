import { db } from '@/db';
import { User, RescheduleRecord } from '@/types';

const CURRENT_USER_KEY = 'current_user_id';
const DEFAULT_USER_ID = 'user-supervisor-1';

export const AuthService = {
  async getCurrentUser(): Promise<User> {
    const storedUserId = localStorage.getItem(CURRENT_USER_KEY);
    const userId = storedUserId || DEFAULT_USER_ID;
    const user = await db.users.get(userId);
    if (user) return user;
    const fallback = await db.users.get(DEFAULT_USER_ID);
    if (fallback) return fallback;
    return {
      id: DEFAULT_USER_ID,
      name: '王主管',
      role: 'supervisor',
    };
  },

  async setCurrentUser(userId: string): Promise<void> {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  },

  canViewRecord(
    user: User,
    record: RescheduleRecord
  ): { allowed: boolean; reason?: string } {
    if (user.role === 'supervisor') {
      return { allowed: true };
    }
    if (user.role === 'viewer') {
      return { allowed: false, reason: '查看员无权查看记录详情' };
    }
    if (user.role === 'nurse') {
      if (user.id === record.handlerId) {
        return { allowed: true };
      }
      const isNightNurse = user.shift?.includes('夜') || user.shift === '夜班';
      const isNightRecord =
        record.targetShift.includes('夜') || record.targetShift === '夜班';
      if (isNightNurse && isNightRecord) {
        return { allowed: true };
      }
      return { allowed: false, reason: '护士仅可查看自己负责或夜班的记录' };
    }
    return { allowed: false, reason: '未知角色，无权查看' };
  },

  canEditRecord(user: User, record: RescheduleRecord): boolean {
    if (user.role === 'supervisor') return true;
    if (user.role === 'nurse' && user.id === record.handlerId) {
      return record.status === 'pending';
    }
    return false;
  },

  canApprove(user: User): boolean {
    return user.role === 'supervisor';
  },

  canImport(user: User): boolean {
    return user.role === 'supervisor' || user.role === 'nurse';
  },

  canExport(user: User): boolean {
    return user.role === 'supervisor' || user.role === 'nurse';
  },

  async logAccessDenied(
    user: User,
    recordId: string,
    babyName: string,
    reason: string
  ): Promise<void> {
    await db.access_denied_logs.add({
      id: `access-denied-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetRecordId: recordId,
      targetBabyName: babyName,
      reason,
      attemptedAt: new Date().toISOString(),
    });
  },
};
