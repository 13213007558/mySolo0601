import { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  GitCompare,
  FileDown,
  Check,
  X,
  Edit3,
  Save,
  User,
} from 'lucide-react';
import { useBatteryStore } from '../store/batteryStore';
import { compareRecords, supplementExportToCSV, parseSupplementCSV, downloadFile } from '../utils/fileHandler';
import { getTodayDate } from '../utils/validation';
import type { SupplementRecord } from '../types';

const fieldLabels: Record<string, string> = {
  batteryNo: '电池编号',
  boxNo: '电池箱编号',
  transferDate: '流转日期',
  fromLocation: '转出地点',
  toLocation: '转入地点',
  operator: '操作人',
  remark: '备注',
  isManual: '是否手工补录',
};

export default function Supplement() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { supplementRecords, addSupplementRecord, updateSupplementRecord, deleteSupplementRecord } = useBatteryStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [showReadbackResult, setShowReadbackResult] = useState<{
    success: boolean;
    message: string;
    differences: any[];
  } | null>(null);

  const [formData, setFormData] = useState({
    batteryNo: '',
    boxNo: '',
    transferDate: getTodayDate(),
    fromLocation: '',
    toLocation: '',
    operator: '小廖',
    remark: '',
    isManual: true,
  });

  const resetForm = () => {
    setFormData({
      batteryNo: '',
      boxNo: '',
      transferDate: getTodayDate(),
      fromLocation: '',
      toLocation: '',
      operator: '小廖',
      remark: '',
      isManual: true,
    });
  };

  const handleAdd = () => {
    if (!formData.batteryNo || !formData.boxNo) return;
    addSupplementRecord(formData);
    resetForm();
    setShowAddForm(false);
  };

  const handleEdit = (record: SupplementRecord) => {
    setEditingId(record.id);
    setFormData({
      batteryNo: record.batteryNo,
      boxNo: record.boxNo,
      transferDate: record.transferDate,
      fromLocation: record.fromLocation,
      toLocation: record.toLocation,
      operator: record.operator,
      remark: record.remark,
      isManual: record.isManual,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateSupplementRecord(editingId, formData);
    setEditingId(null);
    resetForm();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleExport = () => {
    const csv = supplementExportToCSV(supplementRecords);
    const filename = `电池箱流转表_${getTodayDate()}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedRecords = await parseSupplementCSV(file);
      
      const originalData = JSON.stringify(supplementRecords);
      const importedData = JSON.stringify(importedRecords);
      
      const differences = compareRecords(
        JSON.parse(originalData)[0] || {},
        importedRecords[0] || {}
      ).filter((d: any) => d.isDifferent);

      importedRecords.forEach(record => {
        addSupplementRecord({
          batteryNo: record.batteryNo,
          boxNo: record.boxNo,
          transferDate: record.transferDate,
          fromLocation: record.fromLocation,
          toLocation: record.toLocation,
          operator: record.operator,
          remark: record.remark,
          isManual: record.isManual,
        });
      });

      setShowReadbackResult({
        success: true,
        message: `成功导入并读回验证 ${importedRecords.length} 条记录`,
        differences,
      });

      setTimeout(() => setShowReadbackResult(null), 5000);
    } catch (error) {
      setShowReadbackResult({
        success: false,
        message: `导入失败: ${(error as Error).message}`,
        differences: [],
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDiffForRecord = (record: SupplementRecord) => {
    if (!record.beforeData) return [];
    return compareRecords(record.beforeData, record).filter(d => d.isDifferent);
  };

  const stats = {
    total: supplementRecords.length,
    manual: supplementRecords.filter(r => r.isManual).length,
    auto: supplementRecords.filter(r => !r.isManual).length,
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      <div className="card-industrial mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold text-industrial-100">
                小廖手工补录 - 电池箱流转表
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-industrial-300">
                总计：<span className="font-mono font-semibold text-white">{stats.total}</span> 条
              </span>
              <span className="text-industrial-300">
                手工补录：<span className="font-mono font-semibold text-warning-400">{stats.manual}</span> 条
              </span>
              <span className="text-industrial-300">
                系统录入：<span className="font-mono font-semibold text-success-400">{stats.auto}</span> 条
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2 inline" />
              新增补录
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
              <Upload className="w-4 h-4 mr-2 inline" />
              导入并验证
            </button>
            
            <button onClick={handleExport} className="btn-success">
              <Download className="w-4 h-4 mr-2 inline" />
              导出CSV
            </button>
          </div>
        </div>
      </div>

      {showReadbackResult && (
        <div className={`mb-4 p-4 rounded border-2 ${
          showReadbackResult.success ? 'bg-success-500/20 border-success-500' : 'bg-warning-500/20 border-warning-500'
        }`}>
          <div className="font-semibold mb-2">
            {showReadbackResult.success ? (
              <><Check className="w-5 h-5 inline mr-2 text-success-400" />{showReadbackResult.message}</>
            ) : (
              <><X className="w-5 h-5 inline mr-2 text-warning-400" />{showReadbackResult.message}</>
            )}
          </div>
          {showReadbackResult.differences.length > 0 && (
            <div className="text-sm">
              <div className="text-warning-400 mb-1">数据差异（导出前 vs 导入后）：</div>
              <div className="space-y-1">
                {showReadbackResult.differences.slice(0, 5).map((diff, i) => (
                  <div key={i} className="flex gap-2 font-mono text-xs">
                    <span className="text-industrial-400">{fieldLabels[diff.field] || diff.field}:</span>
                    <span className="text-industrial-300">{String(diff.before)}</span>
                    <span className="text-industrial-500">→</span>
                    <span className="text-warning-400">{String(diff.after)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="card-industrial mb-4">
          <h4 className="font-semibold text-industrial-100 mb-4">新增补录记录</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-industrial-300 mb-1">电池编号 *</label>
              <input
                type="text"
                value={formData.batteryNo}
                onChange={(e) => setFormData({ ...formData, batteryNo: e.target.value })}
                placeholder="如 B-202406-0001"
                className="input-industrial font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-industrial-300 mb-1">电池箱编号 *</label>
              <input
                type="text"
                value={formData.boxNo}
                onChange={(e) => setFormData({ ...formData, boxNo: e.target.value })}
                placeholder="如 BOX-A-001"
                className="input-industrial font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-industrial-300 mb-1">流转日期</label>
              <input
                type="date"
                value={formData.transferDate}
                onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                className="input-industrial"
              />
            </div>
            <div>
              <label className="block text-xs text-industrial-300 mb-1">转出地点</label>
              <input
                type="text"
                value={formData.fromLocation}
                onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                placeholder="如 A区换电站"
                className="input-industrial"
              />
            </div>
            <div>
              <label className="block text-xs text-industrial-300 mb-1">转入地点</label>
              <input
                type="text"
                value={formData.toLocation}
                onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                placeholder="如 中心仓库"
                className="input-industrial"
              />
            </div>
            <div>
              <label className="block text-xs text-industrial-300 mb-1">操作人</label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="input-industrial"
              />
            </div>
            <div>
              <label className="block text-xs text-industrial-300 mb-1">备注</label>
              <input
                type="text"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                className="input-industrial"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isManual}
                  onChange={(e) => setFormData({ ...formData, isManual: e.target.checked })}
                  className="w-4 h-4 rounded border-industrial-300 bg-industrial-600 text-warning-500 focus:ring-warning-500"
                />
                <span className="text-sm text-industrial-200">手工补录</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="btn-secondary"
            >
              取消
            </button>
            <button onClick={handleAdd} className="btn-primary">
              保存
            </button>
          </div>
        </div>
      )}

      {compareId && (
        <div className="card-industrial mb-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-industrial-100">
              <GitCompare className="w-5 h-5 inline mr-2 text-primary-400" />
              补录前后差异对比
            </h4>
            <button
              onClick={() => setCompareId(null)}
              className="text-industrial-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {(() => {
            const record = supplementRecords.find(r => r.id === compareId);
            if (!record || !record.beforeData) return null;
            
            const diffs = getDiffForRecord(record);
            
            return (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-industrial-600 rounded">
                  <h5 className="text-sm font-semibold text-industrial-300 mb-3">补录前</h5>
                  <div className="space-y-2 text-sm">
                    {Object.entries(record.beforeData).filter(([k]) => !['id', 'createdAt', 'beforeData', 'afterData'].includes(k)).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-industrial-400">{fieldLabels[key] || key}</span>
                        <span className={`font-mono ${
                          diffs.some(d => d.field === key) ? 'diff-highlight px-1 rounded' : ''
                        }`}>
                          {String(value || '-')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-primary-500/10 rounded border border-primary-500/30">
                  <h5 className="text-sm font-semibold text-primary-300 mb-3">补录后</h5>
                  <div className="space-y-2 text-sm">
                    {Object.entries(record).filter(([k]) => !['id', 'createdAt', 'beforeData', 'afterData'].includes(k)).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-industrial-400">{fieldLabels[key] || key}</span>
                        <span className={`font-mono ${
                          diffs.some(d => d.field === key) ? 'diff-highlight px-1 rounded' : ''
                        }`}>
                          {String(value || '-')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="card-industrial overflow-hidden">
        {supplementRecords.length === 0 ? (
          <div className="text-center py-16 text-industrial-400">
            <FileDown className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无流转记录</p>
            <p className="text-sm mt-2">点击"新增补录"或"导入并验证"开始使用</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="table-industrial">
              <thead>
                <tr>
                  <th>电池编号</th>
                  <th>电池箱编号</th>
                  <th>流转日期</th>
                  <th>转出地点</th>
                  <th>转入地点</th>
                  <th>操作人</th>
                  <th>补录类型</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {supplementRecords.map((record) => {
                  if (editingId === record.id) {
                    return (
                      <tr key={record.id} className="bg-primary-500/10">
                        <td>
                          <input
                            type="text"
                            value={formData.batteryNo}
                            onChange={(e) => setFormData({ ...formData, batteryNo: e.target.value })}
                            className="input-industrial text-sm py-1 font-mono"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.boxNo}
                            onChange={(e) => setFormData({ ...formData, boxNo: e.target.value })}
                            className="input-industrial text-sm py-1 font-mono"
                          />
                        </td>
                        <td>
                          <input
                            type="date"
                            value={formData.transferDate}
                            onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
                            className="input-industrial text-sm py-1"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.fromLocation}
                            onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
                            className="input-industrial text-sm py-1"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.toLocation}
                            onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                            className="input-industrial text-sm py-1"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.operator}
                            onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                            className="input-industrial text-sm py-1"
                          />
                        </td>
                        <td>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={formData.isManual}
                              onChange={(e) => setFormData({ ...formData, isManual: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-xs">手工</span>
                          </label>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={formData.remark}
                            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                            className="input-industrial text-sm py-1"
                          />
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1.5 rounded bg-success-500 text-white hover:bg-success-600"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded bg-industrial-400 text-white hover:bg-industrial-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  const hasDiff = record.beforeData !== null;
                  
                  return (
                    <tr key={record.id} className={hasDiff ? 'bg-warning-500/5' : ''}>
                      <td className="font-mono">{record.batteryNo}</td>
                      <td className="font-mono">{record.boxNo}</td>
                      <td>{record.transferDate}</td>
                      <td>{record.fromLocation}</td>
                      <td>{record.toLocation}</td>
                      <td>{record.operator}</td>
                      <td>
                        {record.isManual ? (
                          <span className="px-2 py-1 rounded text-xs bg-warning-500/20 text-warning-100">
                            手工补录
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-success-500/20 text-success-100">
                            系统录入
                          </span>
                        )}
                      </td>
                      <td className="max-w-[150px] truncate text-industrial-300">
                        {record.remark || '-'}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {hasDiff && (
                            <button
                              onClick={() => setCompareId(compareId === record.id ? null : record.id)}
                              className={`p-1.5 rounded transition-colors ${
                                compareId === record.id
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-industrial-400 text-white hover:bg-primary-500'
                              }`}
                              title="查看差异"
                            >
                              <GitCompare className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1.5 rounded bg-industrial-400 text-white hover:bg-primary-500 transition-colors"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSupplementRecord(record.id)}
                            className="p-1.5 rounded bg-industrial-400 text-white hover:bg-red-500 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
