import { useNavigate } from 'react-router-dom';
import {
  ROLE_INFO,
  type UserRole,
} from '../../shared/types';
import { useAppStore } from '../store/useAppStore';
import { Baby, Shield, Users, Stethoscope } from 'lucide-react';

const ROLE_ICON: Record<UserRole, React.ReactNode> = {
  elder: <Users className="w-8 h-8" />,
  parent: <Baby className="w-8 h-8" />,
  nanny: <Stethoscope className="w-8 h-8" />,
  admin: <Shield className="w-8 h-8" />,
};

export default function RoleSelect() {
  const navigate = useNavigate();
  const setRole = useAppStore((s) => s.setRole);

  const handleSelect = (role: UserRole) => {
    setRole(role);
    navigate('/dashboard');
  };

  const roles: UserRole[] = ['elder', 'parent', 'nanny', 'admin'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warm-gradient shadow-card mb-5">
          <span className="text-4xl">🍼</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-warm-orange mb-3">
          婴幼儿费用核销提醒墙
        </h1>
        <p className="text-gray-500 text-lg">家庭协作版 · 选择您的身份进入</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {roles.map((role, index) => {
          const info = ROLE_INFO[role];
          return (
            <button
              key={role}
              onClick={() => handleSelect(role)}
              style={{ animationDelay: `${index * 80}ms` }}
              className={`
                card card-hover group text-left cursor-pointer
                border-2 border-transparent hover:border-warm-orange/40
                animate-fade-in-up
              `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center
                    ${info.color} group-hover:scale-105 transition-transform
                  `}
                >
                  <span className="text-3xl">{info.avatar}</span>
                  {ROLE_ICON[role]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-xl text-gray-800">
                      {info.name}
                    </h3>
                    <span className={`badge ${info.color}`}>
                      {role === 'admin' && '🔐 审计权限'}
                      {role === 'parent' && '📋 详情权限'}
                      {role === 'nanny' && '📝 操作权限'}
                      {role === 'elder' && '👀 仅摘要'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{info.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 text-center text-sm text-gray-400 animate-fade-in-up animate-delay-500">
        <p>💡 小贴士：不同角色看到的内容不同，可随时切换身份查看效果</p>
      </div>
    </div>
  );
}
