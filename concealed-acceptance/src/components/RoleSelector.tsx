import React from 'react';
import { User, Building2, Eye, FileCheck } from 'lucide-react';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { USER_ROLE_LABELS } from '@/types';
import type { UserRole } from '@/types';

const roleIcons: Record<UserRole, React.FC<any>> = {
  PROJECT_MANAGER: Building2,
  SUPERVISOR: Eye,
  DOCUMENT_CONTROLLER: FileCheck
};

const roleDescriptions: Record<UserRole, string> = {
  PROJECT_MANAGER: '可以创建、编辑、提交验收记录',
  SUPERVISOR: '可以审核、通过、退回、要求补证',
  DOCUMENT_CONTROLLER: '仅可查看已归档的记录'
};

export const RoleSelector: React.FC = () => {
  const currentUser = useAcceptanceStore((state) => state.currentUser);
  const availableUsers = useAcceptanceStore((state) => state.availableUsers);
  const setCurrentUser = useAcceptanceStore((state) => state.setCurrentUser);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <User className="w-5 h-5 text-concealed-orange" />
        角色切换
      </h3>

      {currentUser && (
        <div className="mb-4 p-3 bg-concealed-orange bg-opacity-5 rounded-lg border border-concealed-orange border-opacity-30">
          <p className="text-sm font-medium text-concealed-orange-dark">
            当前用户：{currentUser.name}
          </p>
          <p className="text-xs text-concealed-orange">
            {USER_ROLE_LABELS[currentUser.role]}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {availableUsers.map((user) => {
          const Icon = roleIcons[user.role];
          const isActive = currentUser?.id === user.id;
          return (
            <button
              key={user.id}
              onClick={() => setCurrentUser(user)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all
                ${isActive
                  ? 'border-concealed-orange bg-concealed-orange bg-opacity-5'
                  : 'border-gray-200 hover:border-concealed-orange hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                  ${isActive ? 'bg-concealed-orange text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${isActive ? 'text-concealed-orange-dark' : 'text-gray-900'}`}>
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {USER_ROLE_LABELS[user.role]}
                  </p>
                </div>
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-concealed-orange flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 pl-13">
                {roleDescriptions[user.role]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
