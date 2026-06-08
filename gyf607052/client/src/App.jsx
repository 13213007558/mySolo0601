import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import RecordList from './pages/RecordList.jsx';
import RecordDetail from './pages/RecordDetail.jsx';
import ExportView from './pages/ExportView.jsx';
import socket from './socket.js';

export default function App() {
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>婴幼儿辅食禁忌交接本</h1>
        <div className="subtitle">
          餐厅现场版
          {connected && (
            <span className="live-indicator" style={{ marginLeft: 10 }}>
              <span className="live-dot"></span>
              实时同步中
            </span>
          )}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<RecordList />} />
        <Route path="/record/:id" element={<RecordDetail />} />
        <Route path="/export" element={<ExportView />} />
      </Routes>
    </div>
  );
}
