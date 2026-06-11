import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Map, Dog, FileText, Gavel, BarChart3 } from 'lucide-react'

const navItems = [
  { to: '/', label: '地图总览', icon: Map },
  { to: '/dogs', label: '犬只档案', icon: Dog },
  { to: '/summary', label: '日终汇总', icon: BarChart3 },
  { to: '/arbitration', label: '仲裁中心', icon: Gavel },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="h-screen flex bg-bark-50 overflow-hidden">
      <nav className="w-16 bg-forest-800 flex flex-col items-center py-4 gap-2 shrink-0">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center mb-4">
          <span className="text-white text-sm font-bold">T</span>
        </div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-12 h-12 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive
                  ? 'bg-forest-700 text-amber-400'
                  : 'text-forest-300 hover:bg-forest-700 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="text-[9px] leading-tight">{label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-hidden relative">
        {location.pathname === '/' ? (
          <Outlet />
        ) : (
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
