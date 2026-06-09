import { useState } from 'react';
import { X, Copy, Download, CheckCircle, AlertTriangle, FileText, User, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMeterStore } from '@/store/useMeterStore';
import { ReviewSummary, ERROR_TYPE_LABELS } from '@/types';
import { exportSummaryToClipboard, exportSummaryToFile, generateMarkdownReport } from '@/utils/report';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const generateSummary = useMeterStore((state) => state.generateSummary);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const summary: ReviewSummary | null = isOpen ? generateSummary() : null;

  if (!isOpen || !summary) return null;

  const { statistics, errorBreakdown, pendingItems, multiplierChanges, multiplierDifference } = summary;
  const total = statistics.totalRecords || 1;

  const errorTypes = Object.entries(errorBreakdown)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const handleCopyToClipboard = async () => {
    try {
      await exportSummaryToClipboard(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleDownloadFile = () => {
    setExporting(true);
    try {
      exportSummaryToFile(summary);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  const markdown = generateMarkdownReport(summary);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-industrial-card rounded-2xl border border-industrial-border shadow-card-hover overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-industrial-border">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-400" />
              复核摘要预览
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              可直接复制发送给班组长，或下载为 Markdown 文件
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-industrial-hover transition-colors text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary-500/10 to-status-purple/10 border border-primary-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">青岚光伏二区电表复核摘要</h3>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {format(summary.generatedAt, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {summary.operator}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    复核范围: {format(summary.dateRange.start, 'MM-dd', { locale: zhCN })} ~{' '}
                    {format(summary.dateRange.end, 'MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="btn-primary py-2 text-sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制全文
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadFile}
                    disabled={exporting}
                    className="btn-secondary py-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    下载文件
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                一、数量统计
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: '总记录数', value: statistics.totalRecords, color: 'primary', icon: FileText },
                  { label: '正常记录', value: statistics.normalRecords, color: 'success', icon: CheckCircle },
                  { label: '问题记录', value: statistics.problemRecords, color: 'warning', icon: AlertTriangle },
                  { label: '待拍板', value: statistics.pendingRecords, color: 'danger', icon: Clock },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`p-4 rounded-xl border bg-${
                      item.color === 'primary' ? 'primary-500/10 border-primary-500/30' :
                      item.color === 'success' ? 'status-success/10 border-status-success/30' :
                      item.color === 'warning' ? 'status-warning/10 border-status-warning/30' :
                      'status-danger/10 border-status-danger/30'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mb-2 text-${
                      item.color === 'primary' ? 'primary-400' :
                      item.color === 'success' ? 'status-success' :
                      item.color === 'warning' ? 'status-warning' :
                      'status-danger'
                    }`} />
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="text-2xl font-bold font-mono-tabular mt-1">
                      {item.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((item.value / total) * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {errorTypes.length > 0 && (
              <div>
                <h4 className="text-base font-semibold mb-4">二、问题原因分类</h4>
                <div className="space-y-3">
                  {errorTypes.map(([type, count], index) => (
                    <div key={type} className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-200">
                            {ERROR_TYPE_LABELS[type as keyof typeof ERROR_TYPE_LABELS]}
                          </span>
                          <span className="text-sm text-gray-400 font-mono-tabular">
                            {count}条 ({((count / statistics.problemRecords) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-industrial-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-primary transition-all duration-500"
                            style={{ width: `${(count / statistics.problemRecords) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingItems.length > 0 && (
              <div>
                <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-status-warning" />
                  三、待拍板记录（需班组长决策）
                </h4>
                <div className="overflow-x-auto rounded-xl border border-industrial-border">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="table-header bg-industrial-bg">电表编号</th>
                        <th className="table-header bg-industrial-bg">问题描述</th>
                        <th className="table-header bg-industrial-bg">上报时间</th>
                        <th className="table-header bg-industrial-bg">建议处理</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingItems.slice(0, 5).map((item) => (
                        <tr key={item.id} className="table-row">
                          <td className="table-cell font-mono text-primary-400">{item.meterNo}</td>
                          <td className="table-cell">{item.errorMessage}</td>
                          <td className="table-cell text-gray-400">
                            {format(item.importedAt, 'MM-dd HH:mm', { locale: zhCN })}
                          </td>
                          <td className="table-cell">
                            <span className="badge bg-status-warning/20 text-status-warning border-status-warning/30">
                              核实后{item.errorType === 'late_supplement' ? '补录' : '修正'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pendingItems.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ...还有 {pendingItems.length - 5} 条待处理记录
                  </p>
                )}
              </div>
            )}

            {multiplierChanges.length > 0 && (
              <div>
                <h4 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-status-purple" />
                  四、分表倍率变更说明
                </h4>
                <div className="p-5 rounded-xl bg-status-purple/10 border border-status-purple/30">
                  <p className="text-sm text-gray-300 mb-3">
                    老周于{' '}
                    {format(multiplierChanges[multiplierChanges.length - 1].createdAt, 'MM-dd HH:mm', {
                      locale: zhCN,
                    })}{' '}
                    手工更新 {multiplierChanges.length} 台电表倍率
                  </p>
                  <ul className="space-y-2 mb-4">
                    {multiplierChanges.map((m) => (
                      <li key={m.id} className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-purple" />
                        <span className="font-mono text-primary-400">{m.meterNo}</span>：
                        倍率 <span className="font-mono text-gray-200">×{m.multiplier}</span>，
                        {m.note}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-industrial-bg/50">
                    <span className="text-sm text-gray-400">补录前后差异</span>
                    <span
                      className={`text-sm font-semibold font-mono-tabular ${
                        Math.abs(multiplierDifference.percentage) <= 5
                          ? 'text-status-success'
                          : 'text-status-danger'
                      }`}
                    >
                      总读数偏差 {multiplierDifference.percentage >= 0 ? '+' : ''}
                      {multiplierDifference.percentage.toFixed(2)}%
                      <span className="text-xs text-gray-500 ml-2">
                        （{Math.abs(multiplierDifference.percentage) <= 5 ? '在允许范围内' : '超出允许范围，请核实'}）
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-industrial-bg/50 border border-industrial-border">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Markdown 原文预览</h4>
              <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap bg-industrial-bg p-4 rounded-lg max-h-60 overflow-y-auto">
                {markdown}
              </pre>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-industrial-border flex items-center justify-between">
          <p className="text-xs text-gray-500">
            *此摘要由能源园区电表复核台自动生成
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-secondary py-2 text-sm">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
