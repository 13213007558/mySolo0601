import { useState, useRef } from 'react';
import { useBracketStore } from '@/store/useBracketStore';
import type { ImportResult } from '@/types';

export const useDataImport = () => {
  const importRecords = useBracketStore((state) => state.importRecords);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await importRecords(file);
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('请上传 CSV 或 TXT 格式文件');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await importRecords(file);
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    importResult,
    error,
    fileInputRef,
    handleFileSelect,
    handleFileChange,
    handleDragOver,
    handleDrop,
    clearResult: () => setImportResult(null),
  };
};
