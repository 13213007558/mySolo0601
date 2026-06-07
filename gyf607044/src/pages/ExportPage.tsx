import { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  History,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { exportToExcel, exportToPDF } from '@/utils/exporters';
import { formatDateTime } from '@/utils/helpers';
import type { RecordStatus, SourceType } from '@/types';
import { SOURCE_LABEL, STATUS_LABEL } from '@/types';

export default function ExportPage() {
  const records = useAppStore((s) => s.records);
  const exportLogs = useAppStore((s) => s.exportLogs);
  const appendLog = useAppStore((s) => s.appendExportLog);

  const [status, setStatus] = useState<RecordStatus | 'all'>('all');
  const [source, setSource] = useState<SourceType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeCorrupted, setIncludeCorrupted] = useState(false);
  const [operator, setOperator] = useState('护理主管');
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (!includeCorrupted && r.isCorrupted) return false;
      if (status !== 'all' && r.currentStatus !== status) return false;
      if (source !== 'all' && r.sourceType !== source) return false;
      if (startDate && r.createdAt.slice(0, 10) < startDate) return false;
      if (endDate && r.createdAt.slice(0, 10) > endDate) return false;
      return true;
    });
  }, [records, status, source, startDate, endDate, includeCorrupted]);

  const doExport = (fmt: 'xlsx' | 'pdf') => {
    if (!filtered.length) {
      setToast('没有符合条件的记录');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    if (fmt === 'xlsx') exportToExcel(filtered, operator);
    else exportToPDF(filtered, operator);
    appendLog({
      operator,
      filters: { status, source, startDate, endDate, includeCorrupted },
      format: fmt,
      count: filtered.length,
    });
    setToast(
      fmt === 'xlsx' ? 'Excel 已开始下载' : 'PDF 已开始下载'
    );
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up">
      {toast && (
        <div className="fixed top-20 right-6 z-50 rounded-xl2 bg-secondary text-white shadow-card px-5 py-3 flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      <div className="lg:col-span-2 card">
        <h3 className="font-display text-xl text-secondary mb-1">
          配置导出范围
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          按条件筛选需要导出的记录，导出文件会自动下载
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">状态</label>
            <select
              className="input-base"
              value={status}
              onChange={(e) => setStatus(e.target.value as RecordStatus | 'all')}
            >
              <option value="all">全部状态</option>
              {(
                [
                  'pending',
                  'processing',
                  'completed',
                  'rejected',
                  'cancelled',
                ] as const
              ).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">来源类型</label>
            <select
              className="input-base"
              value={source}
              onChange={(e) => setSource(e.target.value as SourceType | 'all')}
            >
              <option value="all">全部来源</option>
              {(['parent_submit', 'manual_entry', 'file_import'] as const).map(
                (s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABEL[s]}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="label-base">开始日期</label>
            <input
              type="date"
              className="input-base"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">结束日期</label>
            <input
              type="date"
              className="input-base"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">操作人（记录导出日志）</label>
            <input
              className="input-base"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
            />
          </div>
          <div className="flex items-end pb-2.5">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-muted text-secondary focus:ring-primary/30"
                checked={includeCorrupted}
                onChange={(e) => setIncludeCorrupted(e.target.checked)}
              />
              包含异常记录（坏数据）
            </label>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-cream p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">符合条件的记录</div>
            <div className="font-display text-2xl text-secondary">
              {filtered.length} <span className="text-sm text-gray-400 font-normal">条</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => doExport('pdf')}>
              <FileText size={16} /> 导出 PDF
            </button>
            <button className="btn-primary" onClick={() => doExport('xlsx')}>
              <FileSpreadsheet size={16} /> 导出 Excel
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display text-lg text-secondary mb-3 flex items-center gap-2">
          <History size={16} /> 导出日志
        </h3>
        {exportLogs.length === 0 ? (
          <div className="text-sm text-gray-400 py-8 text-center">
            暂无导出记录
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {exportLogs.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-muted/80 p-3 text-sm bg-cream/40"
              >
                <div className="flex items-center gap-2">
                  <Download
                    size={13}
                    className={l.format === 'xlsx' ? 'text-green-600' : 'text-red-500'}
                  />
                  <span className="font-medium text-secondary">
                    {l.format.toUpperCase()}
                  </span>
                  <span className="text-gray-500">· {l.count} 条</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  操作人：{l.operator}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDateTime(l.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
