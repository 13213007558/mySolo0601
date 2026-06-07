import { Routes, Route, Navigate } from 'react-router-dom';
import RecordsListPage from './pages/RecordsListPage';
import RecordDetailPage from './pages/RecordDetailPage';
import AppLayout from './components/AppLayout';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/records" replace />} />
        <Route path="/records" element={<RecordsListPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
      </Route>
    </Routes>
  );
}

export default App;
