import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Tag, FileJson, FileSpreadsheet, Upload } from 'lucide-react';
import { useShadowStore } from '@/store/useShadowStore';
import { exportToJSON, exportToCSV, downloadFile, importFromJSON, importFromCSV, readFileAsText } from '@/utils/importExport';

interface TableToolbarProps {
  visibleCount: number;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({ visibleCount }) => {
  const {
    selectedIds,
    selectAll,
    clearSelection,
    batchUpdateStatus,
    batchDelete,
    exportData,
    annotations,
    currentUser,
    importData,
    loadMockData,
    records,
  } = useShadowStore();

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelectAll = () => {
    if (selectedIds.length === visibleCount) {
      clearSelection();
    } else {
      selectAll();
    }
  };

  const handleBatchStatus = (status: 'normal' | 'warning' | 'danger') => {
    if (selectedIds.length === 0) return;
    batchUpdateStatus(selectedIds, status);
    setShowStatusMenu(false);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      batchDelete(selectedIds);
    }
  };

  const handleExport = async (type: 'json' | 'csv', dataType: 'raw' | 'modified') => {
    const data = exportData(dataType);
    const dateStr = new Date().toISOString().split('T')[0];
    const typeLabel = dataType === 'raw' ? '原始值' : '修正值';

    if (type === 'json') {
      const result = exportToJSON(data, annotations, dataType, currentUser);
      downloadFile(result.data, `屋顶阴影数据_${typeLabel}_${dateStr}.json`, 'application/json');
    } else {
      const csv = exportToCSV(data, dataType);
      downloadFile(csv, `屋顶阴影数据_${typeLabel}_${dateStr}.csv`, 'text/csv');
    }
    setShowExportMenu(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      let result;

      if (file.name.endsWith('.json')) {
        result = importFromJSON(content);
      } else if (file.name.endsWith('.csv')) {
        result = importFromCSV(content);
      } else {
        alert('仅支持JSON或CSV格式文件');
        return;
      }

      if (!result.success) {
        alert(`导入失败：\n${result.errors.join('\n')}`);
        return;
      }

      if (result.warnings.length > 0) {
        const confirmMsg = `导入成功，但有以下警告：\n${result.warnings.slice(0, 5).join('\n')}${result.warnings.length > 5 ? `\n...还有${result.warnings.length - 5}条警告` : ''}\n\n是否继续导入？`;
        if (!confirm(confirmMsg)) return;
      }

      if ('annotations' in result.data!) {
        importData(result.data!.records, result.data!.annotations);
      } else {
        importData(result.data!.records);
      }
      alert(`成功导入 ${result.data!.records.length} 条记录`);
    } catch (err) {
      alert(`导入失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  const allSelected = visibleCount > 0 && selectedIds.length === visibleCount;

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b-2 border-primary-100">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-primary-200 rounded hover:bg-primary-50 transition-colors"
          title={allSelected ? '取消全选' : '全选当前页'}
        >
          {allSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
          <span>
            {selectedIds.length > 0
              ? `已选 ${selectedIds.length}/${visibleCount}`
              : visibleCount > 0
                ? `共 ${visibleCount} 条`
                : '无数据'}
          </span>
        </button>

        {selectedIds.length > 0 && (
          <>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-primary-200 rounded hover:bg-primary-50 transition-colors"
              >
                <Tag size={16} />
                标记状态
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border-2 border-primary-200 rounded shadow-lg z-20 min-w-[120px]">
                  <button onClick={() => handleBatchStatus('normal')} className="w-full px-3 py-2 text-left text-sm hover:bg-success-50 text-success-700">
                    标记为正常
                  </button>
                  <button onClick={() => handleBatchStatus('warning')} className="w-full px-3 py-2 text-left text-sm hover:bg-warning-50 text-warning-700">
                    标记为警告
                  </button>
                  <button onClick={() => handleBatchStatus('danger')} className="w-full px-3 py-2 text-left text-sm hover:bg-danger-50 text-danger-700">
                    标记为危险
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-danger-200 text-danger-600 rounded hover:bg-danger-50 transition-colors"
            >
              <Trash2 size={16} />
              删除
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-primary-200 rounded hover:bg-primary-50 transition-colors"
        >
          <Upload size={16} />
          导入
        </button>

        {records.length === 0 && (
          <button
            onClick={loadMockData}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            加载示例数据
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            <FileSpreadsheet size={16} />
            导出
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 bg-white border-2 border-primary-200 rounded shadow-lg z-20 min-w-[200px]">
              <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">导出修正值（当前展示）</div>
              <button onClick={() => handleExport('json', 'modified')} className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2">
                <FileJson size={14} /> JSON 格式
              </button>
              <button onClick={() => handleExport('csv', 'modified')} className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 flex items-center gap-2">
                <FileSpreadsheet size={14} /> CSV 格式
              </button>
              <div className="px-3 py-1.5 text-xs text-gray-500 border-t border-gray-100">导出原始值（不可修改）</div>
              <button onClick={() => handleExport('json', 'raw')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                <FileJson size={14} /> JSON 格式
              </button>
              <button onClick={() => handleExport('csv', 'raw')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600">
                <FileSpreadsheet size={14} /> CSV 格式
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
