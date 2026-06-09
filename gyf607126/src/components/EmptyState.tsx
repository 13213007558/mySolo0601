import { FileQuestion, SearchX, DatabaseZap, Upload, FileSearch, RotateCcw } from 'lucide-react';
import { EmptyStateType } from '../types/contract';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  onReset?: () => void;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  secondaryActionLabel?: string;
  variant: 'info' | 'warning' | 'error';
}> = {
  no_import: {
    icon: <Upload className="w-16 h-16" />,
    title: '尚未导入合同数据',
    description: '客户经理，您还没有导入任何售电合同数据。请使用导入功能上传Excel或JSON文件，或者使用示例数据开始体验。',
    actionLabel: '导入合同数据',
    secondaryActionLabel: '加载示例数据',
    variant: 'info',
  },
  no_data: {
    icon: <FileQuestion className="w-16 h-16" />,
    title: '暂无合同记录',
    description: '当前筛选条件下没有找到任何合同记录。您可以调整筛选条件，或者添加新的合同数据。',
    actionLabel: '清除筛选条件',
    variant: 'info',
  },
  filtered_empty: {
    icon: <SearchX className="w-16 h-16" />,
    title: '筛选结果为空',
    description: '当前筛选条件过于严格，没有匹配到任何合同。请尝试放宽筛选条件或清除筛选。',
    actionLabel: '重置筛选条件',
    variant: 'warning',
  },
  corrupted: {
    icon: <DatabaseZap className="w-16 h-16" />,
    title: '数据文件已损坏',
    description: '检测到本地存储的数据文件存在损坏，无法正常读取。您可以尝试恢复到示例数据，或重新导入数据。',
    actionLabel: '恢复示例数据',
    secondaryActionLabel: '重新导入数据',
    variant: 'error',
  },
};

export const EmptyState = ({ type, onAction, onReset }: EmptyStateProps) => {
  const config = emptyStateConfig[type];
  
  const variantClasses = {
    info: 'text-energy-500 bg-energy-50',
    warning: 'text-amber-500 bg-amber-50',
    error: 'text-rose-500 bg-rose-50',
  };

  const iconBgClasses = {
    info: 'from-energy-100 to-energy-50',
    warning: 'from-amber-100 to-amber-50',
    error: 'from-rose-100 to-rose-50',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 animate-fade-in">
      <div className={`relative mb-8 p-8 rounded-3xl bg-gradient-to-br ${iconBgClasses[config.variant]}`}>
        <div className="absolute inset-0 rounded-3xl bg-grid-pattern opacity-30 bg-[size:24px_24px]" />
        <div className={`relative ${variantClasses[config.variant]}`}>
          {config.icon}
        </div>
      </div>

      <h3 className="font-display text-2xl font-semibold text-slate-800 mb-3 text-center">
        {config.title}
      </h3>
      
      <p className="text-slate-500 text-center max-w-md mb-8 leading-relaxed">
        {config.description}
      </p>

      <div className="flex gap-3">
        {config.actionLabel && onAction && (
          <button onClick={onAction} className="btn-primary">
            <FileSearch className="w-4 h-4" />
            {config.actionLabel}
          </button>
        )}
        {config.secondaryActionLabel && onReset && (
          <button onClick={onReset} className="btn-secondary">
            <RotateCcw className="w-4 h-4" />
            {config.secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
