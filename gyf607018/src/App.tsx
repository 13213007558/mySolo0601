import React from 'react';
import { AppProvider, useApp } from './store';
import { ListPanel } from './ListPanel';
import { DetailPanel } from './DetailPanel';
import './styles.css';

function AppInner() {
  const { getCurrentUser } = useApp();
  const user = getCurrentUser();
  return (
    <div className="app">
      <div className="app-header">
        <h1>婴幼儿批次追溯追踪台儿保随访版</h1>
        <div className="user">当前用户：{user.name}（{user.role === 'nurse' ? '护士' : '保健老师'}） · 西门接送口</div>
      </div>
      <div className="app-body">
        <ListPanel />
        <DetailPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
