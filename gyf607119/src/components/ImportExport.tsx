import { useState, useRef } from 'react';
import { Download, Upload, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useGateStore } from '../store/useGateStore';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  type: ToastType;
  message: string;
}

export function ImportExport() {
  const { exportData, importData, resetData, gates } = useGateStore();
  const [toast, setToast] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    try {
      const jsonData = exportData();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `道闸巡检数据_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', `成功导出 ${gates.length} 条数据`);
    } catch (error) {
      showToast('error', '导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = importData(content);
        if (result.success) {
          showToast('success', result.message);
        } else {
          showToast('error', result.message);
        }
      } catch (error) {
        showToast('error', '文件读取失败');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？这将恢复到初始内置样例数据。')) {
      resetData();
      showToast('info', '已重置为内置样例数据');
    }
  };

  const toastColors = {
    success: 'bg-industrial-green-500',
    error: 'bg-industrial-red-500',
    info: 'bg-industrial-blue-500',
  };

  return (
    <div className="relative">
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 px-4 py-3 text-white shadow-lg flex items-center gap-2',
          toastColors[toast.type]
        )}>
          {toast.type === 'success' && <Check className="w-4 h-4" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {toast.type === 'info' && <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExport}
          className="industrial-btn-primary inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出 JSON
        </button>
        
        <button
          onClick={handleImportClick}
          className="industrial-btn-secondary inline-flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          导入 JSON
        </button>
        
        <button
          onClick={handleReset}
          className="industrial-btn-secondary inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          重置数据
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
