import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Info, X } from 'lucide-react';
import Header from '@/components/Header';
import StatisticsCards from '@/components/StatisticsCards';
import FileUpload from '@/components/FileUpload';
import NormalRecordsTable from '@/components/NormalRecordsTable';
import ProblemRecordsList from '@/components/ProblemRecordsList';
import MultiplierPanel from '@/components/MultiplierPanel';
import OperationLogs from '@/components/OperationLogs';
import ExportModal from '@/components/ExportModal';
import { useMeterStore } from '@/store/useMeterStore';

export default function Home() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [statusAlertMessage, setStatusAlertMessage] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadState = useMeterStore((state) => state.loadState);
  const clearState = useMeterStore((state) => state.clearState);
  const saveState = useMeterStore((state) => state.saveState);
  const lastRefreshReason = useMeterStore((state) => state.lastRefreshReason);
  const exportSummary = useMeterStore((state) => state.exportSummary);
  const exportExcel = useMeterStore((state) => state.exportExcel);
  const isLoading = useMeterStore((state) => state.isLoading);
  const addLog = useMeterStore((state) => state.addLog);

  useEffect(() => {
    const loaded = loadState();

    if (!loaded && lastRefreshReason) {
      setStatusAlertMessage(lastRefreshReason);
      setShowStatusAlert(true);
    }

    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      saveState();
    }, 30000);

    return () => clearInterval(interval);
  }, [saveState]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveState]);

  useEffect(() => {
    const expectedTimestamp = sessionStorage.getItem('meter_review_expected_save');
    const actualLastSaved = localStorage.getItem('meter_review_app_state_v1');

    if (expectedTimestamp && !actualLastSaved) {
      const reason = '检测到本地状态丢失，可能是浏览器缓存清理或无痕模式导致';
      addLog('status_lost', '状态丢失检测', reason);
      setStatusAlertMessage(reason);
      setShowStatusAlert(true);
    }

    sessionStorage.removeItem('meter_review_expected_save');
  }, []);

  const handleExportSummary = useCallback(() => {
    exportSummary();
    setShowExportModal(true);
  }, [exportSummary]);

  const handleClearData = useCallback(() => {
    if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
      clearState();
      setShowClearConfirm(false);
    }
  }, [clearState]);

  const handleImportComplete = useCallback((result: { normal: number; problem: number }) => {
    if (result.problem > 0) {
      setStatusAlertMessage(
        `导入完成，但检测到 ${result.problem} 条问题记录，请在问题记录区处理`
      );
      setShowStatusAlert(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onExportSummary={handleExportSummary}
        onExportExcel={exportExcel}
        onClearData={() => setShowClearConfirm(true)}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
        {showStatusAlert && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-slide-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-200 font-medium">状态提示</p>
                <p className="text-sm text-amber-100/80 mt-1">{statusAlertMessage}</p>
              </div>
              <button
                onClick={() => setShowStatusAlert(false)}
                className="text-amber-400 hover:text-amber-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3 text-white">
              <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
              <span className="text-lg font-medium">正在处理数据...</span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <StatisticsCards />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <FileUpload onImportComplete={handleImportComplete} />
          </div>
          <div className="lg:col-span-2">
            <div className="card p-5 h-full">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                  <Info className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">使用说明</h3>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                      <span>
                        上传设备导出的 <code className="px-1.5 py-0.5 bg-industrial-bg rounded text-xs">.csv</code> 或{' '}
                        <code className="px-1.5 py-0.5 bg-industrial-bg rounded text-xs">.xlsx</code> 文件
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-success mt-1.5 flex-shrink-0" />
                      <span>系统自动校验数据，正常记录进入统计，坏行留在问题区</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-warning mt-1.5 flex-shrink-0" />
                      <span>补录晚到需标注原因，刷新后状态丢失会自动记录</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-purple mt-1.5 flex-shrink-0" />
                      <span>老周手工补录的分表倍率已预置，可在下方管理面板查看和更新</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="xl:col-span-2">
            <NormalRecordsTable />
          </div>
          <div className="xl:col-span-1">
            <ProblemRecordsList />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MultiplierPanel />
          <OperationLogs />
        </div>
      </main>

      <footer className="border-t border-industrial-border py-4 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>能源园区电表复核台 · 青岚光伏二区专用</p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            数据本地加密存储 · 无需联网 · 自动保存
          </p>
        </div>
      </footer>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative w-full max-w-md bg-industrial-card rounded-2xl border border-industrial-border shadow-card-hover p-6 animate-slide-in">
            <h3 className="text-lg font-bold mb-2">确认清空数据</h3>
            <p className="text-sm text-gray-400 mb-6">
              此操作将清空所有已导入的记录、问题记录、操作日志等数据。此操作不可撤销，建议先导出备份。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary py-2 text-sm"
              >
                取消
              </button>
              <button onClick={handleClearData} className="btn-danger py-2 text-sm">
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
