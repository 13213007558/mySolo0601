import { useRef, useState } from 'react';
import {
  Save,
  Download,
  Upload,
  RefreshCw,
  FileJson,
  FileSpreadsheet,
  Settings,
  Thermometer,
  UserPlus,
} from 'lucide-react';
import { useOilTempStore } from '@/store/useOilTempStore';

const DEVICES = ['1#箱变', '2#箱变', '3#箱变', '4#箱变'];

export function Toolbar() {
  const {
    selectedDevice,
    setSelectedDevice,
    saveToStorage,
    exportData,
    exportCSV,
    importData,
    resetData,
    setShowSupplementPanel,
    saveStatus,
  } = useOilTempStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await importData(file);
    if (success) {
      setImportError(null);
    } else {
      setImportError('导入失败：文件格式不正确');
      setTimeout(() => setImportError(null), 3000);
    }
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      resetData();
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Thermometer className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">能源箱变油温复核台</h1>
              <p className="text-xs text-slate-500">夜间油温曲线复核与补录管理</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">设备选择:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {DEVICES.map(device => (
                <option key={device} value={device}>{device}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSupplementPanel(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-lg border border-amber-500/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            小赵补录
          </button>

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            onClick={saveToStorage}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm rounded-lg border border-emerald-500/30 transition-colors disabled:opacity-50"
            title="保存到本地"
          >
            <Save className="w-4 h-4" />
            保存
          </button>

          <div className="relative group">
            <button className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-600 transition-colors">
              <Download className="w-4 h-4" />
              导出
            </button>
            <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[140px]">
              <button
                onClick={exportData}
                className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-t-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                导出 JSON
              </button>
              <button
                onClick={exportCSV}
                className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-b-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                导出 CSV
              </button>
            </div>
          </div>

          <button
            onClick={handleImportClick}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-600 transition-colors"
            title="导入数据"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="h-6 w-px bg-slate-700 mx-1" />

          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-sm rounded-lg border border-slate-600 hover:border-red-500/30 transition-colors"
            title="重置数据"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      {importError && (
        <div className="mt-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
          {importError}
        </div>
      )}
    </div>
  );
}
