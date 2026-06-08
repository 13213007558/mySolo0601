import { create } from 'zustand';
import {
  User,
  UserRole,
  Baby,
  TemperatureRecord,
  LeaveRecord,
  AuditLog,
  SupplementRecord,
  ExportTableRow,
} from '@/types';
import {
  mockUsers,
  mockBabies,
  mockTemperatureRecords,
  mockLeaveRecords,
  mockAuditLogs,
  mockSupplementRecords,
  mockExportTableData,
} from '@/data/mockData';

interface AppState {
  currentUser: User | null;
  users: User[];
  babies: Baby[];
  temperatureRecords: TemperatureRecord[];
  leaveRecords: LeaveRecord[];
  supplementRecords: SupplementRecord[];
  auditLogs: AuditLog[];
  exportTableData: ExportTableRow[];
  selectedBabyId: string | null;
  selectedDate: string;
  selectedClass: string;

  login: (role: UserRole) => void;
  logout: () => void;
  selectBaby: (id: string | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedClass: (className: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id'>) => void;
  addSupplementRecord: (record: Omit<SupplementRecord, 'id'>) => void;
  getBabiesByFamily: (userId: string) => Baby[];
  getTemperatureByBaby: (babyId: string) => TemperatureRecord[];
  getLeaveByBaby: (babyId: string) => LeaveRecord | undefined;
  canViewDetail: (babyId: string) => boolean;
  canViewFullDetail: (babyId: string) => boolean;
  canViewPhoto: (babyId: string) => boolean;
  canSupplement: () => boolean;
  canViewAudit: () => boolean;
  canManageData: () => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: mockUsers,
  babies: mockBabies,
  temperatureRecords: mockTemperatureRecords,
  leaveRecords: mockLeaveRecords,
  supplementRecords: mockSupplementRecords,
  auditLogs: mockAuditLogs,
  exportTableData: mockExportTableData,
  selectedBabyId: null,
  selectedDate: '2026-06-08',
  selectedClass: 'all',

  login: (role: UserRole) => {
    const users = get().users;
    const user = users.find((u) => u.role === role) || null;
    set({ currentUser: user });
    if (user) {
      get().addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'view_detail',
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        result: 'success',
        detail: `用户 ${user.name} 登录系统`,
      });
    }
  },

  logout: () => set({ currentUser: null, selectedBabyId: null }),

  selectBaby: (id: string | null) => set({ selectedBabyId: id }),

  setSelectedDate: (date: string) => set({ selectedDate: date }),

  setSelectedClass: (className: string) => set({ selectedClass: className }),

  addAuditLog: (log) => {
    const newLog: AuditLog = {
      ...log,
      id: `a${Date.now()}`,
    };
    set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  addSupplementRecord: (record) => {
    const newRecord: SupplementRecord = {
      ...record,
      id: `s${Date.now()}`,
    };
    set((state) => ({ supplementRecords: [...state.supplementRecords, newRecord] }));

    const baby = get().babies.find((b) => b.id === record.babyId);
    if (baby) {
      const updatedBabies = get().babies.map((b) =>
        b.id === record.babyId
          ? {
              ...b,
              supplementRecords: [...(b.supplementRecords || []), newRecord],
            }
          : b
      );
      set({ babies: updatedBabies });
    }
  },

  getBabiesByFamily: (userId: string) => {
    const user = get().users.find((u) => u.id === userId);
    if (!user?.familyBabyIds) return [];
    return get().babies.filter((b) => user.familyBabyIds?.includes(b.id));
  },

  getTemperatureByBaby: (babyId: string) =>
    get().temperatureRecords.filter((t) => t.babyId === babyId),

  getLeaveByBaby: (babyId: string) =>
    get().leaveRecords.find((l) => l.babyId === babyId),

  canViewDetail: (babyId: string) => {
    const user = get().currentUser;
    if (!user) return false;
    if (user.role === 'manager' || user.role === 'supervisor') return true;
    if (user.role === 'elder' || user.role === 'parent') {
      return user.familyBabyIds?.includes(babyId) || false;
    }
    return false;
  },

  canViewFullDetail: (babyId: string) => {
    const user = get().currentUser;
    if (!user) return false;
    if (user.role === 'parent' || user.role === 'manager' || user.role === 'supervisor') {
      if (user.role === 'parent') {
        return user.familyBabyIds?.includes(babyId) || false;
      }
      return true;
    }
    return false;
  },

  canViewPhoto: (babyId: string) => {
    const user = get().currentUser;
    if (!user) return false;
    if (user.role === 'manager' || user.role === 'supervisor') return true;
    if (user.role === 'parent') {
      return user.familyBabyIds?.includes(babyId) || false;
    }
    return false;
  },

  canSupplement: () => {
    const user = get().currentUser;
    return user?.role === 'manager' || user?.role === 'supervisor';
  },

  canViewAudit: () => {
    const user = get().currentUser;
    return user?.role === 'manager' || user?.role === 'supervisor';
  },

  canManageData: () => {
    const user = get().currentUser;
    return user?.role === 'supervisor';
  },
}));
