import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import ListPage from '@/pages/ListPage';
import EntryPage from '@/pages/EntryPage';
import DetailPage from '@/pages/DetailPage';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/entry" element={<EntryPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
