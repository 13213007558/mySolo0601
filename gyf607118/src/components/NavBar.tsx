import { NavLink } from 'react-router-dom';
import { Battery, History, FileText, Zap } from 'lucide-react';

const navItems = [
  { to: '/', label: '电池追踪面板', icon: Battery },
  { to: '/review', label: '复盘追溯页', icon: History },
  { to: '/supplement', label: '补录流转表', icon: FileText },
];

export const NavBar = () => {
  return (
    <nav className="bg-industrial-600 border-b-2 border-industrial-400">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-mono tracking-wide">
                能源换电电池追踪面板
              </h1>
              <p className="text-xs text-industrial-200">园区能源墙 · 电池管理系统</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-industrial-200 hover:bg-industrial-500 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
          
          <div className="text-xs text-industrial-300 font-mono">
            v1.0.0
          </div>
        </div>
      </div>
    </nav>
  );
};
