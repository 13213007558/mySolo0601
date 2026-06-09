import React, { useState, useEffect } from 'react';
import { X, PenTool, Save, Eye, ArrowRight } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { validateRecordData, getRecordDiff } from '../utils/validation';
import { formatDateTime } from '../utils/time';
import type { PlugAction } from '../types';

interface FormData {
  gunCode: string;
  timestamp: string;
  operator: string;
  action: PlugAction | '';
  remark: string;
  manualEntryBy: string;
}

const initialFormData: FormData = {
  gunCode: '',
  timestamp: '',
  operator: '',
  action: '',
  remark: '',
  manualEntryBy: '林姐'
};

export const ManualEntryModal: React.FC = () => {
  const { 
    isManualEntryModalOpen, 
    setManualEntryModalOpen, 
    editingRecord,
    addManualEntry,
    updateRecord,
    addAlert
  } = useRecordStore();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isManualEntryModalOpen && editingRecord) {
      setFormData({
        gunCode: editingRecord.gunCode,
        timestamp: editingRecord.timestamp.slice(0, 16),
        operator: editingRecord.operator,
        action: editingRecord.action,
        remark: editingRecord.remark,
        manualEntryBy: editingRecord.manualEntryBy || '林姐'
      });
    } else if (isModalOpening) {
      setFormData(initialFormData);
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData(prev => ({
        ...prev,
        timestamp: now.toISOString().slice(0, 16)
      }));
    }
    setErrors([]);
    setShowPreview(false);
  }, [isManualEntryModalOpen, editingRecord]);

  const [isModalOpening, setIsModalOpening] = useState(false);
  useEffect(() => {
    if (isManualEntryModalOpen) {
      setIsModalOpening(true);
    } else {
      setTimeout(() => setIsModalOpening(false), 300);
    }
  }, [isManualEntryModalOpen]);

  if (!isManualEntryModalOpen && !isModalOpening) {
    return null;
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = () => {
    const validation = validateRecordData({
      ...formData,
      action: formData.action as PlugAction,
      isManualEntry: true,
      remark: formData.remark || ''
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (editingRecord) {
      updateRecord(editingRecord.id, {
        gunCode: formData.gunCode,
        timestamp: formData.timestamp,
        operator: formData.operator,
        action: formData.action as PlugAction,
        remark: formData.remark
      });
      addAlert({
        type: 'success',
        message: '记录更新成功',
        plainText: `记录已更新。${formData.gunCode} ${formatDateTime(formData.timestamp)} ${formData.action === 'insert' ? '插入' : '拔出'}`
      });
    } else {
      addManualEntry({
        gunCode: formData.gunCode,
        timestamp: formData.timestamp,
        operator: formData.operator,
        action: formData.action as PlugAction,
        remark: formData.remark,
        manualEntryBy: formData.manualEntryBy
      });
      addAlert({
        type: 'success',
        message: `${formData.manualEntryBy} 手工补录成功`,
        plainText: `${formData.manualEntryBy} 的手工补录记录已添加。${formData.gunCode} ${formatDateTime(formData.timestamp)} ${formData.action === 'insert' ? '插入' : '拔出'}`
      });
    }

    setManualEntryModalOpen(false);
  };

  const diffs = editingRecord 
    ? getRecordDiff(editingRecord, { ...formData, action: formData.action as PlugAction })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-xl card-panel transition-opacity duration-300 ${isManualEntryModalOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between p-4 border-b border-bgdark-700">
          <div className="flex items-center gap-3">
            <PenTool size={20} className="text-violet-400" />
            <h2 className="text-lg font-semibold text-white">
              {editingRecord ? '编辑记录' : '手工补录记录'}
            </h2>
          </div>
          <button
            onClick={() => setManualEntryModalOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-bgdark-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {editingRecord && diffs.length > 0 && (
            <div className="p-3 bg-violet-900/30 border border-violet-700 rounded text-sm">
              <p className="text-violet-300 mb-2 font-medium">修改内容预览：</p>
              <div className="space-y-1">
                {diffs.map((diff, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">{diff.field}:</span>
                    <span className="line-through text-red-400">{diff.oldValue}</span>
                    <ArrowRight size={14} className="text-gray-500" />
                    <span className="text-emerald-400">{diff.newValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded">
              <p className="text-red-300 text-sm font-medium mb-1">请修正以下错误：</p>
              <ul className="text-red-400 text-sm space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                枪编号 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.gunCode}
                onChange={(e) => handleChange('gunCode', e.target.value.toUpperCase())}
                placeholder="如 CG-001"
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                插拔时间 <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => handleChange('timestamp', e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                操作人 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => handleChange('operator', e.target.value)}
                placeholder="如 张工"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                动作 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.action}
                onChange={(e) => handleChange('action', e.target.value)}
                className="input-field"
              >
                <option value="">请选择</option>
                <option value="insert">插入</option>
                <option value="remove">拔出</option>
              </select>
            </div>
          </div>

          {!editingRecord && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                补录人 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.manualEntryBy}
                onChange={(e) => handleChange('manualEntryBy', e.target.value)}
                placeholder="如 林姐"
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              备注
            </label>
            <textarea
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
              placeholder="简单描述操作原因，如：早班充电开始、现场巡视发现未登记等"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {showPreview && (
            <div className="p-4 bg-bgdark-900 border border-bgdark-600 rounded">
              <p className="text-sm font-medium text-gray-300 mb-2">记录预览：</p>
              <div className="font-mono text-sm text-gray-400 space-y-1">
                <p>枪编号：<span className="text-white">{formData.gunCode || '—'}</span></p>
                <p>时间：<span className="text-white">{formData.timestamp ? formatDateTime(formData.timestamp) : '—'}</span></p>
                <p>操作人：<span className="text-white">{formData.operator || '—'}</span></p>
                <p>动作：<span className="text-white">{formData.action === 'insert' ? '插入' : formData.action === 'remove' ? '拔出' : '—'}</span></p>
                <p>备注：<span className="text-white">{formData.remark || '—'}</span></p>
                {!editingRecord && (
                  <p>补录人：<span className="text-white">{formData.manualEntryBy || '—'}</span></p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-bgdark-700">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="industrial-btn-gray flex items-center gap-2"
          >
            <Eye size={16} />
            {showPreview ? '隐藏预览' : '预览'}
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setManualEntryModalOpen(false)}
              className="industrial-btn-gray"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="industrial-btn-purple flex items-center gap-2"
            >
              <Save size={16} />
              {editingRecord ? '保存修改' : '确认补录'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
