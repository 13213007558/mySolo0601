import { Zap, User, Download, FileSpreadsheet, Settings } from 'lucide-react';
import { useMeterStore } from '@/store/useMeterStore';
import { OPERATORS, OperatorName } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface HeaderProps {
  onExportSummary: () => void;
  onExportExcel: () => void;
  onClearData: () => void;
}

export default function Header({ onExportSummary, onExportExcel, onClearData }: HeaderProps) {
  const { currentOperator, setOperator, lastSavedAt } = useMeterStore();

  return (
    <header className="sticky top-0 z-50 bg-industrial-bg/80 backdrop-blur-xl border-b border-industrial-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-primary shadow-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-gradient">能源园区</span>
                <span className="text-gray-100">电表复核台</span>
              </h1>
              <p className="text-xs text-gray-500">青岚光伏二区 · 专业数据复核工具</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {lastSavedAt && (
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                已保存 {format(lastSavedAt, 'HH:mm:ss', { locale: zhCN })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <select
                value={currentOperator}
                onChange={(e) => setOperator(e.target.value as OperatorName)}
                className="bg-industrial-card border border-industrial-border rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
              >
                {OPERATORS.filter(op => op !== '系统').map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div className="h-8 w-px bg-industrial-border" />

            <div className="flex items-center gap-2">
              <button
                onClick={onExportSummary}
                className="btn-secondary text-sm py-2"
                title="导出复核摘要"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">导出摘要</span>
              </button>
              <button
                onClick={onExportExcel}
                className="btn-primary text-sm py-2"
                title="导出完整Excel"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">导出Excel</span>
              </button>
              <button
                onClick={onClearData}
                className="btn-secondary text-sm py-2 text-status-danger hover:border-status-danger/50"
                title="清空所有数据"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
