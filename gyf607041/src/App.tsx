import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Home';
import BabyDetailPage from '@/pages/BabyDetail';
import AuditPage from '@/pages/Audit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/baby/:id" element={<BabyDetailPage />} />
        <Route path="/audit" element={<AuditPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
