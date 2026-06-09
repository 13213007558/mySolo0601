import { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, Info } from 'lucide-react';
import { parseExcelFile, importExcelFile, downloadImportTemplate } from '../utils/import';
import { excelImportTemplate } from '../data/mockData';
import { importAnnotations } from '../db/operations';

export function ImportWizard({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('请选择 Excel 文件（.xlsx 或 .xls 格式）');
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      const parsed = await parseExcelFile(selectedFile);
      setParsedData(parsed);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    try {
      const result = await importExcelFile(file);
      setImportResult(result.importResult);
      setStep(3);
      
      if (result.importResult.success) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleImportSample = async () => {
    setImporting(true);
    try {
      const result = await importAnnotations(excelImportTemplate, '样例数据导入');
      setImportResult(result);
      setStep(3);
      
      if (result.success) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              导入会审清单
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s
                      ? 'bg-primary-600 text-white'
                      : step > s
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= s ? 'text-slate-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  {s === 1 ? '选择文件' : s === 2 ? '预览确认' : '导入完成'}
                </span>
                {s < 3 && <div className="w-12 h-0.5 bg-slate-200 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">导入失败</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-600">
                    支持 .xlsx 和 .xls 格式的 Excel 文件
                  </p>
                  <button
                    onClick={downloadImportTemplate}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    下载导入模板
                  </button>
                </div>

                <label className="block">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/30 transition-colors">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">点击或拖拽文件到此处</p>
                    <p className="text-sm text-slate-400">
                      选择要导入的会审清单 Excel 文件
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2 text-sm text-slate-500">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      不想准备文件？可以直接导入系统提供的样例数据体验功能
                    </p>
                  </div>
                  <button
                    onClick={handleImportSample}
                    disabled={importing}
                    className="btn-secondary"
                  >
                    导入样例数据
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && parsedData && (
            <div>
              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">文件信息</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-500">文件名</p>
                    <p className="font-medium text-slate-800 truncate" title={parsedData.fileName}>
                      {parsedData.fileName}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-500">记录数</p>
                    <p className="font-medium text-slate-800">{parsedData.rowCount} 条</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-sm text-slate-500">列数</p>
                    <p className="font-medium text-slate-800">{parsedData.columns.length} 列</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-slate-700 mb-2">数据预览（前 5 条）</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">行号</th>
                        {parsedData.columns.map(col => (
                          <th key={col} className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.preview.map((row, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                          {parsedData.columns.map(col => (
                            <td key={col} className="px-3 py-2 text-slate-700">
                              {row[col]?.toString() || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-700 font-medium mb-1">导入规则说明</p>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• 系统会自动检测重复的批注编号，重复记录将被跳过</li>
                      <li>• 相同内容的文件只能导入一次，避免重复数据</li>
                      <li>• 缺少页码或专业名称错误的记录会被放到问题区</li>
                      <li>• 导入后可以在列表中编辑和分派责任人</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && importResult && (
            <div className="text-center py-8">
              {importResult.success ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-800 mb-2">导入成功</h4>
                  <p className="text-slate-600 mb-6">
                    共 {importResult.total} 条记录
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                      <p className="text-sm text-green-700">成功导入</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-amber-600">{importResult.errors}</p>
                      <p className="text-sm text-amber-700">待处理问题</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-slate-600">{importResult.skipped}</p>
                      <p className="text-sm text-slate-700">重复跳过</p>
                    </div>
                  </div>
                  {importResult.errorDetails.length > 0 && (
                    <div className="mt-6 text-left max-w-md mx-auto">
                      <p className="text-sm font-medium text-slate-600 mb-2">详细信息：</p>
                      <ul className="text-sm text-slate-500 space-y-1">
                        {importResult.errorDetails.slice(0, 3).map((err, idx) => (
                          <li key={idx}>• 第 {err.row} 行 {err.annotationNo}：{err.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-800 mb-2">导入被阻止</h4>
                  <p className="text-slate-600">{importResult.message}</p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
          {step === 1 ? (
            <button onClick={onClose} className="btn-secondary">
              取消
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s - 1)}
              className="btn-secondary"
              disabled={step === 3 || importing}
            >
              上一步
            </button>
          )}
          
          <div className="flex gap-3">
            {step < 3 && (
              <button
                onClick={handleImport}
                className="btn-primary"
                disabled={!parsedData || importing}
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    导入中...
                  </>
                ) : (
                  '确认导入'
                )}
              </button>
            )}
            {step === 3 && (
              <button onClick={onClose} className="btn-primary">
                完成
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
