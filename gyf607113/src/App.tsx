import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import CylinderDetail from "@/pages/CylinderDetail";
import Supplement from "@/pages/Supplement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cylinder/:id" element={<CylinderDetail />} />
          <Route path="/supplement" element={<Supplement />} />
        </Route>
      </Routes>
    </Router>
  );
}
