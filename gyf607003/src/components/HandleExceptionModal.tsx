import { useState } from 'react';
import { X, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { appStore } from '@/store/app';
import type { ExceptionRecord, HandleExceptionResponse } from '@shared/types';
import { EXCEPTION_TYPE_LABEL } from '@shared/types';

interface Props {
  record: ExceptionRecord | null;
  onClose: () => void;
}

export default function HandleExceptionModal({ record, onClose }: Props) {
  const [measure, setMeasure] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<HandleExceptionResponse | null>(null);
  const handleException = appStore((s) => s.handleException);

  if (!record) return null;

  const syncLabels: Record<keyof HandleExceptionResponse['syncResults'], string> = {
    classPage: '班级页',
    babyDetail: '宝宝详情',
    backendCache: '后台接口',
    exportData: '导出清单',
  };

  async function submit() {
    if (!measure.trim()) return;
    setSubmitting(true);
    const res = await handleException(record.id, measure.trim());
    setResult(res);
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-accent-orange text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-serif-sc text-lg font-bold">处理异常记录</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!result ? (
          <div className="p-5 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-orange-800">异常类型：</span>
                <span className="text-orange-700">{EXCEPTION_TYPE_LABEL[record.type]}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-orange-800">涉及宝宝：</span>
                <span className="text-orange-700">{record.babyName}（{record.classId === 'c_small' ? '小班' : record.classId === 'c_middle' ? '中班' : '大班'}）</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-orange-800">异常原因：</span>
                <span className="text-orange-700">{record.reason}</span>
              </div>
              <div className="text-xs text-orange-500">
                创建时间：{new Date(record.createTime).toLocaleString('zh-CN')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                处理措施 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={measure}
                onChange={(e) => setMeasure(e.target.value)}
                rows={4}
                placeholder="请详细描述采取的处理措施..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                取消
              </button>
              <button
                onClick={submit}
                disabled={!measure.trim() || submitting}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                提交处理
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {result.historyLost ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800">历史记录已丢失</p>
                  <p className="text-sm text-amber-700">
                    原异常记录不存在，可能因历史数据清理或丢失导致。系统已创建审计记录确保可追溯，
                    四端同步状态标记为成功。
                  </p>
                  {result.historyLostItems && result.historyLostItems.length > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      缺失数据：{result.historyLostItems.join('、')}
                    </p>
                  )}
                  <p className="text-xs text-amber-600 mt-1">审计日志ID：{result.auditLogId}</p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">处理提交成功</p>
                  <p className="text-sm text-green-600">审计日志ID：{result.auditLogId}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">四端同步状态：</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(result.syncResults) as Array<keyof typeof result.syncResults>).map((k) => {
                  const ok = result.syncResults[k] === 'success';
                  return (
                    <div
                      key={k}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {ok ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span className="font-medium">{syncLabels[k]}</span>
                      <span className="ml-auto text-xs">{ok ? '成功' : '补偿中'}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                注：服务重启等情况下允许部分成功，系统会自动重试失败项，审计记录已永久保留。
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-600 transition"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
