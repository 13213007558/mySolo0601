import React from 'react';
import { Users, Shield, UserCheck, Building2, ChevronDown } from 'lucide-react';
import type { UserRole } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_CONFIGS } from '@/config/roles';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  engineer: <UserCheck className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
  supplier: <Building2 className="w-4 h-4" />,
};

export const RoleSwitcher: React.FC = () => {
  const { currentRole, userName, setRole } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);
  
  const roles: UserRole[] = ['engineer', 'admin', 'supplier'];
  
  const handleRoleChange = (role: UserRole) => {
    setRole(role);
    setIsOpen(false);
    window.location.reload();
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Users className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-medium text-gray-700">{userName}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500">切换角色以测试权限控制</p>
            </div>
            {roles.map(role => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${
                  currentRole === role ? 'bg-primary-50' : ''
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  currentRole === role ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {ROLE_ICONS[role]}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    currentRole === role ? 'text-primary-700' : 'text-gray-800'
                  }`}>
                    {ROLE_CONFIGS[role].roleName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ROLE_CONFIGS[role].canViewSensitiveData 
                      ? '可查看敏感数据' 
                      : '敏感数据已脱敏'}
                    {' · '}
                    {ROLE_CONFIGS[role].canExport ? '可导出' : '不可导出'}
                    {' · '}
                    {ROLE_CONFIGS[role].canSupplement ? '可补录' : '不可补录'}
                  </p>
                </div>
                {currentRole === role && (
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
