import { useState, useRef, useEffect } from 'react';
import { Search, Calendar, Filter, User, Shield, ClipboardList, History, RotateCcw, FileDown, FileUp } from 'lucide-react';
import { useViewStore } from '@/store/viewStore';
import { useValveStore } from '@/store/valveStore';
import { useAuditStore } from '@/store/auditStore';
import { exportToExcel, importFromExcel, ImportResult } from '@/utils/export';
import type { ValveRecord } from '@/types';

export default function Header() {
  const {
    currentView,
    currentRole,
    setView,
    setRole,
    setFilters,
    resetFilters,
    searchKeyword,
    setSearchKeyword,
    filters,
  } = useViewStore();

  const { records, contracts, filteredRecords, addRecord, init: initValve } = useValveStore();
  const { init: initAudit } = useAuditStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const [filterStatus, setFilterStatus] = useState<ValveRecord['status'][]>(filters.status || []);
  const [filterValveNo, setFilterValveNo] = useState(filters.valveNo || '');
  const [filterOperator, setFilterOperator] = useState(filters.operator || '');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    useValveStore.getState().applyFilters(filters, value);
  };

  const handleApplyFilters = () => {
    const newFilters = {
      ...filters,
      status: filterStatus.length > 0 ? filterStatus : undefined,
      valveNo: filterValveNo || undefined,
      operator: filterOperator || undefined,
    };
    setFilters(newFilters);
    useValveStore.getState().applyFilters(newFilters, searchKeyword);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilterStatus([]);
    setFilterValveNo('');
    setFilterOperator('');
    resetFilters();
    useValveStore.getState().applyFilters({}, searchKeyword);
  };

  const handleExport = () => {
    exportToExcel(filteredRecords, contracts, { includeContracts: true });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importFromExcel(file);
      setImportResult(result);

      if (result.success) {
        result.records.forEach(record => {
          useValveStore.getState().addRecord(record as Omit<ValveRecord, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>);
        });
      }

      setTimeout(() => {
        const newFilters = useViewStore.getState().filters;
        const newKeyword = useViewStore.getState().searchKeyword;
        useValveStore.getState().applyFilters(newFilters, newKeyword);
        setImportResult(null);
      }, 3000);
    } catch (err) {
      console.error('Import failed:', err);
    }

    e.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      localStorage.clear();
      initValve();
      initAudit();
      const newFilters = useViewStore.getState().filters;
      const newKeyword = useViewStore.getState().searchKeyword;
      useValveStore.getState().applyFilters(newFilters, newKeyword);
    }
  };

  const toggleStatusFilter = (status: ValveRecord['status']) => {
    setFilterStatus(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const todayCount = records.filter(r => !r.isDeleted && r.recordDate === new Date().toISOString().split('T')[0]).length;
  const abnormalCount = filteredRecords.filter(r => r.status === 'abnormal').length;
  const manualCount = filteredRecords.filter(r => r.status === 'manual').length;
  const unmatchedCount = contracts.filter(c => {
    const matched = records.some(r => r.contractId === c.id);
    return !matched;
  }).length;

  return (
    <header className="bg-primary-500 text-white shadow-industrial-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-wide">
              🏭 能源锅炉余热巡检板
            </h1>
            <div className="flex items-center gap-1 bg-primary-600/50 rounded px-3 py-1">
              <span className="text-xs text-primary-200">今日记录</span>
              <span className="text-lg font-mono font-bold text-industrial-orange">{todayCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-primary-600 rounded p-0.5">
              <button
                onClick={() => setView('duty')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm transition-all ${
                  currentView === 'duty'
                    ? 'bg-white text-primary-500 shadow'
                    : 'text-primary-200 hover:text-white'
                }`}
              >
                <ClipboardList size={16} />
                值班视图
              </button>
              <button
                onClick={() => setView('review')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm transition-all ${
                  currentView === 'review'
                    ? 'bg-white text-primary-500 shadow'
                    : 'text-primary-200 hover:text-white'
                }`}
              >
                <History size={16} />
                复盘视图
              </button>
            </div>

            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 bg-primary-600/50 hover:bg-primary-600 px-3 py-1.5 rounded text-sm transition-colors"
              >
                {currentRole === 'operator' ? <User size={16} /> : <Shield size={16} />}
                {currentRole === 'operator' ? '值班员' : '主管'}
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded shadow-industrial-lg py-1 min-w-[120px] z-50 animate-slide-in">
                  <button
                    onClick={() => { setRole('operator'); setShowRoleMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2 ${
                      currentRole === 'operator' ? 'bg-primary-50 text-primary-500' : ''
                    }`}
                  >
                    <User size={14} />
                    值班员
                  </button>
                  <button
                    onClick={() => { setRole('supervisor'); setShowRoleMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2 ${
                      currentRole === 'supervisor' ? 'bg-primary-50 text-primary-500' : ''
                    }`}
                  >
                    <Shield size={14} />
                    主管
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 bg-primary-600/50 hover:bg-industrial-red hover:text-white px-3 py-1.5 rounded text-sm transition-colors"
              title="重置数据"
            >
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜索阀门编号、操作人、备注..."
              className="w-full pl-10 pr-4 py-2 rounded bg-primary-600/30 border border-primary-400/30 text-white placeholder:text-primary-300 focus:outline-none focus:border-primary-300 focus:bg-primary-600/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm transition-colors ${
                showFilters ? 'bg-white text-primary-500' : 'bg-primary-600/30 hover:bg-primary-600/50'
              }`}
            >
              <Filter size={16} />
              筛选
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-industrial-green/80 hover:bg-industrial-green px-4 py-2 rounded text-sm transition-colors"
            >
              <FileDown size={16} />
              导出
            </button>

            <button
              onClick={handleImportClick}
              className="flex items-center gap-1.5 bg-primary-600/30 hover:bg-primary-600/50 px-4 py-2 rounded text-sm transition-colors"
            >
              <FileUp size={16} />
              导入
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 bg-primary-600/30 rounded animate-slide-in">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-primary-200 mb-1.5">状态筛选</label>
                <div className="flex gap-2">
                  {(['normal', 'abnormal', 'manual'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-3 py-1 rounded text-xs transition-colors ${
                        filterStatus.includes(status)
                          ? 'bg-white text-primary-500'
                          : 'bg-primary-700/50 hover:bg-primary-700'
                      }`}
                    >
                      {{ normal: '正常', abnormal: '异常', manual: '手工补录' }[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-primary-200 mb-1.5">阀门编号</label>
                <input
                  type="text"
                  value={filterValveNo}
                  onChange={(e) => setFilterValveNo(e.target.value)}
                  placeholder="如 VL-A01"
                  className="w-full px-3 py-1.5 rounded bg-primary-700/50 border border-primary-400/30 text-white placeholder:text-primary-300 text-sm focus:outline-none focus:border-primary-300"
                />
              </div>

              <div>
                <label className="block text-xs text-primary-200 mb-1.5">操作人</label>
                <input
                  type="text"
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  placeholder="如 老何"
                  className="w-full px-3 py-1.5 rounded bg-primary-700/50 border border-primary-400/30 text-white placeholder:text-primary-300 text-sm focus:outline-none focus:border-primary-300"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 bg-industrial-orange hover:bg-industrial-orange/90 px-4 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  应用筛选
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-1.5 rounded text-sm bg-primary-700/50 hover:bg-primary-700 transition-colors"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        )}

        {importResult && (
          <div className={`mt-4 p-3 rounded animate-slide-in ${
            importResult.success ? 'bg-industrial-green/20 border border-industrial-green/30' : 'bg-industrial-red/20 border border-industrial-red/30'
          }`}>
            {importResult.success ? (
              <span className="text-sm">✓ 成功导入 {importResult.records.length} 条记录</span>
            ) : (
              <div>
                <span className="text-sm text-industrial-red">导入失败：</span>
                <ul className="text-xs mt-1 text-industrial-red">
                  {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-primary-600/50 px-6 py-2 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-industrial-orange"></span>
          <span>异常记录: <strong className="text-industrial-orange">{abnormalCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-industrial-green"></span>
          <span>正常记录: <strong>{filteredRecords.length - abnormalCount - manualCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-industrial-blue"></span>
          <span>手工补录: <strong className="text-industrial-blue">{manualCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-industrial-gray"></span>
          <span>待关联合同: <strong className="text-industrial-orange">{unmatchedCount}</strong></span>
        </div>
      </div>
    </header>
  );
}
