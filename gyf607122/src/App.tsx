import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Forbidden from "@/pages/Forbidden";
import AlarmList from "@/pages/AlarmList";
import HostDetail from "@/pages/HostDetail";
import DataImport from "@/pages/DataImport";
import SupplementRecord from "@/pages/SupplementRecord";

export default function App() {
  const { currentUser } = useAppStore();

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route path="/forbidden" element={<Forbidden />} />
        
        <Route path="/" element={<ProtectedRoute requiredPermission="alarm:view"><Layout><Outlet /></Layout></ProtectedRoute>}>
          <Route index element={<Navigate to="/alarms" replace />} />
          <Route path="alarms" element={<AlarmList />} />
          <Route path="host/:hostId" element={<HostDetail />} />
          <Route 
            path="import" 
            element={<ProtectedRoute requiredPermission="data:import"><DataImport /></ProtectedRoute>} 
          />
          <Route 
            path="supplement" 
            element={<ProtectedRoute requiredPermission="supplement:create"><SupplementRecord /></ProtectedRoute>} 
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
