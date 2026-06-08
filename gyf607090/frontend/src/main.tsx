import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import RecordList from './pages/RecordList';
import RecordDetail from './pages/RecordDetail';
import AppLayout from './components/Layout';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RecordList />} />
            <Route path="/records/:id" element={<RecordDetail />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
);
