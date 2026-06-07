import { Routes, Route } from 'react-router-dom';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';

export default function App() {
  return (
    <div className="min-h-full">
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/record/:id" element={<DetailPage />} />
      </Routes>
    </div>
  );
}
