import { useEffect, useMemo } from 'react';
import { useInverterStore } from '@/store/inverterStore';
import { ExportButton, ExportPreview } from '@/components/ExportButton';
import { generateExportSummary, getStatusText, formatDateShort } from '../utils';
import { LAOZHOU_TEST_INVERTER_ID } from '../data/mockData';
import { FileDown, User, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ExportPage() {
  const { inverters, initData } = useInverterStore();

  useEffect(() => {
    initData();
  }, [initData]);

  const summary = useMemo(() => generateExportSummary(inverters), [inverters]);

  const laozhouRecord = inverters.find((i) => i.id === LAOZHOU_TEST_INVERTER_ID);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileDown className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  摘要导出
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  一键生成班组长可读摘要 · 包含数量、原因、处理人、未拍板记录
                </p>
              </div>
            </div>
            <ExportButton summary={summary} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-300 font-medium">
                📋 导出内容说明
              </p>
              <p className="text-blue-200/70 text-sm mt-1">
                摘要格式经过优化，可直接复制粘贴发给班组长。内容包含：复核总数、异常数量、已通过/未拍板统计、
                原因分类统计、处理人清单、未拍板明细。
              </p>
            </div>
          </div>
        </div>

        {laozhouRecord && (
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium">
                  🧪 老周补录数据验证
                </p>
                <p className="text-amber-200/70 text-sm mt-1">
                  预置测试数据已包含在导出摘要中：INV-003（老周处理）状态为「待拍板」，
                  原因是「散热片积尘待确认」。可用于验证导出→读回流程。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">总计复核</div>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {summary.totalCount}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">台设备</div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">异常数量</div>
                <div className="text-2xl font-bold text-amber-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {summary.abnormalCount}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              占比 {((summary.abnormalCount / summary.totalCount) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">已通过</div>
                <div className="text-2xl font-bold text-emerald-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {summary.passedCount}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              占比 {((summary.passedCount / summary.totalCount) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">未拍板</div>
                <div className="text-2xl font-bold text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {summary.pendingCount}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500">待班组长确认</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              原因分类
            </h3>
            <div className="space-y-3">
              {summary.reasons.length > 0 ? (
                summary.reasons.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-slate-300">{r.reason}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(r.count / summary.totalCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-amber-400 font-mono text-sm w-12 text-right">
                        {r.count} 台
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-sm py-4 text-center">暂无异常原因</div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              处理人清单
            </h3>
            <div className="space-y-3">
              {summary.handlers.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-300">{h.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(h.count / summary.totalCount) * 100}%` }}
                      />
                    </div>
                    <span className={cn(
                      'font-mono text-sm w-12 text-right',
                      h.name === '老周' ? 'text-amber-400' : 'text-blue-400'
                    )}>
                      {h.count} 台
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {summary.pendingRecords.length > 0 && (
          <div className="bg-slate-800 border-2 border-red-500/30 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-medium text-red-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              未拍板记录（需班组长确认）
            </h3>
            <div className="space-y-3">
              {summary.pendingRecords.map((p, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'bg-slate-900/50 border rounded-lg p-4',
                    p.handler === '老周'
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-white">{p.inverterName}</span>
                        {p.handler === '老周' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                            老周补录
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">{p.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">处理人</div>
                      <div className="text-sm text-slate-300">{p.handler}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-slate-500" />
            所有逆变器明细
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">逆变器</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">型号</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">结论</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">处理人</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">未拍板原因</th>
                </tr>
              </thead>
              <tbody>
                {inverters.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    className={cn(
                      'border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors',
                      idx % 2 === 0 && 'bg-slate-800/30',
                      inv.id === LAOZHOU_TEST_INVERTER_ID && 'bg-amber-500/5'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-white">{inv.name}</span>
                      {inv.id === LAOZHOU_TEST_INVERTER_ID && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">
                          老周测试
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{inv.model}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded text-white',
                        inv.status === 'normal' && 'bg-emerald-500',
                        inv.status === 'warning' && 'bg-amber-500',
                        inv.status === 'error' && 'bg-red-500'
                      )}>
                        {getStatusText(inv.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded text-white',
                        inv.conclusion === 'passed' && 'bg-emerald-500',
                        inv.conclusion === 'failed' && 'bg-red-500',
                        inv.conclusion === 'pending' && 'bg-slate-500'
                      )}>
                        {getStatusText(inv.conclusion)}
                      </span>
                    </td>
                    <td className={cn(
                      'py-3 px-4',
                      inv.handler === '老周' ? 'text-amber-400' : 'text-slate-300'
                    )}>
                      {inv.handler}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {inv.pendingReason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ExportPreview summary={summary} />

        <div className="mt-6 flex justify-center">
          <ExportButton summary={summary} />
        </div>
      </main>
    </div>
  );
}
