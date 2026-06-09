import React, { useState } from 'react';
import {
  Download,
  FileText,
  Table,
  CheckSquare,
  Square,
  Upload,
  Database,
  Trash2,
  AlertTriangle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useBracketStore } from '@/store/useBracketStore';
import { useDataImport } from '@/hooks/useDataImport';
import type { ExportConfig } from '@/types';

interface ExportOption {
  key: 'includeNormal' | 'includeProblem' | 'includeManual';
  label: string;
  count: number;
  icon: React.ReactNode;
}

export const ExportToolbar: React.FC = () => {
  const normalRecords = useBracketStore((state) => state.normalRecords);
  const problemRecords = useBracketStore((state) => state.problemRecords);
  const manualRecords = useBracketStore((state) => state.manualRecords);
  const filterParams = useBracketStore((state) => state.filterParams);
  const exportData = useBracketStore((state) => state.exportData);
  const loadMockData = useBracketStore((state) => state.loadMockData);
  const clearAllData = useBracketStore((state) => state.clearAllData);
  const simulateStateLoss = useBracketStore((state) => state.simulateStateLoss);
  const simulateOnlyProblemImport = useBracketStore((state) => state.simulateOnlyProblemImport);

  const { isImporting, importResult, error, fileInputRef, handleFileSelect, handleFileChange, clearResult } = useDataImport();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeNormal: true,
    includeProblem: true,
    includeManual: true,
  });

  const options: ExportOption[] = [
    {
      key: 'includeNormal',
      label: '正常记录',
      count: normalRecords.length,
      icon: <Table className="w-4 h-4 text-green-600" />,
    },
    {
      key: 'includeProblem',
      label: '问题记录',
      count: problemRecords.length,
      icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
    },
    {
      key: 'includeManual',
      label: '手工补录',
      count: manualRecords.length,
      icon: <Database className="w-4 h-4 text-blue-600" />,
    },
  ];

  const toggleOption = (key: 'includeNormal' | 'includeProblem' | 'includeManual') => {
    setExportOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = (format: 'csv' | 'markdown') => {
    const config: ExportConfig = {
      format,
      ...exportOptions,
      filterParams,
    };
    exportData(config);
    setShowExportMenu(false);
  };

  const hasRecords = normalRecords.length > 0 || problemRecords.length > 0 || manualRecords.length > 0;

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleFileSelect}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded text-sm font-mono hover:bg-[#2a4d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#1e3a5f]"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? '导入中...' : '导入 CSV'}
            </button>
          </div>

          {!hasRecords && (
            <button
              onClick={loadMockData}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#1e3a5f] rounded text-sm font-mono hover:bg-slate-50 transition-colors border-2 border-[#1e3a5f]"
            >
              <Database className="w-4 h-4" />
              加载示例数据
            </button>
          )}

          <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 font-mono ml-4">
            <span className="px-2 py-1 bg-slate-100 rounded">调试:</span>
            <button
              onClick={simulateStateLoss}
              className="px-2 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition-colors border border-amber-200"
              title="模拟状态丢失"
            >
              <RefreshCw className="w-3 h-3 inline mr-1" />
              状态丢失
            </button>
            <button
              onClick={simulateOnlyProblemImport}
              className="px-2 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors border border-orange-200"
              title="模拟仅坏行导入"
            >
              <XCircle className="w-3 h-3 inline mr-1" />
              仅坏行
            </button>
            {hasRecords && (
              <button
                onClick={clearAllData}
                className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors border border-red-200"
                title="清空所有数据"
              >
                <Trash2 className="w-3 h-3 inline mr-1" />
                清空
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(importResult || error) && (
            <div className={`text-sm font-mono px-3 py-1 rounded ${
              error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {error || importResult?.message}
              <button onClick={clearResult} className="ml-2 hover:opacity-70">×</button>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!hasRecords}
              className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-black rounded text-sm font-mono hover:bg-[#fbbf24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#f59e0b]"
            >
              <Download className="w-4 h-4" />
              导出
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-slate-200 w-72 z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-200 bg-slate-50">
                  <p className="text-xs font-mono text-slate-600 font-medium">选择导出内容</p>
                </div>
                <div className="p-2 space-y-1">
                  {options.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => toggleOption(option.key)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded text-left transition-colors"
                    >
                      {exportOptions[option.key] ? (
                        <CheckSquare className="w-4 h-4 text-[#f59e0b]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      {option.icon}
                      <span className="text-sm text-slate-700">{option.label}</span>
                      <span className="ml-auto text-xs text-slate-500 font-mono">
                        {option.count}条
                      </span>
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={!Object.values(exportOptions).some(Boolean)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded text-sm font-mono hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Table className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('markdown')}
                    disabled={!Object.values(exportOptions).some(Boolean)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded text-sm font-mono hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-4 h-4" />
                    Markdown
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
