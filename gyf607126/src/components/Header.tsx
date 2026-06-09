import { useState, useRef } from 'react';
import { Zap, Upload, Download, RotateCcw, Plus, Trash2, Database, AlertTriangle, HardDrive, FileSpreadsheet, FileJson } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { importFromExcel, importFromJSON, exportToExcel, exportToJSON } from '../utils/export';

interface HeaderProps {
  onOpenSupplement: () => void;
}

export const Header = ({ onOpenSupplement }: HeaderProps) => {
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const contracts = useContractStore((state) => state.contracts);
  const resetToMock = useContractStore((state) => state.resetToMock);
  const clearAllData = useContractStore((state) => state.clearAllData);
  const importContracts = useContractStore((state) => state.importContracts);
  const exportContracts = useContractStore((state) => state.exportContracts);
  const markAsCorrupted = useContractStore((state) => state.markAsCorrupted);
  const validateAll = useContractStore((state) => state.validateAll);
  const isDataLoaded = useContractStore((state) => state.isDataLoaded);

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromExcel(file);
      importContracts(data);
      validateAll();
      alert(`成功导入 ${data.length} 份合同数据`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '导入失败');
    }
    setShowImportMenu(false);
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleJSONImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      importContracts(data);
      validateAll();
      alert(`成功导入 ${data.length} 份合同数据`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '导入失败');
    }
    setShowImportMenu(false);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    const data = exportContracts();
    exportToExcel(data, '全部售电合同');
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    const data = exportContracts();
    exportToJSON(data, '全部售电合同');
    setShowExportMenu(false);
  };

  return (
    <header className="bg-gradient-to-r from-energy-900 via-energy-800 to-energy-900 text-white shadow-xl">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 bg-[size:32px_32px]" />
      <div className="relative max-w-[1600px] mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                能源售电合同复核台
              </h1>
              <p className="text-energy-200 text-sm mt-0.5">
                智能校验 · 批量处理 · 差异对比 · 本地持久化
              </p>
            </div>
            {isDataLoaded && (
              <div className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-energy-100">{contracts.length} 份合同</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSupplement}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              小赵补录
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowImportMenu(!showImportMenu);
                  setShowExportMenu(false);
                  setShowSettingsMenu(false);
                }}
                className="btn-secondary text-sm bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Upload className="w-4 h-4" />
                导入
              </button>
              {showImportMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-1 min-w-[160px] z-50">
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => excelInputRef.current?.click()}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    导入 Excel
                  </button>
                  <input
                    ref={jsonInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleJSONImport}
                    className="hidden"
                  />
                  <button
                    onClick={() => jsonInputRef.current?.click()}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <FileJson className="w-4 h-4 text-blue-600" />
                    导入 JSON
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowImportMenu(false);
                  setShowSettingsMenu(false);
                }}
                className="btn-secondary text-sm bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-1 min-w-[160px] z-50">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    导出 Excel
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <FileJson className="w-4 h-4 text-blue-600" />
                    导出 JSON
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowImportMenu(false);
                  setShowExportMenu(false);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Database className="w-5 h-5" />
              </button>
              {showSettingsMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-1 min-w-[200px] z-50">
                  <button
                    onClick={() => {
                      resetToMock();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-energy-600" />
                    重置为示例数据
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定要标记数据为损坏状态吗？这将触发损坏提示界面。')) {
                        markAsCorrupted();
                        setShowSettingsMenu(false);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    模拟数据损坏
                  </button>
                  <div className="border-t border-slate-200 my-1" />
                  <button
                    onClick={() => {
                      if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
                        clearAllData();
                        setShowSettingsMenu(false);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    清空所有数据
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
