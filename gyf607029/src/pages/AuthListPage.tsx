import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Baby, ShieldCheck, Clock, Phone, AlertTriangle, FileCheck,
  Search, Filter, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Eye,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { KpiCard } from '../components/KpiCard.js';
import { AuthStatusBadge, AuthTypeBadge, MaterialStatusBadge } from '../components/badges.js';
import { exportApi, downloadText } from '../lib/api.js';
import type { ExportResult } from 'shared/types.js';

export function AuthListPage() {
  const nav = useNavigate();
  const { filter, setFilter, summary, loadSummary, list, total, loadList, selectedIds, toggleSelect, toggleSelectAll } = useAuthStore();
  const [showFilter, setShowFilter] = useState(true);
  const [exporting, setExporting] = useState<'csv' | 'markdown' | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warn'; msg: string } | null>(null);

  useEffect(() => {
    loadSummary();
    loadList();
  }, [filter]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const pageCount = total;
  const selected = list.filter(a => selectedIds.has(a.id));

  const handleExport = async (format: 'csv' | 'markdown') => {
    if (selectedIds.size === 0) {
      setToast({ type: 'warn', msg: '请先勾选要导出的记录' });
      return;
    }
    setExporting(format);
    try {
      const fn = format === 'csv' ? exportApi.csv : exportApi.markdown;
      const mime = format === 'csv' ? 'text/csv' : 'text/markdown';
      let result: ExportResult;
      try {
        result = await fn({
          ids: Array.from(selectedIds),
          operator: '张店长',
          filterCriteria: filter,
          pageCount: selectedIds.size,
          allowPartial: true,
        });
      } catch (e: any) {
        if (e?.response?.status === 409) {
          result = e.response.data as ExportResult;
        } else {
          throw e;
        }
      }

      if (result.status === 'rejected') {
        setToast({ type: 'error', msg: `导出被拒绝：${result.remark ?? '数量不一致'}。请前往导出中心查看差异。` });
      } else if (result.content && result.filename) {
        downloadText(result.filename, result.content, mime);
        const note = result.status === 'partial' ? `（部分成功：导出 ${result.exportCount} / 页面 ${result.pageCount} 条）` : '';
        setToast({ type: 'success', msg: `已导出 ${result.filename}${note}` });
      }
    } catch (e: any) {
      setToast({ type: 'error', msg: '导出失败：' + (e?.message ?? '未知错误') });
    } finally {
      setExporting(null);
    }
  };

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 10;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm flex items-center gap-2 animate-count-up ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {toast.type === 'success' && <FileCheck size={16} />}
          {toast.type === 'error' && <AlertTriangle size={16} />}
          {toast.type === 'warn' && <AlertTriangle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-serif font-bold text-slate-800 mb-1">婴幼儿接送授权列表</h1>
        <p className="text-sm text-slate-500">按手机号筛选 → 核对摘要 → 勾选并导出给客服。页面数量与导出数量严格一致。</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard icon={Baby} label="总记录数" value={summary.total} color="blue" hint="全部门店" />
          <KpiCard icon={ShieldCheck} label="有效授权" value={summary.active} color="green" hint="当前生效" />
          <KpiCard icon={Clock} label="临时授权" value={summary.temporary} color="orange" hint="含临时阿姨" />
          <KpiCard icon={Phone} label="电话授权" value={summary.phoneAuth} color="amber" hint="需重点复核" />
          <KpiCard icon={AlertTriangle} label="授权失败" value={summary.failed} color="red" hint="失败路径" />
          <KpiCard icon={FileCheck} label="待更正数" value={summary.pendingCorrection} color="sky" hint="人工更正路径" />
        </div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9 w-60"
                placeholder="按家长手机号搜索..."
                defaultValue={filter.parentPhone ?? ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setFilter({ parentPhone: (e.target as HTMLInputElement).value || undefined, page: 1 });
                  }
                }}
              />
            </div>
            <button className="btn-secondary" onClick={() => setShowFilter(v => !v)}>
              <Filter size={14} />
              <span>更多筛选</span>
              {showFilter ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              已选 <span className="font-semibold text-brand-600 tabular-nums">{selectedIds.size}</span> / 共 <span className="tabular-nums">{total}</span> 条
            </span>
            <button
              className="btn-secondary"
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
            >
              <FileSpreadsheet size={14} />
              <span>{exporting === 'csv' ? '导出中...' : '导出 CSV'}</span>
            </button>
            <button
              className="btn-primary"
              onClick={() => handleExport('markdown')}
              disabled={exporting !== null}
            >
              <Download size={14} />
              <span>{exporting === 'markdown' ? '导出中...' : '导出 Markdown 报告'}</span>
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">授权状态</label>
              <select
                className="input"
                value={filter.authStatus ?? ''}
                onChange={(e) => setFilter({ authStatus: e.target.value || undefined, page: 1 })}
              >
                <option value="">全部状态</option>
                <option value="active">有效</option>
                <option value="pending">待审核</option>
                <option value="failed">授权失败</option>
                <option value="revoked">已撤销</option>
                <option value="corrected">已人工更正</option>
                <option value="expired">已过期</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">授权类型</label>
              <select
                className="input"
                value={filter.authType ?? ''}
                onChange={(e) => setFilter({ authType: e.target.value || undefined, page: 1 })}
              >
                <option value="">全部类型</option>
                <option value="primary">常规授权</option>
                <option value="temporary">临时授权</option>
                <option value="phone">电话授权</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">所属门店</label>
              <select
                className="input"
                value={filter.storeName ?? ''}
                onChange={(e) => setFilter({ storeName: e.target.value || undefined, page: 1 })}
              >
                <option value="">全部门店</option>
                <option value="梧桐社区店">梧桐社区店</option>
                <option value="翠竹社区店">翠竹社区店</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-secondary w-full" onClick={() => setFilter({ parentPhone: undefined, authStatus: undefined, authType: undefined, storeName: undefined, page: 1 })}>
                重置筛选
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                    checked={list.length > 0 && list.every(a => selectedIds.has(a.id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>婴幼儿</th>
                <th>家长</th>
                <th>授权类型</th>
                <th>状态</th>
                <th>接送人</th>
                <th>材料</th>
                <th>最后更新</th>
                <th className="text-right pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-slate-400 py-10">暂无记录</td>
                </tr>
              )}
              {list.map((a) => {
                const missingMat = a.materials.some(m => m.status === 'missing');
                return (
                  <tr key={a.id} className={missingMat ? 'bg-amber-50/30' : undefined}>
                    <td>
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </td>
                    <td>
                      <div className="font-medium text-slate-800">{a.babyName}</div>
                      <div className="text-xs text-slate-400 font-mono">{a.id}</div>
                    </td>
                    <td>
                      <div className="text-slate-700">{a.parentName}</div>
                      <div className="text-xs text-slate-500 font-mono">{a.parentPhone}</div>
                    </td>
                    <td><AuthTypeBadge type={a.authType} /></td>
                    <td><AuthStatusBadge status={a.authStatus} /></td>
                    <td>
                      <div className="text-slate-700">
                        {a.pickups.slice(0, 2).map(p => (
                          <div key={p.id} className="text-xs leading-relaxed">
                            {p.name} <span className="text-slate-400">· {p.relation}</span>
                            {p.isPhoneAuth && <span className="ml-1 text-amber-600">📞</span>}
                          </div>
                        ))}
                        {a.pickups.length > 2 && (
                          <div className="text-xs text-slate-400">+{a.pickups.length - 2} 人</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {a.materials.map(m => (
                          <MaterialStatusBadge key={m.id} status={m.status} />
                        ))}
                        {a.materials.length === 0 && <span className="text-xs text-slate-400">未上传</span>}
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-600 text-xs">{new Date(a.updatedAt).toLocaleString('zh-CN')}</div>
                      <div className="text-xs text-slate-400">{a.lastOperator}</div>
                    </td>
                    <td className="text-right pr-4">
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => nav(`/detail/${a.id}`)}>
                        <Eye size={13} />
                        详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            第 <span className="font-mono">{page}</span> / <span className="font-mono">{totalPages}</span> 页，共 {total} 条
          </div>
          <div className="flex items-center gap-1">
            <select
              className="input !w-auto !py-1.5 text-xs"
              value={pageSize}
              onChange={(e) => setFilter({ pageSize: parseInt(e.target.value, 10), page: 1 })}
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n} 条/页</option>)}
            </select>
            <button className="btn-secondary !px-2 !py-1.5" disabled={page <= 1} onClick={() => setFilter({ page: page - 1 })}>
              <ChevronLeft size={14} />
            </button>
            <button className="btn-secondary !px-2 !py-1.5" disabled={page >= totalPages} onClick={() => setFilter({ page: page + 1 })}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
