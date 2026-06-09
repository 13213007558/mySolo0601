import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useValveStore } from '@/store/valveStore';
import { STATUS_LABELS } from '@/types';
import type { ValveRecord } from '@/types';
import { todayStr } from '@/utils/storage';

export default function EditRecordModal() {
  const { showEditModal, editingRecord, closeEditModal, addRecord, updateRecord, contracts } = useValveStore();

  const [formData, setFormData] = useState({
    recordDate: todayStr(),
    valveNo: '',
    opening: 0,
    temperature: 0,
    pressure: 0,
    status: 'normal' as ValveRecord['status'],
    operator: '值班员',
    contractId: '',
    remarks: '',
  });

  const isEdit = editingRecord && editingRecord.id;

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        recordDate: editingRecord.recordDate || todayStr(),
        valveNo: editingRecord.valveNo || '',
        opening: editingRecord.opening || 0,
        temperature: editingRecord.temperature || 0,
        pressure: editingRecord.pressure || 0,
        status: editingRecord.status || 'normal',
        operator: editingRecord.operator || '值班员',
        contractId: editingRecord.contractId || '',
        remarks: editingRecord.remarks || '',
      });
    } else {
      setFormData({
        recordDate: todayStr(),
        valveNo: '',
        opening: 0,
        temperature: 0,
        pressure: 0,
        status: 'normal',
        operator: '值班员',
        contractId: '',
        remarks: '',
      });
    }
  }, [editingRecord]);

  const handleSubmit = () => {
    if (!formData.valveNo) {
      alert('请填写阀门编号');
      return;
    }

    if (isEdit && editingRecord) {
      updateRecord(editingRecord.id, { ...formData });
    } else {
      addRecord({ ...formData });
    }

    const newFilters = window.localStorage.getItem('boiler_inspection_filters');
    const newKeyword = window.localStorage.getItem('boiler_inspection_searchKeyword') || '';
    const filters = newFilters ? JSON.parse(newFilters) : {};
    useValveStore.getState().applyFilters(filters, newKeyword);
  };

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-500 text-white">
          <h3 className="font-semibold">
            {isEdit ? '编辑记录' : '新增记录'}
          </h3>
          <button
            onClick={closeEditModal}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">记录日期</label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={(e) => setFormData(prev => ({ ...prev, recordDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">阀门编号</label>
              <input
                type="text"
                value={formData.valveNo}
                onChange={(e) => setFormData(prev => ({ ...prev, valveNo: e.target.value }))}
                placeholder="如 VL-A01-01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开度 (%)</label>
              <input
                type="number"
                value={formData.opening}
                onChange={(e) => setFormData(prev => ({ ...prev, opening: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">温度 (°C)</label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">压力 (MPa)</label>
              <input
                type="number"
                step="0.1"
                value={formData.pressure}
                onChange={(e) => setFormData(prev => ({ ...prev, pressure: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ValveRecord['status'] }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">操作人</label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => setFormData(prev => ({ ...prev, operator: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联合同</label>
              <select
                value={formData.contractId}
                onChange={(e) => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              >
                <option value="">不关联</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.contractNo} ({c.contractDate})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="选填"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={closeEditModal}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Check size={16} />
            {isEdit ? '保存修改' : '新增记录'}
          </button>
        </div>
      </div>
    </div>
  );
}
