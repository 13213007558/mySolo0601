import { Search, Filter, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { customerManagers, statusColors } from '../data/mockData';
import { ContractStatus } from '../types/contract';

const statusOptions: ContractStatus[] = ['待审核', '审核通过', '异常', '已退回', '草稿'];

export const FilterBar = () => {
  const filters = useContractStore((state) => state.filters);
  const setFilters = useContractStore((state) => state.setFilters);
  const resetFilters = useContractStore((state) => state.resetFilters);
  const getFilteredContracts = useContractStore((state) => state.getFilteredContracts);
  const contracts = useContractStore((state) => state.contracts);

  const filteredCount = getFilteredContracts().length;
  const hasActiveFilters = filters.status || filters.customerManager || filters.hasAnomaly !== null || filters.dateRange || filters.searchKeyword;

  return (
    <div className="card-industrial p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-5 h-5 text-energy-600" />
          <span className="font-medium text-sm">筛选条件</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-energy-100 text-energy-700 text-xs font-medium rounded-full">
              {filteredCount} / {contracts.length} 条
            </span>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索合同号、客户、设备..."
              value={filters.searchKeyword}
              onChange={(e) => setFilters({ searchKeyword: e.target.value })}
              className="input-field pl-9"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as ContractStatus | '' })}
            className="input-field"
          >
            <option value="">全部状态</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filters.customerManager}
            onChange={(e) => setFilters({ customerManager: e.target.value })}
            className="input-field"
          >
            <option value="">全部客户经理</option>
            {customerManagers.map((manager) => (
              <option key={manager} value={manager}>{manager}</option>
            ))}
          </select>

          <select
            value={filters.hasAnomaly === null ? '' : String(filters.hasAnomaly)}
            onChange={(e) => setFilters({ hasAnomaly: e.target.value === '' ? null : e.target.value === 'true' })}
            className="input-field"
          >
            <option value="">异常状态</option>
            <option value="true">存在异常</option>
            <option value="false">无异常</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn-ghost">
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-slate-600">异常</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-slate-600">正常</span>
            </div>
          </div>
        </div>
      </div>

      {filters.status && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="text-slate-500">当前状态:</span>
          <span className={`badge-status ${statusColors[filters.status]}`}>
            {filters.status}
          </span>
        </div>
      )}
    </div>
  );
};
