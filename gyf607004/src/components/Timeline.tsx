import { cn } from '@/lib/utils';
import { STATUS_LABELS, type AuditAction, type AuditLog } from '@/types';
import {
  FilePlus,
  Edit,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Download,
  Upload,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

interface TimelineProps {
  logs: AuditLog[];
}

const actionConfig: Record<
  AuditAction,
  { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string; dotClass: string; ringClass: string }
> = {
  create: { icon: FilePlus, label: '创建记录', dotClass: 'bg-ink-blue', ringClass: 'ring-ink-blue/20' },
  update_status: { icon: Edit, label: '更新状态', dotClass: 'bg-status-gray', ringClass: 'ring-status-gray/20' },
  add_note: { icon: MessageSquare, label: '添加说明', dotClass: 'bg-status-orange', ringClass: 'ring-status-orange/20' },
  approve: { icon: CheckCircle2, label: '审批通过', dotClass: 'bg-status-green', ringClass: 'ring-status-green/20' },
  reject: { icon: XCircle, label: '审批驳回', dotClass: 'bg-status-red', ringClass: 'ring-status-red/20' },
  isolate: { icon: ShieldAlert, label: '隔离记录', dotClass: 'bg-status-red', ringClass: 'ring-status-red/20' },
  export: { icon: Download, label: '导出数据', dotClass: 'bg-ink-blue', ringClass: 'ring-ink-blue/20' },
  import: { icon: Upload, label: '导入数据', dotClass: 'bg-status-green', ringClass: 'ring-status-green/20' },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Timeline({ logs }: TimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">暂无操作记录</div>
    );
  }

  return (
    <ul className="space-y-4">
      {logs.map((log, idx) => {
        const cfg = actionConfig[log.action];
        const Icon = cfg.icon;
        const isLast = idx === logs.length - 1;
        return (
          <li key={log.id} className="relative flex gap-3">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 h-full w-px -translate-x-1/2 bg-gray-200"
                aria-hidden
              />
            )}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ring-4',
                cfg.dotClass,
                cfg.ringClass
              )}
            >
              <Icon className="h-[14px] w-[14px] text-white" />
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{log.operatorName}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{cfg.label}</span>
                {log.oldStatus && log.newStatus && (
                  <span className="text-gray-500">
                    （{STATUS_LABELS[log.oldStatus]} → {STATUS_LABELS[log.newStatus]}）
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-gray-400">{formatTime(log.createdAt)}</div>
              {log.note && (
                <div className="mt-1.5 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {log.note}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
