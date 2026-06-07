import React from 'react';

export default function Header({ users, currentUser, setCurrentUser, tab, setTab, onBack }) {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1>🌙 婴幼儿睡眠观察提醒墙 <span style={{ fontSize: 13, opacity: 0.8 }}>儿保随访版</span></h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <nav className="tabs" style={{ border: 'none', margin: 0 }}>
          {onBack && (
            <button className="tab" onClick={onBack} style={{ padding: '8px 16px' }}>← 返回列表</button>
          )}
          <div className={`tab ${tab === 'records' ? 'active' : ''}`} style={{ color: tab === 'records' ? 'white' : 'rgba(255,255,255,0.75)' }} onClick={() => setTab('records')}>观察记录</div>
          <div className={`tab ${tab === 'children' ? 'active' : ''}`} style={{ color: tab === 'children' ? 'white' : 'rgba(255,255,255,0.75)' }} onClick={() => setTab('children')}>儿童档案</div>
          <div className={`tab ${tab === 'export' ? 'active' : ''}`} style={{ color: tab === 'export' ? 'white' : 'rgba(255,255,255,0.75)' }} onClick={() => setTab('export')}>导出 / 审计</div>
        </nav>
        <div className="user-bar">
          <span>当前操作人：</span>
          <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)}>
            {users.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}
