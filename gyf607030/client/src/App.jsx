import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ListPage from './pages/ListPage.jsx';
import DetailPage from './pages/DetailPage.jsx';

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>婴幼儿奶量交接对账台</h1>
        <p>试听顾问版 — 家长群留言 × 纸质交接单 · 对账复核系统</p>
      </header>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/record/:id" element={<DetailPage />} />
      </Routes>
    </div>
  );
}
