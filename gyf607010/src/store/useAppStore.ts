import { create } from 'zustand';
import type { User, UserRole } from '@shared/types';

interface AppState {
  currentUser: User;
  setRole: (role: UserRole) => void;
}

const users: Record<UserRole, User> = {
  nurse: { id: 'user-nurse', name: '张护士', role: 'nurse' },
  supervisor: { id: 'user-supervisor', name: '李主管', role: 'supervisor' },
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: users.nurse,
  setRole: (role) => set({ currentUser: users[role] }),
}));
