import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import BabyDetail from './pages/BabyDetail';
import ExportManage from './pages/ExportManage';
import AuditLog from './pages/AuditLog';
import ManualAdd from './pages/ManualAdd';
import { useCheckStore } from './store/useCheckStore';

message.config({
  top: 100,
  duration: 2.5,
  maxCount: 3,
  rtl: false,
});

const App: React.FC = () => {
  const { initData } = useCheckStore();

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#E63946',
          colorInfo: '#457B9D',
          colorSuccess: '#2A9D8F',
          colorWarning: '#F4A261',
          colorError: '#E63946',
          borderRadius: 8,
          fontFamily: '"Noto Serif SC", "PingFang SC", "Microsoft YaHei", sans-serif',
          fontSize: 14,
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 40,
          },
          Card: {
            borderRadius: 16,
          },
          Table: {
            borderRadius: 16,
          },
          Tabs: {
            borderRadius: 8,
          },
        },
      }}
    >
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/baby/:babyId" element={<BabyDetail />} />
            <Route path="/export" element={<ExportManage />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/manual-add" element={<ManualAdd />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
