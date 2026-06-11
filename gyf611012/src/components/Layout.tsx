import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Transition } from '@headlessui/react';
import {
  LayoutDashboard,
  Pipette,
  Boxes,
  History,
  FileCheck2,
  FileBarChart,
  Settings,
  User,
  Languages,
  Lightbulb,
  LightbulbOff,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/inspection', icon: Pipette, labelKey: 'nav.inspection' },
  { to: '/batches', icon: Boxes, labelKey: 'nav.batches' },
  { to: '/history', icon: History, labelKey: 'nav.history' },
  { to: '/approvals', icon: FileCheck2, labelKey: 'nav.approvals' },
  { to: '/reports', icon: FileBarChart, labelKey: 'nav.reports' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

const languageLabels: Record<string, string> = {
  zh: '中文',
  en: 'EN',
  hi: 'हिं',
};

export default function Layout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { currentUser, settings, toggleDarkbox, setLanguage } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = settings.language;
    if (settings.darkboxMode) {
      document.body.classList.add('darkbox-mode');
    } else {
      document.body.classList.remove('darkbox-mode');
    }
    return () => document.body.classList.remove('darkbox-mode');
  }, [settings.language, settings.darkboxMode]);

  const cycleLanguage = () => {
    const order = ['zh', 'en', 'hi'] as const;
    const idx = order.indexOf(settings.language as typeof order[number]);
    const next = order[(idx + 1) % order.length];
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-ink-950 text-ink-100">
      <Transition show={settings.darkboxMode}>
        <div className="darkbox-led-bar" />
      </Transition>

      <aside
        className={cn(
          'flex h-full flex-col border-r border-ink-700 bg-ink-900 transition-all duration-300',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ink-700 px-4">
          <Transition show={sidebarOpen}>
            <div className="flex items-center gap-2 overflow-hidden font-serif text-lg font-bold tracking-wider text-gold-500">
              <span className="text-shadow-gold">SAFFRON</span>
              <span className="text-ink-300">QC</span>
            </div>
          </Transition>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-hard-ghost !px-2 !py-1"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          {navItems.map(({ to, icon: Icon, labelKey }) => {
            const active = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-none px-3 py-2.5 font-mono text-sm uppercase tracking-wider transition-all',
                    isActive
                      ? 'bg-saffron-700 text-white shadow-btn'
                      : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
                  )
                }
              >
                <Icon size={18} className="shrink-0" />
                <Transition show={sidebarOpen}>
                  <span className="overflow-hidden whitespace-nowrap">{t(labelKey)}</span>
                </Transition>
                <Transition show={sidebarOpen && active}>
                  <ChevronRight size={14} className="ml-auto text-gold-400" />
                </Transition>
              </NavLink>
            );
          })}
        </nav>

        <Transition show={sidebarOpen}>
          <div className="border-t border-ink-700 p-3 text-[10px] font-mono text-ink-500">
            v1.0.0 · © 2026
          </div>
        </Transition>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-700 bg-ink-900/80 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-lg font-semibold text-ink-100">
              {t('app_title')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cycleLanguage}
              onMouseEnter={() => setLangMenuOpen(true)}
              onMouseLeave={() => setLangMenuOpen(false)}
              className="btn-hard-ghost !px-3 !py-1.5 relative"
              title={t('common.language')}
            >
              <Languages size={16} />
              <span className="font-mono text-xs">{languageLabels[settings.language]}</span>
            </button>

            <button
              onClick={toggleDarkbox}
              className={cn(
                'btn-hard !px-3 !py-1.5 transition-all',
                settings.darkboxMode
                  ? 'bg-gold-500 text-ink-900 hover:bg-gold-400 animate-pulse-gold'
                  : 'btn-hard-ghost'
              )}
              title={t('inspection.darkbox')}
            >
              {settings.darkboxMode ? (
                <LightbulbOff size={16} className="text-ink-900" />
              ) : (
                <Lightbulb size={16} />
              )}
              <Transition show={sidebarOpen}>
                <span className="font-mono text-xs">
                  {settings.darkboxMode ? t('inspection.darkbox_on') : t('inspection.darkbox')}
                </span>
              </Transition>
            </button>

            <div className="flex items-center gap-3 border-l border-ink-700 pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-none border-2 border-gold-500 bg-ink-800">
                <User size={16} className="text-gold-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-sm font-semibold text-ink-100">
                  {currentUser.name}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
                  {currentUser.employeeNo} · {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
