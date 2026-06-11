import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/DashboardPage';
import InspectionPage from '@/pages/InspectionPage';
import BatchListPage from '@/pages/BatchListPage';
import BatchSummaryPage from '@/pages/BatchSummaryPage';
import HistoryComparePage from '@/pages/HistoryComparePage';
import ApprovalListPage from '@/pages/ApprovalListPage';
import ApprovalDetailPage from '@/pages/ApprovalDetailPage';
import ReportExportPage from '@/pages/ReportExportPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          element={<Layout />}
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inspection" element={<InspectionPage />} />
          <Route path="/inspection/:batchId" element={<InspectionPage />} />
          <Route path="/batches" element={<BatchListPage />} />
          <Route path="/batches/:batchId/summary" element={<BatchSummaryPage />} />
          <Route path="/history" element={<HistoryComparePage />} />
          <Route path="/approvals" element={<ApprovalListPage />} />
          <Route path="/approvals/:returnId" element={<ApprovalDetailPage />} />
          <Route path="/reports" element={<ReportExportPage />} />
          <Route path="/reports/:batchId" element={<ReportExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
