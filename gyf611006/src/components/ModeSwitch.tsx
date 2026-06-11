import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { AppMode } from '../types';

export const ModeSwitch: React.FC = () => {
  const { mode, setMode } = useAppStore();

  const modes: { value: AppMode; label: string; icon: React.ReactNode; color: string }[] = [
    {
      value: 'drill',
      label: '演练模式',
      icon: <Shield size={16} />,
      color: 'blue',
    },
    {
      value: 'real',
      label: '实盘模式',
      icon: <AlertTriangle size={16} />,
      color: 'warning',
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-dark-700 rounded-lg">
      {modes.map((m) => {
        const isActive = mode === m.value;
        const colorMap: Record<string, { active: string; inactive: string }> = {
          blue: {
            active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
            inactive: 'text-dark-400 hover:text-dark-200',
          },
          warning: {
            active: 'bg-warning-500 text-white shadow-lg shadow-warning-500/30',
            inactive: 'text-dark-400 hover:text-dark-200',
          },
        };
        const colorClasses = colorMap[m.color];

        return (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
              isActive ? colorClasses!.active : colorClasses!.inactive
            }`}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
