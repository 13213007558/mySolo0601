import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  ChevronDown,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useBracketStore } from '@/store/useBracketStore';
import { generateTraceableURL, copyToClipboard } from '@/utils/export';

export const FilterBar: React.FC = () => {
  const filterParams = useBracketStore((state) => state.filterParams);
  const updateFilterParams = useBracketStore((state) => state.updateFilterParams);
  const [copied, setCopied] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const handleCopyURL = async () => {
    const url = generateTraceableURL(filterParams);
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    updateFilterParams({
      bracketId: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      handler: undefined,
      page: 1,
    });
  };

  const hasActiveFilters = filterParams.bracketId || filterParams.status ||
    filterParams.dateFrom || filterParams.dateTo || filterParams.handler;

  return (
    <div className="bg-[#1e3a5f] text-white p-4 border-b-4 border-[#1a2f4a]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono tracking-wider">
              能源跟踪支架对账页
            </h1>
            <span className="text-xs px-2 py-1 bg-[#f59e0b] text-black rounded font-mono">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyURL}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-mono transition-all border border-white/20"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制链接'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm font-mono transition-all border border-white/20"
            >
              <Filter className="w-4 h-4" />
              筛选
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="支架编号..."
                  value={filterParams.bracketId || ''}
                  onChange={(e) => updateFilterParams({ bracketId: e.target.value || undefined, page: 1 })}
                  className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]"
                />
              </div>

              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterParams.status || ''}
                  onChange={(e) => updateFilterParams({ status: e.target.value || undefined, page: 1 })}
                  className="w-full pl-9 pr-8 py-2 bg-white/10 border border-white/20 rounded text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待处理</option>
                  <option value="processed">已处理</option>
                  <option value="problem">有问题</option>
                  <option value="manual">手工补录</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filterParams.dateFrom || ''}
                  onChange={(e) => updateFilterParams({ dateFrom: e.target.value || undefined, page: 1 })}
                  className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]"
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filterParams.dateTo || ''}
                  onChange={(e) => updateFilterParams({ dateTo: e.target.value || undefined, page: 1 })}
                  className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]"
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="处理人..."
                  value={filterParams.handler || ''}
                  onChange={(e) => updateFilterParams({ handler: e.target.value || undefined, page: 1 })}
                  className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-xs text-slate-300 font-mono">当前筛选:</span>
                {filterParams.bracketId && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded text-xs font-mono">
                    支架: {filterParams.bracketId}
                    <button onClick={() => updateFilterParams({ bracketId: undefined, page: 1 })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filterParams.status && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded text-xs font-mono">
                    状态: {filterParams.status}
                    <button onClick={() => updateFilterParams({ status: undefined, page: 1 })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(filterParams.dateFrom || filterParams.dateTo) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded text-xs font-mono">
                    日期: {filterParams.dateFrom || '不限'} ~ {filterParams.dateTo || '不限'}
                  </span>
                )}
                {filterParams.handler && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded text-xs font-mono">
                    处理人: {filterParams.handler}
                    <button onClick={() => updateFilterParams({ handler: undefined, page: 1 })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleReset}
                  className="ml-auto text-xs text-slate-300 hover:text-white font-mono underline"
                >
                  重置筛选
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
