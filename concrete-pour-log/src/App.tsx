import { useEffect, useState } from 'react'
import {
  Construction,
  Plus,
  Download,
  Trash2,
  FileText,
  RotateCcw,
  Menu
} from 'lucide-react'
import { usePourStore, calculateStats } from '@/store/usePourStore'
import { filterRecords } from '@/utils/calc'
import { exportRecordsCSV, exportSamplesCSV, exportAbnormalsCSV, downloadReport } from '@/utils/export'

import StatsCards from '@/components/StatsCards'
import FilterBar from '@/components/FilterBar'
import TimelineView from '@/components/TimelineView'
import PourTable from '@/components/PourTable'
import DetailPanel from '@/components/DetailPanel'
import PourForm from '@/components/PourForm'
import IssuesPanel from '@/components/IssuesPanel'

export default function App() {
  const records = usePourStore((s) => s.records)
  const filter = usePourStore((s) => s.filter)
  const showForm = usePourStore((s) => s.showForm)
  const editingRecord = usePourStore((s) => s.editingRecord)
  const setShowForm = usePourStore((s) => s.setShowForm)
  const loadMock = usePourStore((s) => s.loadMock)
  const clearAll = usePourStore((s) => s.clearAll)

  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 等 zustand persist 从 localStorage 恢复后再判断
    const timer = setTimeout(() => {
      setIsLoaded(true)
      if (records.length === 0) {
        setShowWelcome(true)
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoaded && records.length === 0) {
      setShowWelcome(true)
    }
  }, [records.length, isLoaded])

  const filteredRecords = filterRecords(records, filter)
  const stats = calculateStats(records)

  function handleLoadMock() {
    loadMock()
    setShowWelcome(false)
  }

  function handleExport(type: 'records' | 'samples' | 'abnormals' | 'report') {
    const data = filteredRecords.length > 0 ? filteredRecords : records
    const prefix = filteredRecords.length > 0 ? '筛选后_' : '全部_'

    switch (type) {
      case 'records':
        exportRecordsCSV(data, prefix + '浇筑记录.csv')
        break
      case 'samples':
        exportSamplesCSV(data, prefix + '试块留置.csv')
        break
      case 'abnormals':
        exportAbnormalsCSV(data, prefix + '异常记录.csv')
        break
      case 'report':
        downloadReport(data, prefix + '旁站报告.txt')
        break
    }
    setShowExportMenu(false)
  }

  function handleClearAll() {
    if (window.confirm('确定要清空所有数据吗？此操作不可撤销。')) {
      clearAll()
      setShowWelcome(true)
    }
  }

  return (
    <div className="min-h-screen bg-concrete-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-concrete-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-lg flex items-center justify-center">
                <Construction className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-concrete-900">混凝土浇筑旁站记录台</h1>
                <p className="text-xs text-concrete-500">旁站核对 · 试块追踪 · 异常闭环</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForm(true, null)}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增记录
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 text-sm bg-white border border-concrete-200 text-concrete-700 rounded-lg hover:bg-concrete-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-concrete-200 rounded-lg shadow-lg z-40 overflow-hidden">
                    <button
                      onClick={() => handleExport('records')}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-concrete-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-concrete-400" />
                      浇筑记录 CSV
                    </button>
                    <button
                      onClick={() => handleExport('samples')}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-concrete-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-concrete-400" />
                      试块留置 CSV
                    </button>
                    <button
                      onClick={() => handleExport('abnormals')}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-concrete-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-concrete-400" />
                      异常记录 CSV
                    </button>
                    <div className="border-t border-concrete-100" />
                    <button
                      onClick={() => handleExport('report')}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-concrete-50 flex items-center gap-2 text-accent"
                    >
                      <FileText className="w-4 h-4" />
                      旁站报告 TXT
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm bg-white border border-concrete-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </button>
            </div>
          </div>

          {records.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-concrete-500">
              <span>
                当前筛选：<span className="font-medium text-concrete-700">{filteredRecords.length}</span> / {records.length} 条
              </span>
              {filteredRecords.length > 0 && filteredRecords.length < records.length && (
                <span className="text-accent">
                  （导出将使用当前筛选后的 {filteredRecords.length} 条数据）
                </span>
              )}
              <span className="mx-2">·</span>
              <span>
                标号分布：{Object.entries(stats.gradeDistribution).map(([g, v]) => `${g} ${v}m³`).join(' ／ ')}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* 欢迎页 */}
      {showWelcome && (
        <div className="max-w-3xl mx-auto py-20 px-6">
          <div className="bg-white rounded-2xl border border-concrete-200 shadow-sm p-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Construction className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-concrete-900 mb-3">
              混凝土浇筑旁站记录台
            </h2>
            <p className="text-concrete-500 mb-8 max-w-md mx-auto">
              录入车次、到场时间、浇筑部位、试验结果和旁站备注，
              自动生成时间线、检测异常、追踪试块，让旁站记录一目了然。
            </p>

            <div className="flex items-center justify-center gap-4 mb-10">
              <button
                onClick={handleLoadMock}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                加载样例数据
              </button>
              <button
                onClick={() => setShowForm(true, null)}
                className="px-6 py-3 bg-white border border-concrete-200 text-concrete-700 rounded-lg hover:bg-concrete-50 transition-colors font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                手动录入
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-left">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">⏱ 时间线合并</h4>
                <p className="text-xs text-blue-600">
                  到场、浇筑、试块、异常、更正自动合并为一条时间线，按时间排序。
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2 text-sm">⚠️ 异常检测</h4>
                <p className="text-xs text-amber-600">
                  自动识别坍落度超界、温度异常、缺照片、标号不符、重复车号。
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 text-sm">📋 报告导出</h4>
                <p className="text-xs text-green-600">
                  浇筑记录、试块、异常三种 CSV + 旁站报告，筛选结果一致导出。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      {!showWelcome && records.length > 0 && (
        <main className="max-w-[1600px] mx-auto px-6 py-6">
          <StatsCards />

          <div className="grid grid-cols-12 gap-6 mt-6">
            {/* 左侧：筛选 + 问题 */}
            <div className="col-span-3 space-y-4">
              <FilterBar />
              <IssuesPanel />
            </div>

            {/* 中间：表格 */}
            <div className="col-span-6 space-y-4">
              <PourTable />
            </div>

            {/* 右侧：时间线 */}
            <div className="col-span-3 space-y-4">
              <TimelineView />
            </div>
          </div>
        </main>
      )}

      {/* 详情侧边栏 */}
      <DetailPanel />

      {/* 录入表单 */}
      {showForm && (
        <PourForm record={editingRecord} onClose={() => setShowForm(false, null)} />
      )}

      {/* 点击外部关闭导出菜单 */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  )
}
