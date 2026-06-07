import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  FileSpreadsheet,
  PenLine,
  Refrigerator,
  Baby,
} from 'lucide-react';
import { useEffect } from 'react';
import { useAppStore } from '@/store';

const navItems = [
  { to: '/submit', label: '家长录入', icon: PenLine },
  { to: '/handover', label: '交接本列表', icon: ClipboardList },
  { to: '/freezer', label: '冷冻柜名额', icon: Refrigerator },
  { to: '/export', label: '数据导出', icon: FileSpreadsheet },
];

export default function Layout() {
  const init = useAppStore((s) => s.init);
  const loc = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-60 shrink-0 bg-white border-r border-muted/60 flex flex-col">
        <div className="px-6 py-5 border-b border-muted/60">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl2 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
              <Baby size={18} />
            </div>
            <div>
              <div className="font-display text-lg text-secondary leading-tight">
                月子护理中心
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                婴幼儿课程改期交接本
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl2 text-sm transition-all ${
                  isActive
                    ? 'bg-primary/15 text-secondary font-medium shadow-soft'
                    : 'text-gray-600 hover:bg-cream hover:text-secondary'
                }`
              }
            >
              <it.icon size={18} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-muted/60 text-xs text-gray-400">
          数据本地持久化 · 服务重启不丢失
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="h-14 border-b border-muted/60 bg-white/60 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="font-display text-xl text-secondary">
            {
              {
                '/submit': '家长录入 · 婴幼儿课程改期申请',
                '/handover': '交接本列表 · 课程改期记录',
                '/freezer': '辅食厨房冷冻柜 · 名额看板',
                '/export': '数据导出 · Excel / PDF',
              }[loc.pathname] || '婴幼儿课程改期交接本月子护理版'
            }
          </h1>
          <div className="text-sm text-gray-500">
            当前用户：护理主管 / 家长端
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
