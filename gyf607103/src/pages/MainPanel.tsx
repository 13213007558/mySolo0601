import React, { useEffect } from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { checkEmptyState } from '@/utils/dataValidator';
import { EditableTable } from '@/components/EditableTable/EditableTable';
import { RangeChart } from '@/components/RangeChart/RangeChart';
import { ThresholdAlert } from '@/components/ThresholdAlert/ThresholdAlert';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { SaveStatus } from '@/components/SaveStatus/SaveStatus';

export const MainPanel: React.FC = () => {
  const { records, getVisibleRecords, loadFromStorage } = useShadowStore();
  
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const visibleRecords = getVisibleRecords();
  const emptyStateType = checkEmptyState(records, visibleRecords);

  if (emptyStateType) {
    return (
      <div className="p-6">
        <EmptyState type={emptyStateType} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">能源屋顶阴影追踪面板</h1>
          <p className="text-sm text-gray-500 mt-1">
            双击表格单元格可编辑 · 拖拽下方图表选区可筛选时间区间
          </p>
        </div>
        <SaveStatus />
      </div>

      <ThresholdAlert />

      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <RangeChart />
        
        <div className="flex-1 bg-white rounded-lg border-2 border-primary-100 overflow-hidden min-h-0">
          <EditableTable />
        </div>
      </div>
    </div>
  );
};
