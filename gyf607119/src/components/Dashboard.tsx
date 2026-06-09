import { useGateStore } from '../store/useGateStore';
import { StatsCard } from './StatsCard';
import { FilterBar } from './FilterBar';
import { GateList } from './GateList';
import { EmptyState } from './EmptyState';
import { ImportExport } from './ImportExport';
import { PassInfoPanel } from './PassInfoPanel';
import { AmountIssuePanel } from './AmountIssuePanel';
import { ThresholdIssuePanel } from './ThresholdIssuePanel';
import { DiffViewer } from './DiffViewer';
import { Gauge, CheckCircle, AlertTriangle, Clock, FileText, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { gates, activeTab, setActiveTab, showEmptyState, emptyStateType, setShowEmptyState } = useGateStore();

  const stats = {
    total: gates.length,
    normal: gates.filter(g => g.status === 'normal').length,
    abnormal: gates.filter(g => g.status === 'abnormal').length,
    pending: gates.filter(g => g.status === 'pending').length,
    hasPassInfo: gates.filter(g => g.passDescription).length,
  };

  const tabs = [
    { key: 'dashboard' as const, label: '巡检看板', icon: LayoutDashboard },
    { key: 'pass-info' as const, label: '放行说明', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-industrial-gray-50">
      <header className="bg-industrial-blue-900 text-white border-b-4 border-industrial-blue-500">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-mono flex items-center gap-3">
                <Gauge className="w-8 h-8 text-industrial-blue-300" />
                能源站内道闸巡检板
              </h1>
              <p className="text-industrial-blue-200 text-sm mt-1">
                道闸设备巡检管理 · 放行说明统一管理 · 异常原因可视化
              </p>
            </div>
            <ImportExport />
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-industrial-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors',
                  activeTab === key
                    ? 'border-industrial-blue-500 text-industrial-blue-600 bg-industrial-blue-50'
                    : 'border-transparent text-industrial-gray-600 hover:text-industrial-gray-800 hover:bg-industrial-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="道闸总数"
                value={stats.total}
                icon={Gauge}
                color="blue"
              />
              <StatsCard
                title="正常运行"
                value={stats.normal}
                icon={CheckCircle}
                color="green"
              />
              <StatsCard
                title="异常告警"
                value={stats.abnormal}
                icon={AlertTriangle}
                color="orange"
              />
              <StatsCard
                title="待巡检"
                value={stats.pending}
                icon={Clock}
                color="gray"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <FilterBar />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowEmptyState(true, 'no-import')}
                  className="industrial-btn-secondary text-sm py-1.5 px-3"
                >
                  演示：未导入数据
                </button>
              </div>
            </div>

            {showEmptyState && emptyStateType ? (
              <EmptyState />
            ) : (
              <GateList />
            )}
          </div>
        )}

        {activeTab === 'pass-info' && (
          <PassInfoPanel />
        )}
      </main>

      <footer className="bg-white border-t border-industrial-gray-200 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-industrial-gray-500">
          <p>能源站内道闸巡检板 · 内置样例数据 · 数据自动保存到本地浏览器</p>
          <p className="mt-1 text-xs text-industrial-gray-400">
            所有手机号显示时已自动脱敏处理，保护隐私安全
          </p>
        </div>
      </footer>

      <AmountIssuePanel />
      <ThresholdIssuePanel />
      <DiffViewer />
    </div>
  );
}
