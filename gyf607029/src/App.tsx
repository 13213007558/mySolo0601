import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthListPage } from "@/pages/AuthListPage";
import { AuthDetailPage } from "@/pages/AuthDetailPage";
import { ExportCenterPage } from "@/pages/ExportCenterPage";
import { CorrectionPage } from "@/pages/CorrectionPage";
import { AuditPage } from "@/pages/AuditPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/list" replace />} />
          <Route path="list" element={<AuthListPage />} />
          <Route path="detail/:id" element={<AuthDetailPage />} />
          <Route path="export" element={<ExportCenterPage />} />
          <Route path="correction" element={<CorrectionPage />} />
          <Route path="audit" element={<AuditPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
