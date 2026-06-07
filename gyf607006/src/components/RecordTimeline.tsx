import { Clock, Shield, ShieldAlert, ShieldQuestion, ImageOff, FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { AuthRecord } from '@shared/types';
import { SOURCE_LABEL, sourceColor, formatDateTime } from '@/utils/format';

function diffStatus(prev?: AuthRecord, curr?: AuthRecord): string | null {
  if (!prev || !curr) return null;
  if (prev.status !== curr.status) return `状态：${prev.status} → ${curr.status}`;
  return null;
}

export default function RecordTimeline({ records }: { records: AuthRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-night-400/60 p-8 text-center text-sm text-night-300">
        暂无任何授权记录
      </div>
    );
  }

  return (
    <ol className="relative ml-2 border-l border-night-400/60">
      {records.map((r, idx) => {
        const prev = records[idx + 1];
        const isSupplement = r.source !== 'original';
        const diff = diffStatus(prev, r);
        return (
          <li key={r.id} className="fade-in-up relative pl-8 pb-6" style={{ animationDelay: `${idx * 60}ms` }}>
            <span
              className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-night-700 ${
                r.source === 'manual' ? 'bg-orange-400'
                : r.source === 'supplement' ? 'bg-amber-400'
                : r.source === 'revocation_notice' ? 'bg-rose-400'
                : 'bg-emerald-400'
              }`}
            />
            <div
              className={`rounded-lg border p-4 backdrop-blur transition ${
                isSupplement
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-night-500/60 bg-night-600/60'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-semibold text-night-50">v{r.version}</span>
                  <StatusBadge status={r.status} />
                  <span className={`text-xs ${sourceColor(r.source)}`}>
                    {SOURCE_LABEL[r.source]}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-night-200">
                  <Clock size={12} />
                  {formatDateTime(r.createdAt)}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-night-200">
                <span className="inline-flex items-center gap-1">
                  <Shield size={12} className="text-night-300" />
                  操作人：{r.operatorName}
                </span>
                <span className="inline-flex items-center gap-1">
                  {r.photoPresent
                    ? <FileText size={12} className="text-emerald-400" />
                    : <ImageOff size={12} className="text-rose-400" />}
                  照片：{r.photoPresent ? '已归档' : '缺失'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  业务时间：{formatDateTime(r.recordedAt)}
                </span>
                <span className={`inline-flex items-center gap-1 ${r.affectsSummary ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <ShieldQuestion size={12} />
                  汇总影响：{r.affectsSummary ? '已计入' : '不计入（异常隔离）'}
                </span>
              </div>

              {diff && (
                <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
                  相对上一版本变化：{diff}
                </div>
              )}

              {r.remark && (
                <div className="mt-3 rounded-md border border-night-400/40 bg-night-700/40 px-3 py-2 text-xs text-night-100">
                  备注：{r.remark}
                </div>
              )}

              {r.anomalyReason && (
                <div className="mt-3 rounded-md border border-danger/40 bg-danger/10 p-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={14} className="mt-0.5 text-danger" />
                    <div className="text-xs leading-relaxed">
                      <div className="font-medium text-danger">异常原因</div>
                      <div className="mt-1 text-night-100">{r.anomalyReason}</div>
                      <div className="mt-1 text-night-200">
                        对汇总影响：该行被标记为 <span className="text-danger">affectsSummary=false</span>，
                        统计已自动跳过，不会污染正常宝宝的汇总数字。
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
