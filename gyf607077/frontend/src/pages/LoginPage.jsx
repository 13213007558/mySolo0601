import React, { useState } from 'react';
import { api } from '../api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.login(username, password);
      localStorage.setItem('token', r.token);
      onLogin(r.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <h2>🌙 婴幼儿睡眠观察复核墙</h2>
      <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: -8 }}>家庭协作版</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-item">
          <label>用户名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="supervisor / parent / elder / nanny" />
        </div>
        <div className="form-item">
          <label>密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="默认 123456" />
        </div>
        <button type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
      </form>
      <div className="hint">
        <b>演示账号(密码均为 123456):</b><br />
        · supervisor - 客服主管(全权限,可查看审计)<br />
        · parent - 父母(可录入/提交/查看详情/导出)<br />
        · elder - 老人(仅查看摘要)<br />
        · nanny - 育儿嫂(可录入/提交/查看详情)
      </div>
    </div>
  );
}
