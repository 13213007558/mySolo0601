import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Workbench from "@/pages/Workbench";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Workbench />} />
        <Route path="/workbench" element={<Workbench />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
