import React, { useState, useEffect } from 'react';
import { setContext, getContext } from './api.js';
import ReminderWall from './pages/ReminderWall.jsx';
import BabyDetail from './pages/BabyDetail.jsx';
import ClassPage from './pages/ClassPage.jsx';
import Toast from './components/Toast.jsx';
import { UserRole } from '../shared/types.js';

type Page =
  | { name: 'wall' }
  | { name: 'class'; className: string }
  | { name: 'baby'; babyId: string };

const USERS = [
  { id: 'u_consultant_1', name: '李老师', role: 'consultant' as UserRole, label: '课程顾问·李老师' },
  { id: 'u_consultant_2', name: '王老师', role: 'consultant' as UserRole, label: '课程顾问·王老师' },
  { id: 'u_store_1', name: '张店员', role: 'store_staff' as UserRole, label: '门店同事·张店员' },
  { id: 'u_supervisor_1', name: '赵主管', role: 'supervisor' as UserRole, label: '主管·赵主管' },
  { id: 'u_admin_1', name: '系统管理员', role: 'admin' as UserRole, label: '管理员' }
];

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'wall' });
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warn'; msg: string } | null>(null);

  useEffect(() => {
    setContext(currentUser.role, currentUser.id, currentUser.name);
  }, [currentUser]);

  function showToast(type: 'success' | 'error' | 'warn', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function renderPage() {
    switch (page.name) {
      case 'wall':
        return <ReminderWall onNavigate={setPage} showToast={showToast} />;
      case 'class':
        return <ClassPage className={page.className} onNavigate={setPage} showToast={showToast} />;
      case 'baby':
        return <BabyDetail babyId={page.babyId} onNavigate={setPage} showToast={showToast} />;
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>婴幼儿用品消毒提醒墙</h1>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            试听顾问版 <span className="badge" style={{ marginLeft: 8 }}>DEMO</span>
          </div>
        </div>
        <div className="user-info">
          <span>当前身份：</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = USERS.find(x => x.id === e.target.value)!;
              setCurrentUser(u);
            }}
          >
            {USERS.map(u => (
              <option key={u.id} value={u.id}>{u.label}</option>
            ))}
          </select>
        </div>
      </header>

      {renderPage()}

      {toast && <Toast type={toast.type} message={toast.msg} />}
    </div>
  );
}
