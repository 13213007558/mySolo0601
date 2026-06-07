import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import RecordsList from "@/pages/RecordsList";
import RecordDetail from "@/pages/RecordDetail";
import Supplement from "@/pages/Supplement";
import ExportCenter from "@/pages/ExportCenter";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-cream-100">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<RecordsList />} />
            <Route path="/records/:id" element={<RecordDetail />} />
            <Route path="/supplement" element={<Supplement />} />
            <Route path="/export" element={<ExportCenter />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
