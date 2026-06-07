import { useEffect, useState } from 'react';
import {
  History, Search, Filter, User, Clock, FileText, Baby,
  Shield, AlertTriangle,
} from 'lucide-react';
import { auditApi } from '../lib/api.js';
import type { AuditLog } from 'shared/types.js';
import { cn } from '../lib/utils.js';

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState({ action: '', operator: '' });
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    auditApi.timeline({ limit: 300 }).then(setLogs);
  }, []);

  const filtered = logs.filter(l =>
    (!filter.action || l.action === filter.action) &&
    (!filter.operator || l.operator.includes(filter.operator))
  );

  const stats = {
    total: logs.length,
    phoneAuth: logs.filter(l => l.action === 'phone_auth').length,
    correct: logs.filter(l => l.action === 'correct').length,
    export: logs.filter(l => l.action === 'export').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold text-slate-800 mb-1 flex items-center gap-2">
          <History size={20} className="text-brand-500" />
          审计追踪
        </h1>
        <p className="text-sm text-slate-500">全门店所有操作的完整时间线，用于财务复盘与主管复查。谁改过、什么时候改的、改了什么一目了然。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatItem icon={FileText} label="审计事件总数" value={stats.total} color="blue" />
        <StatItem icon={Shield} label="电话授权" value={stats.phoneAuth} color="amber" hint="重点复核项" />
        <StatItem icon={Shield} label="人工更正" value={stats.correct} color="sky" hint="财务留痕" />
        <StatItem icon={FileText} label="导出记录" value={stats.export} color="green" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 w-56"
                placeholder="按操作人搜索..."
                value={filter.operator}
                onChange={(e) => setFilter({ ...filter, operator: e.target.value })}
              />
            </div>
            <button className="btn-secondary" onClick={() => setShowFilter(v => !v)}>
              <Filter size={14} />按操作类型
            </button>
          </div>
          <div className="text-xs text-slate-400">
            显示 {filtered.length} / {logs.length} 条记录
          </div>
        </div>
        {showFilter && (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className={`badge ${!filter.action ? 'bg-brand-500 text-white border border-brand-500' : 'bg-white text-slate-600 border border-slate-200'}`}
                onClick={() => setFilter({ ...filter, action: '' })}
              >全部</button>
              {[
                ['create', '创建'],
                ['update', '更新'],
                ['phone_auth', '电话授权'],
                ['correct', '人工更正'],
                ['revoke', '撤销'],
                ['export', '导出'],
              ].map(([v, l]) => (
                <button
                  key={v}
                  className={`badge ${filter.action === v ? 'bg-brand-500 text-white border border-brand-500' : 'bg-white text-slate-600 border border-slate-200'}`}
                  onClick={() => setFilter({ ...filter, action: v })}
                >{l}</button>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 py-5">
          <div className="relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-gradient-to-b from-brand-300 via-slate-200 to-slate-200" />
            {filtered.map((l, idx) => (
              <div key={l.id} className={cn('relative mb-6 last:mb-0', idx < 3 && 'animate-count-up')}>
                <div className={cn(
                  'timeline-dot absolute -left-[15px] top-1.5 w-3 h-3 rounded-full',
                  l.action === 'phone_auth' && 'bg-amber-500',
                  l.action === 'correct' && 'bg-sky-500',
                  l.action === 'revoke' && 'bg-red-500',
                  l.action === 'export' && 'bg-emerald-500',
                  !['phone_auth','correct','revoke','export'].includes(l.action) && 'bg-brand-500',
                )} />
                <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-200 hover:shadow-card-hover transition-all">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 text-sm flex items-center gap-1">
                          <User size={13} className="text-slate-400" />
                          {l.operator}
                        </span>
                        <span className={`badge ${
                          l.action === 'phone_auth' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          l.action === 'correct' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                          l.action === 'revoke' ? 'bg-red-50 text-red-700 border border-red-200' :
                          l.action === 'export' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {actionLabel(l.action)}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Baby size={11} />
                          <span className="font-mono">{l.authId}</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(l.timestamp).toLocaleString('zh-CN')}
                        {l.ip && <span className="font-mono ml-2">· {l.ip}</span>}
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400 font-mono">
                      #{String(idx + 1).padStart(3, '0')}
                    </div>
                  </div>
                  {l.field && (
                    <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-xs">
                      <span className="text-slate-500">字段变更：</span>
                      <span className="font-mono font-medium text-slate-700">{l.field}</span>
                      {l.oldValue !== undefined && l.oldValue !== '' ? (
                        <>
                          <span className="text-slate-300 mx-2">→</span>
                          <span className="text-red-600 line-through font-mono">{l.oldValue}</span>
                          <span className="text-slate-300 mx-2">→</span>
                          <span className="text-emerald-600 font-mono">{l.newValue || '(空)'}</span>
                        </>
                      ) : null}
                    </div>
                  )}
                  {l.reason && (
                    <div className="mt-2 text-xs text-slate-600 flex items-start gap-1.5">
                      {l.action === 'correct' && <AlertTriangle size={12} className="text-sky-500 mt-0.5 shrink-0" />}
                      <span className="text-slate-500">原因：</span>{l.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-slate-400 py-10 text-sm">暂无匹配的审计记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color, hint }: { icon: any; label: string; value: number; color: string; hint?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="kpi-card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-2xl font-serif font-bold text-slate-800 tabular-nums animate-count-up">
          {value.toLocaleString('zh-CN')}
        </div>
        {hint && <div className="text-[11px] text-slate-400 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

function actionLabel(a: string): string {
  return { create: '创建', update: '更新', revoke: '撤销', correct: '人工更正', export: '导出', phone_auth: '电话授权' }[a] ?? a;
}
