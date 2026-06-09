import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Download,
  Upload,
  Trash2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { useBracketStore } from '@/store/useBracketStore';
import { DiffHighlight } from './DiffHighlight';
import { getDifferenceColor, getDifferenceLabel } from '@/utils/diff';
import { generateVersion } from '@/utils/dataValidator';
import type { ManualAngleRecord } from '@/types';

interface FormData {
  bracketNo: string;
  originalAngle: string;
  correctedAngle: string;
  reason: string;
}

const initialFormData: FormData = {
  bracketNo: '',
  originalAngle: '',
  correctedAngle: '',
  reason: '',
};

export const ManualAngleTable: React.FC = () => {
  const manualRecords = useBracketStore((state) => state.manualRecords);
  const normalRecords = useBracketStore((state) => state.normalRecords);
  const addManualRecord = useBracketStore((state) => state.addManualRecord);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const availableBrackets = normalRecords
    .filter((r) => r.status !== 'manual')
    .map((r) => ({
      bracketNo: r.bracketNo,
      currentAngle: r.currentAngle,
    }));

  const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.bracketNo) {
            newErrors.bracketNo = '请选择支架编号';
        }

        const original = parseFloat(formData.originalAngle);
        if (!formData.originalAngle || isNaN(original) || original < 0 || original > 90) {
            newErrors.originalAngle = '请输入有效角度(0-90°)';
        }

        const corrected = parseFloat(formData.correctedAngle);
        if (!formData.correctedAngle || isNaN(corrected) || corrected < 0 || corrected > 90) {
            newErrors.correctedAngle = '请输入有效角度(0-90°)';
        }

        if (!formData.reason.trim()) {
            newErrors.reason = '请输入补录原因';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

  const handleBracketChange = (bracketNo: string) => {
    const bracket = availableBrackets.find((b) => b.bracketNo === bracketNo);
    setFormData((prev) => ({
      ...prev,
      bracketNo,
      originalAngle: bracket ? String(bracket.currentAngle) : '',
    }));
    setErrors((prev) => ({ ...prev, bracketNo: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const original = parseFloat(formData.originalAngle);
    const corrected = parseFloat(formData.correctedAngle);

    const existingRecord = normalRecords.find((r) => r.bracketNo === formData.bracketNo);

    addManualRecord({
      bracketNo: formData.bracketNo,
      originalAngle: original,
      correctedAngle: corrected,
      operator: '许班长',
      operateDate: new Date().toISOString().slice(0, 10),
      reason: formData.reason,
      version: generateVersion(existingRecord?.version),
    });

    setFormData(initialFormData);
    setShowForm(false);
    setErrors({});
  };

  const handleExport = () => {
    if (manualRecords.length === 0) return;

    const content = manualRecords
      .map(
        (r) =>
        `${r.bracketNo},${r.originalAngle},${r.correctedAngle},${r.difference},${r.operator},${r.operateDate},${r.reason},${r.version}`
      )
      .join('\n');

    const header = '支架编号,原始角度,补录角度,差值,操作人,操作日期,补录原因,版本';
    const csvContent = header + '\n' + content;

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `手工补录记录_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.trim().split('\n').slice(1);
      lines.forEach((line) => {
        const values = line.split(',');
        if (values.length >= 4) {
          const bracketNo = values[0].trim();
          const originalAngle = parseFloat(values[1]);
          const correctedAngle = parseFloat(values[2]);
          const reason = values[6]?.trim() || '导入补录';

          if (bracketNo && !isNaN(originalAngle) && !isNaN(correctedAngle)) {
            addManualRecord({
              bracketNo,
              originalAngle,
              correctedAngle,
              operator: '许班长',
              operateDate: new Date().toISOString().slice(0, 10),
              reason,
              version: 'v1.0',
            });
          }
        }
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-white font-bold font-mono tracking-wide">许班长手工补录支架角度表</h2>
            <p className="text-blue-200 text-xs">用于检查补录前后差异和导出读回</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={manualRecords.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded text-xs font-mono hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded text-xs font-mono hover:bg-white/30 transition-colors cursor-pointer border border-white/30">
            <Upload className="w-4 h-4" />
            导入
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f59e0b] text-black rounded text-xs font-mono hover:bg-[#fbbf24] transition-colors border border-[#f59e0b]"
          >
            <Plus className="w-4 h-4" />
            {showForm ? '取消' : '新增补录'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-mono text-blue-800 mb-1">支架编号</label>
              <select
                value={formData.bracketNo}
                onChange={(e) => handleBracketChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  errors.bracketNo ? 'border-red-500' : 'border-slate-300'}`}
              >
                <option value="">选择支架...</option>
                {availableBrackets.map((b) => (
                  <option key={b.bracketNo} value={b.bracketNo}>
                    {b.bracketNo} (当前: {b.currentAngle}°)
                  </option>
                ))}
              </select>
              {errors.bracketNo && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.bracketNo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-blue-800 mb-1">原始角度 (°)</label>
              <input
                type="number"
                value={formData.originalAngle}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, originalAngle: e.target.value }));
                  setErrors((prev) => ({ ...prev, originalAngle: '' }));
                }}
                placeholder="输入原始角度"
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  errors.originalAngle ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.originalAngle && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.originalAngle}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-blue-800 mb-1">补录角度 (°)</label>
              <input
                type="number"
                value={formData.correctedAngle}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, correctedAngle: e.target.value }));
                  setErrors((prev) => ({ ...prev, correctedAngle: '' }));
                }}
                placeholder="输入补录后角度"
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  errors.correctedAngle ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.correctedAngle && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.correctedAngle}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-blue-800 mb-1">补录原因</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, reason: e.target.value }));
                  setErrors((prev) => ({ ...prev, reason: '' }));
                }}
                placeholder="例如：客服回访确认..."
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  errors.reason ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.reason && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reason}
                </p>
              )}
            </div>

            <div className="flex items-end">
              {formData.originalAngle && formData.correctedAngle && (
                <div className="text-sm font-mono bg-white p-2 rounded border border-blue-200 w-full">
                  <div className="text-xs text-blue-600 mb-1">差异预览</div>
                  <DiffHighlight
                    original={parseFloat(formData.originalAngle)}
                    corrected={parseFloat(formData.correctedAngle)}
                  />
                </div>
              )}
            </div>
          </form>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-mono hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              确认补录
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto">
        {manualRecords.length === 0 ? (
          <div className="p-8 text-center text-blue-400">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-mono">暂无手工补录记录</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-blue-100 border-b-2 border-blue-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  支架编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  原始角度
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  补录角度
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800">
                  差异
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  操作人
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  操作日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  补录原因
                </th>
                <th className="px-4 py-3 text-left text-xs font-mono font-medium text-blue-800 uppercase tracking-wider">
                  版本
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100">
              {manualRecords.map((record: ManualAngleRecord, index: number) => (
                <tr
                  key={record.id}
                  className={`hover:bg-blue-50/50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-medium text-blue-900">
                    {record.bracketNo}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="line-through text-slate-400">
                      {record.originalAngle}°
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {record.correctedAngle}°
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold ${
                        record.difference > 0
                          ? 'bg-red-100 text-red-700'
                          : record.difference < 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      } ${getDifferenceColor(record.difference)}`}
                    >
                      <ArrowRight className="w-3 h-3" />
                      {getDifferenceLabel(record.difference)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {record.operator}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {record.operateDate}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {record.reason}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {record.version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
