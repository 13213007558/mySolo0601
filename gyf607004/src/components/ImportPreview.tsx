import { cn } from '@/lib/utils';
import type { ImportDryRunResult } from '@/types';
import { AlertCircle, CheckCircle2, FileWarning, X } from 'lucide-react';
import Button from './Button';

interface ImportPreviewProps {
  result: ImportDryRunResult;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

type PreviewRow =
  | { kind: 'valid'; idx: number; babyName: string; babyId: string; originalShift: string; originalDate: string; targetShift: string; targetDate: string; reason: string }
  | { kind: 'bad'; idx: number; rawData: Record<string, unknown>; errors: string[] };

export default function ImportPreview({ result, onConfirm, onCancel, loading }: ImportPreviewProps) {
  const validRows: PreviewRow[] = result.validRows.map((r, i) => ({
    kind: 'valid',
    idx: i,
    babyName: r.babyName,
    babyId: r.babyId,
    originalShift: r.originalShift,
    originalDate: r.originalDate,
    targetShift: r.targetShift,
    targetDate: r.targetDate,
    reason: r.reason,
  }));

  const badRows: PreviewRow[] = result.badRows.map((b) => ({
    kind: 'bad',
    idx: b.rowIndex,
    rawData: b.rawData,
    errors: b.errors,
  }));

  const rows: PreviewRow[] = [...validRows, ...badRows].sort((a, b) => a.idx - b.idx);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">导入预览</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            文件：<span className="font-medium text-gray-700">{result.sourceFileName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{result.totalRows}</span>
            <span>总行数</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-status-green">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">{result.validRows.length}</span>
            <span>正常</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-status-red">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{result.badRows.length}</span>
            <span>坏行</span>
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[50vh]">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">行号</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">宝宝姓名</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">宝宝编号</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">原班次</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">原日期</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">改期班次</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">改期日期</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">改期原因</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">错误原因</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) =>
              row.kind === 'valid' ? (
                <tr key={`v-${row.idx}`} className="border-l-4 border-status-green bg-white">
                  <td className="px-4 py-2.5 text-gray-500">{row.idx + 1}</td>
                  <td className="px-4 py-2.5 text-gray-900">{row.babyName}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.babyId}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.originalShift}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.originalDate}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.targetShift}</td>
                  <td className="px-4 py-2.5 text-gray-700">{row.targetDate}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">{row.reason}</td>
                  <td className="px-4 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-status-green" />
                  </td>
                </tr>
              ) : (
                <tr key={`b-${row.idx}`} className="border-l-4 border-status-red bg-status-red/5">
                  <td className="px-4 py-2.5 text-gray-500">{row.idx + 1}</td>
                  <td className="px-4 py-2.5 text-gray-900">{String(row.rawData.babyName ?? '')}</td>
                  <td className="px-4 py-2.5 text-gray-700">{String(row.rawData.babyId ?? '')}</td>
                  <td className="px-4 py-2.5 text-gray-700">{String(row.rawData.originalShift ?? '')}</td>
                  <td className="px-4 py-2.5 text-gray-700">{String(row.rawData.originalDate ?? '')}</td>
                  <td className="px-4 py-2.5 text-gray-700">{String(row.rawData.targetShift ?? '')}</td>
                  <td className="px-4 py-2.5 text-gray-700">{String(row.rawData.targetDate ?? '')}</td>
                  <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">
                    {String(row.rawData.reason ?? '')}
                  </td>
                  <td className="px-4 py-2.5">
                    <ul className="space-y-1">
                      {row.errors.map((err, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1 text-xs text-status-red"
                        >
                          <X className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-500">
                  <FileWarning className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                  无预览数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          取消
        </Button>
        <Button onClick={onConfirm} loading={loading} disabled={result.validRows.length === 0}>
          确认入库（{result.validRows.length} 条）
        </Button>
      </div>
    </div>
  );
}
