import React, { useEffect, useState } from 'react';
import { api, getToken } from './api';
import LoginPage from './pages/LoginPage.jsx';
import ObsList from './pages/ObsList.jsx';
import ObsDetail from './pages/ObsDetail.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const me = await api.me();
          setUser(me);
        } catch {
          api.logout();
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;

  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />;

  return (
    <div>
      <div className="app-header">
        <h1>🌙 婴幼儿睡眠观察复核墙 · 家庭协作版</h1>
        <div className="user-info">
          <span>{user.displayName}</span>
          <span className="role-tag">{user.roleLabel}</span>
          <button onClick={() => { api.logout(); setUser(null); setSelectedId(null); }}>退出登录</button>
        </div>
      </div>
      <div className="container">
        {selectedId ? (
          <ObsDetail
          id={selectedId}
          user={user}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <ObsList user={user} onSelect={(id) => setSelectedId(id)} />
      )}
      </div>
    </div>
  );
}
