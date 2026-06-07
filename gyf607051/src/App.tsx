import { useEffect } from 'react';
import { FileSpreadsheet, Smartphone, ChefHat, Shield, Waves, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ParentView from '@/pages/ParentView';
import WaiterView from '@/pages/WaiterView';
import KitchenView from '@/pages/KitchenView';
import ManagerView from '@/pages/ManagerView';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'parent' as const, label: '家长端', hint: '导出表反查', Icon: FileSpreadsheet },
  { key: 'waiter' as const, label: '服务员', hint: '现场录入', Icon: Smartphone },
  { key: 'kitchen' as const, label: '厨房/后场', hint: '实时大屏', Icon: ChefHat },
  { key: 'manager' as const, label: '主管复查', hint: '审计追踪', Icon: Shield },
];

export default function App() {
  const { currentView, setCurrentView, loadAll, loading, error, startPolling } = useStore();

  useEffect(() => {
    loadAll();
    const stop = startPolling();
    return stop;
  }, [loadAll, startPolling]);

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-teal-400 text-white shadow-lg shadow-sky-200/60">
              <Waves className="h-5 w-5" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/40" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                海豚泳池 2 区 · 婴幼儿晨检复核墙
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                餐厅现场版 · 含家长反查、照片缺失部分成功、异常审计、手工补录
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm md:flex">
            {TABS.map(({ key, label, hint, Icon }) => {
              const active = currentView === key;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentView(key)}
                  className={cn(
                    'group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                    active
                      ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-200/60'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{label}</span>
                  <span className={cn('hidden text-[11px] lg:inline', active ? 'text-sky-100' : 'text-slate-400')}>
                    {hint}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:inline-flex">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                同步中
              </span>
            )}
            {error && (
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-600">
                {error}
              </span>
            )}
          </div>
        </div>

        <nav className="flex overflow-x-auto border-t border-slate-100 px-2 py-2 md:hidden">
          {TABS.map(({ key, label, Icon }) => {
            const active = currentView === key;
            return (
              <button
                key={key}
                onClick={() => setCurrentView(key)}
                className={cn(
                  'mx-1 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                  active
                    ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {currentView === 'parent' && <ParentView />}
        {currentView === 'waiter' && <WaiterView />}
        {currentView === 'kitchen' && <KitchenView />}
        {currentView === 'manager' && <ManagerView />}
      </main>

      <footer className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 text-center text-xs text-slate-400 sm:px-6">
        婴幼儿晨检复核墙 · 餐厅现场版 · 空 / 脏 / 正常三态反馈 · 照片缺失允许部分成功 · 异常入汇总必留审计
      </footer>
    </div>
  );
}
