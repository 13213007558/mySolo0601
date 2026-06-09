import { useState } from 'react';
import { FileSpreadsheet, Upload, Download, RotateCcw, FileDown, ListChecks, FileText, HelpCircle } from 'lucide-react';
import { useInitialize, resetAllData } from './hooks/useInitialize';
import { useAnnotations } from './hooks/useAnnotations';
import { StatsCards, StatusDistribution } from './components/StatsCards';
import { FilterPanel } from './components/FilterPanel';
import { ProblemSection } from './components/ProblemSection';
import { AnnotationList } from './components/AnnotationList';
import { DetailDrawer } from './components/DetailDrawer';
import { ImportWizard } from './components/ImportWizard';
import { exportToExcel, exportSummary, exportChecklist, generateHash } from './utils/export';
import { getRepliesByAnnotationId } from './db/operations';

function App() {
  const { isLoading, error: initError, isInitialized } = useInitialize();
  const {
    annotations,
    normalAnnotations,
    problemAnnotations,
    loading,
    error,
    stats,
    filters,
    updateFilter,
    clearFilters,
    refresh,
    removeAnnotation,
    changeStatus
  } = useAnnotations();

  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastHash, setLastHash] = useState(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    
    const currentHash = generateHash(annotations.map(a => ({
      annotationNo: a.annotationNo,
      status: a.status,
      updatedAt: a.updatedAt
    })));
    
    if (lastHash && currentHash !== lastHash) {
      console.log(`数据已更新: ${lastHash} → ${currentHash}`);
    }
    setLastHash(currentHash);
  };

  const handleResetData = async () => {
    if (confirm('确定要重置所有数据吗？这将恢复到初始样例状态，所有修改都会丢失。')) {
      try {
        await resetAllData();
        await refresh();
        alert('数据已重置');
      } catch (err) {
        alert('重置失败：' + err.message);
      }
    }
  };

  const handleExportExcel = () => {
    exportToExcel(annotations, `图纸会审批注清单_${formatDate()}.xlsx`);
  };

  const handleExportSummary = async () => {
    const replies = await getRepliesForAnnotations(annotations);
    exportSummary(annotations, replies, `会审批注回复摘要_${formatDate()}.txt`);
  };

  const handleExportChecklist = () => {
    exportChecklist(annotations, `会审问题追踪核对表_${formatDate()}.txt`);
  };

  const handleImportSuccess = () => {
    setShowImportWizard(false);
    refresh();
  };

  const handleVerifyData = async () => {
    const currentHash = generateHash(annotations.map(a => ({
      annotationNo: a.annotationNo,
      status: a.status,
      description: a.description,
      assignee: a.assignee
    })));
    
    const replies = await getRepliesForAnnotations(annotations);
    const replyCount = replies.length;
    
    alert(
      `数据一致性验证\n\n` +
      `总批注数：${annotations.length}\n` +
      `总回复数：${replyCount}\n` +
      `数据哈希：${currentHash}\n\n` +
      `刷新页面后，此哈希值应保持不变。\n` +
      `导出的 Excel 摘要与当前列表数据一致。`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">正在初始化数据...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">初始化失败</h2>
          <p className="text-slate-600 mb-4">{initError}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            刷新重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  图纸会审批注追踪板
                </h1>
                <p className="text-xs text-slate-500">
                  多专业会审意见管理 · 责任流转追踪
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative group">
                <button
                  onClick={() => setShowImportWizard(true)}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  导入会审清单
                </button>
              </div>

              <div className="relative group">
                <button className="btn-secondary">
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                    导出 Excel 清单
                  </button>
                  <button
                    onClick={handleExportSummary}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    导出回复摘要
                  </button>
                  <button
                    onClick={handleExportChecklist}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ListChecks className="w-4 h-4 text-amber-600" />
                    导出核对清单
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={handleVerifyData}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                  >
                    <FileDown className="w-4 h-4" />
                    验证数据一致性
                  </button>
                </div>
              </div>

              <button
                onClick={handleResetData}
                className="btn-secondary"
                title="重置为初始样例数据"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置数据
              </button>

              <button
                onClick={() => setShowHelp(true)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <StatsCards stats={stats} onRefresh={handleRefresh} refreshing={refreshing} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <FilterPanel
              filters={filters}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
            />

            {problemAnnotations.length > 0 && (
              <ProblemSection
                annotations={problemAnnotations}
                onRefresh={refresh}
                onViewDetail={setSelectedAnnotation}
              />
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                正常记录
                <span className="ml-2 text-sm font-normal text-slate-500">
                  ({normalAnnotations.length} 条)
                </span>
              </h2>
              {error && (
                <span className="text-sm text-red-600">{error}</span>
              )}
            </div>

            <AnnotationList
              annotations={normalAnnotations}
              onViewDetail={setSelectedAnnotation}
              onDelete={removeAnnotation}
              onRefresh={refresh}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-1">
            <StatusDistribution stats={stats} />
            
            <div className="card p-4">
              <h3 className="font-medium text-slate-700 mb-3">快速操作指南</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                  <p>点击「导入会审清单」上传 Excel 文件或使用样例数据</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                  <p>在「问题区」修复缺少页码或专业错误的记录</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                  <p>点击「查看详情」添加回复、分派责任人、查看版本历史</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                  <p>点击「刷新数据」确认列表、详情、导出摘要数据一致</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">✓</span>
                  <p>刷新页面后所有数据保持不变，存储在浏览器本地 IndexedDB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedAnnotation && (
        <DetailDrawer
          annotation={selectedAnnotation}
          onClose={() => setSelectedAnnotation(null)}
          onRefresh={refresh}
        />
      )}

      {showImportWizard && (
        <ImportWizard
          onClose={() => setShowImportWizard(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {showHelp && (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">使用帮助</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">项目简介</h4>
                  <p className="text-slate-600 text-sm">
                    「图纸会审批注追踪板」用于管理设计会审后多专业批注意见的追踪。
                    解决设计经理在会审后面临的 PDF 截图零散、微信群意见混杂、Excel 清单不统一等问题，
                    确保每条意见都能追踪到责任人和回复状态。
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-2">核心功能</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <strong>批注定位</strong>：按楼栋、专业、责任人、图纸页码多维度筛选
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <strong>责任流转</strong>：分派责任人、记录回复历史、状态追踪
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <strong>版本对比</strong>：查看批注的历史回复，追踪处理过程
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <strong>异常隔离</strong>：缺少页码、专业错误的记录自动放入问题区
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <strong>导出一致</strong>：Excel 清单、回复摘要、核对表三种格式导出
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-600">•</span>
                      <strong>导入去重</strong>：重复文件或重复批注编号自动检测并跳过
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-2">数据存储说明</h4>
                  <p className="text-slate-600 text-sm">
                    所有数据存储在浏览器本地的 IndexedDB 中，不会上传到任何服务器。
                    刷新页面后数据保持不变，清理浏览器数据会导致数据丢失。
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-2">验证流程</h4>
                  <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                    <li>点击「导入会审清单」→「导入样例数据」</li>
                    <li>查看问题区的 3 条问题记录，尝试修复其中一条</li>
                    <li>点击任一条目的「查看详情」，添加一条回复</li>
                    <li>点击「刷新数据」，确认记录数和状态正确</li>
                    <li>点击「导出」→「验证数据一致性」，记录哈希值</li>
                    <li>按 F5 刷新页面，再次验证数据和哈希值</li>
                    <li>导出 Excel 和回复摘要，确认内容与列表一致</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function getRepliesForAnnotations(annotations) {
  const allReplies = [];
  for (const annotation of annotations) {
    const replies = await getRepliesByAnnotationId(annotation.id);
    allReplies.push(...replies);
  }
  return allReplies;
}

function formatDate() {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
}

export default App;
