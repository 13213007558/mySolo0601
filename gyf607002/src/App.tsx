import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import RecordDetail from '@/pages/RecordDetail';
import Supplement from '@/pages/Supplement';
import ExportPage from '@/pages/Export';
import { PageHeader } from '@/components/PageHeader';

export default function App() {
  return (
    <Router>
      <PageHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/record/:id" element={<RecordDetail />} />
        <Route path="/supplement" element={<Supplement />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
