import { useEffect, useMemo, useState } from 'react';
import {
  FileDown,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Calendar,
  Users,
  Loader2,
  ListFilter,
} from 'lucide-react';
import PrivacyCell from '@/components/PrivacyCell';
import { useScheduleStore } from '@/store/scheduleStore';
import { useAuthStore } from '@/store/authStore';
import type { DisinfectionRecord, ExportResult, UserRole } from '@/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import { formatDate, getRoleLabel, getSourceLabel } from '@/utils/format';
import { downloadCSV, downloadJSON, downloadDataUrl } from '@/utils/export';

type ExportScope = 'all' | 'class' | 'status' | 'date';
type ExportFormat = 'csv' | 'json';

interface ExportApiResponse {
  success: boolean;
  data: ExportResult;
}

interface PreviewRow {
  id: string;
  babyName: string;
  itemName: string;
  scheduledTime: string;
  temperature: number;
  operatorName?: string;
  handlerName?: string;
  source: string;
  isManual: boolean;
  status: string;
}

function PreviewTable({
  records,
  role,
}: {
  records: DisinfectionRecord[];
  role: UserRole;
}) {
  const previewRows: PreviewRow[] = records.slice(0, 5).map((r) => ({
    id: r.id,
    babyName: r.babyId,
    itemName: r.itemName,
    scheduledTime: r.scheduledTime,
    temperature: r.temperature,
    operatorName: r.operatorName,
    handlerName: r.handlerName,
    source: r.source,
    isManual: r.source === 'manual',
    status: r.status,
  }));

  const headers = [
    '宝宝名',
    '物品',
    '时间',
    '温度',
    '操作人',
    '处理人',
    '来源',
    '补录',
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200">
      <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-ink-500" />
          <span className="text-sm font-medium text-ink-700">脱敏预览（前 5 条样例）</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-medical-50 px-2.5 py-0.5 text-xs font-medium text-medical-700">
          <ShieldAlert className="h-3 w-3" />
          当前角色：{getRoleLabel(role)}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-200">
          <thead className="bg-ink-50">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 bg-white">
            {previewRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-ink-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              previewRows.map((row) => (
                <tr key={row.id} className="hover:bg-ink-50">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <PrivacyCell value={row.babyName} field="baby.name" role={role} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink-800">
                    {row.itemName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink-600">
                    {formatDate(row.scheduledTime, true)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink-800">
                    {row.temperature || '-'} ℃
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink-700">
                    {row.operatorName || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink-700">
                    {row.handlerName || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-ink-600">
                    {getSourceLabel(row.source as 'scan' | 'manual')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    {row.isManual ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-warm-100 px-2 py-0.5 text-xs font-medium text-warm-700">
                        补录
                      </span>
                    ) : (
                      <span className="text-xs text-ink-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ExportCenter() {
  const { currentUser } = useAuthStore();
  const { records, fetchAll } = useScheduleStore();

  const [scope, setScope] = useState<ExportScope>('all');
  const [classId, setClassId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [showPreview, setShowPreview] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role: UserRole | null = currentUser?.role ?? null;

  useEffect(() => {
    if (currentUser) {
      fetchAll();
    }
  }, [currentUser, fetchAll]);

  const filteredPreviewRecords = useMemo(() => {
    let result = records;
    if (scope === 'class' && classId) {
      result = result.filter((r) => r.classId === classId);
    }
    if (scope === 'status' && statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (scope === 'date') {
      if (startDate) {
        result = result.filter((r) => new Date(r.scheduledTime) >= new Date(startDate));
      }
      if (endDate) {
        result = result.filter((r) => new Date(r.scheduledTime) <= new Date(endDate + 'T23:59:59'));
      }
    }
    return result;
  }, [records, scope, classId, statusFilter, startDate, endDate]);

  const handleExport = async () => {
    if (!role) return;
    setExporting(true);
    setError(null);
    setExportResult(null);
    try {
      const body: Record<string, unknown> = { format };
      if (scope === 'class' && classId) body.classId = classId;
      if (scope === 'date') {
        if (startDate) body.startDate = startDate;
        if (endDate) body.endDate = endDate;
      }
      const res = await api<ExportApiResponse>('/export', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const result = (res as ExportApiResponse)?.data ?? (res as unknown as ExportResult);
      setExportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const filename = `disinfection-records-${new Date().toISOString().slice(0, 10)}`;
    if (exportResult.dataUrl) {
      downloadDataUrl(exportResult.dataUrl, `${filename}.${exportResult.format}`);
      return;
    }
    const data = (exportResult.data ?? []) as Record<string, unknown>[];
    if (exportResult.format === 'csv') {
      downloadCSV(data, `${filename}.csv`);
    } else {
      downloadJSON(data, `${filename}.json`);
    }
  };

  const canExport = role && role !== 'staff';

  return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <FileDown className="h-6 w-6 text-medical-600" />
            <h1 className="page-title text-2xl font-semibold text-ink-900">数据导出中心</h1>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            按范围筛选消毒记录并导出为 CSV 或 JSON 格式，支持脱敏预览与部分成功下载。
          </p>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-ink-800">导出选项</h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">导出范围</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(
                  [
                    { key: 'all', label: '全部记录', icon: CheckCircle },
                    { key: 'class', label: '按班级', icon: Users },
                    { key: 'status', label: '按状态', icon: ListFilter },
                    { key: 'date', label: '按日期范围', icon: Calendar },
                  ] as { key: ExportScope; label: string; icon: React.ElementType }[]
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = scope === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setScope(opt.key)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'border-medical-400 bg-medical-50 text-medical-700 shadow-sm'
                          : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {scope === 'class' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">选择班级</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                >
                  <option value="">全部班级</option>
                  <option value="c1">太阳班</option>
                  <option value="c2">月亮班</option>
                  <option value="c3">星星班</option>
                </select>
              </div>
            )}

            {scope === 'status' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">选择状态</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待执行</option>
                  <option value="processing">执行中</option>
                  <option value="completed">已完成</option>
                  <option value="exception">异常</option>
                </select>
              </div>
            )}

            {scope === 'date' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">开始日期</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-700">结束日期</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700">导出格式</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: 'csv' as ExportFormat, label: 'CSV 表格', icon: FileSpreadsheet },
                    { key: 'json' as ExportFormat, label: 'JSON 数据', icon: FileJson },
                  ]
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = format === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setFormat(opt.key)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'border-medical-400 bg-medical-50 text-medical-700 shadow-sm'
                          : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-medical-500 focus:ring-medical-200"
              />
              <span className="text-sm text-ink-700">显示脱敏预览</span>
            </label>

            {showPreview && role && (
              <PreviewTable records={filteredPreviewRecords} role={role} />
            )}

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-500">
                预计导出：<span className="font-medium text-ink-700">{filteredPreviewRecords.length}</span> 条记录
                {role && (
                  <>
                    {' · '}
                    当前角色：
                    <span className="font-medium text-ink-700">{getRoleLabel(role)}</span>
                    {role === 'staff' && (
                      <span className="ml-1 text-danger-600">（无导出权限）</span>
                    )}
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={handleExport}
                disabled={!canExport || exporting}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium shadow-sm transition',
                  canExport && !exporting
                    ? 'bg-medical-500 text-white hover:bg-medical-600 active:bg-medical-700'
                    : 'cursor-not-allowed bg-ink-200 text-ink-500'
                )}
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    生成导出
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3">
            <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-500" />
            <div>
              <p className="text-sm font-medium text-danger-800">导出失败</p>
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          </div>
        )}

        {exportResult && (
          <div className="space-y-3">
            {exportResult.failedCount > 0 && (
              <div className="rounded-xl border border-warm-300 bg-warm-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warm-600" />
                  <span className="text-sm font-semibold text-warm-800">
                    部分导出成功：成功 {exportResult.successCount} / {exportResult.totalCount} 条
                  </span>
                </div>
                <p className="mb-3 text-sm text-warm-700">
                  有 {exportResult.failedCount} 条记录因数据问题未能导出，成功部分仍可下载。
                </p>
                <ul className="space-y-1">
                  {exportResult.failedItems.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2 text-xs"
                    >
                      <span className="inline-flex h-5 flex-shrink-0 items-center justify-center rounded bg-warm-200 px-1.5 font-medium text-warm-800">
                        第 {item.rowIndex + 1} 行
                      </span>
                      <span className="text-warm-700">{item.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {exportResult.failedCount === 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-mint-500" />
                <div>
                  <p className="text-sm font-medium text-mint-800">导出成功</p>
                  <p className="text-sm text-mint-700">
                    共 {exportResult.successCount} 条记录已准备好下载。
                  </p>
                </div>
              </div>
            )}

            {exportResult.successCount > 0 && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-mint-600 active:bg-mint-700"
              >
                <Download className="h-4 w-4" />
                下载 {format.toUpperCase()} 文件
              </button>
            )}
          </div>
        )}
      </div>
  );
}
