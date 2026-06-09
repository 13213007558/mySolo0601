import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';
import { canAccessRoute } from '@/utils/mockData';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, checkAuth, hasPermission } = useAppStore();

  useEffect(() => {
    if (!currentUser) {
      checkAuth();
    }
  }, [currentUser, checkAuth]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      navigate('/403', { replace: true });
      return;
    }

    if (!canAccessRoute(currentUser, location.pathname)) {
      navigate('/403', { replace: true });
    }
  }, [currentUser, location.pathname, navigate, requiredPermission, hasPermission]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-200 font-mono">正在验证身份...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
