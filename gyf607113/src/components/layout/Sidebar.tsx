import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cylinder, FilePlus, AlertTriangle, RotateCcw } from 'lucide-react';
import { useCylinderStore } from '@/store/useCylinderStore';

const Sidebar = () => {
  const resetToMockData = useCylinderStore(state => state.resetToMockData);

  const handleReset = () => {
    if (confirm('确定要重置所有数据到初始状态吗？')) {
      resetToMockData();
      window.location.reload();
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '追踪面板', end: true },
    { to: '/supplement', icon: FilePlus, label: '补录管理' },
  ];

  return (
    <aside className="w-64 bg-industrial-950/90 border-r border-industrial-700/50 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-industrial-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-industrial-600 rounded-sm flex items-center justify-center">
            <Cylinder className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight">消防气瓶追踪</h1>
            <p className="text-xs text-industrial-400 font-mono">ENERGY FIRE SYSTEM</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 ${
                isActive
                  ? 'bg-industrial-600 text-white shadow-lg shadow-industrial-600/20'
                  : 'text-industrial-300 hover:bg-industrial-800/50 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-industrial-700/50">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-industrial-400 hover:text-white hover:bg-industrial-800/50 rounded-sm transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">重置数据</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
