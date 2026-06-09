import { useEffect, useState } from 'react';
import { useInverterStore } from '@/store/inverterStore';
import { DiffCompare } from '@/components/DiffCompare';
import { formatDate, getStatusText } from '../utils';
import { LAOZHOU_TEST_INVERTER_ID } from '../data/mockData';
import { GitCompare, Clock, RefreshCw, User, Zap, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StringTemperature } from '../types';

export function ReviewPage() {
  const { inverters, snapshots, initData, getSnapshot, createSnapshot } = useInverterStore();
  const [selectedInverterId, setSelectedInverterId] = useState<string>(LAOZHOU_TEST_INVERTER_ID);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (selectedInverterId) {
      createSnapshot(selectedInverterId);
    }
  }, [selectedInverterId, createSnapshot]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    initData();
  };

  const selectedInverter = inverters.find((i) => i.id === selectedInverterId);
  const snapshot = getSnapshot(selectedInverterId);

  const getDiffPairs = (): { original: StringTemperature; current: StringTemperature }[] => {
    if (!selectedInverter || !snapshot) return [];

    const pairs: { original: StringTemperature; current: StringTemperature }[] = [];

    snapshot.originalData.forEach((orig) => {
      const currentManual = selectedInverter.stringTemperatures.find(
        (st) => st.stringNo === orig.stringNo && st.source === 'manual'
      );
      const currentAuto = selectedInverter.stringTemperatures.find(
        (st) => st.stringNo === orig.stringNo && st.source === 'auto' && st.id === orig.id
      );

      if (currentManual) {
        pairs.push({ original: orig, current: currentManual });
      } else if (currentAuto) {
        pairs.push({ original: orig, current: currentAuto });
      }
    });

    return pairs;
  };

  const diffPairs = getDiffPairs();
  const hasChanges = diffPairs.some(
    (p) => p.original.temperature !== p.current.temperature || p.original.remark !== p.current.remark
  );

  const isLaoZhouTest = selectedInverterId === LAOZHOU_TEST_INVERTER_ID;

  return (
    <div className="min-h-screen bg-slate-900" key={refreshKey}>
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="w-8 h-8 text-emerald-500" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  复盘对比页
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  原始值持久化保存 · 刷新不丢失 · 补录前后差异一目了然
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 border-2 border-slate-600 rounded text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              模拟刷新页面
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm text-slate-400">选择逆变器：</span>
            <div className="flex flex-wrap gap-2">
              {inverters.map((inv) => {
                const hasSnapshot = snapshots.some((s) => s.inverterId === inv.id);
                const hasManual = inv.stringTemperatures.some((st) => st.source === 'manual');
                const isLaoZhou = inv.id === LAOZHOU_TEST_INVERTER_ID;

                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => setSelectedInverterId(inv.id)}
                    className={cn(
                      'px-4 py-2 rounded border-2 text-sm font-medium transition-all flex items-center gap-2',
                      selectedInverterId === inv.id
                        ? isLaoZhou
                          ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                          : 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <span className="font-mono">{inv.name}</span>
                    {isLaoZhou && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                        老周测试
                      </span>
                    )}
                    {hasSnapshot && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300">
                        有快照
                      </span>
                    )}
                    {hasManual && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/30 text-orange-300">
                        有补录
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {snapshot && (
          <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-blue-300">
              <Database className="w-5 h-5" />
              <div>
                <span className="font-medium">原始值快照已保存</span>
                <span className="text-blue-400/60 text-sm ml-2">
                  快照时间：{formatDate(snapshot.snapshotTime)} · 数据已存入 localStorage，刷新不丢失
                </span>
              </div>
            </div>
          </div>
        )}

        {isLaoZhouTest && (
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium">
                  🧪 老周手工补录测试数据演示
                </p>
                <p className="text-amber-200/70 text-sm mt-1">
                  这是预置的测试数据，用于验证：补录前后温度从 62.5℃ → 58.3℃（下降4.2℃），
                  备注从「组串温度偏高，待核实」→「组串温度已核实，为散热片积尘导致，已清理」。
                  点击「模拟刷新页面」按钮可验证原始值不会丢失。
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedInverter && (
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-mono text-white mb-2">
                    {selectedInverter.name}
                  </h2>
                  <p className="text-sm text-slate-400">{selectedInverter.model}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">处理人</div>
                  <div className="text-white font-medium">{selectedInverter.handler}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-1">运行状态</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        selectedInverter.status === 'normal' && 'bg-emerald-500',
                        selectedInverter.status === 'warning' && 'bg-amber-500',
                        selectedInverter.status === 'error' && 'bg-red-500'
                      )}
                    />
                    <span className="text-white font-medium">
                      {getStatusText(selectedInverter.status)}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-1">复核结论</div>
                  <span className={cn(
                    'px-2 py-1 text-xs rounded text-white font-medium',
                    selectedInverter.conclusion === 'passed' && 'bg-emerald-500',
                    selectedInverter.conclusion === 'failed' && 'bg-red-500',
                    selectedInverter.conclusion === 'pending' && 'bg-slate-500'
                  )}>
                    {getStatusText(selectedInverter.conclusion)}
                  </span>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-1">组串记录数</div>
                  <div className="text-white font-mono text-lg">
                    {selectedInverter.stringTemperatures.length}
                    <span className="text-sm text-slate-500 ml-1">组</span>
                  </div>
                </div>
              </div>
            </div>

            {hasChanges ? (
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-emerald-500" />
                  补录前后差异对比
                </h3>
                <div className="space-y-4">
                  {diffPairs.map((pair) => (
                    <DiffCompare
                      key={pair.original.id}
                      originalData={pair.original}
                      currentData={pair.current}
                      highlight={pair.current.recorder === '老周'}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
                <div className="text-slate-500 mb-2">
                  {snapshot ? '该逆变器暂无补录数据，原始值与当前值一致' : '暂无快照数据，请先在复核台展开查看以创建快照'}
                </div>
                <div className="text-xs text-slate-600 mt-2 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  {snapshot ? `快照创建于 ${formatDate(snapshot.snapshotTime)}` : '快照会在首次展开逆变器详情时自动创建'}
                </div>
              </div>
            )}

            {snapshot && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  原始值快照详情（持久化存储，刷新不丢失）
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">组串号</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">原始温度</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">原始备注</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">记录人</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">记录时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.originalData.map((st, idx) => (
                        <tr
                          key={st.id}
                          className={cn(
                            'border-b border-slate-700/50',
                            idx % 2 === 0 && 'bg-slate-900/30'
                          )}
                        >
                          <td className="py-3 px-4 font-mono text-white">#{st.stringNo}</td>
                          <td className="py-3 px-4 font-mono text-slate-300">{st.temperature}℃</td>
                          <td className="py-3 px-4 text-slate-300">{st.remark}</td>
                          <td className="py-3 px-4 text-slate-400">{st.recorder}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(st.recordTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
