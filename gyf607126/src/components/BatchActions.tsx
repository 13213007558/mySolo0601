import { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowDownCircle, Tag, Download, Trash2, ChevronDown, X } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { AnomalyType, ContractStatus } from '../types/contract';
import { anomalyColors, statusColors } from '../data/mockData';
import { exportToExcel, exportToJSON } from '../utils/export';

const anomalyTypes: AnomalyType[] = ['附件缺失', '状态冲突', '金额异常', '日期错误', '设备重复', '其他'];
const statusOptions: ContractStatus[] = ['待审核', '审核通过', '异常', '已退回', '草稿'];

export const BatchActions = () => {
  const selectedIds = useContractStore((state) => state.selectedIds);
  const clearSelection = useContractStore((state) => state.clearSelection);
  const batchUpdateStatus = useContractStore((state) => state.batchUpdateStatus);
  const batchMarkAnomaly = useContractStore((state) => state.batchMarkAnomaly);
  const batchRemoveAnomaly = useContractStore((state) => state.batchRemoveAnomaly);
  const validateAll = useContractStore((state) => state.validateAll);
  const exportContracts = useContractStore((state) => state.exportContracts);
  const deleteContract = useContractStore((state) => state.deleteContract);

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAnomalyMenu, setShowAnomalyMenu] = useState(false);
  const [showRemoveAnomalyMenu, setShowRemoveAnomalyMenu] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleExportExcel = () => {
    const data = exportContracts(selectedIds);
    exportToExcel(data, `选中合同_${selectedIds.length}份`);
  };

  const handleExportJSON = () => {
    const data = exportContracts(selectedIds);
    exportToJSON(data, `选中合同_${selectedIds.length}份`);
  };

  const handleBatchDelete = () => {
    if (confirm(`确定要删除选中的 ${selectedIds.length} 份合同吗？此操作不可恢复。`)) {
      selectedIds.forEach((id) => deleteContract(id));
      clearSelection();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-energy-50 rounded-lg">
          <CheckCircle className="w-4 h-4 text-energy-600" />
          <span className="text-sm font-medium text-energy-700">
            已选择 {selectedIds.length} 份合同
          </span>
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <div className="relative">
          <button
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowAnomalyMenu(false);
              setShowRemoveAnomalyMenu(false);
            }}
            className="btn-secondary text-sm py-1.5"
          >
            <Tag className="w-4 h-4" />
            批量更新状态
            <ChevronDown className="w-4 h-4" />
          </button>
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 p-1 min-w-[140px]">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    batchUpdateStatus(selectedIds, status);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-slate-50 flex items-center gap-2 ${statusColors[status]}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusColors[status].includes('amber') ? 'bg-amber-500' : statusColors[status].includes('emerald') ? 'bg-emerald-500' : statusColors[status].includes('rose') ? 'bg-rose-500' : statusColors[status].includes('sky') ? 'bg-sky-500' : 'bg-slate-500'}`} />
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowAnomalyMenu(!showAnomalyMenu);
              setShowStatusMenu(false);
              setShowRemoveAnomalyMenu(false);
            }}
            className="btn-secondary text-sm py-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            <AlertTriangle className="w-4 h-4" />
            标记异常
            <ChevronDown className="w-4 h-4" />
          </button>
          {showAnomalyMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 p-1 min-w-[150px]">
              {anomalyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    batchMarkAnomaly(selectedIds, type);
                    setShowAnomalyMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm rounded-md hover:bg-slate-50 ${anomalyColors[type]}`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowRemoveAnomalyMenu(!showRemoveAnomalyMenu);
              setShowStatusMenu(false);
              setShowAnomalyMenu(false);
            }}
            className="btn-secondary text-sm py-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          >
            <CheckCircle className="w-4 h-4" />
            移除异常
            <ChevronDown className="w-4 h-4" />
          </button>
          {showRemoveAnomalyMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 p-1 min-w-[150px]">
              {anomalyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    batchRemoveAnomaly(selectedIds, type);
                    setShowRemoveAnomalyMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm rounded-md hover:bg-slate-50 text-slate-700"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={validateAll}
          className="btn-secondary text-sm py-1.5"
          title="重新校验所有异常"
        >
          <ArrowDownCircle className="w-4 h-4" />
          重新校验
        </button>

        <div className="w-px h-6 bg-slate-200" />

        <button onClick={handleExportExcel} className="btn-secondary text-sm py-1.5">
          <Download className="w-4 h-4" />
          导出Excel
        </button>

        <button onClick={handleExportJSON} className="btn-secondary text-sm py-1.5">
          <Download className="w-4 h-4" />
          导出JSON
        </button>

        <div className="w-px h-6 bg-slate-200" />

        <button onClick={handleBatchDelete} className="btn-danger text-sm py-1.5">
          <Trash2 className="w-4 h-4" />
          删除
        </button>

        <button onClick={clearSelection} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
