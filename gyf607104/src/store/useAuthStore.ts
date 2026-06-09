import { create } from 'zustand';
import type { UserRole } from '@/types';
import { ROLE_CONFIGS } from '@/config/roles';
import { getCurrentRoleFromStorage, setCurrentRoleToStorage, clearAllRoleStorage } from '@/utils/storage';

interface AuthState {
  currentRole: UserRole;
  userName: string;
  setRole: (role: UserRole) => void;
  canViewSensitiveData: () => boolean;
  canExport: () => boolean;
  canSupplement: () => boolean;
  canPerformOperation: (operation: string) => boolean;
  getRoleConfig: () => typeof ROLE_CONFIGS[UserRole];
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedRole = getCurrentRoleFromStorage() || 'admin';
  
  return {
    currentRole: savedRole,
    userName: ROLE_CONFIGS[savedRole].roleName,
    
    setRole: (role: UserRole) => {
      clearAllRoleStorage(get().currentRole);
      setCurrentRoleToStorage(role);
      set({
        currentRole: role,
        userName: ROLE_CONFIGS[role].roleName,
      });
    },
    
    canViewSensitiveData: () => {
      const { currentRole } = get();
      return ROLE_CONFIGS[currentRole].canViewSensitiveData;
    },
    
    canExport: () => {
      const { currentRole } = get();
      return ROLE_CONFIGS[currentRole].canExport;
    },
    
    canSupplement: () => {
      const { currentRole } = get();
      return ROLE_CONFIGS[currentRole].canSupplement;
    },
    
    canPerformOperation: (operation: string) => {
      const { currentRole } = get();
      return ROLE_CONFIGS[currentRole].allowedOperations.includes(operation);
    },
    
    getRoleConfig: () => {
      const { currentRole } = get();
      return ROLE_CONFIGS[currentRole];
    },
  };
});
