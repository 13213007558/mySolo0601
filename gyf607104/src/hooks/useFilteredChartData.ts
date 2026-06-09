import { useMemo, useState, useEffect } from 'react';
import type { HotSpotRecord, ChartDataPoint, StatusChartData, HotSpotLevel } from '@/types';
import { useInspectionStore } from '@/store/useInspectionStore';

export function useFilteredChartData() {
  const { filteredRecords, filters, records } = useInspectionStore();
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  
  useEffect(() => {
    const hasActiveFilter = 
      filters.searchText !== '' ||
      filters.stationName !== '' ||
      filters.hotSpotLevel !== '' ||
      filters.status !== '' ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.isManuallySupplemented !== null;
    setIsFilterApplied(hasActiveFilter);
  }, [filters]);
  
  const hasAnomaly = useMemo(() => {
    if (!isFilterApplied) return false;
    return filteredRecords.length === 0 || filteredRecords.length >= records.length;
  }, [filteredRecords.length, records.length, isFilterApplied]);
  
  const chartRecords = useMemo(() => {
    if (hasAnomaly) {
      return records;
    }
    return filteredRecords;
  }, [filteredRecords, records, hasAnomaly]);
  
  const trendData = useMemo((): ChartDataPoint[] => {
    const dateMap = new Map<string, ChartDataPoint>();
    
    chartRecords.forEach(record => {
      const date = record.detectedDate;
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          严重: 0,
          中等: 0,
          轻微: 0,
          isAnomaly: hasAnomaly,
        });
      }
      const point = dateMap.get(date)!;
      const level = record.hotSpotLevel as HotSpotLevel;
      point[level]++;
    });
    
    const sortedDates = Array.from(dateMap.keys()).sort();
    return sortedDates.map(date => dateMap.get(date)!);
  }, [chartRecords, hasAnomaly]);
  
  const statusData = useMemo((): StatusChartData[] => {
    const statusMap = new Map<string, number>();
    
    chartRecords.forEach(record => {
      const status = record.status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    return [
      { name: '待处理', value: statusMap.get('待处理') || 0 },
      { name: '处理中', value: statusMap.get('处理中') || 0 },
      { name: '已完成', value: statusMap.get('已完成') || 0 },
      { name: '已撤回', value: statusMap.get('已撤回') || 0 },
    ];
  }, [chartRecords]);
  
  const levelSummary = useMemo(() => {
    const counts = { 严重: 0, 中等: 0, 轻微: 0 };
    chartRecords.forEach(record => {
      counts[record.hotSpotLevel as HotSpotLevel]++;
    });
    return counts;
  }, [chartRecords]);
  
  const summaryStats = useMemo(() => {
    const total = chartRecords.length;
    const completed = chartRecords.filter(r => r.status === '已完成').length;
    const pending = chartRecords.filter(r => r.status === '待处理').length;
    const processing = chartRecords.filter(r => r.status === '处理中').length;
    const withdrawn = chartRecords.filter(r => r.status === '已撤回').length;
    const supplemented = chartRecords.filter(r => r.isManuallySupplemented).length;
    
    return {
      total,
      completed,
      pending,
      processing,
      withdrawn,
      supplemented,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [chartRecords]);
  
  return {
    trendData,
    statusData,
    levelSummary,
    summaryStats,
    hasAnomaly,
    isFilterApplied,
    filteredCount: filteredRecords.length,
    totalCount: records.length,
    anomalyMessage: hasAnomaly 
      ? `筛选条件异常（返回${filteredRecords.length}条），已自动切换至全量数据展示，避免干扰正常汇总统计`
      : '',
  };
}

export function useRecordTrendData(recordId: string) {
  const { records } = useInspectionStore();
  
  return useMemo(() => {
    const record = records.find(r => r.id === recordId);
    if (!record) return null;
    
    const versionTrend = record.versionHistory.map((vh, index) => ({
      version: vh.versionNumber,
      date: vh.changedAt.split(' ')[0],
      changeType: vh.changeType,
      changedBy: vh.changedBy,
      sequence: index + 1,
    }));
    
    return {
      versionTrend,
      totalVersions: record.versionHistory.length,
      hasSupplement: record.versionHistory.some(vh => vh.changeType === '补录'),
      lastUpdated: record.versionHistory[record.versionHistory.length - 1]?.changedAt,
    };
  }, [records, recordId]);
}
