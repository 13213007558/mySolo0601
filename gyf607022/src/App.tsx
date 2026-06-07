import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RecordListPage from "@/pages/RecordListPage";
import RecordDetailPage from "@/pages/RecordDetailPage";
import { useRecordStore } from "@/store/useRecordStore";

function AppRoutes() {
  const init = useRecordStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route path="/" element={<RecordListPage />} />
      <Route path="/record/:id" element={<RecordDetailPage />} />
      <Route path="*" element={<RecordListPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
