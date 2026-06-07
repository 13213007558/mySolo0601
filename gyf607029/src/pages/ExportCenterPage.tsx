import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileDown, FileSpreadsheet, FileText, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, Eye, Baby, Phone, AlertCircle, ClipboardList,
} from 'lucide-react';
import { exportApi } from '../lib/api.js';
import type { ExportRecord, ExportDiffItem } from 'shared/types.js';
import { ExportStatusBadge } from '../components/badges.js';

export function ExportCenterPage() {
  const nav = useNavigate();
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [diffs, setDiffs] = useState<Record<string, ExportDiffItem[]>>({});

  useEffect(() => {
    exportApi.records().then(setRecords);
  }, []);

  const toggleExpand = async (id: string) => {
    setExpanded(prev => prev === id ? null : id);
    if (!diffs[id]) {
      const d = await exportApi.diff(id);
      setDiffs(prev => ({ ...prev, [id]: d }));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-serif font-bold text-slate-800 mb-1 flex items-center gap-2">
          <FileDown size={20} className="text-brand-500" />
          导出中心
        </h1>
        <p className="text-sm text-slate-500">所有导出记录与差异审计。页面数量与导出数量不一致时会被拒绝并保留审计记录，方便主管复查。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="总导出次数" value={records.length} color="blue" />
        <StatCard icon={CheckCircle} label="完全成功" value={records.filter(r => r.status === 'success').length} color="green" />
        <StatCard icon={AlertTriangle} label="部分成功" value={records.filter(r => r.status === 'partial').length} color="orange" />
        <StatCard icon={AlertCircle} label="被拒绝" value={records.filter(r => r.status === 'rejected').length} color="red" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="section-title !mb-0">导出记录</div>
        </div>
        <div className="divide-y divide-slate-100">
          {records.map(r => {
            const isExpanded = expanded === r.id;
            const currentDiffs = diffs[r.id] ?? [];
            return (
              <div key={r.id}>
                <div
                  className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/60 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(r.id)}
                >
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div className="flex items-center gap-2 w-40">
                    {r.format === 'csv' ? (
                      <FileSpreadsheet size={16} className="text-emerald-600" />
                    ) : (
                      <FileText size={16} className="text-brand-600" />
                    )}
                    <span className="text-sm font-medium text-slate-800 font-mono">{r.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-700 flex items-center gap-2">
                      <span>{r.operator}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 text-xs">
                        筛选：{r.filterCriteria ? formatFilter(JSON.parse(r.filterCriteria || '{}')) : '无'}
                      </span>
                    </div>
                    {r.remark && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">备注：{r.remark}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm tabular-nums">
                    <div className="text-center">
                      <div className="text-xs text-slate-400">页面数</div>
                      <div className="font-semibold text-slate-700">{r.pageCount}</div>
                    </div>
                    <div className="text-slate-300">→</div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">导出数</div>
                      <div className={`font-semibold ${r.exportCount !== r.pageCount ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {r.exportCount}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-400">差异</div>
                      <div className={`font-semibold ${r.diffCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{r.diffCount}</div>
                    </div>
                    <ExportStatusBadge status={r.status} />
                    <div className="text-xs text-slate-400 font-mono">
                      {new Date(r.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                {isExpanded && r.diffCount > 0 && (
                  <div className="bg-slate-50/80 border-t border-slate-100 px-10 py-4">
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-500" />
                      差异详情（{currentDiffs.length} 条）
                    </div>
                    {currentDiffs.length === 0 ? (
                      <div className="text-sm text-slate-400 py-2">加载中...</div>
                    ) : (
                      <div className="space-y-2">
                        {currentDiffs.map(d => (
                          <div key={d.authId} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-slate-200">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <AlertTriangle size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                <Baby size={14} className="text-brand-500" />
                                {d.babyName}
                                <span className="text-xs text-slate-400 font-mono">{d.authId}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone size={11} />
                                {d.parentPhone}
                              </div>
                            </div>
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">
                              {d.reason}
                            </div>
                            <button
                              className="btn-secondary !px-2.5 !py-1.5 text-xs"
                              onClick={(e) => { e.stopPropagation(); nav(`/detail/${d.authId}`); }}
                            >
                              <Eye size={12} />
                              查看详情
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {records.length === 0 && (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">暂无导出记录</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
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
      </div>
    </div>
  );
}

function formatFilter(f: Record<string, any>): string {
  const parts: string[] = [];
  if (f.storeName) parts.push(`门店:${f.storeName}`);
  if (f.status) parts.push(`状态:${f.status}`);
  if (f.parentPhone) parts.push(`手机:${f.parentPhone}`);
  return parts.length > 0 ? parts.join('，') : '全部';
}
