import { X, Download, AlertTriangle, CheckCircle, FileJson, FileSpreadsheet } from 'lucide-react';
import { useExport } from '../hooks/useExport';
import { cn } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const {
    exportOptions,
    setExportOptions,
    previewData,
    exportData,
    generateCSV,
    generateJSON,
  } = useExport();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">导出数据预览</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700">导出选项</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">导出格式</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExportOptions({ ...exportOptions, format: 'csv' })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-all',
                      exportOptions.format === 'csv'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    )}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => setExportOptions({ ...exportOptions, format: 'json' })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded border transition-all',
                      exportOptions.format === 'json'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    )}
                  >
                    <FileJson className="h-4 w-4" />
                    JSON
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">附加内容</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includePhotos}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, includePhotos: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    包含BMS拍照URL
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeHistory}
                      onChange={(e) =>
                        setExportOptions({ ...exportOptions, includeHistory: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    包含状态变更历史
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700">数据校验</h4>

            <div className="space-y-3">
              {previewData.amountMismatch ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      金额精度不一致警告
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      页面显示总金额: <code className="bg-amber-100 px-1 rounded">¥{previewData.totalAmount}</code>
                      {' ≠ '}
                      精确计算总金额: <code className="bg-amber-100 px-1 rounded">¥{previewData.preciseTotalAmount}</code>
                    </p>
                    <p className="text-xs text-amber-500 mt-1">
                      这是由于浮点数累加导致的精度问题。导出文件将同时包含显示值和精确值。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">金额精度校验通过</p>
                </div>
              )}

              {previewData.hasPhoneLeak ? (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      检测到手机号泄露风险
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      以下手机号未正确脱敏: {previewData.leakedPhones.join(', ')}
                    </p>
                    <p className="text-xs text-red-500 mt-1">
                      导出时将自动脱敏处理。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">所有手机号已正确脱敏</p>
                </div>
              )}

              {previewData.readmeInconsistencies.length > 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      README命令与页面不一致
                    </p>
                    {previewData.readmeInconsistencies.map((inc, idx) => (
                      <p key={idx} className="text-xs text-amber-600 mt-1">
                        字段 [{inc.field}]: 页面显示"{inc.pageValue}" ≠ 期望值"{inc.expectedValue}"
                      </p>
                    ))}
                    <p className="text-xs text-amber-500 mt-1">
                      请先返回列表页使用"一键修复"功能同步数据。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-800">README数据一致性校验通过</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">
                导出预览 ({previewData.alarms.length} 条记录)
              </h4>
              <span className="text-xs text-slate-500">
                合计金额: ¥{previewData.totalAmount}
              </span>
            </div>

            <div className="max-h-60 overflow-auto rounded-lg border border-slate-200">
              <pre className="p-4 text-xs bg-slate-50 text-slate-700 whitespace-pre-wrap font-mono">
                {exportOptions.format === 'csv' ? generateCSV() : generateJSON()}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            确认导出
          </button>
        </div>
      </div>
    </div>
  );
}
