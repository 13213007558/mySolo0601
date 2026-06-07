import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Workbench from "@/pages/Workbench";
import AuditCenter from "@/pages/AuditCenter";
import Supplement from "@/pages/Supplement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Workbench />} />
        <Route path="/audit" element={<AuditCenter />} />
        <Route path="/supplement" element={<Supplement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
