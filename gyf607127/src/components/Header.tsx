import { Zap, ShieldAlert, User } from 'lucide-react';
import type { DataScene } from '@/types';
import { sceneLabels } from '@/data/mockData';

interface HeaderProps {
  scene: DataScene;
}

export const Header = ({ scene }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-emerald-500/30 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-8 h-8 text-emerald-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              能源绿证批次告警墙
            </h1>
            <p className="text-xs text-slate-400">
              Green Certificate Batch Alert Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <ShieldAlert className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">当前场景：</span>
            <span className={`font-medium ${
              scene === 'normal' ? 'text-emerald-400' :
              scene === 'abnormal' ? 'text-red-400' :
              'text-slate-400'
            }`}>
              {sceneLabels[scene]}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-6 border-l border-slate-700">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">结算员</p>
              <p className="text-xs text-slate-400">售电公司运营部</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
