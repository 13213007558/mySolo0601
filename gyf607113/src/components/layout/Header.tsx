import { Bell, RefreshCw, User } from 'lucide-react';
import { useCylinderStore } from '@/store/useCylinderStore';
import { useEffect, useState } from 'react';

const Header = () => {
  const anomalies = useCylinderStore(state => state.anomalies);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unresolvedCount = anomalies.filter(a => !a.resolved).length;

  return (
    <header className="h-16 bg-industrial-900/80 border-b border-industrial-700/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-industrial-400">
          <span className="text-sm">系统时间:</span>
          <span className="font-mono text-white">
            {currentTime.toLocaleString('zh-CN')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-industrial-400 hover:text-white hover:bg-industrial-800/50 rounded-sm transition-all"
          title="刷新页面"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button className="relative p-2 text-industrial-400 hover:text-white hover:bg-industrial-800/50 rounded-sm transition-all">
          <Bell className="w-5 h-5" />
          {unresolvedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse-slow">
              {unresolvedCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-industrial-700/50">
          <div className="w-8 h-8 bg-industrial-700 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-industrial-300" />
          </div>
          <div className="text-sm">
            <p className="text-white font-medium">管理员</p>
            <p className="text-industrial-400 text-xs">安全管理系统</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
