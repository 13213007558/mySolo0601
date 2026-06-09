import React, { useRef } from 'react';
import { Upload, Download, Plus, Database, Trash2, Eye } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';

export const ActionBar: React.FC = () => {
  const {
    records,
    currentView,
    setView,
    setSampleSelectorOpen,
    setManualEntryModalOpen,
    importFromFile,
    exportToFile,
    addAlert,
    clearAll
  } = useRecordStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importFromFile(file);
      
      if (result.errors.length > 0 && result.added.length === 0) {
        addAlert({
          type: 'error',
          message: result.errors[0],
          plainText: `值班员请注意：导入失败了。${result.errors[0]} 请检查文件格式是否正确。`
        });
      } else if (result.added.length > 0) {
        addAlert({
          type: 'success',
          message: `成功导入 ${result.added.length} 条记录`,
          plainText: `导入成功！共导入 ${result.added.length} 条记录。${result.duplicates.length > 0 ? `其中 ${result.duplicates.length} 条重复记录已保留原始值。` : ''}`
        });
      }
    } catch (error) {
      addAlert({
        type: 'error',
        message: '导入失败',
        plainText: `值班员请注意：导入失败了。${error instanceof Error ? error.message : '未知错误'} 请重试或检查文件。`
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    if (records.length === 0) return;
    if (window.confirm(`确定要清空所有 ${records.length} 条记录吗？此操作不可恢复。`)) {
      clearAll();
      addAlert({
        type: 'info',
        message: '已清空所有记录',
        plainText: '所有记录已清空。您可以加载样例数据或导入文件重新开始。'
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-bgdark-800/80 border-b border-bgdark-700">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-mono font-bold text-white">
          <span className="text-primary-400">⚡</span> 能源充电枪复核台
        </h1>
        <span className="px-2 py-0.5 text-xs bg-primary-800 text-primary-300 rounded">
          {records.length} 条记录
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => setView(currentView === 'main' ? 'review' : 'main')}
          className={`industrial-btn flex items-center gap-2 ${
            currentView === 'review' 
              ? 'bg-primary-700 border-primary-500 text-white' 
              : 'bg-bgdark-700 border-bgdark-600 text-gray-200 hover:bg-bgdark-600'
          }`}
        >
          <Eye size={16} />
          {currentView === 'main' ? '复盘页' : '复核台'}
        </button>

        <button
          onClick={() => setSampleSelectorOpen(true)}
          className="industrial-btn-green flex items-center gap-2"
        >
          <Database size={16} />
          加载样例
        </button>

        <button
          onClick={() => setManualEntryModalOpen(true)}
          className="industrial-btn-purple flex items-center gap-2"
        >
          <Plus size={16} />
          手工补录
        </button>

        <button
          onClick={handleImportClick}
          className="industrial-btn-orange flex items-center gap-2"
        >
          <Upload size={16} />
          导入数据
        </button>

        <button
          onClick={exportToFile}
          className="industrial-btn-primary flex items-center gap-2"
          disabled={records.length === 0}
        >
          <Download size={16} />
          导出数据
        </button>

        <button
          onClick={handleClearAll}
          className="industrial-btn-gray flex items-center gap-2"
          disabled={records.length === 0}
        >
          <Trash2 size={16} />
          清空
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
