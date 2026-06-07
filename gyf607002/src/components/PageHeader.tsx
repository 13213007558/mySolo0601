import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Moon, Sun } from 'lucide-react';

export function PageHeader() {
  const location = useLocation();
  const titleMap: Record<string, string> = {
    '/': '婴幼儿辅食禁忌交接本 · 夜班版',
    '/supplement': '手工补录记录',
    '/export': '交接摘要导出',
  };
  const title = Object.entries(titleMap).find(([p]) => location.pathname.startsWith(p))?.[1] ?? '婴幼儿辅食禁忌交接本';

  return (
    <header className="bg-gradient-to-r from-ink via-ink to-ink-light text-white py-5 px-6 shadow-soft">
      <div className="container max-w-6xl flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="font-serif text-lg md:text-xl font-semibold leading-tight">{title}</h1>
            <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
              <Moon size={11} />
              夜班交接 · 早会前核对
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-xs text-white/80">
          <span className="hidden sm:flex items-center gap-1">
            <Sun size={12} />
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
        </div>
      </div>
    </header>
  );
}
