import { createContext } from '@lit-labs/context';
import type { Context } from '@lit-labs/context';
import type { User } from '../types/index';
import { users as mockUsers } from '../utils/mock-data';

export interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isUserLocked: boolean;
  lockUser: (userId: string) => void;
  unlockUser: (userId: string) => void;
  hasRole: (role: User['role'] | User['role'][]) => boolean;
}

const technicianUser = mockUsers.find(u => u.role === 'technician');

const mapUser = (user: typeof mockUsers[0] | undefined): User | null => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role as User['role'],
    phone: '',
    isLocked: false,
    lastLogin: new Date(),
  };
};

export const authContext = createContext<AuthContextType, symbol>(
  Symbol('auth-context')
);

export type AuthContext = Context<symbol, AuthContextType>;

export const authContextDefaultValue: AuthContextType = {
  currentUser: mapUser(technicianUser),
  login: async () => false,
  logout: () => {},
  isUserLocked: false,
  lockUser: () => {},
  unlockUser: () => {},
  hasRole: () => false,
};

export type AuthContextProvider = (value: AuthContextType) => void;
