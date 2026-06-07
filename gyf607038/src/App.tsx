import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import RecordDetail from '@/pages/RecordDetail';
import Audit from '@/pages/Audit';
import { useAppStore } from '@/store/useAppStore';

function AppRoutes() {
  const init = useAppStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/record/:id" element={<RecordDetail />} />
        <Route path="/audit" element={<Audit />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
