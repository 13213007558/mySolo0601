import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ListPage from './pages/ListPage.jsx';
import DetailPage from './pages/DetailPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ListPage />} />
      <Route path="/record/:id" element={<DetailPage />} />
    </Routes>
  );
}
