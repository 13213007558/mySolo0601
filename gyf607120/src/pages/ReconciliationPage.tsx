import { useState } from 'react';
import { Zap, Info, AlertCircle } from 'lucide-react';
import { StatsCards } from '@/components/StatsCards/StatsCards';
import { FilterPanel } from '@/components/FilterPanel/FilterPanel';
import { ChartsRow } from '@/components/Charts/Charts';
import { DataTable } from '@/components/DataTable/DataTable';
import { ImportPanel } from '@/components/ImportPanel/ImportPanel';
import { SupplementPanel } from '@/components/SupplementPanel/SupplementPanel';
import { LinkageBoard } from '@/components/LinkageBoard/LinkageBoard';
import { useReconciliationStore } from '@/store/useReconciliationStore';
import { exportToExcel } from '@/utils/export';

export const ReconciliationPage = () => {
  const {
    filteredFlows,
    filters,
    chartFiltersApplied,
    unappliedFilterReasons,
    supplementRecords,
    selectedFlowId,
    selectFlow,
    currentSample,
    unappliedFilterReasons: reasons
  } = useReconciliationStore();

  const [showSupplementPanel, setShowSupplementPanel] = useState(false);

  const handleExport = () => {
    exportToExcel({
      flows: filteredFlows,
      filters,
      chartFiltersApplied,
      unappliedFilterReasons,
      supplementRecords
    });
  };

  const handleSupplement = (flowId: string) => {
    selectFlow(flowId);
    setShowSupplementPanel(true);
  };

  const sampleLabels: Record<string, string> = {
    normal: '正常数据样例',
    anomaly: '异常数据样例',
    empty: '空数据样例'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg shadow-orange-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    能源快充账单对账系统
                  </h1>
                  <p className="text-sm text-slate-400">
                    当前样例：<span className="text-orange-400 font-medium">{sampleLabels[currentSample]}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!chartFiltersApplied && unappliedFilterReasons.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-amber-400">
                      筛选条件未应用于图表，导出时将标注说明
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    值班员：先按车牌过滤，再对比导出异常金额
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1800px] mx-auto px-6 py-6">
          <StatsCards />

          <div className="grid grid-cols-[260px_1fr_320px] gap-6">
            <div className="space-y-4">
              <FilterPanel />
              <ImportPanel onExport={handleExport} />
            </div>

            <div className="min-w-0">
              <ChartsRow />
              <DataTable onSupplement={handleSupplement} />
              
              {reasons.length > 0 && !chartFiltersApplied && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-amber-300 mb-1">
                        筛选未同步提示
                      </div>
                      <div className="text-xs text-amber-400/80 space-y-1">
                        {reasons.map((reason, idx) => (
                          <div key={idx}>• {reason}</div>
                        ))}
                      </div>
                      <div className="text-xs text-amber-500/70 mt-2">
                        点击「应用筛选」按钮可同步图表数据；若直接导出，Excel中将自动标注以上未采用原因
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              {showSupplementPanel && selectedFlowId ? (
                <SupplementPanel
                  selectedFlowId={selectedFlowId}
                  onClose={() => { setShowSupplementPanel(false); selectFlow(null); }}
                />
              ) : (
                <LinkageBoard />
              )}
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-800/50 bg-slate-900/30 mt-12">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>能源快充账单对账系统 · 资产台账专员专用</span>
              <span>支付流水 · 枪号占用 · 退款重算 · 司机排队 全链路联动</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
