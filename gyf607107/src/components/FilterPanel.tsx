import { useAlarmStore } from '@/store/useAlarmStore';
import type { FilterCondition, AlarmStatus, Severity } from '@/types';
import { X } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FilterPanel = ({ isOpen, onClose }: FilterPanelProps) => {
  const { filter, setFilter } = useAlarmStore();

  const handleChange = (key: keyof FilterCondition, value: string | boolean | undefined) => {
    setFilter({ ...filter, [key]: value });
  };

  const handleReset = () => {
    setFilter({});
  };

  if (!isOpen) return null;

  return (
    <div className="card-industrial mb-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-industrial-text">筛选条件</h3>
        <button
          onClick={onClose}
          className="text-industrial-textMuted hover:text-industrial-text transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm text-industrial-textMuted mb-1">状态</label>
          <select
            className="input-industrial"
            value={filter.status || ''}
            onChange={(e) => handleChange('status', (e.target.value as AlarmStatus) || undefined)}
          >
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已处理</option>
            <option value="reviewed">已复核</option>
            <option value="withdrawn">已撤回</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-industrial-textMuted mb-1">严重程度</label>
          <select
            className="input-industrial"
            value={filter.severity || ''}
            onChange={(e) => handleChange('severity', (e.target.value as Severity) || undefined)}
          >
            <option value="">全部</option>
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">严重</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-industrial-textMuted mb-1">站点名称</label>
          <input
            type="text"
            className="input-industrial"
            placeholder="输入站点名称"
            value={filter.siteName || ''}
            onChange={(e) => handleChange('siteName', e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="block text-sm text-industrial-textMuted mb-1">处理人</label>
          <input
            type="text"
            className="input-industrial"
            placeholder="输入处理人"
            value={filter.handler || ''}
            onChange={(e) => handleChange('handler', e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="block text-sm text-industrial-textMuted mb-1">手工补录</label>
          <select
            className="input-industrial"
            value={filter.isManualSupplement !== undefined ? String(filter.isManualSupplement) : ''}
            onChange={(e) =>
              handleChange(
                'isManualSupplement',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
          >
            <option value="">全部</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button className="btn-industrial" onClick={handleReset}>
          重置筛选
        </button>
      </div>
    </div>
  );
};
