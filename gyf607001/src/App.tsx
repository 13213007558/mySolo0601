import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ImportDashboard from '@/pages/ImportDashboard';
import ReviewWall from '@/pages/ReviewWall';
import BabyDetail from '@/pages/BabyDetail';
import AuditView from '@/pages/AuditView';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<ImportDashboard />} />
          <Route path="/review" element={<ReviewWall />} />
          <Route path="/review/:id" element={<BabyDetail />} />
          <Route path="/audit" element={<AuditView />} />
        </Routes>
      </div>
    </Router>
  );
}
