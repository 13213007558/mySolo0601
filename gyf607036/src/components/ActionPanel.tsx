import { useState } from 'react';
import {
  MessageSquarePlus, RefreshCw, AlertTriangle,
  Trash2, RotateCcw, CheckCircle2,
} from 'lucide-react';
import type { PhotoAuthorization, AuthStatus, RemarkSource } from '@shared/types';
import { AUTH_STATUS_LABEL, REMARK_SOURCE_LABEL } from '@shared/types';
import { cn } from '@/utils';

interface Props {
  record: PhotoAuthorization;
  onUpdated: () => void;
}

export default function ActionPanel({ record, onUpdated }: Props) {
  const [remark, setRemark] = useState('');
  const [remarkSource, setRemarkSource] = useState<Exclude<RemarkSource, 'original_commitment'>>('supplement');
  const [operatorName, setOperatorName] = useState('陈顾问');
  const [targetStatus, setTargetStatus] = useState<AuthStatus>('authorized');
  const [statusReason, setStatusReason] = useState('');
  const [statusRemark, setStatusRemark] = useState('');
  const [badReason, setBadReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function doAction(tag: string, fn: () => Promise<void>) {
    setBusy(tag);
    setErr(null);
    try {
      await fn();
      showToast('已保存，历史版本已生成');
      onUpdated();
    } catch (e: any) {
      setErr(e.message || '操作失败');
    } finally {
      setBusy(null);
    }
  }

  async function submitRemark() {
    if (!remark.trim()) {
      setErr('请输入备注内容');
      return;
    }
    await doAction('remark', async () => {
      const res = await fetch(`/api/records/${record.id}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: remark.trim(),
          operatorName,
          source: remarkSource,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '保存失败');
      setRemark('');
    });
  }

  async function submitStatus() {
    if (!operatorName.trim()) {
      setErr('请填写操作人');
      return;
    }
    await doAction('status', async () => {
      const res = await fetch(`/api/records/${record.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          operatorName,
          reason: statusReason.trim() || undefined,
          supplementRemark: statusRemark.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '保存失败');
      setStatusReason('');
      setStatusRemark('');
    });
  }

  async function markBad() {
    if (!badReason.trim() || !operatorName.trim()) {
      setErr('原因和操作人均必填');
      return;
    }
    await doAction('bad', async () => {
      const res = await fetch(`/api/records/${record.id}/mark-bad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: badReason.trim(), operatorName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '保存失败');
      setBadReason('');
    });
  }

  async function restore() {
    if (!operatorName.trim()) {
      setErr('操作人必填');
      return;
    }
    await doAction('restore', async () => {
      const res = await fetch(`/api/records/${record.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '恢复失败');
    });
  }

  return (
    <aside className="sticky top-24 space-y-4">
      <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
        <h4 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <MessageSquarePlus className="w-4.5 h-4.5 text-brand-500" />
          补充备注
        </h4>
        <p className="text-[11px] text-gray-500 mb-3">
          新增备注为追加记录，不会覆盖原有承诺或历史说明。
        </p>
        <div className="space-y-2.5">
          <label className="block text-xs text-gray-500">备注来源</label>
          <div className="flex flex-wrap gap-1.5">
            {(['supplement', 'parent_revision', 'status_change'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRemarkSource(s)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-lg border transition',
                  remarkSource === s
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-cream-50 text-gray-600 border-cream-200 hover:bg-cream-100',
                )}
              >
                {REMARK_SOURCE_LABEL[s]}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="输入补充说明内容..."
            className="w-full p-2.5 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
          />
          <input
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            placeholder="操作人姓名"
            className="w-full p-2 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            onClick={submitRemark}
            disabled={busy === 'remark'}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-60"
          >
            {busy === 'remark' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            追加备注（保留历史）
          </button>
        </div>
      </section>

      <section className="bg-white rounded-card shadow-card border border-cream-200 p-5">
        <h4 className="font-serif text-base font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <RefreshCw className="w-4.5 h-4.5 text-brand-500" />
          变更授权状态
        </h4>
        <p className="text-[11px] text-gray-500 mb-3">
          状态变更会自动生成快照版本，原状态与理由都会保留。
        </p>
        <div className="space-y-2.5">
          <div>
            <label className="text-xs text-gray-500">变更为</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as AuthStatus)}
              className="w-full p-2 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {(['pending', 'authorized', 'partial', 'revoked', 'expired'] as AuthStatus[])
                .filter((s) => s !== 'bad_data')
                .map((s) => (
                  <option key={s} value={s}>
                    {AUTH_STATUS_LABEL[s]}
                  </option>
                ))}
            </select>
          </div>
          <input
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="变更原因（可选）"
            className="w-full p-2 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <textarea
            rows={2}
            value={statusRemark}
            onChange={(e) => setStatusRemark(e.target.value)}
            placeholder="可同时追加备注说明（可选）"
            className="w-full p-2 text-sm border border-cream-200 rounded-lg bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
          />
          <button
            onClick={submitStatus}
            disabled={busy === 'status'}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white bg-medical-500 hover:bg-medical-600 disabled:opacity-60"
          >
            {busy === 'status' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            更新状态并保存历史
          </button>
        </div>
      </section>

      {!record.isBadData ? (
        <section className="bg-white rounded-card shadow-card border border-danger-100 p-5">
          <h4 className="font-serif text-base font-semibold text-danger-600 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4.5 h-4.5" />
            标记为坏数据并隔离
          </h4>
          <p className="text-[11px] text-gray-500 mb-3">
            坏数据将从正常统计中移除，记录本身不会删除，可在详情页恢复。
          </p>
          <div className="space-y-2.5">
            <textarea
              rows={2}
              value={badReason}
              onChange={(e) => setBadReason(e.target.value)}
              placeholder="请填写隔离原因（必填）"
              className="w-full p-2 text-sm border border-danger-200 rounded-lg bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
            />
            <button
              onClick={markBad}
              disabled={busy === 'bad'}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white bg-danger-500 hover:bg-danger-600 disabled:opacity-60"
            >
              {busy === 'bad' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              移入坏数据隔离区
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-card shadow-card border border-safety-100 p-5">
          <h4 className="font-serif text-base font-semibold text-safety-600 mb-3 flex items-center gap-1.5">
            <RotateCcw className="w-4.5 h-4.5" />
            从坏数据隔离区恢复
          </h4>
          <p className="text-[11px] text-gray-500 mb-3">
            恢复后状态回到「待确认」，重新参与统计，历史版本全部保留。
          </p>
          <button
            onClick={restore}
            disabled={busy === 'restore'}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-white bg-safety-500 hover:bg-safety-600 disabled:opacity-60"
          >
            {busy === 'restore' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            恢复为待确认
          </button>
        </section>
      )}

      {err && (
        <div className="text-xs bg-danger-100 border border-red-200 text-danger-600 rounded-lg p-2.5">
          {err}
        </div>
      )}

      {toast && (
        <div className="fixed top-20 right-6 bg-safety-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in flex items-center gap-1.5 z-50">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </aside>
  );
}
