import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { RecordListPage } from "@/pages/RecordListPage";
import { RecordFormPage } from "@/pages/RecordFormPage";
import { RecordDetailPage } from "@/pages/RecordDetailPage";
import { AuditPage } from "@/pages/AuditPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RecordListPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/records/new" element={<RecordFormPage />} />
          <Route path="/records/:id" element={<RecordDetailPage />} />
          <Route path="/records/:id/edit" element={<RecordFormPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
