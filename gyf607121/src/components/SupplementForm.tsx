import { useState, useMemo } from 'react';
import { X, Wrench, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useMeterStore } from '@/store/useMeterStore';
import { ProblemRecord } from '@/types';
import { getErrorTypeColor, getErrorTypeLabel } from '@/utils/validation';
import { revalidateRecord } from '@/utils/parser';

interface SupplementFormProps {
  record: ProblemRecord;
  onClose: () => void;
}

export default function SupplementForm({ record, onClose }: SupplementFormProps) {
  const resolveProblem = useMeterStore((state) => state.resolveProblem);
  const rejectProblem = useMeterStore((state) => state.rejectProblem);
  const supplementRecord = useMeterStore((state) => state.supplementRecord);

  const [formData, setFormData] = useState({
    meterNo: record.meterNo.replace(/[^0-9]/g, ''),
    reading: record.reading || '',
    readingTime: format(record.readingTime, 'yyyy-MM-dd\'T\'HH:mm'),
    multiplier: record.multiplier || '',
  });

  const [note, setNote] = useState('');
  const [lateReason, setLateReason] = useState('');
  const [isLateSupplement, setIsLateSupplement] = useState(record.errorType === 'late_supplement');
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'resolve' | 'reject' | 'supplement'>('resolve');
  const showDataForm = useMemo(() => action !== 'reject', [action]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (action === 'reject') {
        if (!note.trim()) {
          throw new Error('请填写驳回原因');
        }
        rejectProblem(record.id, note);
      } else if (action === 'supplement') {
        if (!lateReason.trim()) {
          throw new Error('请填写补录晚到原因');
        }
        const updates = {
          meterNo: formData.meterNo,
          reading: parseFloat(String(formData.reading)),
          readingTime: new Date(formData.readingTime),
          multiplier: parseFloat(String(formData.multiplier)),
        };
        supplementRecord(record.id, updates, lateReason);
      } else {
        const updates = {
          meterNo: formData.meterNo,
          reading: parseFloat(String(formData.reading)),
          readingTime: new Date(formData.readingTime),
          multiplier: parseFloat(String(formData.multiplier)),
        };

        const validation = revalidateRecord(record, updates);
        if (!validation.isValid) {
          throw new Error(validation.errorMessage || '数据校验失败');
        }

        resolveProblem(record.id, updates, note);
      }

      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-industrial-card rounded-2xl border border-industrial-border shadow-card-hover overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between p-6 border-b border-industrial-border">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-400" />
              处理问题记录
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              电表编号: <span className="font-mono text-primary-400">{record.meterNo}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-industrial-hover transition-colors text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 rounded-xl bg-industrial-bg/50 border border-industrial-border">
            <div className="flex items-center gap-3 mb-3">
              <span className={`badge ${getErrorTypeColor(record.errorType)}`}>
                <AlertTriangle className="w-3 h-3" />
                {getErrorTypeLabel(record.errorType)}
              </span>
              <span className="badge bg-status-warning/20 text-status-warning border-status-warning/30">
                <Clock className="w-3 h-3" />
                待处理
              </span>
            </div>
            <p className="text-sm text-gray-300">{record.errorMessage}</p>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">原始读数:</span>{' '}
                <span className="font-mono">{record.reading}</span>
              </div>
              <div>
                <span className="text-gray-500">原始倍率:</span>{' '}
                <span className="font-mono">×{record.multiplier}</span>
              </div>
              <div>
                <span className="text-gray-500">行号:</span>{' '}
                <span className="font-mono">#{record.rowIndex}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6 p-1 bg-industrial-bg rounded-xl">
            <button
              onClick={() => setAction('resolve')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                action === 'resolve'
                  ? 'bg-gradient-success text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              修正数据
            </button>
            <button
              onClick={() => setAction('supplement')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                action === 'supplement'
                  ? 'bg-gradient-warning text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              补录晚到
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                action === 'reject'
                  ? 'bg-gradient-danger text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <XCircle className="w-4 h-4" />
              驳回忽略
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {showDataForm && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">电表编号 *</label>
                    <input
                      type="text"
                      value={formData.meterNo}
                      onChange={(e) =>
                        setFormData({ ...formData, meterNo: e.target.value.replace(/[^0-9]/g, '') })
                      }
                      placeholder="8位数字编号"
                      className="input-field font-mono"
                      maxLength={8}
                      pattern="\d{8}"
                      required={showDataForm}
                    />
                  </div>
                  <div>
                    <label className="label">电表读数 *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.reading}
                      onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                      placeholder="请输入正确读数"
                      className="input-field font-mono"
                      required={showDataForm}
                    />
                  </div>
                  <div>
                    <label className="label">抄表时间 *</label>
                    <input
                      type="datetime-local"
                      value={formData.readingTime}
                      onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                      className="input-field"
                      required={showDataForm}
                    />
                  </div>
                  <div>
                    <label className="label">倍率 *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                      placeholder="如: 40, 60, 80"
                      className="input-field font-mono"
                      required={showDataForm}
                    />
                  </div>
                </div>

                {formData.reading && formData.multiplier && (
                  <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30">
                    <p className="text-sm text-gray-400">
                      计算后数值:{' '}
                      <span className="font-mono text-lg font-bold text-status-success">
                        {(parseFloat(String(formData.reading)) * parseFloat(String(formData.multiplier))).toLocaleString(
                          'zh-CN',
                          { maximumFractionDigits: 2 }
                        )}{' '}
                        kWh
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            {action === 'supplement' && (
              <div>
                <label className="label">
                  补录晚到原因 <span className="text-status-danger">*</span>
                </label>
                <select
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">请选择原因</option>
                  <option value="材料送达延迟 - 物流原因">材料送达延迟 - 物流原因</option>
                  <option value="材料送达延迟 - 供应方问题">材料送达延迟 - 供应方问题</option>
                  <option value="班组交接遗漏">班组交接遗漏</option>
                  <option value="系统导出延迟">系统导出延迟</option>
                  <option value="人工录入疏漏">人工录入疏漏</option>
                  <option value="其他">其他（请在备注中说明）</option>
                </select>
                {isLateSupplement && (
                  <p className="text-xs text-status-warning mt-2">
                    此记录已标记为补录晚到，将在摘要中单独列出供班组长决策
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="label">
                {action === 'reject' ? '驳回原因' : '处理备注'}
                <span className="text-status-danger">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  action === 'reject'
                    ? '请详细说明驳回原因...'
                    : '请填写处理说明，供后续复盘...'
                }
                rows={3}
                className="input-field resize-none"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-status-danger/10 border border-status-danger/30">
                <p className="text-sm text-status-danger flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2.5 px-6"
              >
                取消
              </button>
              <button
                type="submit"
                className={`${
                  action === 'resolve'
                    ? 'btn-success'
                    : action === 'supplement'
                    ? 'btn-warning'
                    : 'btn-danger'
                } py-2.5 px-6`}
              >
                {action === 'resolve' && (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    确认修正
                  </>
                )}
                {action === 'supplement' && (
                  <>
                    <Clock className="w-4 h-4" />
                    标记补录
                  </>
                )}
                {action === 'reject' && (
                  <>
                    <XCircle className="w-4 h-4" />
                    确认驳回
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
