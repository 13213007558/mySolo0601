import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Lock, User, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser, isLoading, error, checkAuth } = useAppStore();
  const [employeeId, setEmployeeId] = useState('');
  const [showHint, setShowHint] = useState(false);

  const from = (location.state as any)?.from || '/';

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) return;

    const success = await login(employeeId.trim().toUpperCase());
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const testAccounts = [
    { id: 'OP001', name: '张值班', role: '值班人员' },
    { id: 'EN001', name: '李运维', role: '运维工程师' },
    { id: 'AD001', name: '王管理', role: '管理员' },
    { id: 'YE001', name: '叶师傅', role: '启停补录' },
  ];

  return (
    <div className="min-h-screen bg-dark-700 grid-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-danger-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 industrial-border mb-4">
            <Bell className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-mono text-3xl font-bold text-white mb-2 glow-text">
            能源空调主机告警墙
          </h1>
          <p className="text-dark-300">东郊煤改电片区值班管理系统</p>
        </div>

        <div className="card-glow industrial-border">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-dark-500">
            <Lock className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">身份验证</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                工号
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="请输入您的工号"
                  className="input-field pl-10 font-mono"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-danger-500/20 border-2 border-danger-500 text-danger-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !employeeId.trim()}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  验证中...
                </span>
              ) : (
                '登录系统'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-dark-500">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-dark-300 hover:text-primary-400 transition-colors"
            >
              {showHint ? '隐藏测试账号' : '查看测试账号'}
            </button>

            {showHint && (
              <div className="mt-3 space-y-2 animate-fade-in">
                <p className="text-xs text-dark-400 mb-2">测试工号（点击快速填入）：</p>
                {testAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setEmployeeId(account.id)}
                    className="w-full flex items-center justify-between p-2 bg-dark-700 border border-dark-500 hover:border-primary-500 transition-colors text-left"
                  >
                    <span className="font-mono text-sm text-white">{account.id}</span>
                    <span className="text-xs text-dark-300">
                      {account.name} / {account.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-dark-400 mt-6">
          © 2026 东郊煤改电片区管理中心 | 安全加密传输
        </p>
      </div>
    </div>
  );
}
