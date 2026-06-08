import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RoleSelect from '@/pages/RoleSelect';
import Dashboard from '@/pages/Dashboard';
import ProcessPage from '@/pages/ProcessPage';
import SupplementPage from '@/pages/SupplementPage';
import AuditCenter from '@/pages/AuditCenter';
import ImportPage from '@/pages/ImportPage';
import TopNav from '@/components/TopNav';
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';

function RequireRole({ children }: { children: React.ReactNode }) {
  const currentRole = useAppStore((s) => s.currentRole);
  const location = useLocation();

  if (!currentRole) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { currentRole } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {currentRole && <TopNav />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<RoleSelect />} />
          <Route
            path="/dashboard"
            element={
              <RequireRole>
                <Dashboard />
              </RequireRole>
            }
          />
          <Route
            path="/process/:recordId"
            element={
              <RequireRole>
                <ProcessPage />
              </RequireRole>
            }
          />
          <Route
            path="/supplement"
            element={
              <RequireRole>
                <SupplementPage />
              </RequireRole>
            }
          />
          <Route
            path="/audit"
            element={
              <RequireRole>
                <AuditCenter />
              </RequireRole>
            }
          />
          <Route
            path="/import"
            element={
              <RequireRole>
                <ImportPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {currentRole && (
          <footer className="py-4 text-center text-xs text-gray-400">
          🍼 婴幼儿费用核销提醒墙 · 家庭协作版
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
