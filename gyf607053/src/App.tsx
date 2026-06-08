import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Onsite from "@/pages/Onsite";
import Kitchen from "@/pages/Kitchen";
import Classes from "@/pages/Classes";
import BabyDetail from "@/pages/BabyDetail";
import Records from "@/pages/Records";
import ExportAudit from "@/pages/ExportAudit";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.currentUser)
  const loc = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  }
  return <>{children}</>
}

function LiveSync() {
  const user = useAppStore((s) => s.currentUser)
  const applySnapshot = useAppStore((s) => s.applySnapshot)

  useEffect(() => {
    if (!user) return
    const cleanup = api.subscribeEvents((type, data) => {
      if (type === 'snapshot' || type === 'update') {
        applySnapshot(data as {
          records?: any[]
          items?: any[]
          babies?: any[]
          unresolved?: any[]
        })
      }
    })
    return cleanup
  }, [user, applySnapshot])

  return null
}

export default function App() {
  return (
    <Router>
      <LiveSync />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/onsite"
            element={
              <RequireAuth>
                <Onsite />
              </RequireAuth>
            }
          />
          <Route
            path="/kitchen"
            element={
              <RequireAuth>
                <Kitchen />
              </RequireAuth>
            }
          />
          <Route
            path="/classes"
            element={
              <RequireAuth>
                <Classes />
              </RequireAuth>
            }
          />
          <Route
            path="/baby/:id"
            element={
              <RequireAuth>
                <BabyDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/records"
            element={
              <RequireAuth>
                <Records />
              </RequireAuth>
            }
          />
          <Route
            path="/export"
            element={
              <RequireAuth>
                <ExportAudit />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
