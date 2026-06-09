import { useAlarmStore } from '@/store/useAlarmStore';
import { AlarmCard } from './AlarmCard';
import { AlertCircle } from 'lucide-react';

export const AlarmList = () => {
  const { getFilteredAlarms, searchText, filterStatus, filterProcess } = useAlarmStore();
  const alarms = getFilteredAlarms();

  if (alarms.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-700">暂无匹配的告警记录</h3>
        <p className="mt-2 text-sm text-gray-500">
          当前筛选条件下没有找到记录，请尝试调整筛选条件或搜索关键词。
        </p>
        {(searchText || filterStatus !== 'all' || filterProcess !== 'all') && (
          <p className="mt-4 text-xs text-gray-500">
            搜索: {searchText || '-'} · 状态: {filterStatus} · 进度: {filterProcess}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alarms.map((alarm) => (
        <AlarmCard key={alarm.id} alarm={alarm} />
      ))}
    </div>
  );
};
