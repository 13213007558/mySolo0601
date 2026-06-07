import type { ReactNode } from 'react';
import type { User } from '@/types';
import Sidebar, { type NavKey } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  user: User;
  activeNav: NavKey;
  onNavChange: (key: NavKey) => void;
  onUserSwitch: (user: User) => void;
}

export default function Layout({ children, user, activeNav, onNavChange, onUserSwitch }: LayoutProps) {
  return (
    <div className="flex h-screen bg-warm-white">
      <Sidebar
        activeNav={activeNav}
        onNavChange={onNavChange}
        user={user}
        onUserSwitch={onUserSwitch}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
