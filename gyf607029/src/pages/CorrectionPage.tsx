import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, AlertTriangle, Eye, ChevronRight, FileWarning,
  Baby, User, Clock, UserCheck,
} from 'lucide-react';
import { auditApi, correctionApi } from '../lib/api.js';
import type { CorrectionRecord } from 'shared/types.js';
import { AuthStatusBadge } from '../components/badges.js';

interface FailureRecord {
  auth: any;
  audits: any[];
}

export function CorrectionPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<'failure' | 'correction'>('failure');
  const [failures, setFailures] = useState<FailureRecord[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    auditApi.failurePaths().then(setFailures);
    correctionApi.pending().then(setCorrections);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold text-slate-800 mb-1 flex items-center gap-2">
          <ClipboardCheck size={20} className="text-brand-500" />
          人工更正工作台
        </h1>
        <p className="text-sm text-slate-500">
          左侧为<b className="text-red-600">失败路径</b>（供财务复盘），右侧为<b className="text-sky-600">人工更正路径</b>（已更正记录留痕）。每条数据均可追溯完整操作链。
        </p>
      </div>

      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'failure' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          onClick={() => setTab('failure')}
        >
          <span className="flex items-center gap-1.5"><AlertTriangle size={14} />失败路径（{failures.length}）</span>
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'correction' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          onClick={() => setTab('correction')}
        >
          <span className="flex items-center gap-1.5"><ClipboardCheck size={14} />人工更正路径（{corrections.length}）</span>
        </button>
      </div>

      {tab === 'failure' ? (
        <div className="space-y-3">
          {failures.map(f => {
            const isExp = expanded === f.auth.id;
            return (
              <div key={f.auth.id} className="card overflow-hidden">
                <div
                  className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpanded(isExp ? null : f.auth.id)}
                >
                  <div className="text-slate-400">{isExp ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}</div>
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <FileWarning size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                      <Baby size={14} className="text-brand-500" />
                      {f.auth.babyName}
                      <span className="font-mono text-xs text-slate-400">{f.auth.id}</span>
                      <AuthStatusBadge status={f.auth.authStatus} />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><User size={11} />{f.auth.parentName}</span>
                      <span className="font-mono">{f.auth.parentPhone}</span>
                      <span>·</span>
                      <span>{f.auth.storeName}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {f.audits.length} 条操作记录
                  </div>
                  <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={(e) => { e.stopPropagation(); nav(`/detail/${f.auth.id}`); }}>
                    <Eye size={12} />详情
                  </button>
                </div>
                {isExp && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-12 py-4">
                    <div className="text-xs text-slate-500 mb-3 font-medium">完整失败链路复盘：</div>
                    <div className="relative pl-5">
                      <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-300" />
                      {f.audits.map((a, i) => (
                        <div key={a.id} className="relative mb-4 last:mb-0">
                          <div className={`absolute -left-[11px] top-1 w-2.5 h-2.5 rounded-full ${i === f.audits.length - 1 ? 'bg-red-500' : 'bg-brand-500'} timeline-dot`} />
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-800">{a.operator}</span>
                            <span className="badge bg-slate-100 text-slate-600 text-[10px]">{actionLabel(a.action)}</span>
                            <span className="text-xs text-slate-400 font-mono ml-auto">{new Date(a.timestamp).toLocaleString('zh-CN')}</span>
                          </div>
                          {a.reason && (
                            <div className={`text-xs mt-1 px-2 py-1 rounded border inline-block ${i === f.audits.length - 1 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                              {a.reason}
                            </div>
                          )}
                          {a.oldValue || a.newValue ? (
                            <div className="text-xs mt-1 bg-white border border-slate-200 rounded px-2 py-1.5 font-mono">
                              <span className="text-red-600 line-through">{a.oldValue || '(空)'}</span>
                              <span className="mx-2 text-slate-400">→</span>
                              <span className="text-emerald-600">{a.newValue || '(空)'}</span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {failures.length === 0 && (
            <div className="card px-5 py-10 text-center text-slate-400 text-sm">暂无失败记录</div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {corrections.map(c => {
            let before: Record<string, any> = {};
            let after: Record<string, any> = {};
            try { before = JSON.parse(c.beforeData); } catch {}
            try { after = JSON.parse(c.afterData); } catch {}
            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800 font-mono">{c.id}</span>
                        <span className={`badge ${c.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : c.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {c.status === 'approved' ? '已审核通过' : c.status === 'rejected' ? '已驳回' : '待审核'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span>授权编号：<span className="font-mono">{c.authId}</span></span>
                        <span className="flex items-center gap-1"><User size={11} />操作人：{c.operator}</span>
                        {c.reviewedBy && <span>审核：{c.reviewedBy}</span>}
                        <span className="flex items-center gap-1"><Clock size={11} />{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-start">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-[11px] text-red-600 font-medium mb-1">更正前</div>
                          {Object.entries(before).map(([k, v]) => (
                            <div key={k} className="text-xs font-mono">
                              <span className="text-red-500">{k}</span>: <span className="text-red-700">{String(v) || '(空)'}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center h-full pt-4">
                          <ChevronRight size={20} className="text-slate-400" />
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="text-[11px] text-emerald-600 font-medium mb-1">更正后</div>
                          {Object.entries(after).map(([k, v]) => (
                            <div key={k} className="text-xs font-mono">
                              <span className="text-emerald-500">{k}</span>: <span className="text-emerald-700">{String(v) || '(空)'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        <span className="font-medium text-slate-500">更正原因：</span>{c.reason}
                      </div>
                    </div>
                  </div>
                  <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => nav(`/detail/${c.authId}`)}>
                    <Eye size={12} />查看完整记录
                  </button>
                </div>
              </div>
            );
          })}
          {corrections.length === 0 && (
            <div className="card px-5 py-10 text-center text-slate-400 text-sm">暂无人工更正记录</div>
          )}
        </div>
      )}
    </div>
  );
}

function actionLabel(a: string): string {
  return { create: '创建', update: '更新', revoke: '撤销', correct: '人工更正', export: '导出', phone_auth: '电话授权' }[a] ?? a;
}
