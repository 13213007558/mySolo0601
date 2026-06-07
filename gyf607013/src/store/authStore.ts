import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      login: (user, token) => set({ currentUser: user, token }),
      logout: () => set({ currentUser: null, token: null }),
      switchRole: (role) =>
        set((state) => ({
          currentUser: state.currentUser ? { ...state.currentUser, role } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ currentUser: state.currentUser, token: state.token }),
    }
  )
);
