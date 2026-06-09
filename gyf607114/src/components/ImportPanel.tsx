import { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, AlertTriangle, X, FileSpreadsheet } from 'lucide-react';
import type { ImportResult } from '../types';

interface ImportPanelProps {
  isLoading: boolean;
  importResult: ImportResult | null;
  onImport: (file: File) => Promise<void>;
  onClear: () => void;
}

export const ImportPanel = ({
  isLoading,
  importResult,
  onImport,
  onClear,
}: ImportPanelProps) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      alert('请上传 Excel (.xlsx, .xls) 或 CSV 文件');
      return;
    }

    await onImport(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="card mb-6">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">数据导入</h2>
          <p className="text-sm text-gray-500">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
        </div>
        {importResult && (
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-5">
        {!importResult ? (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {isLoading ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
                <p className="text-gray-600 font-medium">正在处理文件...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-gray-900 font-medium mb-1">点击或拖拽文件到此处</p>
                <p className="text-sm text-gray-500">
                  系统将自动处理重复记录和空白字段
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-600">
                    支持字段: pumpCode, pumpName, location, temperature, pressure, flowRate, vibration, runningHours, lastMaintenance, inspector, inspectionTime, remarks
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  importResult.success > 0
                    ? 'bg-green-100'
                    : importResult.errors.length > 0
                    ? 'bg-amber-100'
                    : 'bg-red-100'
                }`}>
                  {importResult.success > 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : importResult.errors.length > 0 ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">导入完成</p>
                  <p className="text-sm text-gray-500">共处理 {importResult.totalProcessed} 条记录</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                  <p className="text-xs text-gray-500">成功导入</p>
                </div>
                {importResult.skipped > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                    <p className="text-xs text-gray-500">重复跳过</p>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                    <p className="text-xs text-gray-500">存在警告</p>
                  </div>
                )}
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto scrollbar-thin">
                <p className="text-sm font-medium text-gray-700 mb-2">处理详情：</p>
                <div className="space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        error.field === 'pumpCode' && error.message.includes('已存在')
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {error.field === 'pumpCode' && error.message.includes('已存在') ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium ${
                            error.field === 'pumpCode' && error.message.includes('已存在')
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}>
                            第 {error.row} 行 - {error.field}
                          </p>
                          <p className="text-gray-600 text-xs mt-0.5">{error.message}</p>
                          {error.originalValue !== null && error.originalValue !== undefined && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              原始值: "{String(error.originalValue)}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClear} className="btn-secondary">
                关闭
              </button>
              <button onClick={handleClick} className="btn-primary">
                继续导入
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
