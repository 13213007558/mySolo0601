import { AlertTriangle, CheckCircle2, Inbox, Info } from 'lucide-react';
import type { DataStatus } from '../../shared/types';

interface Props {
  status: DataStatus;
  total: number;
  dirtyCount?: number;
}

export default function StatusBanner({ status, total, dirtyCount }: Props) {
  const configs = {
    empty: {
      bg: 'bg-ink-100 border-ink-200',
      icon: <Inbox className="w-5 h-5 text-ink-500" />,
      title: '暂无数据',
      desc: '还没有导入任何宝宝信息，请点击右上角「导入导出表」或「手工补录」开始录入。',
      accent: 'text-ink-600',
    },
    dirty: {
      bg: 'bg-clay-50 border-clay-200',
      icon: <AlertTriangle className="w-5 h-5 text-clay-500" />,
      title: '数据存在异常',
      desc: `共 ${total} 条记录，其中 ${dirtyCount ?? 0} 条存在手机号格式不规范或缺少晨检记录等问题。已允许部分成功导入，请点击异常项补全信息。`,
      accent: 'text-clay-700',
    },
    normal: {
      bg: 'bg-sage-50 border-sage-200',
      icon: <CheckCircle2 className="w-5 h-5 text-sage-600" />,
      title: '数据状态正常',
      desc: `共 ${total} 条记录，所有信息完整，手机号格式规范。`,
      accent: 'text-sage-700',
    },
  };
  const cfg = configs[status];

  return (
    <div className={`paper-card ${cfg.bg} border p-5 flex items-start gap-4`}>
      <div className="mt-0.5 shrink-0">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold ${cfg.accent} mb-1`}>{cfg.title}</div>
        <div className="text-sm text-ink-600 leading-relaxed">{cfg.desc}</div>
      </div>
      <Info className="w-4 h-4 text-ink-400 shrink-0 mt-1" />
    </div>
  );
}
