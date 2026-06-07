import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RecordList from "@/pages/RecordList";
import RecordDetail from "@/pages/RecordDetail";
import RecordCreate from "@/pages/RecordCreate";
import ImportPage from "@/pages/ImportPage";
import ApprovalPage from "@/pages/ApprovalPage";
import ExportPage from "@/pages/ExportPage";
import AccessDeniedPage from "@/pages/AccessDeniedPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/records" replace />} />
        <Route path="/records" element={<RecordList />} />
        <Route path="/records/new" element={<RecordCreate />} />
        <Route path="/records/:id" element={<RecordDetail />} />
        <Route path="/records/import" element={<ImportPage />} />
        <Route path="/approvals" element={<ApprovalPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route path="*" element={<Navigate to="/records" replace />} />
      </Routes>
    </Router>
  );
}
