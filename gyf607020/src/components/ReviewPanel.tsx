import { useState } from 'react';
import { CheckCircle, XCircle, AlertOctagon, RefreshCw } from 'lucide-react';
import type { MilkRecord } from '@shared/types';
import { useStore } from '@/store/useStore';

interface Props {
  record: MilkRecord;
  onUpdated: () => void;
}

export default function ReviewPanel({ record, onUpdated }: Props) {
  const { currentUser, fetchRecords } = useStore();
  const [status, setStatus] = useState<'approved' | 'rejected'>(record.status === 'rejected' ? 'rejected' : 'approved');
  const [reason, setReason] = useState(record.reviewReason || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReview() {
    if (!reason.trim()) {
      setError('请填写复核原因');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewReason: reason.trim(),
          handlerName: currentUser,
        }),
      });
      if (!res.ok) throw new Error('提交失败');
      await fetchRecords();
      onUpdated();
    } catch (e: any) {
      setError(e.message || '提交失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkBad() {
    const badReason = window.prompt('请输入标记为坏数据的原因：');
    if (!badReason || !badReason.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${record.id}/mark-bad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: badReason.trim(), handlerName: currentUser }),
      });
      if (!res.ok) throw new Error('标记失败');
      await fetchRecords();
      onUpdated();
    } catch (e: any) {
      setError(e.message || '标记失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!window.confirm('确认要从坏数据区恢复这条记录？恢复后状态变为"待复核"')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${record.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handlerName: currentUser }),
      });
      if (!res.ok) throw new Error('恢复失败');
      await fetchRecords();
      onUpdated();
    } catch (e: any) {
      setError(e.message || '恢复失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-cream-200 p-5 sticky top-24 animate-fade-in">
      <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4">复核操作面板</h3>

      {!record.isBadData ? (
        <>
          <div className="space-y-1 mb-3">
            <label className="text-xs text-gray-500">复核结果</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('approved')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  status === 'approved'
                    ? 'bg-green-500 text-white border-green-500 shadow'
                    : 'bg-white text-gray-600 border-cream-300 hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                通过
              </button>
              <button
                type="button"
                onClick={() => setStatus('rejected')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  status === 'rejected'
                    ? 'bg-red-500 text-white border-red-500 shadow'
                    : 'bg-white text-gray-600 border-cream-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                }`}
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
            </div>
          </div>

          <div className="space-y-1 mb-3">
            <label className="text-xs text-gray-500">复核原因 *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细填写复核说明，将作为导出时的原因字段"
              rows={3}
              className="w-full px-3 py-2 border border-cream-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition-all bg-cream-50/50 resize-none"
            />
          </div>

          <div className="space-y-1 mb-4">
            <label className="text-xs text-gray-500">处理人</label>
            <div className="px-3 py-2 bg-cream-100 border border-cream-200 rounded-lg text-sm text-gray-700 font-medium">
              {currentUser}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={submitReview}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-400 text-white font-medium shadow hover:bg-brand-500 hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {loading ? '提交中...' : '提交复核（立即写入数据库）'}
            </button>
            <button
              onClick={handleMarkBad}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium transition-all disabled:opacity-50"
            >
              <AlertOctagon className="w-4 h-4" />
              标记为坏数据（移入隔离区）
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium mb-1">该记录已被标记为坏数据</p>
            <p className="text-xs text-red-600">
              原因：{record.reviewReason}
            </p>
            <p className="text-xs text-red-600 mt-1">
              处理人：{record.handlerName}
            </p>
          </div>
          <button
            onClick={handleRestore}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-500 text-white font-medium shadow hover:bg-amber-600 hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            从坏数据区恢复
          </button>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
