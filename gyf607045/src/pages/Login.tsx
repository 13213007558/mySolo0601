import { User, ROLE_LABEL } from '../types';
import { login, getUsers } from '../store';
import { useNavigate } from 'react-router-dom';

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const navigate = useNavigate();
  const users = getUsers();

  const handleLogin = (userId: string) => {
    const user = login(userId);
    if (user) {
      onLogin(user);
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>婴幼儿费用核销清洗链</h1>
        <p className="subtitle">月子护理版 — 请选择身份登录</p>
        <div className="role-list">
          {users.map((u) => (
            <button
              key={u.id}
              className="role-btn"
              onClick={() => handleLogin(u.id)}
            >
              <div className="role-icon">
                {u.role === 'supervisor' ? '🛡' : '👩‍⚕️'}
              </div>
              <div className="role-info">
                <div className="role-title">{u.name}</div>
                <div className="role-desc">
                  {ROLE_LABEL[u.role]}
                  {u.role === 'supervisor'
                    ? ' · 可查看审计日志、人工改判'
                    : ' · 仅查看必要业务内容'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
