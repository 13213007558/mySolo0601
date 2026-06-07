import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import SubmitPage from '@/pages/SubmitPage';
import HandoverList from '@/pages/HandoverList';
import HandoverDetail from '@/pages/HandoverDetail';
import FreezerPage from '@/pages/FreezerPage';
import ExportPage from '@/pages/ExportPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/submit" replace />} />
          <Route path="submit" element={<SubmitPage />} />
          <Route path="handover" element={<HandoverList />} />
          <Route path="handover/:id" element={<HandoverDetail />} />
          <Route path="freezer" element={<FreezerPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="*" element={<Navigate to="/submit" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
