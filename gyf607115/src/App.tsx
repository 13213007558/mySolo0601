import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AlarmList from '@/pages/AlarmList';
import AlarmDetail from '@/pages/AlarmDetail';
import ManualEntry from '@/pages/ManualEntry';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlarmList />} />
        <Route path="/alarm/:id" element={<AlarmDetail />} />
        <Route path="/manual-entry" element={<ManualEntry />} />
        <Route path="*" element={<AlarmList />} />
      </Routes>
    </Router>
  );
}
