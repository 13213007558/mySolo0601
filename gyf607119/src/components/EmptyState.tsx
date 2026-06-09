import { Upload, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { EmptyStateType } from '../types';
import { cn } from '@/lib/utils';

interface EmptyStateConfig {
  type: EmptyStateType;
  icon: typeof Upload;
  title: string;
  description: string;
  color: 'gray' | 'orange' | 'red';
  actionLabel: string;
}

const emptyStateConfigs: EmptyStateConfig[] = [
  {
    type: 'no-import',
    icon: Upload,
    title: '尚未导入巡检数据',
    description: '当前系统中没有道闸巡检数据，请先导入数据文件或使用内置样例数据开始工作。抢修坐席可以通过导入功能批量导入巡检记录。',
    color: 'gray',
    actionLabel: '加载内置样例数据',
  },
  {
    type: 'filter-narrow',
    icon: Filter,
    title: '筛选条件过于严格',
    description: '当前筛选条件下没有匹配的道闸记录。请尝试放宽筛选条件，或者清除所有筛选后重新查看。施工队长请注意：过窄的筛选可能导致遗漏重要异常信息。',
    color: 'orange',
    actionLabel: '清除筛选条件',
  },
  {
    type: 'all-damaged',
    icon: AlertTriangle,
    title: '所有道闸材料均已损坏',
    description: '检测到所有道闸设备均处于损坏状态，这是严重的系统警报！请立即联系设备维修部门紧急处理，避免影响能源站正常运营。',
    color: 'red',
    actionLabel: '查看紧急处理预案',
  },
];

export function EmptyState() {
  const { showEmptyState, emptyStateType, setShowEmptyState, resetData, setFilter } = useGateStore();

  if (!showEmptyState || !emptyStateType) return null;

  const config = emptyStateConfigs.find((c) => c.type === emptyStateType);
  if (!config) return null;

  const Icon = config.icon;

  const colorClasses = {
    gray: {
      bg: 'bg-industrial-gray-50',
      border: 'border-industrial-gray-300',
      iconBg: 'bg-industrial-gray-100',
      icon: 'text-industrial-gray-600',
      title: 'text-industrial-gray-800',
      button: 'industrial-btn-primary',
    },
    orange: {
      bg: 'bg-industrial-orange-50',
      border: 'border-industrial-orange-300',
      iconBg: 'bg-industrial-orange-100',
      icon: 'text-industrial-orange-600',
      title: 'text-industrial-orange-800',
      button: 'industrial-btn-warning',
    },
    red: {
      bg: 'bg-industrial-red-50',
      border: 'border-industrial-red-300',
      iconBg: 'bg-industrial-red-100',
      icon: 'text-industrial-red-600',
      title: 'text-industrial-red-800',
      button: 'industrial-btn-danger',
    },
  };

  const colors = colorClasses[config.color];

  const handleAction = () => {
    if (config.type === 'no-import') {
      resetData();
      setShowEmptyState(false);
    } else if (config.type === 'filter-narrow') {
      setFilter('all');
      setShowEmptyState(false);
    } else if (config.type === 'all-damaged') {
      alert('紧急处理预案：\n1. 立即切断所有道闸电源\n2. 联系维修班组：138****0001\n3. 启动备用人工登记方案\n4. 上报主管领导');
    }
  };

  return (
    <div className={cn(
      'industrial-card p-12 border-2 text-center max-w-2xl mx-auto',
      colors.bg,
      colors.border
    )}>
      <div className={cn(
        'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6',
        colors.iconBg
      )}>
        <Icon className={cn('w-10 h-10', colors.icon)} />
      </div>
      
      <h2 className={cn(
        'text-2xl font-bold mb-4 font-mono',
        colors.title
      )}>
        {config.title}
      </h2>
      
      <p className="text-industrial-gray-600 mb-8 leading-relaxed">
        {config.description}
      </p>
      
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={handleAction}
          className={colors.button}
        >
          {config.actionLabel}
        </button>
        <button
          onClick={() => setShowEmptyState(false)}
          className="industrial-btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回数据视图
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-industrial-gray-200">
        <p className="text-sm text-industrial-gray-500 mb-3">快速切换空状态场景：</p>
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setShowEmptyState(true, 'no-import')}
            className={cn(
              'px-3 py-1.5 text-sm border-2 transition-colors',
              emptyStateType === 'no-import'
                ? 'bg-industrial-gray-600 text-white border-industrial-gray-700'
                : 'bg-white text-industrial-gray-600 border-industrial-gray-300 hover:bg-industrial-gray-50'
            )}
          >
            未导入
          </button>
          <button
            onClick={() => setShowEmptyState(true, 'filter-narrow')}
            className={cn(
              'px-3 py-1.5 text-sm border-2 transition-colors',
              emptyStateType === 'filter-narrow'
                ? 'bg-industrial-orange-500 text-white border-industrial-orange-600'
                : 'bg-white text-industrial-gray-600 border-industrial-gray-300 hover:bg-industrial-gray-50'
            )}
          >
            筛选过窄
          </button>
          <button
            onClick={() => setShowEmptyState(true, 'all-damaged')}
            className={cn(
              'px-3 py-1.5 text-sm border-2 transition-colors',
              emptyStateType === 'all-damaged'
                ? 'bg-industrial-red-500 text-white border-industrial-red-600'
                : 'bg-white text-industrial-gray-600 border-industrial-gray-300 hover:bg-industrial-gray-50'
            )}
          >
            材料全坏
          </button>
        </div>
      </div>
    </div>
  );
}
