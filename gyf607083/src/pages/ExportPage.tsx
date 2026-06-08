import React, { useEffect, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  Eye,
  RefreshCw,
  Calendar,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  History,
  User,
  UserX
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ROLE_LABELS,
  ITEM_TYPE_LABELS,
  ExportOptions,
  RecordStatus
} from '../../shared/types';

export const ExportPage: React.FC = () => {
  const {
    classes,
    supplyRecords,
    loading,
    loadClasses,
    loadSupplyRecords,
    exportExcel,
    exportJson,
    refreshKey,
    currentRole
  } = useStore();

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeStatusHistory: true
  });
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: any[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'history'>('records');

  useEffect(() => {
    loadClasses();
    loadSupplyRecords();
  }, [refreshKey]);

  const filteredRecords = supplyRecords.filter(record => {
    if (exportOptions.classId && record.classId !== exportOptions.classId) return false;
    if (exportOptions.status && record.status !== exportOptions.status) return false;
    if (exportOptions.startDate && new Date(record.createdAt) < new Date(exportOptions.startDate)) return false;
    if (exportOptions.endDate && new Date(record.createdAt) > new Date(exportOptions.endDate)) return false;
    return true;
  });

  const allStatusChanges = filteredRecords.flatMap(record =>
    record.statusHistory.map(change => ({
      ...change,
      recordId: record.id,
      babyName: record.babyName,
      itemName: record.itemName
    }))
  );

  const xiaomanRecord = filteredRecords.find(r => r.remark?.includes('小满') || r.remark?.includes('未清洁用品再次发放'));
  const manualRecords = filteredRecords.filter(r => r.isManual);

  const handleExportExcel = async () => {
    try {
      await exportExcel(exportOptions);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleExportJson = async () => {
    try {
      await exportJson(exportOptions);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">数据导出</h2>
        <p className="text-gray-500">
          导出用品发放记录和状态变更历史，隐私字段已按角色处理
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">导出数据隐私说明</p>
            <p>
              当前角色为 <strong>{ROLE_LABELS[currentRole]}</strong>，导出数据中的隐私字段（姓名、手机号、家庭住址、过敏史）
              已根据您的角色权限进行过滤处理。主管可查看完整数据，客服人员看到脱敏数据，普通员工看到完全隐藏的数据。
              数据导出操作会被记录到审计日志。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              导出筛选条件
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择班级
                </label>
                <select
                  value={exportOptions.classId || ''}
                  onChange={(e) => setExportOptions({ ...exportOptions, classId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部班级</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  记录状态
                </label>
                <select
                  value={exportOptions.status || ''}
                  onChange={(e) => setExportOptions({ ...exportOptions, status: (e.target.value as RecordStatus) || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全部状态</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  开始日期
                </label>
                <input
                  type="date"
                  value={exportOptions.startDate || ''}
                  onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  结束日期
                </label>
                <input
                  type="date"
                  value={exportOptions.endDate || ''}
                  onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeHistory"
                  checked={exportOptions.includeStatusHistory}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeStatusHistory: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeHistory" className="text-sm text-gray-700">
                  包含状态变更历史
                </label>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <button
                onClick={handleExportExcel}
                disabled={loading.export}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading.export ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5" />
                )}
                导出 Excel
              </button>
              <button
                onClick={handleExportJson}
                disabled={loading.export}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading.export ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <FileJson className="w-5 h-5" />
                )}
                导出 JSON
              </button>
            </div>

            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                本次导出包含：<br />
                <span className="font-medium">{filteredRecords.length}</span> 条发放记录<br />
                <span className="font-medium">{allStatusChanges.length}</span> 条状态变更记录<br />
                <span className="font-medium">{manualRecords.length}</span> 条手工补录记录
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {xiaomanRecord && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 flex-1">
                  <p className="font-medium mb-1">典型案例：小满那条记录（未清洁用品再次发放）</p>
                  <p className="mb-2">
                    该记录展示了完整的状态变更流程：<strong>待处理 → 已拒绝 → 已补发</strong>。
                    导出Excel时，状态变更历史工作表中会清晰展示这一过程。
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {xiaomanRecord.statusHistory.map((change, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[change.fromStatus]}`}>
                          {STATUS_LABELS[change.fromStatus]}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`px-1.5 py-0.5 rounded ${STATUS_COLORS[change.toStatus]}`}>
                          {STATUS_LABELS[change.toStatus]}
                        </span>
                        <span className="text-gray-500 ml-1">{change.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {manualRecords.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">手工补录记录（{manualRecords.length}条）</p>
                  <p>
                    以下为手工补录的记录，用于对比补录前后的数据差异。
                    这些记录会在导出数据中单独标记。
                  </p>
                  <div className="mt-2 space-y-1">
                    {manualRecords.map(r => (
                      <div key={r.id} className="flex items-center gap-2 bg-white px-2 py-1 rounded text-xs">
                        <span className="font-medium">{r.babyName}</span>
                        <span className="text-gray-500">-</span>
                        <span>{r.itemName}</span>
                        <span className="text-gray-400">({r.remark})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="border-b border-gray-100">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'records'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  用品发放记录
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {filteredRecords.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <History className="w-4 h-4 inline mr-2" />
                  状态变更历史
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {allStatusChanges.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'records' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">宝宝姓名</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">班级</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">物品名称</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">物品类型</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">已消毒</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">状态</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">补录</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">创建时间</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading.supplyRecords ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center">
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-gray-500">
                            暂无符合条件的记录
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map(record => (
                          <tr
                            key={record.id}
                            className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                              record.remark?.includes('小满') || record.remark?.includes('未清洁')
                                ? 'bg-amber-50/50'
                                : record.isManual
                                ? 'bg-purple-50/50'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-sm font-medium text-gray-800">
                              {record.babyName}
                              {record.remark?.includes('小满') && (
                                <span className="ml-1 text-xs text-amber-600">⚠️</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{record.className}</td>
                            <td className="py-3 px-4 text-sm text-gray-800">{record.itemName}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{ITEM_TYPE_LABELS[record.itemType]}</td>
                            <td className="py-3 px-4">
                              {record.sterilized ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <span className="text-red-500 text-sm">未消毒</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[record.status]}`}>
                                {STATUS_LABELS[record.status]}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {record.isManual ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">是</span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                              {record.remark || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">记录ID</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">宝宝姓名</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">物品</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">原状态</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">新状态</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">变更原因</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">处理人</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStatusChanges.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-gray-500">
                            暂无状态变更记录
                          </td>
                        </tr>
                      ) : (
                        allStatusChanges.map((change, idx) => (
                          <tr
                            key={`${change.recordId}-${idx}`}
                            className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                              change.babyName?.includes('小满') ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-xs text-gray-500 font-mono">{change.recordId}</td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-800">{change.babyName}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{change.itemName}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[change.fromStatus]}`}>
                                {STATUS_LABELS[change.fromStatus]}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[change.toStatus]}`}>
                                {STATUS_LABELS[change.toStatus]}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{change.reason}</td>
                            <td className="py-3 px-4">
                              {change.operatorId ? (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <User className="w-3 h-3" />
                                  {change.operatorName || change.operatorId}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-sm text-orange-600">
                                  <UserX className="w-3 h-3" />
                                  <span className="text-xs">处理人缺失</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {new Date(change.createdAt).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              导出内容说明
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Excel 导出包含</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>工作表1：用品发放记录（主数据）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>工作表2：状态变更历史（拒绝→已补发等完整过程）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>隐私字段按角色过滤后的数据</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>手工补录记录特殊标记</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">JSON 导出包含</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span>完整的记录对象数组</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span>内嵌状态变更历史数组</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span>导出元信息（导出时间、操作人员、角色）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                    <span>可直接用于程序处理的标准格式</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
