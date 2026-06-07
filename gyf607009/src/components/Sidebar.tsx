import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileDown, Wrench, Clock, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', label: '提醒墙', icon: LayoutDashboard },
  { to: '/export', label: '导出中心', icon: FileDown },
  { to: '/correction', label: '人工更正', icon: Wrench },
];

function useShiftCountdown() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours();
  let end: Date;
  if (h >= 17) {
    end = new Date(now);
    end.setDate(end.getDate() + 1);
    end.setHours(8, 0, 0, 0);
  } else {
    end = new Date(now);
    end.setHours(8, 0, 0, 0);
  }
  const diff = Math.max(0, end.getTime() - now.getTime());
  const hh = Math.floor(diff / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return { remaining: `${pad(hh)}:${pad(mm)}:${pad(ss)}`, now: now.toLocaleTimeString('zh-CN', { hour12: false }) };
}

export function Sidebar() {
  const { remaining, now } = useShiftCountdown();
  return (
    <aside className="w-60 shrink-0 bg-night-800 border-r border-night-600 h-full flex flex-col">
      <div className="p-5 border-b border-night-600">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-pickup-phone to-pickup-aunt flex items-center justify-center">
            <Moon size={18} className="text-white" />
          </div>
          <div>
            <div className="font-display text-base font-semibold text-night-50">西门接送口</div>
            <div className="text-[10px] text-night-300 font-mono tracking-wide">夜班授权提醒墙</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-night-600 text-night-50 glow-blue'
                  : 'text-night-200 hover:bg-night-700 hover:text-night-50'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-night-600 space-y-2">
        <div className="flex items-center gap-2 text-night-200">
          <Clock size={14} />
          <span className="text-xs font-mono">当前时间 {now}</span>
        </div>
        <div className="bg-night-700 border border-night-500 rounded-md p-3">
          <div className="text-[10px] text-night-300 font-mono tracking-wider">距离交班</div>
          <div className="font-mono text-xl text-pickup-normal mt-0.5 tabular-nums">{remaining}</div>
        </div>
        <div className="text-[10px] text-night-400 font-mono">
          值班员：张建国（工号 D-2037）
        </div>
      </div>
    </aside>
  );
}
