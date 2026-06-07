import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, AlertTriangle, FileX2, History, DatabaseZap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';

export default function AuditPage() {
  const { importAudits, operationLogs, loading, loadAuditData } = useAppStore();

  useEffect(() => { loadAuditData(); }, []);

  return (
    <div className="min-h-screen grain">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/60 shadow-soft">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-medical-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> 返回提醒墙
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-500 to-medical-700 flex items-center justify-center text-white shadow-soft">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-slate-800">审计日志</h1>
                <p className="text-xs text-slate-500 mt-0.5">导入审计 · 材料缺页 · 操作历史 · 服务重启数据不丢失</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <section className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp">
          <h2 className="font-serif text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DatabaseZap className="w-4 h-4 text-medical-500" /> 导入审计记录
            <span className="ml-auto text-xs font-normal text-slate-400">每次 Excel 导入都留存完整审计，支持部分成功</span>
          </h2>
          {importAudits.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400 italic">暂无导入记录</div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="text-left px-4 py-2.5 font-medium">文件名</th>
                    <th className="text-left px-4 py-2.5 font-medium">导入时间</th>
                    <th className="text-center px-4 py-2.5 font-medium">总数</th>
                    <th className="text-center px-4 py-2.5 font-medium">成功</th>
                    <th className="text-center px-4 py-2.5 font-medium">失败</th>
                    <th className="text-center px-4 py-2.5 font-medium">页数</th>
                    <th className="text-center px-4 py-2.5 font-medium">实际数</th>
                    <th className="text-left px-4 py-2.5 font-medium">差异/说明</th>
                  </tr>
                </thead>
                <tbody>
                  {importAudits.map((a, i) => (
                    <tr key={a.id} className={`border-t border-slate-100 ${i % 2 ? 'bg-slate-50/40' : ''} hover:bg-medical-50/30 transition-colors`}>
                      <td className="px-4 py-3 text-slate-700 font-medium">{a.fileName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{a.importedAt?.slice(0, 19).replace('T', ' ')}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-slate-600">{a.totalCount}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-emerald-600 font-medium">{a.successCount}</td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        {a.failedCount > 0 ? <span className="text-rose-600 font-medium">{a.failedCount}</span> : <span className="text-slate-400">0</span>}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-slate-500">{a.pageCount ?? '-'}</td>
                      <td className="px-4 py-3 text-center tabular-nums text-slate-500">{a.actualRecordCount ?? '-'}</td>
                      <td className="px-4 py-3">
                        {a.hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                            <AlertTriangle className="w-3 h-3" /> {a.discrepancyNote || '数量不一致'}
                          </span>
                        ) : a.failedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-100">
                            <FileX2 className="w-3 h-3" /> 部分成功，失败记录已留存
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600">全部成功</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
          <h2 className="font-serif text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-medical-500" /> 操作历史记录
            <span className="ml-auto text-xs font-normal text-slate-400">所有变更操作均记录，服务重启后依然可追溯</span>
          </h2>
          {operationLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400 italic">暂无操作记录</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
              {operationLogs.map((log, i) => (
                <div key={log.id} className={`flex items-start gap-3 p-3 rounded-xl border border-slate-100 ${i % 2 ? 'bg-slate-50/40' : 'bg-white'} animate-slideIn`} style={{ animationDelay: `${i * 30}ms` }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                    log.action === 'CREATE' ? 'bg-emerald-500'
                    : log.action === 'UPDATE' ? 'bg-medical-500'
                    : log.action === 'UPLOAD' ? 'bg-warmpink-500'
                    : log.action === 'IMPORT' ? 'bg-amber-500'
                    : 'bg-slate-400'
                  }`}>
                    {log.action.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{log.action}</span>
                      <span className="text-sm text-slate-700 font-medium">{log.targetType}</span>
                      <span className="text-xs text-slate-400">ID: {log.targetId.slice(0, 8)}...</span>
                      <span className="ml-auto text-[11px] text-slate-400 font-mono">{log.timestamp?.slice(0, 19).replace('T', ' ')}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">操作人：{log.operator}</p>
                    {log.beforeChange && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="bg-rose-50 rounded-lg px-3 py-2 border border-rose-50">
                          <p className="text-[10px] text-rose-500 font-medium mb-1">变更前</p>
                          <pre className="text-[11px] text-rose-700 overflow-x-auto">{JSON.stringify(log.beforeChange, null, 0).slice(0, 300)}</pre>
                        </div>
                        <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-50">
                          <p className="text-[10px] text-emerald-600 font-medium mb-1">变更后</p>
                          <pre className="text-[11px] text-emerald-700 overflow-x-auto">{JSON.stringify(log.afterChange, null, 0).slice(0, 300)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-medical-50 via-white to-warmpink-50 border border-white/60 p-5 animate-fadeInUp" style={{ animationDelay: '120ms' }}>
          <h2 className="font-serif text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <StatusBadge status="normal" /> 数据状态说明
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-white/70 border border-white p-3">
              <StatusBadge status="normal" />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">体温枪记录完整，体温值处于正常范围（36.0 ~ 37.3°C）</p>
            </div>
            <div className="rounded-xl bg-white/70 border border-white p-3">
              <StatusBadge status="pending_review" />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">体温异常或有备注需护理主管人工复核的记录</p>
            </div>
            <div className="rounded-xl bg-white/70 border border-white p-3">
              <StatusBadge status="dirty" />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">早高峰信息不全：有房号/姓名但缺少体温数据的脏数据</p>
            </div>
            <div className="rounded-xl bg-white/70 border border-white p-3">
              <StatusBadge status="empty" />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">整行空数据：姓名与房号均为空，已留存不丢弃</p>
            </div>
            <div className="rounded-xl bg-white/70 border border-white p-3">
              <StatusBadge status="missing_material" />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">请假条/证明材料存在缺页，已标记并进入审计</p>
            </div>
            <div className="rounded-xl bg-white/70 border border-white p-3">
              <div className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium">
                <AlertTriangle className="w-3 h-3" /> 部分成功
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">导入时部分行失败不阻断，成功行入库，失败行与差异留存审计</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
