import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import Home from "@/pages/Home";
import ExportPage from "@/pages/ExportPage";
import CorrectionPage from "@/pages/CorrectionPage";

export default function App() {
  return (
    <Router>
      <div className="h-screen w-screen flex overflow-hidden bg-night-900 text-night-100">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/correction" element={<CorrectionPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
