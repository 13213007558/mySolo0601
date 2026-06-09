import { Activity, Download, Plus, RefreshCw, BarChart3 } from 'lucide-react';
import type { DataMode } from '../types';

interface HeaderProps {
  dataMode: DataMode;
  onModeChange: (mode: DataMode) => void;
  onExport: () => void;
  onManualEntry: () => void;
  onReset: () => void;
  onToggleChart: () => void;
  showChart: boolean;
}

export const Header = ({
  dataMode,
  onModeChange,
  onExport,
  onManualEntry,
  onReset,
  onToggleChart,
  showChart,
}: HeaderProps) => {
  const modes: { value: DataMode; label: string; color: string }[] = [
    { value: 'normal', label: '正常模式', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'abnormal', label: '异常模式', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'empty', label: '空数据', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">能源冷却液泵巡检板</h1>
              <p className="text-sm text-gray-500">实时监控 · 数据分析 · 智能预警</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {modes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => onModeChange(mode.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    dataMode === mode.value
                      ? 'bg-white shadow-sm ' + mode.color
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <button
              onClick={onToggleChart}
              className={`btn-secondary flex items-center gap-2 ${
                showChart ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">启停图</span>
            </button>

            <button
              onClick={onManualEntry}
              className="btn-success flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">张工补录</span>
            </button>

            <button
              onClick={onExport}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">导出</span>
            </button>

            <button
              onClick={onReset}
              className="btn-secondary flex items-center gap-2"
              title="重置所有数据"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
