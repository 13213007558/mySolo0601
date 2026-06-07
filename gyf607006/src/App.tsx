import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Overview from '@/pages/Overview';
import BabyDetail from '@/pages/BabyDetail';
import Toast from '@/components/Toast';

export default function App() {
  return (
    <Router>
      <Toast />
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/baby/:id" element={<BabyDetail />} />
      </Routes>
    </Router>
  );
}
