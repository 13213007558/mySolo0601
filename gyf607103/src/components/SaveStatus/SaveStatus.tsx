import React from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { Check, Loader2, AlertTriangle, HardDrive } from 'lucide-react';

export const SaveStatus: React.FC = () => {
  const { saveStatus, lastSavedAt } = useShadowStore();

  const configs = {
    idle: {
      icon: <HardDrive size={14} />,
      text: lastSavedAt ? `已保存于 ${new Date(lastSavedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '本地存储',
      color: 'text-gray-400',
    },
    saving: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: '正在保存...',
      color: 'text-primary-500',
    },
    saved: {
      icon: <Check size={14} />,
      text: '已保存到本地',
      color: 'text-success-500',
    },
    error: {
      icon: <AlertTriangle size={14} />,
      text: '保存失败',
      color: 'text-danger-500',
    },
  };

  const config = configs[saveStatus];

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.color} transition-colors duration-300`}>
      {config.icon}
      <span className="font-mono">{config.text}</span>
    </div>
  );
};
