import { useRef } from 'react';
import { Upload, Download, RefreshCw, GitCompare, ArrowUpDown } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { importFromCSV, exportToCSV } from '../utils/export';
import { generateId } from '../utils/calculation';

export const ActionBar = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    versions,
    currentVersionId,
    filters,
    getFilteredRecords,
    setCurrentVersion,
    setFilters,
    addRecord,
  } = useForecastStore();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedRecords = await importFromCSV(file);
      importedRecords.forEach(record => {
        addRecord({
          ...record,
          id: generateId(),
          status: 'pending',
          isAbnormal: false,
          hasStatusConflict: false,
          remarks: [],
        });
      });
      alert(`成功导入 ${importedRecords.length} 条记录`);
    } catch (err) {
      alert((err as Error).message);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const filteredRecords = getFilteredRecords();
    const normalRecords = filteredRecords.filter(r => !r.hasStatusConflict && !r.isAbnormal);
    exportToCSV(normalRecords);
    alert(`已导出 ${normalRecords.length} 条正常记录（已排除状态冲突和异常数据）`);
  };

  const handleDeviationSort = () => {
    const currentSort = filters.deviationSort;
    let newSort: 'asc' | 'desc' | null = 'desc';
    if (currentSort === 'desc') newSort = 'asc';
    else if (currentSort === 'asc') newSort = null;
    setFilters({ deviationSort: newSort });
  };

  const getSortLabel = () => {
    if (!filters.deviationSort) return '偏差排序';
    return filters.deviationSort === 'desc' ? '偏差从大到小' : '偏差从小到大';
  };

  return (
    <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold tracking-wide" style={{ fontFamily: '"Noto Sans SC", sans-serif' }}>
          能源负荷预测对账页
        </h1>
        <div className="h-6 w-px bg-slate-600" />
        <div className="flex items-center gap-2">
          <GitCompare size={16} className="text-slate-400" />
          <select
            value={currentVersionId}
            onChange={(e) => setCurrentVersion(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} {v.isCurrent && '(当前)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-sm"
        >
          <Upload size={16} />
          导入
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors text-sm"
        >
          <Download size={16} />
          导出
        </button>

        <div className="h-6 w-px bg-slate-600 mx-1" />

        <button
          onClick={handleDeviationSort}
          className={`flex items-center gap-2 px-4 py-2 rounded transition-colors text-sm ${
            filters.deviationSort ? 'bg-orange-600 hover:bg-orange-500' : 'bg-slate-700 hover:bg-slate-600'
          }`}
        >
          <ArrowUpDown size={16} className={filters.deviationSort ? 'animate-pulse' : ''} />
          {getSortLabel()}
        </button>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-sm"
        >
          <RefreshCw size={16} />
          重置
        </button>
      </div>
    </div>
  );
};
