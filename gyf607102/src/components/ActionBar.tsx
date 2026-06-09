import { Download, Upload, RotateCcw, FileWarning } from 'lucide-react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  className?: string;
}

export const ActionBar = ({ className }: ActionBarProps) => {
  const { exportData, importData, resetToMock } = useAlarmStore();

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importData(file)
        .then(() => {
          alert('导入成功！数据已合并到现有记录。');
        })
        .catch((err) => {
          alert('导入失败: ' + (err as Error).message);
        });
    }
    e.target.value = '';
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        onClick={exportData}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600"
      >
        <Download className="h-4 w-4" />
        导出数据
      </button>
      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-500 hover:text-emerald-600">
        <Upload className="h-4 w-4" />
        导入数据
        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
      </label>
      <button
        onClick={() => {
          if (confirm('确定要重置为初始Mock数据吗？当前所有修改将会丢失。')) {
            resetToMock();
          }
        }}
        className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-red-500 hover:text-red-600"
      >
        <RotateCcw className="h-4 w-4" />
        重置数据
      </button>
      <div className="ml-auto flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
        <FileWarning className="h-4 w-4" />
        <span className="font-medium">ID校验:</span>
        <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">MANUAL-SAMPLE-001</code>
      </div>
    </div>
  );
};
