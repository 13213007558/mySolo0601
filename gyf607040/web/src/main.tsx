import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ListPage from './pages/ListPage';
import DetailPage from './pages/DetailPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ListPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
