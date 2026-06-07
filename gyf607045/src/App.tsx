import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, ROLE_LABEL } from './types';
import { getCurrentUser, logout } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RecordDetail from './pages/RecordDetail';

function App() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setUser(getCurrentUser());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleAuthChange = (u: User | null) => {
    setUser(u);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  if (!user) {
    return <Login onLogin={handleAuthChange} />;
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-title">
          婴幼儿费用核销清洗链
          <span className="tag">月子护理版</span>
        </div>
        <div className="user-area">
          <div className="user-info">
            <div className="avatar">{user.name.slice(0, 1)}</div>
            <div>
              <div className="user-name">
                {user.name}{' '}
                <span className={`badge badge-${user.role}`}>{ROLE_LABEL[user.role]}</span>
              </div>
              <div className="user-role">
                {user.role === 'supervisor' ? '可见完整审计链路' : '仅见必要业务信息'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/record/:id" element={<RecordDetail user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
