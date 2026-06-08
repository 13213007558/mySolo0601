import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import BabyDetail from '@/pages/BabyDetail';
import AuditLog from '@/pages/AuditLog';
import DataStatus from '@/pages/DataStatus';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/baby/:id" element={<BabyDetail />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/data-status" element={<DataStatus />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
