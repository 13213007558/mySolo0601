import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import RecordDetail from '@/pages/RecordDetail';
import RecordEdit from '@/pages/RecordEdit';
import ExportCenter from '@/pages/ExportCenter';
import Supplement from '@/pages/Supplement';
import AuditPage from '@/pages/AuditPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/record/:id" element={<RecordDetail />} />
          <Route path="/record/:id/edit" element={<RecordEdit />} />
          <Route path="/export" element={<ExportCenter />} />
          <Route path="/supplement" element={<Supplement />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
