import { User, Shield, Activity, Clock, Plus, Edit3 } from 'lucide-react';
import type { AuditLog } from '@shared/types';
import { cn } from '@/lib/utils';

const ACTION_LABEL: Record<AuditLog['action'], { label: string; color: string }> = {
  status_changed: { label: '状态流转', color: 'bg-sky-500' },
  photo_missing: { label: '照片缺失·部分成功', color: 'bg-amber-500' },
  manual_supplement: { label: '手工补录', color: 'bg-violet-500' },
  anomaly_counted_normal: { label: '异常纳入正常汇总', color: 'bg-rose-500' },
  review_created: { label: '流程创建', color: 'bg-emerald-500' },
};

const ROLE_LABEL: Record<AuditLog['operatorRole'], string> = {
  waiter: '前台服务员',
  kitchen: '厨房/后场',
  manager: '主管',
  parent: '家长',
  system: '系统',
};

export default function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <ol className="relative space-y-6 border-l border-slate-200 pl-6">
        {sorted.map((log) => {
          const meta = ACTION_LABEL[log.action];
          return (
            <li key={log.id} className="relative">
              <span
                className={cn(
                  'absolute -left-[34px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white',
                  meta.color,
                )}
              >
                {log.action === 'manual_supplement' ? (
                  <Edit3 className="h-3 w-3 text-white" />
                ) : log.action === 'anomaly_counted_normal' ? (
                  <Shield className="h-3 w-3 text-white" />
                ) : log.action === 'photo_missing' ? (
                  <Activity className="h-3 w-3 text-white" />
                ) : (
                  <Plus className="h-3 w-3 text-white" />
                )}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {meta.label}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <User className="h-3 w-3" /> {log.operator} · {ROLE_LABEL[log.operatorRole]}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" /> {new Date(log.timestamp).toLocaleString('zh-CN')}
                </span>
              </div>
              {log.note && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{log.note}</p>}
              {log.snapshotBefore && log.snapshotAfter && (
                <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="mb-1 font-semibold text-slate-500">变更前快照</p>
                    <pre className="whitespace-pre-wrap text-slate-600">
{JSON.stringify(
  {
    status: log.snapshotBefore.status,
    reviewStage: log.snapshotBefore.reviewStage,
    temperatureStatus: log.snapshotBefore.temperatureStatus,
    leaveStatus: log.snapshotBefore.leaveStatus,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                  <div>
                    <p className="mb-1 font-semibold text-slate-500">变更后快照</p>
                    <pre className="whitespace-pre-wrap text-slate-700">
{JSON.stringify(
  {
    status: log.snapshotAfter.status,
    reviewStage: log.snapshotAfter.reviewStage,
    temperatureStatus: log.snapshotAfter.temperatureStatus,
    leaveStatus: log.snapshotAfter.leaveStatus,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
