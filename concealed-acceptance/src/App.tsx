import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Download,
  Upload,
  History,
  Trash2,
  Database,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileWarning,
  Eye,
  Filter
} from 'lucide-react';
import type { AcceptanceRecord, StatusHistory, AcceptanceStatus } from '@/types';
import { ACCEPTANCE_STATUS_LABELS, USER_ROLE_LABELS } from '@/types';
import { useAcceptanceStore } from './store/acceptanceStore';
import { downloadCSV, importFromCSV } from './utils/csv';
import { formatDateTimeChinese, formatDateChinese } from './utils/date';
import { clearAllData as clearStorage } from './utils/storage';
import { StatusBadge } from './components/StatusBadge';
import { AcceptanceRecordCard } from './components/AcceptanceRecordCard';
import { FilterPanel } from './components/FilterPanel';
import { RoleSelector } from './components/RoleSelector';
import { StatsPanel } from './components/StatsPanel';
import { RecordForm } from './components/RecordForm';
import { ErrorToast } from './components/ErrorToast';

function App() {
  const loadData = useAcceptanceStore((state) => state.loadData);
  const records = useAcceptanceStore((state) => state.records);
  const history = useAcceptanceStore((state) => state.history);
  const currentUser = useAcceptanceStore((state) => state.currentUser);
  const filter = useAcceptanceStore((state) => state.filter);
  const getFilteredRecords = useAcceptanceStore((state) => state.getFilteredRecords);
  const loadSampleData = useAcceptanceStore((state) => state.loadSampleData);
  const importRecords = useAcceptanceStore((state) => state.importRecords);
  const clearAllData = useAcceptanceStore((state) => state.clearAllData);
  const setFilter = useAcceptanceStore((state) => state.setFilter);
  const addError = useAcceptanceStore((state) => state.addError);

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcceptanceRecord | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (records.length === 0) {
      loadSampleData();
    }
  }, [records.length, loadSampleData]);

  useEffect(() => {
    if (currentUser?.role === 'DOCUMENT_CONTROLLER') {
      setFilter({ status: ['ARCHIVABLE'] });
    }
  }, [currentUser, setFilter]);

  const filteredRecords = getFilteredRecords();

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      addError('没有可导出的记录');
      return;
    }
    downloadCSV(filteredRecords);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importFromCSV(file);
      importRecords(imported);
    } catch (err) {
      addError('导入失败：文件格式不正确');
    }
    e.target.value = '';
  };

  const handleClearData = () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可撤销。')) {
      clearAllData();
      clearStorage();
    }
  };

  const handleEdit = (record: AcceptanceRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecord(undefined);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ARCHIVABLE':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'PENDING_EVIDENCE':
        return <FileWarning className="w-4 h-4 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'SUBMITTED':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: AcceptanceStatus) => {
    const colors: Record<AcceptanceStatus, string> = {
      DRAFT: 'bg-gray-100',
      SUBMITTED: 'bg-blue-100',
      PENDING_EVIDENCE: 'bg-yellow-100',
      REJECTED: 'bg-red-100',
      ARCHIVABLE: 'bg-green-100'
    };
    return colors[status] || 'bg-gray-100';
  };

  const allHistory: (StatusHistory & { record?: AcceptanceRecord })[] = history
    .map((h) => ({
      ...h,
      record: records.find((r) => r.id === h.recordId)
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-concealed-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileCheck className="w-8 h-8" />
                隐蔽工程验收复核墙
              </h1>
              <p className="text-blue-200 text-sm mt-1">
                证据链完整 · 状态可追溯 · 责任到人
              </p>
            </div>
            <div className="flex items-center gap-2">
              {currentUser?.role === 'PROJECT_MANAGER' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-concealed-orange hover:bg-concealed-orange-dark text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  新建记录
                </button>
              )}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                导出
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg font-medium cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                导入
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${showHistory ? 'bg-concealed-orange' : 'bg-white bg-opacity-10 hover:bg-opacity-20'}`}
              >
                <History className="w-5 h-5" />
                审计追踪
              </button>
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 bg-opacity-10 hover:bg-opacity-20 rounded-lg font-medium transition-colors"
                title="清空所有数据"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {!currentUser && (
        <div className="bg-concealed-orange bg-opacity-10 border-b border-concealed-orange border-opacity-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-concealed-orange flex-shrink-0" />
            <p className="text-concealed-orange-dark">
              请在左侧选择用户角色，以获得相应的操作权限。
            </p>
          </div>
        </div>
      )}

      {currentUser?.role === 'DOCUMENT_CONTROLLER' && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Database className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">
              资料员视图：您当前只能查看<strong>可归档</strong>的验收记录。
              <button
                onClick={() => setFilter({ status: ['ARCHIVABLE'] })}
                className="ml-2 text-green-600 hover:underline font-medium"
              >
                点击筛选已归档记录
              </button>
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="w-72 flex-shrink-0 space-y-4">
            <RoleSelector />
            {currentUser && <FilterPanel />}
          </aside>

          <div className="flex-1 space-y-4">
            <StatsPanel />

            {showHistory ? (
              <HistoryView allHistory={allHistory} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} />
            ) : (
              <div>
                {filteredRecords.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-4">
                    {filteredRecords.map((record) => (
                      <AcceptanceRecordCard
                        key={record.id}
                        record={record}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <RecordForm record={editingRecord} onClose={handleCloseForm} />
      )}

      <ErrorToast />
    </div>
  );
}

function EmptyState() {
  const currentUser = useAcceptanceStore((state) => state.currentUser);
  const records = useAcceptanceStore((state) => state.records);
  const loadSampleData = useAcceptanceStore((state) => state.loadSampleData);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-concealed-orange bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-concealed-orange" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无数据</h3>
        <p className="text-gray-500 mb-6">
          您还没有任何隐蔽工程验收记录。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={loadSampleData}
            className="px-4 py-2 bg-concealed-orange text-white rounded-lg font-medium hover:bg-concealed-orange-dark flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            加载样例数据
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Filter className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">没有符合条件的记录</h3>
      <p className="text-gray-500">
        当前筛选条件下没有匹配的验收记录，请尝试调整筛选条件。
      </p>
    </div>
  );
}

function HistoryView({
  allHistory,
  getStatusIcon,
  getStatusColor
}: {
  allHistory: (StatusHistory & { record?: AcceptanceRecord })[];
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: AcceptanceStatus) => string;
}) {
  if (allHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <History className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无审计记录</h3>
        <p className="text-gray-500">
          还没有任何状态变更记录。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-concealed-orange" />
        审计追踪 · 全部状态变更记录
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作人</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">记录</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态变更</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">原因</th>
            </tr>
          </thead>
          <tbody>
            {allHistory.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                  {formatDateTimeChinese(item.timestamp)}
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="font-medium text-gray-900">{item.operator}</div>
                  <div className="text-xs text-gray-500">
                    {USER_ROLE_LABELS[item.operatorRole]}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {item.record ? (
                    <div>
                      <div className="font-medium text-gray-900">{item.record.projectName}</div>
                      <div className="text-xs text-gray-500">
                        {item.record.axis} / {item.record.location}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">(记录已删除)</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center gap-2">
                    {item.fromStatus && (
                      <>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(item.fromStatus)}`}>
                          {ACCEPTANCE_STATUS_LABELS[item.fromStatus]}
                        </span>
                        <span className="text-gray-400">→</span>
                      </>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getStatusColor(item.toStatus)}`}>
                      {getStatusIcon(item.toStatus)}
                      {ACCEPTANCE_STATUS_LABELS[item.toStatus]}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                  {item.reason || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
