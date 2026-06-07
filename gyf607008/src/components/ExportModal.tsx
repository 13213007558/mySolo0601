import { useState } from 'react';
import { X, Download, AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { IssueCard } from '@/components/IssueCard';
import type { ExportReport } from '@shared/types';

interface Props {
  open: boolean;
  onClose: () => void;
  recordIds?: string[];
}

export function ExportModal({ open, onClose, recordIds = [] }: Props) {
  const exportRecords = useAppStore((s) => s.exportRecords);
  const clearExportReport = useAppStore((s) => s.clearExportReport);
  const lastReport = useAppStore((s) => s.lastExportReport);
  const loading = useAppStore((s) => s.loading);

  const [maskPhone, setMaskPhone] = useState(true);
  const [excludeInternal, setExcludeInternal] = useState(true);
  const [excludeAbnormal, setExcludeAbnormal] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  const doExport = async () => {
    await exportRecords({
      recordIds,
      maskPhone,
      excludeInternal,
      excludeAbnormal,
    });
  };

  const downloadCSV = (report: ExportReport) => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + report.csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `婴幼儿记录_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleClose = () => {
    clearExportReport();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-night-surface border border-night-border rounded-md w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-night-border">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent-amber" />
            <div className="text-sm font-semibold">导出数据</div>
          </div>
          <button
            onClick={handleClose}
            className="text-night-muted hover:text-night-text p-1 rounded hover:bg-night-border/50"
          >
            <X size={16} />
          </button>
        </div>

        {!lastReport ? (
          <>
            <div className="p-5 space-y-4">
              <div className="text-xs text-night-muted">
                本次共选中 <span className="text-night-text font-medium">{recordIds.length || '全部'}</span> 条记录
              </div>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maskPhone}
                    onChange={(e) => setMaskPhone(e.target.checked)}
                    className="accent-accent-amber"
                  />
                  手机号脱敏（中间 4 位替换为 ****）
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeInternal}
                    onChange={(e) => setExcludeInternal(e.target.checked)}
                    className="accent-accent-amber"
                  />
                  排除内部备注（仅导出家长可见内容）
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeAbnormal}
                    onChange={(e) => setExcludeAbnormal(e.target.checked)}
                    className="accent-accent-amber"
                  />
                  排除异常记录（仅导出正常和待复核记录）
                </label>
              </div>

              <div className="bg-night-bg border border-night-border rounded p-3 text-xs text-night-muted space-y-1.5">
                <div className="flex items-center gap-1.5 text-night-text font-medium">
                  <AlertTriangle size={12} className="text-accent-amber" />
                  导出前提示
                </div>
                <div>· 系统将在导出前自动进行数据质量校验，异常记录会在下方报告中单独列出</div>
                <div>· 导出操作会被记入审计日志，客服主管可追溯导出人、时间与范围</div>
                <div>· 如选择"排除异常记录"，被标记为异常的记录不会出现在 CSV 中</div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-night-border flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-1.5 text-xs rounded border border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50"
              >
                取消
              </button>
              <button
                onClick={doExport}
                disabled={loading}
                className="px-4 py-1.5 text-xs rounded bg-accent-amber/90 hover:bg-accent-amber text-night-bg font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={13} />
                {loading ? '处理中...' : '生成导出报告'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 flex-1 overflow-auto">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <StatBox label="总记录" value={lastReport.totalCount} icon={<FileText size={14} />} color="text-night-text" />
                <StatBox label="正常" value={lastReport.normalCount} icon={<CheckCircle size={14} />} color="text-status-normal" />
                <StatBox label="待复核" value={lastReport.warningCount} icon={<AlertTriangle size={14} />} color="text-status-pending" />
                <StatBox label="异常" value={lastReport.abnormalCount} icon={<AlertCircle size={14} />} color="text-status-abnormal" />
              </div>

              {lastReport.issues.length > 0 ? (
                <div>
                  <div className="text-xs font-medium text-night-text mb-2">
                    数据质量问题明细（{lastReport.issues.length} 条记录存在问题）
                  </div>
                  <div className="space-y-2">
                    {lastReport.issues.map((item) => (
                      <div key={item.recordId} className="border border-night-border rounded overflow-hidden">
                        <button
                          onClick={() => toggleExpand(item.recordId)}
                          className="w-full px-3 py-2 flex items-center justify-between text-xs bg-night-bg hover:bg-night-border/30"
                        >
                          <span className="flex items-center gap-2">
                            {expandedIds.has(item.recordId) ? (
                              <ChevronDown size={12} className="text-night-muted" />
                            ) : (
                              <ChevronRight size={12} className="text-night-muted" />
                            )}
                            <span className="font-medium">{item.babyName}</span>
                            <span className="text-night-muted">共 {item.issues.length} 项问题</span>
                          </span>
                          <span className="font-mono text-night-muted/60">{item.recordId}</span>
                        </button>
                        {expandedIds.has(item.recordId) && (
                          <div className="p-2 border-t border-night-border space-y-2">
                            {item.issues.map((issue) => (
                              <IssueCard key={issue.id} issue={issue} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-night-muted text-xs">
                  <CheckCircle size={24} className="mx-auto mb-2 text-status-normal" />
                  所有记录数据质量良好，无异常问题
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-night-border flex justify-between items-center">
              <div className="text-xs text-night-muted">
                {excludeAbnormal && lastReport.abnormalCount > 0 && (
                  <span className="text-status-pending">
                    已排除 {lastReport.abnormalCount} 条异常记录
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 text-xs rounded border border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50"
                >
                  关闭
                </button>
                <button
                  onClick={() => downloadCSV(lastReport)}
                  className="px-4 py-1.5 text-xs rounded bg-status-normal hover:bg-emerald-500 text-night-bg font-medium flex items-center gap-1.5"
                >
                  <Download size={13} />
                  下载 CSV
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="border border-night-border rounded bg-night-bg p-3">
      <div className={`flex items-center gap-1.5 text-xs mb-1 ${color}`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold font-mono">{value}</div>
    </div>
  );
}
