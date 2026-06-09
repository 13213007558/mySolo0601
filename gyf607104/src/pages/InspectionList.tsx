import React, { useEffect } from 'react';
import { FilterPanel } from '@/components/FilterPanel';
import { StatisticsCharts } from '@/components/StatisticsCharts';
import { InspectionTable } from '@/components/InspectionTable';
import { useInspectionStore } from '@/store/useInspectionStore';
import { AlertTriangle, Info } from 'lucide-react';

export const InspectionList: React.FC = () => {
  const { applyFilters, filteredRecords, records } = useInspectionStore();
  
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  const supplementalRecords = records.filter(r => r.isManuallySupplemented);
  
  return (
    <div className="space-y-6">
      <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">功能说明</p>
            <div className="mt-1">
              <p>本页面展示所有能源组件热斑巡检记录。请通过上方筛选条件进行查询，点击记录ID可查看详情。</p>
              <p className="mt-2">
                <strong>样例数据说明：</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-600">
                <li>
                  <strong>REC-2024-001</strong>：老何手工补录的热斑复测截图样例，用于检查补录前后差异和导出读回
                </li>
                <li>
                  <strong>REC-2024-002</strong>：人工补录一致性样例，刷新后检查列表、详情和导出是否仍指向同一条记录
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {supplementalRecords.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">含补录的记录 ({supplementalRecords.length}条)</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {supplementalRecords.map(r => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md text-xs font-mono text-amber-700 border border-amber-200"
                  >
                    <span className="w-2 h-2 rounded-full bg-accent-gold" />
                    {r.id}
                    <span className="text-amber-500">-</span>
                    <span className="text-amber-600">{r.stationName}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <FilterPanel />
      
      <StatisticsCharts />
      
      <InspectionTable />
    </div>
  );
};
