import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Database,
  Clock,
  Settings,
  Edit3,
} from 'lucide-react';
import { FilterBar } from '@/components/FilterBar';
import { ExportToolbar } from '@/components/ExportToolbar';
import { NormalRecordsTable } from '@/components/NormalRecordsTable';
import { ProblemRecordsPanel } from '@/components/ProblemRecordsPanel';
import { ManualAngleTable } from '@/components/ManualAngleTable';
import { StatusFeedback } from '@/components/StatusFeedback';
import { StatCard } from '@/components/StatCard';
import { useBracketStore } from '@/store/useBracketStore';
import { useURLSync } from '@/hooks/useURLSync';

export const BracketReconciliation: React.FC = () => {
  const normalRecords = useBracketStore((state) => state.normalRecords);
  const problemRecords = useBracketStore((state) => state.problemRecords);
  const manualRecords = useBracketStore((state) => state.manualRecords);
  const pageStatus = useBracketStore((state) => state.pageStatus);
  const loadMockData = useBracketStore((state) => state.loadMockData);
  const updatePageStatus = useBracketStore((state) => state.updatePageStatus);

  useURLSync();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString().length === 0 && normalRecords.length === 0 && problemRecords.length === 0 && manualRecords.length === 0) {
      loadMockData();
    } else {
      updatePageStatus();
    }
  }, []);

  const activeProblems = problemRecords.filter((r) => !r.isResolved);
  const processedRecords = normalRecords.filter((r) => r.status === 'processed');
  const pendingRecords = normalRecords.filter((r) => r.status === 'pending');

  const showMainContent = pageStatus !== 'empty' && pageStatus !== 'state_lost' && pageStatus !== 'loading';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <FilterBar />
      <ExportToolbar />

      {pageStatus === 'state_lost' && <StatusFeedback status="state_lost" />}
      {pageStatus === 'empty' && <StatusFeedback status="empty" />}
      {pageStatus === 'loading' && <StatusFeedback status="loading" />}

      {showMainContent && (
        <div className="flex-1 flex flex-col">
          <div className="max-w-7xl mx-auto w-full p-4">
            {pageStatus === 'all_problem' && (
              <div className="mb-4 p-4 bg-orange-100 border-2 border-orange-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="font-mono font-bold text-orange-800">
                      本次导入全部为问题记录
                    </p>
                    <p className="text-sm text-orange-700">
                      共发现 {activeProblems.length} 条数据存在问题，请在右侧问题区逐一处理
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={CheckCircle2}
                label="已处理"
                value={processedRecords.length}
                color="green"
                subtext="正常记录"
              />
              <StatCard
                icon={Clock}
                label="待处理"
                value={pendingRecords.length}
                color="blue"
                subtext="等待确认"
              />
              <StatCard
                icon={AlertTriangle}
                label="待解决"
                value={activeProblems.length}
                color="orange"
                subtext="问题记录"
              />
              <StatCard
                icon={Edit3}
                label="手工补录"
                value={manualRecords.length}
                color="slate"
                subtext="许班长补录"
              />
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="max-w-7xl mx-auto w-full p-4 pb-0">
                <div className="bg-white rounded-t-lg border-2 border-slate-200 border-b-0 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-[#1e3a5f]" />
                    <h2 className="font-bold font-mono text-slate-800 tracking-wide">
                      正常记录统计区
                    </h2>
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded font-mono">
                      {normalRecords.length} 条记录
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Settings className="w-4 h-4" />
                    <span className="font-mono">点击行查看详情 | 🔗复制链接核对</span>
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto w-full px-4 flex-1 overflow-hidden">
                <div className="bg-white border-2 border-slate-200 rounded-b-lg h-full overflow-hidden flex flex-col">
                  <NormalRecordsTable />
                </div>
              </div>

              <div className="max-w-7xl mx-auto w-full p-4">
                <ManualAngleTable />
              </div>
            </div>

            <ProblemRecordsPanel />
          </div>
        </div>
      )}
    </div>
  );
};
