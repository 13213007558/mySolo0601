import React from 'react';
import { Database, Search, AlertOctagon, Upload, RefreshCw, Wrench } from 'lucide-react';
import { useShadowStore } from '@/store/useShadowStore';
import type { EmptyStateType } from '@/types';

interface EmptyStateProps {
  type: EmptyStateType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const { loadMockData, clearAllData } = useShadowStore();

  const configs: Record<EmptyStateType, {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    bgColor: string;
    borderColor: string;
    iconColor: string;
    tips: string[];
  }> = {
    'no-data': {
      icon: <Database size={48} strokeWidth={1.5} />,
      title: '还没有导入任何数据',
      description: '这是一个全新的工作区，还没有屋顶阴影数据。你可以导入现有数据或加载示例数据开始使用。',
      actionLabel: '加载示例数据',
      onAction: loadMockData,
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      iconColor: 'text-primary-400',
      tips: [
        '支持导入 JSON 或 CSV 格式的数据文件',
        '示例数据包含 30 天 12 个屋顶的完整记录',
        '所有数据保存在本地浏览器中，不会上传到服务器',
      ],
    },
    'filter-too-narrow': {
      icon: <Search size={48} strokeWidth={1.5} />,
      title: '筛选条件太严格了',
      description: '当前筛选区间内没有匹配的记录。试试放宽时间范围，或者清除筛选条件查看全部数据。',
      actionLabel: '清除筛选条件',
      onAction: () => useShadowStore.getState().setFilterRange(null),
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-400',
      tips: [
        '拖拽下方图表的选区手柄可以调整时间范围',
        '点击图表上方的"清除筛选"按钮可以快速重置',
        '筛选只影响展示，不会删除任何数据',
      ],
    },
    'data-corrupted': {
      icon: <AlertOctagon size={48} strokeWidth={1.5} />,
      title: '数据格式有问题',
      description: '检测到数据格式损坏或不完整。这可能是由于导入了错误格式的文件，或者本地存储出现了异常。',
      actionLabel: '重置所有数据',
      onAction: () => {
        if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
          clearAllData();
        }
      },
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      iconColor: 'text-danger-400',
      tips: [
        '尝试重新导入数据文件，确保格式正确',
        '检查 CSV 文件是否缺少必要的列',
        '如果问题持续，请联系系统管理员',
      ],
    },
  };

  const config = configs[type];

  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div
        className={`max-w-lg w-full p-8 rounded-2xl border-2 ${config.bgColor} ${config.borderColor} transition-all duration-500`}
        style={{
          opacity: 0,
          animation: 'fadeInUp 0.6s ease-out forwards',
        }}
      >
        <div className={`${config.iconColor} mb-6 flex justify-center animate-float`}>
          {config.icon}
        </div>
        
        <h3 className="text-xl font-bold text-center mb-3 text-gray-800">
          {config.title}
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">
          {config.description}
        </p>

        <div className="flex justify-center mb-6">
          <button
            onClick={config.onAction}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-gray-200 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all shadow-sm"
          >
            {type === 'no-data' && <Upload size={16} />}
            {type === 'filter-too-narrow' && <RefreshCw size={16} />}
            {type === 'data-corrupted' && <Wrench size={16} />}
            {config.actionLabel}
          </button>
        </div>

        <div className="bg-white/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            节能顾问提示
          </p>
          <ul className="space-y-2">
            {config.tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-gray-600"
                style={{
                  opacity: 0,
                  animation: `fadeInUp 0.4s ease-out ${0.3 + idx * 0.1}s forwards`,
                }}
              >
                <span className="text-primary-500 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
