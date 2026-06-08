import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore, maskPhone } from '../store/useAppStore';
import { ROLE_INFO, type UserRole } from '../../shared/types';
import {
  LogOut,
  Home,
  FilePlus2,
  ClipboardList,
  Upload,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: '提醒墙',
    path: '/dashboard',
    icon: <Home className="w-4 h-4" />,
    roles: ['elder', 'parent', 'nanny', 'admin'],
  },
  {
    label: '手工补录',
    path: '/supplement',
    icon: <FilePlus2 className="w-4 h-4" />,
    roles: ['nanny', 'parent', 'admin'],
  },
  {
    label: '审计中心',
    path: '/audit',
    icon: <ClipboardList className="w-4 h-4" />,
    roles: ['admin'],
  },
  {
    label: '数据导入',
    path: '/import',
    icon: <Upload className="w-4 h-4" />,
    roles: ['admin'],
  },
];

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, currentUserName, clearRole, getStatistics } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentRole) return null;

  const info = ROLE_INFO[currentRole];
  const stats = getStatistics();
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  const handleLogout = () => {
    clearRole();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-cream-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 rounded-xl bg-warm-gradient flex items-center justify-center shadow-sm">
                <span className="text-lg">🍼</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-lg text-warm-orange leading-tight">
                  核销提醒墙
                </h1>
                <p className="text-[10px] text-gray-400 leading-tight">
                  家庭协作版
                </p>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-1 ml-4">
              {visibleNav.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                    transition-all duration-200
                    ${
                      location.pathname === item.path
                        ? 'bg-warm-orange/10 text-warm-orange font-medium'
                        : 'text-gray-600 hover:bg-cream-100 hover:text-warm-orange'
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentRole !== 'elder' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-50 border border-cream-200">
                <span className="text-xs text-gray-500">待核销余额</span>
                <span className="font-display text-lg text-warm-orange">
                  ¥{stats.balanceAmount.toFixed(0)}
                </span>
                {stats.overdueCount > 0 && (
                  <span className="badge bg-warm-rose/10 text-warm-rose animate-pulse-soft">
                    {stats.overdueCount} 笔逾期
                  </span>
                )}
              </div>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className={`
                  inline-flex items-center gap-2 px-3 py-1.5 rounded-xl
                  ${info.color} border transition-all
                `}
              >
                <span className="text-lg">{info.avatar}</span>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium leading-tight">
                    {currentUserName}
                  </div>
                  <div className="text-[10px] opacity-70 leading-tight">
                    {info.name}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    menuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 card !p-2 z-50 animate-scale-in origin-top-right">
                  <div className="md:hidden space-y-1 pb-2 mb-2 border-b border-cream-100">
                    {visibleNav.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMenuOpen(false);
                        }}
                        className={`
                          w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                          ${
                            location.pathname === item.path
                              ? 'bg-warm-orange/10 text-warm-orange font-medium'
                              : 'text-gray-600 hover:bg-cream-100'
                          }
                        `}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-warm-rose hover:bg-warm-rose/5"
                  >
                    <LogOut className="w-4 h-4" />
                    切换身份
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
