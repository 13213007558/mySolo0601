import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Classes from '@/pages/Classes';
import BabyDetail from '@/pages/BabyDetail';
import AuditPanel from '@/pages/AuditPanel';
import ExportCenter from '@/pages/ExportCenter';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/baby/:id" element={<BabyDetail />} />
          <Route path="/audit" element={<AuditPanel />} />
          <Route path="/export" element={<ExportCenter />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
