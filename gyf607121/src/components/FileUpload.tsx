import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useMeterStore } from '@/store/useMeterStore';

interface FileUploadProps {
  onImportComplete?: (result: { normal: number; problem: number }) => void;
}

export default function FileUpload({ onImportComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastResult, setLastResult] = useState<{ normal: number; problem: number; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importRecords = useMeterStore((state) => state.importRecords);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setImporting(true);
    setLastResult(null);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
        throw new Error('不支持的文件格式，请上传 .csv 或 .xlsx 文件');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件过大，请上传小于 10MB 的文件');
      }

      const result = await importRecords(file);

      setLastResult({
        normal: result.normalCount,
        problem: result.problemCount,
        fileName: file.name,
      });

      onImportComplete?.({ normal: result.normalCount, problem: result.problemCount });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }, [importRecords, onImportComplete]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-400" />
          数据导入
        </h3>
        {lastResult && (
          <button
            onClick={() => setLastResult(null)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          className="hidden"
          disabled={importing}
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          {importing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
              <p className="text-gray-300 font-medium">正在解析文件...</p>
              <p className="text-sm text-gray-500">请稍候，数据校验中</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-700/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary-400" />
              </div>
              <div>
                <p className="text-gray-200 font-medium text-center">
                  拖拽文件到此处，或
                  <span className="text-primary-400 hover:text-primary-300 transition-colors"> 点击选择</span>
                </p>
                <p className="text-sm text-gray-500 mt-1 text-center">
                  支持 CSV、Excel（.xlsx/.xls）格式，最大 10MB
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> CSV
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Excel
                </span>
              </div>
            </div>
          )}
        </label>
      </div>

      {lastResult && (
        <div className="mt-4 p-4 rounded-lg bg-status-success/10 border border-status-success/30 animate-slide-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {lastResult.fileName} 导入成功
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                正常记录 <span className="text-status-success font-medium">{lastResult.normal}</span> 条，
                问题记录 <span className="text-status-warning font-medium">{lastResult.problem}</span> 条
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-status-danger/10 border border-status-danger/30 animate-slide-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-status-danger flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-status-danger">导入失败</p>
              <p className="text-xs text-gray-400 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 rounded-lg bg-industrial-bg/50">
        <p className="text-xs text-gray-500 mb-2">预期的CSV列名（支持中英文）：</p>
        <div className="flex flex-wrap gap-2">
          {['电表编号 / meterNo', '读数 / reading', '抄表时间 / readingTime', '倍率 / multiplier'].map((col) => (
            <code key={col} className="px-2 py-1 text-xs bg-industrial-card rounded border border-industrial-border text-gray-400">
              {col}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
