import React from 'react';
import { Search, Filter, RotateCcw, MapPin, AlertTriangle, Activity, Calendar, CheckCircle2 } from 'lucide-react';
import type { FilterState, HotSpotLevel, RecordStatus } from '@/types';
import { useInspectionStore } from '@/store/useInspectionStore';
import { STATION_NAMES, HOT_SPOT_LEVELS, RECORD_STATUSES } from '@/config/roles';

interface FilterPanelProps {
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ className = '' }) => {
  const { filters, setFilters, resetFilters } = useInspectionStore();
  
  const handleChange = (key: keyof FilterState, value: unknown) => {
    setFilters({ [key]: value } as Partial<FilterState>);
  };
  
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setFilters({
      dateRange: {
        ...filters.dateRange,
        [type]: value,
      },
    });
  };
  
  const hasActiveFilters = 
    filters.searchText !== '' ||
    filters.stationName !== '' ||
    filters.hotSpotLevel !== '' ||
    filters.status !== '' ||
    filters.dateRange.start !== '' ||
    filters.dateRange.end !== '' ||
    filters.isManuallySupplemented !== null;
  
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-lg text-primary-700">筛选条件</h3>
          {hasActiveFilters && (
            <span className="badge bg-primary-100 text-primary-700">
              已筛选
            </span>
          )}
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            关键词搜索
          </label>
          <input
            type="text"
            value={filters.searchText}
            onChange={e => handleChange('searchText', e.target.value)}
            placeholder="搜索记录ID、组件编号、电站..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
          />
        </div>
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            电站名称
          </label>
          <select
            value={filters.stationName}
            onChange={e => handleChange('stationName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
          >
            <option value="">全部电站</option>
            {STATION_NAMES.map(station => (
              <option key={station} value={station}>{station}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            热斑等级
          </label>
          <select
            value={filters.hotSpotLevel}
            onChange={e => handleChange('hotSpotLevel', e.target.value as HotSpotLevel)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
          >
            <option value="">全部等级</option>
            {HOT_SPOT_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Activity className="w-4 h-4 text-gray-400" />
            处理状态
          </label>
          <select
            value={filters.status}
            onChange={e => handleChange('status', e.target.value as RecordStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
          >
            <option value="">全部状态</option>
            {RECORD_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            检测日期开始
          </label>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={e => handleDateChange('start', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
          />
        </div>
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            检测日期结束
          </label>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={e => handleDateChange('end', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm"
          />
        </div>
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
            补录状态
          </label>
          <select
            value={filters.isManuallySupplemented === null ? '' : String(filters.isManuallySupplemented)}
            onChange={e => {
              const val = e.target.value;
              handleChange('isManuallySupplemented', val === '' ? null : val === 'true');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm bg-white"
          >
            <option value="">全部</option>
            <option value="true">已补录</option>
            <option value="false">未补录</option>
          </select>
        </div>
      </div>
    </div>
  );
};
