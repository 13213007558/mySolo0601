import { useState, useRef } from 'react';
import {
  Upload,
  Download,
  Undo2,
  CheckCircle,
  XCircle,
  Database,
  Trash2,
  FileDown,
  AlertTriangle,
} from 'lucide-react';
import { useBatteryStore, useFilteredRecords } from '../store/batteryStore';
import { parseCSVFile, generateCSVTemplate, downloadFile } from '../utils/fileHandler';
import { StatusBadge } from '../components/StatusBadge';
import { FormatTooltip } from '../components/FormatTooltip';
import { FilterPanel } from '../components/FilterPanel';
import type { RecordStatus } from '../types';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportResult, setShowImportResult] = useState<{
    success: boolean;
    count: number;
    warnings: string[];
    errors: string[];
  } | null>(null);
  const [showReviewConfirm, setShowReviewConfirm] = useState<RecordStatus | null>(null);
  const [reviewerName, setReviewerName] = useState('值班员');

  const {
    records,
    selectedIds,
    historyStack,
    importRecords,
    reviewRecords,
    undo,
    selectRecord,
    selectAll,
    exportRecords,
    loadSampleData,
    deleteRecords,
  } = useBatteryStore();
  const filteredRecords = useFilteredRecords();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseCSVFile(file);
      
      if (result.success || result.records.length > 0) {
        importRecords(result.records);
        setShowImportResult({
          success: result.success,
          count: result.records.length,
          warnings: result.warnings,
          errors: result.errors,
        });
        setTimeout(() => setShowImportResult(null), 5000);
      } else {
        setShowImportResult({
          success: false,
          count: 0,
          warnings: [],
          errors: result.errors,
        });
      }
    } catch (error) {
      setShowImportResult({
        success: false,
        count: 0,
        warnings: [],
        errors: [`导入失败: ${(error as Error).message}`],
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadFile(template, '电池记录导入模板.csv', 'text/csv;charset=utf-8');
  };

  const handleReview = (status: RecordStatus) => {
    if (selectedIds.length === 0) return;
    reviewRecords(selectedIds, status, reviewerName);
    setShowReviewConfirm(null);
  };

  const canUndo = historyStack.length > 0;
  const allSelected = filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;
  const hasSelected = selectedIds.length > 0;

  const stats = {
    total: records.length,
    pending: records.filter(r => r.status === 'pending').length,
    normal: records.filter(r => r.status === 'normal').length,
    anomaly: records.filter(r => r.status === 'anomaly').length,
    formatIssues: records.filter(r => r.formatIssue !== null).length,
    dataAnomalies: records.filter(r => r.isAnomaly).length,
  };

  return (
    <div className="flex gap-4 p-4 max-w-[1600px] mx-auto">
      <div className="w-72 flex-shrink-0">
        <FilterPanel />
        
        <div className="card-industrial mt-4">
          <h3 className="font-semibold text-industrial-100 mb-3">数据统计</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-industrial-300">总记录数</span>
              <span className="font-mono font-semibold text-white">{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-industrial-300">待复核</span>
              <span className="font-mono font-semibold text-industrial-200">{stats.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-industrial-300">正常</span>
              <span className="font-mono font-semibold text-success-400">{stats.normal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-industrial-300">异常</span>
              <span className="font-mono font-semibold text-warning-400">{stats.anomaly}</span>
            </div>
            <div className="border-t border-industrial-400 my-2"></div>
            <div className="flex justify-between">
              <span className="text-industrial-300">编号格式问题</span>
              <span className={`font-mono font-semibold ${stats.formatIssues > 0 ? 'text-warning-400' : 'text-industrial-200'}`}>
                {stats.formatIssues}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-industrial-300">数据异常</span>
              <span className={`font-mono font-semibold ${stats.dataAnomalies > 0 ? 'text-warning-400' : 'text-industrial-200'}`}>
                {stats.dataAnomalies}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="card-industrial mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
              <Upload className="w-4 h-4 mr-2 inline" />
              导入CSV
            </button>
            <button onClick={handleDownloadTemplate} className="btn-secondary">
              <FileDown className="w-4 h-4 mr-2 inline" />
              下载模板
            </button>
            <button onClick={loadSampleData} className="btn-secondary">
              <Database className="w-4 h-4 mr-2 inline" />
              加载样例数据
            </button>
            
            <div className="h-8 w-px bg-industrial-400 mx-2"></div>
            
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`btn-secondary ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Undo2 className="w-4 h-4 mr-2 inline" />
              撤回{historyStack.length > 0 && ` (${historyStack.length})`}
            </button>
            
            <div className="h-8 w-px bg-industrial-400 mx-2"></div>
            
            <button
              onClick={() => exportRecords('normal')}
              disabled={stats.normal === 0}
              className={`btn-success ${stats.normal === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Download className="w-4 h-4 mr-2 inline" />
              导出正常数据
            </button>
            <button
              onClick={() => exportRecords('all')}
              disabled={records.length === 0}
              className={`btn-primary ${records.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Download className="w-4 h-4 mr-2 inline" />
              导出全部
            </button>
            
            {hasSelected && (
              <>
                <div className="h-8 w-px bg-industrial-400 mx-2"></div>
                <button onClick={() => setShowReviewConfirm('normal')} className="btn-success">
                  <CheckCircle className="w-4 h-4 mr-2 inline" />
                  标记正常 ({selectedIds.length})
                </button>
                <button onClick={() => setShowReviewConfirm('anomaly')} className="btn-warning">
                  <XCircle className="w-4 h-4 mr-2 inline" />
                  标记异常 ({selectedIds.length})
                </button>
                <button
                  onClick={() => deleteRecords(selectedIds)}
                  className="btn-secondary border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  删除选中
                </button>
              </>
            )}
          </div>
        </div>

        {showImportResult && (
          <div className={`mb-4 p-4 rounded border-2 ${
            showImportResult.success ? 'bg-success-500/20 border-success-500' : 'bg-warning-500/20 border-warning-500'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {showImportResult.success ? (
                <CheckCircle className="w-5 h-5 text-success-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-warning-400" />
              )}
              <span className="font-semibold">
                {showImportResult.success ? '导入成功' : '导入部分成功'}：
                导入 {showImportResult.count} 条记录
              </span>
            </div>
            {showImportResult.warnings.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-warning-400 mb-1">警告：</div>
                <ul className="text-xs text-warning-300 space-y-1">
                  {showImportResult.warnings.slice(0, 3).map((w, i) => (
                    <li key={i}>• {w}</li>
                  ))}
                  {showImportResult.warnings.length > 3 && (
                    <li>... 还有 {showImportResult.warnings.length - 3} 条警告</li>
                  )}
                </ul>
              </div>
            )}
            {showImportResult.errors.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-red-400 mb-1">错误：</div>
                <ul className="text-xs text-red-300 space-y-1">
                  {showImportResult.errors.slice(0, 3).map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {showReviewConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="card-industrial w-96">
              <h3 className="text-lg font-semibold mb-4">
                确认批量标记为{showReviewConfirm === 'normal' ? '正常' : '异常'}
              </h3>
              <p className="text-sm text-industrial-300 mb-4">
                将对 {selectedIds.length} 条记录进行标记。
              </p>
              <div className="mb-4">
                <label className="block text-xs text-industrial-300 mb-1">复核人</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="input-industrial"
                  placeholder="请输入复核人姓名"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowReviewConfirm(null)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => handleReview(showReviewConfirm)}
                  className={showReviewConfirm === 'normal' ? 'btn-success' : 'btn-warning'}
                >
                  确认标记
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card-industrial overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-industrial-100">
              电池记录列表
              <span className="ml-2 text-sm text-industrial-300 font-normal">
                (显示 {filteredRecords.length} 条 / 共 {records.length} 条)
              </span>
            </h3>
            {filteredRecords.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-industrial-300">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-industrial-300 bg-industrial-600 text-primary-500 focus:ring-primary-500"
                />
                全选当前页
              </label>
            )}
          </div>

          {filteredRecords.length === 0 ? (
            <div className="text-center py-16 text-industrial-400">
              <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暂无数据</p>
              <p className="text-sm mt-2">点击"导入CSV"或"加载样例数据"开始使用</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th className="w-12">选择</th>
                    <th>电池编号</th>
                    <th>换电日期</th>
                    <th>换电地点</th>
                    <th>操作人员</th>
                    <th>电压(V)</th>
                    <th>温度(°C)</th>
                    <th>状态</th>
                    <th>复核人</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className={`transition-colors ${
                        record.isAnomaly ? 'bg-warning-500/10' : ''
                      }`}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(record.id)}
                          onChange={(e) => selectRecord(record.id, e.target.checked)}
                          className="w-4 h-4 rounded border-industrial-300 bg-industrial-600 text-primary-500 focus:ring-primary-500"
                        />
                      </td>
                      <td className="font-mono">
                        <FormatTooltip message={record.formatIssue}>
                          {record.batteryNo}
                        </FormatTooltip>
                      </td>
                      <td>{record.exchangeDate}</td>
                      <td>{record.location}</td>
                      <td>{record.operator}</td>
                      <td className={`font-mono ${
                        record.voltage < 3.2 || record.voltage > 4.2
                          ? 'text-warning-400 font-semibold'
                          : ''
                      }`}>
                        {record.voltage.toFixed(1)}
                      </td>
                      <td className={`font-mono ${
                        record.temperature < 0 || record.temperature > 55
                          ? 'text-warning-400 font-semibold'
                          : ''
                      }`}>
                        {record.temperature}
                      </td>
                      <td>
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="text-industrial-300">
                        {record.reviewedBy || '-'}
                      </td>
                      <td className="text-industrial-300 max-w-[150px] truncate">
                        {record.remark || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
