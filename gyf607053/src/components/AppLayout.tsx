import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UsersRound,
  Baby,
  ClipboardList,
  FileDown,
  ChefHat,
  LogOut,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useAppStore, ROLE_LABELS } from '../store/app'
import { RoleBadge } from './Badges'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const liveConnected = useAppStore((s) => s.liveConnected)
  const setCurrentUser = useAppStore((s) => s.setCurrentUser)

  if (!currentUser) {
    return <>{children}</>
  }

  const logout = () => {
    setCurrentUser(null)
    navigate('/login')
  }

  const navItems = [
    { to: '/onsite', label: '餐厅现场版', icon: LayoutDashboard, roles: ['waiter', 'manager', 'supervisor'] as string[] },
    { to: '/kitchen', label: '厨房/后场', icon: ChefHat, roles: ['kitchen', 'manager', 'supervisor'] as string[] },
    { to: '/classes', label: '班级页', icon: UsersRound, roles: ['waiter', 'kitchen', 'manager', 'supervisor'] as string[] },
    { to: '/records', label: '借还记录', icon: ClipboardList, roles: ['waiter', 'kitchen', 'manager', 'supervisor'] as string[] },
    { to: '/export', label: '导出与审计', icon: FileDown, roles: ['manager', 'supervisor'] as string[] },
  ].filter((i) => i.roles.includes(currentUser.role))

  return (
    <div className="min-h-dvh flex">
      <aside className="w-64 shrink-0 border-r border-ink-100 bg-white/70 backdrop-blur-sm p-4 flex flex-col">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-semibold shadow-soft">
            清
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-900">消毒清洗链</div>
            <div className="text-[11px] text-ink-500">餐厅现场版</div>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1 flex-1">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <n.icon size={18} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-ink-100 space-y-3">
          <div className="flex items-center gap-2 px-2">
            {liveConnected ? (
              <Wifi size={14} className="text-emerald-600" />
            ) : (
              <WifiOff size={14} className="text-rose-500" />
            )}
            <span className="text-xs text-ink-500">
              {liveConnected ? '实时同步已连接' : '实时同步离线'}
            </span>
          </div>

          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-ink-50">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink-900 truncate">{currentUser.name}</div>
              <RoleBadge role={currentUser.role} />
            </div>
            <button onClick={logout} title="切换角色">
              <LogOut size={16} className="text-ink-500" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 animate-floatUp">{children}</div>
      </main>
    </div>
  )
}
