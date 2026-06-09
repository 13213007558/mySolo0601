import { useEffect, useMemo, useState } from 'react';
import { useOilTempStore } from '@/store/useOilTempStore';
import { Toolbar } from '@/components/Toolbar';
import { OilTempTable } from '@/components/OilTempTable';
import { TempChart } from '@/components/TempChart';
import { BatchActionBar } from '@/components/BatchActionBar';
import { SupplementPanel } from '@/components/SupplementPanel';
import { ConflictAlert } from '@/components/ConflictAlert';
import { StatusBar } from '@/components/StatusBar';
import { Eye, EyeOff } from 'lucide-react';

export default function ReviewDesk() {
  const { init, records, conflicts, supplementRecords, selectedDevice } = useOilTempStore();
  const [showSupplementOnChart, setShowSupplementOnChart] = useState(true);

  useEffect(() => {
    init();
  }, [init]);

  const unresolvedConflicts = useMemo(() => {
    return conflicts.filter(c => !c.resolved);
  }, [conflicts]);

  const activeSupplementId = useMemo(() => {
    const deviceSupplements = supplementRecords.filter(s => s.deviceName === selectedDevice);
    return deviceSupplements.length > 0 ? deviceSupplements[deviceSupplements.length - 1].id : null;
  }, [supplementRecords, selectedDevice]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <Toolbar />

      <main className="flex-1 p-6 overflow-auto">
        {unresolvedConflicts.length > 0 && (
          <div className="mb-4">
            {unresolvedConflicts.map(conflict => (
              <ConflictAlert key={conflict.id} conflict={conflict} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-medium text-slate-300">
              夜间油温曲线（22:00 - 次日06:00）
            </h2>
            <label className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
              <button
                onClick={() => setShowSupplementOnChart(!showSupplementOnChart)}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
              >
                {showSupplementOnChart ? (
                  <Eye className="w-4 h-4 text-amber-400" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <span>显示小赵补录曲线</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="order-2 xl:order-1">
            <OilTempTable records={records} />
          </div>
          <div className="order-1 xl:order-2 space-y-6">
            <TempChart
              records={records}
              showSupplement={showSupplementOnChart}
              supplementId={activeSupplementId}
            />

            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-200 mb-3">状态统计</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-200 font-mono">
                    {records.filter(r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温').length}
                  </div>
                  <div className="text-xs text-slate-500">总计</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3 text-center border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    {records.filter(r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温' && r.status === 'normal').length}
                  </div>
                  <div className="text-xs text-emerald-500/70">正常</div>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3 text-center border border-amber-500/20">
                  <div className="text-2xl font-bold text-amber-400 font-mono">
                    {records.filter(r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温' && r.status === 'abnormal').length}
                  </div>
                  <div className="text-xs text-amber-500/70">异常</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-400 font-mono">
                    {records.filter(r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温' && r.status === 'pending').length}
                  </div>
                  <div className="text-xs text-blue-500/70">待复核</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-200 mb-3">使用说明</h3>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">1.</span>
                  <span><strong className="text-slate-300">表格编辑：</strong>双击单元格可编辑油温值、状态和备注，按 Enter 保存，ESC 取消</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">2.</span>
                  <span><strong className="text-slate-300">批量标记：</strong>勾选表格左侧复选框多选，或 Ctrl+点击，使用底部批量操作栏标记状态</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">3.</span>
                  <span><strong className="text-slate-300">图表交互：</strong>拖拽选择区间，滚轮缩放，Shift+拖拽平移</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">4.</span>
                  <span><strong className="text-slate-300">小赵补录：</strong>点击顶部"小赵补录"按钮录入手工数据，支持对比分析和导出读回</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">5.</span>
                  <span><strong className="text-slate-300">附件保护：</strong>附件丢失时点击"无附件"提交，保留原值并标记警告</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">6.</span>
                  <span><strong className="text-slate-300">冲突处理：</strong>同一记录多人修改时显示冲突提示，可选择保留原值/使用新值/合并，不清空数据</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BatchActionBar />
      <SupplementPanel />
      <StatusBar />
    </div>
  );
}
