import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Shield,
  Sparkles,
  UserRound,
  Stethoscope,
  ShieldCheck,
  LogIn,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import RoleSwitcher from '@/components/RoleSwitcher';
import type { User, UserRole } from '@/types';
import { getRoleLabel } from '@/utils/format';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';

interface LoginApiResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  error?: string;
}

const QUICK_LOGINS: Array<{
  role: UserRole;
  name: string;
  username: string;
  description: string;
  Icon: React.ElementType;
  color: string;
}> = [
  {
    role: 'staff',
    name: '门店同事',
    username: '张同事',
    description: '日常消毒操作与记录',
    Icon: UserRound,
    color: 'from-medical-400 to-medical-600',
  },
  {
    role: 'nurse',
    name: '护士',
    username: '李护士',
    description: '专业消毒护理与核查',
    Icon: Stethoscope,
    color: 'from-mint-400 to-mint-600',
  },
  {
    role: 'supervisor',
    name: '主管',
    username: '王主管',
    description: '全面审核与数据管理',
    Icon: ShieldCheck,
    color: 'from-warm-400 to-warm-600',
  },
];

export default function Login() {
  const { currentUser, login } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const role = currentUser?.role ?? 'staff';
      const res = await api<LoginApiResponse>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ username: username.trim(), role }),
      });
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('登录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole, username: string) => {
    setLoading(true);
    try {
      const res = await api<LoginApiResponse>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ username, role }),
      });
      if (res.success && res.data) {
        login(res.data.user, res.data.token);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('快速登录失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-medical-600 via-medical-500 to-mint-500">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-mint-300 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-warm-200 blur-3xl opacity-50" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Heart className="h-6 w-6" fill="white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">母婴消毒管理</h1>
              <p className="text-sm text-white/70">Maternal &amp; Infant Care System</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-display text-4xl font-bold leading-tight mb-4">
                守护每一份
                <br />
                纯净与安心
              </h2>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                专业的母婴用品消毒管理平台，从消毒流程、质量追溯到数据分析，
                为宝宝的健康成长构建全方位安全屏障。
              </p>
            </div>

            <div className="space-y-4">
              {[
                { Icon: Shield, text: '全流程消毒追溯，责任到人' },
                { Icon: Sparkles, text: '智能排程提醒，零遗漏执行' },
                { Icon: ClipboardCheck, text: '多级审计机制，数据透明可信' },
              ].map(({ Icon, text }, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-white/90">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/50">
            © 2025 Maternal &amp; Infant Care. 专业 · 安全 · 可信赖
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-ink-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-medical-500 text-white shadow-card">
              <Heart className="h-5 w-5" fill="white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900">母婴消毒管理</h1>
              <p className="text-xs text-ink-500">Maternal &amp; Infant Care</p>
            </div>
          </div>

          <div className="card p-8 shadow-card-hover">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">
                欢迎回来
              </h2>
              <p className="text-sm text-ink-500">请登录以继续使用消毒管理系统</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="label-text">用户名</label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入您的姓名"
                    className="input-field pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="label-text">选择角色</label>
                <RoleSwitcher className="w-full" />
              </div>

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="btn-primary w-full py-2.5 text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    登录中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    登录系统
                  </span>
                )}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-ink-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-ink-400">或使用角色快速登录</span>
              </div>
            </div>

            <div className="space-y-3">
              {QUICK_LOGINS.map(({ role, name, username, description, Icon, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuickLogin(role, username)}
                  disabled={loading}
                  className="group w-full flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-3.5 text-left transition-all hover:border-medical-200 hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-card',
                      color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800">{name}</p>
                    <p className="text-xs text-ink-500">{description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-medical-500" />
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-ink-400 mt-8">
            登录即表示您同意遵守系统使用规范 · 当前角色：
            <span className="text-medical-600 font-medium">
              {getRoleLabel(currentUser?.role ?? 'staff')}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
