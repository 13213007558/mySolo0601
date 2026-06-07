import { AlertTriangle, CheckCircle2, Inbox, Loader2 } from 'lucide-react';
import type { DataStatus } from '@shared/types';
import { cn } from '@/lib/utils';

interface DataStatePanelProps {
  status: DataStatus;
  title: string;
  emptyText?: string;
  dirtyText?: string;
  normalText?: string;
  children?: React.ReactNode;
}

export function DataStatePanel({
  status,
  title,
  emptyText = '暂无数据，请服务员录入或主管补录',
  dirtyText = '数据存在异常，已记录审计日志供主管复查',
  normalText = '数据完整，可以继续下一环节',
  children,
}: DataStatePanelProps) {
  const cfg = {
    empty: {
      Icon: Inbox,
      title: '空数据',
      desc: emptyText,
      cls: 'border-amber-200 bg-amber-50/60 text-amber-800',
      iconCls: 'text-amber-500',
      pulse: 'bg-amber-400',
    },
    dirty: {
      Icon: AlertTriangle,
      title: '脏数据/异常',
      desc: dirtyText,
      cls: 'border-rose-200 bg-rose-50/60 text-rose-800',
      iconCls: 'text-rose-500',
      pulse: 'bg-rose-400',
    },
    normal: {
      Icon: CheckCircle2,
      title: '数据正常',
      desc: normalText,
      cls: 'border-emerald-200 bg-emerald-50/60 text-emerald-800',
      iconCls: 'text-emerald-500',
      pulse: 'bg-emerald-400',
    },
  }[status];
  const Icon = cfg.Icon;
  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm', cfg.cls)}>
      <div className="flex items-start gap-4">
        <div className="relative">
          <Icon className={cn('h-8 w-8', cfg.iconCls)} />
          <span className={cn('absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full opacity-75', cfg.pulse)} />
          <span className={cn('absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full', cfg.pulse)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold">{cfg.title}</h4>
            <span className="text-xs uppercase tracking-wider opacity-70">{title}</span>
          </div>
          <p className="mt-1 text-sm opacity-90">{cfg.desc}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function Loading({ text = '加载中…' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
