import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Home from '@/pages/Home';
import ClassDetail from '@/pages/ClassDetail';
import BabyDetail from '@/pages/BabyDetail';
import ReviewWall from '@/pages/ReviewWall';
import Export from '@/pages/Export';
import AuditLog from '@/pages/AuditLog';

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/class/:classId" element={<ClassDetail />} />
          <Route path="/baby/:babyId" element={<BabyDetail />} />
          <Route path="/review-wall" element={<ReviewWall />} />
          <Route path="/export" element={<Export />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route
            path="*"
            element={
              <div className="text-center py-20">
                <p className="font-display text-xl font-semibold text-slate-800">
                  页面不存在
                </p>
              </div>
            }
          />
        </Routes>
      </AppLayout>
    </Router>
  );
}
