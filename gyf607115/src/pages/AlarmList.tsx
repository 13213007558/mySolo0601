import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  Camera,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { useAlarmStore } from '../stores/useAlarmStore';
import { useValidation } from '../hooks/useValidation';
import { StatCard } from '../components/StatCard';
import { ValidationBanner } from '../components/ValidationBanner';
import { AlarmFilter } from '../components/AlarmFilter';
import { AlarmTable } from '../components/AlarmTable';
import { ExportModal } from '../components/ExportModal';

export default function AlarmList() {
  const { getStats, getFilteredAlarms } = useAlarmStore();
  const { issueCounts } = useValidation();
  const [showExport, setShowExport] = useState(false);
  const [showReadmeDemo, setShowReadmeDemo] = useState(false);

  const stats = getStats();
  const filteredAlarms = getFilteredAlarms();

  const runReadmeCommandDemo = () => {
    setShowReadmeDemo(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-mono tracking-tight">
                能源BMS告警对账系统
              </h1>
              <p className="mt-1 text-slate-300 text-sm">
                资产移交库 · BMS告警全生命周期管理
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={runReadmeCommandDemo}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700/50 rounded border border-slate-600 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Terminal className="h-4 w-4" />
                执行README命令
              </button>
              <Link
                to="/manual-entry"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                <Camera className="h-4 w-4" />
                孟经理手工补录
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="告警总数"
              value={stats.totalAlarms}
              icon={<AlertTriangle className="h-6 w-6" />}
              color="blue"
              trend="up"
              trendValue={`${filteredAlarms.length} 条筛选结果`}
            />
            <StatCard
              title="待处理"
              value={stats.pendingAlarms}
              icon={<Clock className="h-6 w-6" />}
              color="amber"
            />
            <StatCard
              title="已解决"
              value={stats.resolvedAlarms}
              icon={<CheckCircle className="h-6 w-6" />}
              color="green"
            />
            <StatCard
              title="涉及金额"
              value={stats.totalAmountDisplay}
              prefix="¥"
              icon={<DollarSign className="h-6 w-6" />}
              color="slate"
            />
          </div>

          {issueCounts.total > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-amber-700 font-medium">数据一致性提示：</span>
                  <span className="text-amber-600">
                    页面显示总金额 ¥{stats.totalAmountDisplay}，
                    精确计算总金额 ¥{stats.preciseTotalAmount}，
                    差额 ¥{(parseFloat(stats.totalAmountDisplay) - parseFloat(stats.preciseTotalAmount)).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ValidationBanner />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <AlarmFilter />
            </div>
            <div className="lg:col-span-3">
              <AlarmTable onExport={() => setShowExport(true)} />
            </div>
          </div>
        </div>
      </main>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />

      {showReadmeDemo && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReadmeDemo(false)}
        >
          <div
            className="bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-slate-300">README 命令演示</span>
              </div>
              <button
                onClick={() => setShowReadmeDemo(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 font-mono text-sm">
              <p className="text-slate-500">$ npm run check-alarm -- alarm-readme-001</p>
              <div className="mt-3 space-y-2">
                <p className="text-slate-300">// 命令行输出结果：</p>
                <p className="text-green-400">告警编号: BMS-READM-001</p>
                <p className="text-green-400">描述: README命令测试告警-命令行版本</p>
                <p className="text-green-400">金额: ¥12345.67</p>
                <p className="text-green-400">状态: pending</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-amber-400">// 页面显示结果：</p>
                <p className="text-amber-300">描述: README命令测试告警-页面显示版本</p>
                <p className="text-amber-300">金额: ¥12345.67</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-red-400">// ⚠️ 检测到不一致：</p>
                <p className="text-red-300">描述字段在命令行和页面显示中不一致！</p>
                <p className="text-red-300 mt-2">
                  请在上方校验提示中点击"一键修复"同步数据。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
