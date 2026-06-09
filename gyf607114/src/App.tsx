import {
  Header,
  StatsPanel,
  PumpCard,
  DetailPanel,
  Timeline,
  ImportPanel,
  ManualEntryModal,
  StartStopChart,
} from './components';
import { useInspectionData } from './hooks/useInspectionData';
import { Activity, FileText } from 'lucide-react';

function App() {
  const {
    records,
    timeline,
    dataMode,
    isLoading,
    importResult,
    selectedRecord,
    showManualModal,
    showStartStopChart,
    stats,
    loadSampleData,
    importData,
    addManualRecord,
    deleteRecord,
    selectRecord,
    setShowManualModal,
    setShowStartStopChart,
    exportData,
    clearImportResult,
    addStartStopLog,
    resetAll,
  } = useInspectionData();

  const handleAddManualRecord = (data: Parameters<typeof addManualRecord>[0]) => {
    return addManualRecord(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        dataMode={dataMode}
        onModeChange={(mode) => loadSampleData(mode, false)}
        onExport={exportData}
        onManualEntry={() => setShowManualModal(true)}
        onReset={resetAll}
        onToggleChart={() => setShowStartStopChart(!showStartStopChart)}
        showChart={showStartStopChart}
      />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <StatsPanel stats={stats} />
            </div>

            <ImportPanel
              isLoading={isLoading}
              importResult={importResult}
              onImport={importData}
              onClear={clearImportResult}
            />

            {stats.manual > 0 && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <strong>当前包含 {stats.manual} 条张工手工补录记录</strong>
                  <span className="text-purple-600">
                    — 页面卡片、详情时间线和导出表已同步更新。点击"启停图"可查看补录前后差异。
                  </span>
                </p>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">冷却泵列表</h2>
              <span className="text-sm text-gray-500">
                共 {records.length} 台设备
              </span>
            </div>

            {records.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">暂无数据</h3>
                <p className="text-gray-500 mb-6">
                  当前为空数据模式，您可以：
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => loadSampleData('normal', false)}
                    className="btn-success"
                  >
                    加载正常数据
                  </button>
                  <button
                    onClick={() => loadSampleData('abnormal', false)}
                    className="btn-danger"
                  >
                    加载异常数据
                  </button>
                  <button
                    onClick={() => setShowManualModal(true)}
                    className="btn-primary"
                  >
                    张工手工补录
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {records.map((record) => (
                  <PumpCard
                    key={record.id}
                    record={record}
                    isSelected={selectedRecord?.id === record.id}
                    onClick={() => selectRecord(record)}
                  />
                ))}
              </div>
            )}

            {records.length > 0 && (
              <div className="mt-6">
                <Timeline events={timeline} />
              </div>
            )}
          </div>
        </div>

        <DetailPanel
          record={selectedRecord}
          onClose={() => selectRecord(null)}
          onDelete={deleteRecord}
          onAddStartStop={addStartStopLog}
        />
      </main>

      <ManualEntryModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSubmit={handleAddManualRecord}
        existingRecords={records}
      />

      <StartStopChart
        records={records}
        isOpen={showStartStopChart}
        onClose={() => setShowStartStopChart(false)}
      />
    </div>
  );
}

export default App;
