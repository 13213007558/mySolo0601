import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/mock/initialData';

interface UserState {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  switchUser: (userId: string) => void;
  canWithdraw: () => boolean;
  canReview: () => boolean;
  canExportRaw: () => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  setCurrentUser: (user) => set({ currentUser: user }),
  switchUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },
  canWithdraw: () => get().currentUser?.role === 'supervisor',
  canReview: () => get().currentUser?.role === 'supervisor',
  canExportRaw: () => get().currentUser?.canExportRaw ?? false,
}));
