import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RecordDetail } from './pages/RecordDetail';
import { NewRecord } from './pages/NewRecord';
import { useRecordStore } from './store/useRecordStore';

function AppShell() {
  const init = useRecordStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/record/:id" element={<RecordDetail />} />
        <Route path="/new" element={<NewRecord />} />
        <Route
          path="*"
          element={
            <div className="py-20 text-center text-ink-500">
              <p className="font-serif text-lg text-ink-700">页面不存在</p>
              <a href="/" className="text-amber-600 hover:text-amber-700 text-sm mt-2 inline-block">
                返回追踪台
              </a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
