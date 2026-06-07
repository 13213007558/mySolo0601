import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Download, FileSpreadsheet, Clock,
  Check, Filter,
} from 'lucide-react';
import { useRecordsStore } from '../store/useRecordsStore';
import { StatusPill, SourceChip } from '../components/Badges';
import { formatDateTime } from '../utils/format';
import type { RecordStatus, DataSource } from '../../shared/types';

export default function ExportCenter() {
  const { records, filters, stats, exportLogs, fetchRecords, fetchStats, fetchExportLogs, setFilters, exportRecords } =
    useRecordsStore();
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    infantName: true, courseName: true, originalDate: true, newDate: true,
    operator: true, status: true, latestNote: true, sourceFile: true,
    guardianName: false, guardianPhone: false, infantAge: false,
    reviewCount: false, dataSource: false, createdAt: false, updatedAt: false,
  });

  useEffect(() => {
    fetchRecords();
    fetchStats();
    fetchExportLogs();
  }, [fetchRecords, fetchStats, fetchExportLogs]);

  const allFieldOptions = [
    { k: 'infantName', l: '婴幼儿姓名' },
    { k: 'infantAge', l: '月龄' },
    { k: 'guardianName', l: '监护人' },
    { k: 'guardianPhone', l: '联系电话' },
    { k: 'courseName', l: '课程名称' },
    { k: 'originalDate', l: '原课程日期' },
    { k: 'newDate', l: '新课程日期' },
    { k: 'sourceFile', l: '来源文件' },
    { k: 'operator', l: '处理人' },
    { k: 'status', l: '状态' },
    { k: 'dataSource', l: '数据来源' },
    { k: 'latestNote', l: '最近说明' },
    { k: 'reviewCount', l: '复核次数' },
    { k: 'createdAt', l: '创建时间' },
    { k: 'updatedAt', l: '更新时间' },
  ];

  const toggleField = (k: string) =>
    setSelectedFields((s) => ({ ...s, [k]: !s[k] }));

  const applyFilter = (key: string, v: string | undefined) => {
    setFilters({ [key]: v } as any);
    setTimeout(() => fetchRecords(), 0);
  };

  const doExport = () => {
    exportRecords({ format, operator: '王园长' });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-8">
      <div className="mb-6 opacity-0 animate-fadeUp">
        <Link to="/" className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4" />返回对账台
        </Link>
        <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-teal-700">导出中心</h1>
        <p className="mt-1 text-sm text-slate2-500">
          配置筛选条件与字段，一键导出课程改期对账报表，用于审计与存档。
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-5 opacity-0 animate-fadeUp animate-delay-100">
          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 section-title">
              <Filter className="h-4 w-4 text-teal-500" />
              筛选条件
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">记录状态</label>
                <select
                  className="input-field"
                  value={filters.status || ''}
                  onChange={(e) => applyFilter('status', e.target.value || undefined)}
                >
                  <option value="">全部状态</option>
                  <option value="pending">待复核</option>
                  <option value="reviewed">已复核</option>
                  <option value="exception">异常</option>
                  <option value="supplemented">已补录</option>
                </select>
              </div>
              <div>
                <label className="label">数据来源</label>
                <select
                  className="input-field"
                  value={filters.dataSource || ''}
                  onChange={(e) => applyFilter('dataSource', e.target.value || undefined)}
                >
                  <option value="">全部来源</option>
                  <option value="normal">正常录入</option>
                  <option value="supplement">手工补录</option>
                  <option value="corrupted">坏数据</option>
                </select>
              </div>
              <div>
                <label className="label">起始日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={filters.dateFrom || ''}
                  onChange={(e) => applyFilter('dateFrom', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="label">截止日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={filters.dateTo || ''}
                  onChange={(e) => applyFilter('dateTo', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 section-title">
              <FileSpreadsheet className="h-4 w-4 text-teal-500" />
              导出配置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">导出格式</label>
                <div className="flex gap-2">
                  {[
                    { v: 'csv', l: 'CSV（逗号分隔）' },
                    { v: 'xlsx', l: 'Excel（.xlsx）' },
                  ].map(({ v, l }) => (
                    <button
                      key={v}
                      className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-all ${
                        format === v
                          ? 'border-teal-500/50 bg-teal-50 text-teal-700 shadow-inner'
                          : 'border-teal-500/10 bg-white text-slate2-500 hover:border-teal-500/20 hover:text-teal-600'
                      }`}
                      onClick={() => setFormat(v as any)}
                    >
                      <Download className="mr-1.5 inline h-4 w-4" />
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">导出字段（已选 {Object.values(selectedFields).filter(Boolean).length} / {allFieldOptions.length}）</label>
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-teal-500/8 bg-cream-50/40 p-3">
                  {allFieldOptions.map(({ k, l }) => (
                    <label
                      key={k}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        selectedFields[k] ? 'bg-teal-50 text-teal-700' : 'text-slate2-500 hover:bg-cream-100'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-all ${
                          selectedFields[k]
                            ? 'border-teal-500 bg-teal-500 text-white'
                            : 'border-slate2-400/50'
                        }`}
                        onClick={() => toggleField(k)}
                      >
                        {selectedFields[k] && <Check className="h-3 w-3" />}
                      </span>
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="divider my-5" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate2-500">
                当前筛选：<span className="font-medium text-teal-600">{records.length}</span> 条记录将被导出
              </div>
              <button className="btn-primary" onClick={doExport}>
                <Download className="h-4 w-4" />
                立即导出
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-5 opacity-0 animate-fadeUp animate-delay-200">
          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 section-title">
              <Clock className="h-4 w-4 text-teal-500" />
              导出历史
            </h3>
            <div className="space-y-3">
              {exportLogs.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate2-400">暂无导出记录</div>
              ) : (
                exportLogs.map((log) => (
                  <div
                    key={log.id}
                    className="group rounded-lg border border-teal-500/8 p-3 transition-all hover:border-teal-500/20 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-teal-700">
                          <FileSpreadsheet className="h-4 w-4 text-teal-500" />
                          改期对账报表
                          <span className="rounded bg-cream-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate2-500">
                            {log.format}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-slate2-500">
                          {formatDateTime(log.createdAt)} · {log.operator} · 共 {log.recordCount} 条
                        </div>
                      </div>
                      <a href={log.downloadUrl} className="btn-ghost !py-1 !px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100">
                        <Download className="h-3.5 w-3.5" />
                        下载
                      </a>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(log.filters)
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <span key={k} className="chip">
                            {k}: {String(v)}
                          </span>
                        ))}
                      {Object.keys(log.filters).length === 0 && (
                        <span className="text-xs text-slate2-400 italic">未应用筛选</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <h4 className="mb-3 font-serif text-sm font-semibold text-teal-700">快速统计</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatBox label="待复核" value={stats.pending} color="amber" />
              <StatBox label="已复核" value={stats.reviewed} color="teal" />
              <StatBox label="异常记录" value={stats.exception} color="rose" />
              <StatBox label="手工补录" value={stats.supplemented} color="violet" />
            </div>
            <div className="divider my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate2-500">记录总数</span>
              <span className="font-serif text-xl font-semibold text-teal-700">{stats.total}</span>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="mb-3 font-serif text-sm font-semibold text-teal-700">筛选结果预览</h4>
            <div className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin">
              {records.slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border border-teal-500/6 px-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-medium text-teal-700">{r.infantName}</span>
                    <span className="truncate text-slate2-500">{r.courseName}</span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <StatusPill status={r.status as RecordStatus} size="sm" />
                    <SourceChip source={r.dataSource as DataSource} />
                  </div>
                </div>
              ))}
              {records.length > 8 && (
                <div className="py-1 text-center text-xs text-slate2-400">
                  还有 {records.length - 8} 条...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600 bg-amber-50',
    teal: 'text-teal-600 bg-teal-50',
    rose: 'text-rose-600 bg-rose-50',
    violet: 'text-violet-600 bg-violet-50',
  };
  return (
    <div className={`rounded-md ${colorMap[color]} px-3 py-2.5`}>
      <div className="text-[11px] font-medium tracking-wider opacity-70">{label}</div>
      <div className="mt-0.5 font-serif text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
