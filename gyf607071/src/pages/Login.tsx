import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Users,
  Store,
  ShieldCheck,
  Baby,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { UserRole } from '@/types';

const roleConfigs: {
  role: UserRole;
  title: string;
  description: string;
  icon: typeof UserIcon;
  gradient: string;
  accentColor: string;
}[] = [
  {
    role: 'elder',
    title: '老人（家属）',
    description: '查看宝宝晨检摘要，了解出勤与体温状态',
    icon: Users,
    gradient: 'from-amber-50 to-orange-50',
    accentColor: 'text-amber-600',
  },
  {
    role: 'parent',
    title: '父母（家属）',
    description: '查看完整晨检详情、体温记录和请假条',
    icon: UserIcon,
    gradient: 'from-sky-50 to-blue-50',
    accentColor: 'text-sky-600',
  },
  {
    role: 'manager',
    title: '店长',
    description: '导出表反查、跨班处理、手工补录、审计日志',
    icon: Store,
    gradient: 'from-medical-50 to-teal-50',
    accentColor: 'text-medical-600',
  },
  {
    role: 'supervisor',
    title: '主管',
    description: '所有权限、审计复查、数据状态管理',
    icon: ShieldCheck,
    gradient: 'from-violet-50 to-purple-50',
    accentColor: 'text-violet-600',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-baby-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-medical-400 to-medical-600 mb-6 shadow-lg">
            <Baby className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-medical-800 mb-3">
            婴幼儿晨检复核排程板
          </h1>
          <p className="text-lg text-medical-600 font-sans">
            家庭协作版 · 数据溯源 · 权限分级
          </p>
        </div>

        <div className="w-full max-w-5xl">
          <h2 className="text-center text-medical-700 font-medium mb-8 text-lg">
            请选择您的身份登录
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roleConfigs.map((config, idx) => {
              const Icon = config.icon;
              return (
                <button
                  key={config.role}
                  onClick={() => handleLogin(config.role)}
                  className={`group relative bg-gradient-to-br ${config.gradient} rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-white/60 animate-slide-up`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${config.accentColor}`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-gray-800 mb-2">
                    {config.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {config.description}
                  </p>
                  <div className="mt-6 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
                    点击登录
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-medical-600/70">
        © 2026 辅食厨房 · 保健复核数据溯源系统
      </footer>
    </div>
  );
}
