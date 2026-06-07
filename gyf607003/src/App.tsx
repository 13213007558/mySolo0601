import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import Classes from './pages/Classes';
import BabyDetail from './pages/BabyDetail';
import Audit from './pages/Audit';
import ExportPage from './pages/Export';
import { appStore } from './store/app';

export default function App() {
  const refreshAll = appStore((s) => s.refreshAll);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="classes" element={<Classes />} />
          <Route path="baby/:id" element={<BabyDetail />} />
          <Route path="audit" element={<Audit />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
