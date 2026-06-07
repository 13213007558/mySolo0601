import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RecordsPage from './pages/RecordsPage';
import BabyDetailPage from './pages/BabyDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/records" replace />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/baby/:id" element={<BabyDetailPage />} />
        <Route path="*" element={<Navigate to="/records" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
