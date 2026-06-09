import { Search, Filter, X, Building2, Users, FileText, Layers } from 'lucide-react';
import { BUILDINGS, MAJORS, ASSIGNEES, ANNOTATION_STATUS, ANNOTATION_STATUS_LABELS } from '../db';

export function FilterPanel({ filters, updateFilter, clearFilters }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== undefined);
  
  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-5 h-5" />
          <span className="font-medium">筛选条件</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            清除筛选
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Search className="w-4 h-4" />
            关键词搜索
          </label>
          <input
            type="text"
            className="input"
            placeholder="批注编号/内容..."
            value={filters.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            楼栋
          </label>
          <select
            className="select"
            value={filters.building}
            onChange={(e) => updateFilter('building', e.target.value)}
          >
            <option value="">全部楼栋</option>
            {BUILDINGS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Layers className="w-4 h-4" />
            专业
          </label>
          <select
            className="select"
            value={filters.major}
            onChange={(e) => updateFilter('major', e.target.value)}
          >
            <option value="">全部专业</option>
            {MAJORS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Users className="w-4 h-4" />
            责任人
          </label>
          <select
            className="select"
            value={filters.assignee}
            onChange={(e) => updateFilter('assignee', e.target.value)}
          >
            <option value="">全部责任人</option>
            {ASSIGNEES.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <FileText className="w-4 h-4" />
            处理状态
          </label>
          <select
            className="select"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="">全部状态</option>
            {Object.entries(ANNOTATION_STATUS).map(([key, value]) => (
              <option key={value} value={value}>
                {ANNOTATION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            图纸页码
          </label>
          <input
            type="text"
            className="input"
            placeholder="如 A-01"
            value={filters.pageNo}
            onChange={(e) => updateFilter('pageNo', e.target.value)}
          />
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">显示范围：</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={filters.hasError === undefined}
              onChange={() => updateFilter('hasError', undefined)}
              className="text-primary-600"
            />
            <span className="text-sm">全部记录</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={filters.hasError === false}
              onChange={() => updateFilter('hasError', false)}
              className="text-primary-600"
            />
            <span className="text-sm">正常记录</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={filters.hasError === true}
              onChange={() => updateFilter('hasError', true)}
              className="text-primary-600"
            />
            <span className="text-sm">仅问题记录</span>
          </label>
        </div>
      </div>
    </div>
  );
}
