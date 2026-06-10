import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import type { AcceptanceRecord, Evidence, EvidenceType } from '@/types';
import { WORK_TYPES } from '@/types';
import { EvidenceList } from './EvidenceList';
import { useAcceptanceStore } from '@/store/acceptanceStore';
import { validateRecord, type ValidationError } from '@/utils/validator';
import { getTodayString, getNowString } from '@/utils/date';
import { generateId } from '@/utils/validator';

interface RecordFormProps {
  record?: AcceptanceRecord;
  onClose: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({ record, onClose }) => {
  const isEditing = !!record;
  const records = useAcceptanceStore((state) => state.records);
  const createRecord = useAcceptanceStore((state) => state.createRecord);
  const updateRecord = useAcceptanceStore((state) => state.updateRecord);
  const currentUser = useAcceptanceStore((state) => state.currentUser);
  const addError = useAcceptanceStore((state) => state.addError);

  const [formData, setFormData] = useState({
    projectName: '',
    axis: '',
    location: '',
    workType: '',
    acceptanceDate: getTodayString(),
    formworkDate: getTodayString(),
    description: ''
  });

  const [localEvidence, setLocalEvidence] = useState<Evidence[]>(record?.evidence || []);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (record) {
      setFormData({
        projectName: record.projectName,
        axis: record.axis,
        location: record.location,
        workType: record.workType,
        acceptanceDate: record.acceptanceDate,
        formworkDate: record.formworkDate,
        description: record.description
      });
    }
  }, [record]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleAddEvidence = (type: EvidenceType, file: File, dataUrl: string) => {
    const newEvidence: Evidence = {
      id: generateId(),
      type,
      name: file.name,
      dataUrl,
      uploadTime: getNowString(),
      uploadedBy: currentUser?.name || '未知'
    };
    setLocalEvidence((prev) => [...prev, newEvidence]);
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    setLocalEvidence((prev) => prev.filter((e) => e.id !== evidenceId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordData = {
      ...formData,
      evidence: localEvidence
    };

    const validationErrors = validateRecord(
      {
        ...recordData,
        id: record?.id || '',
        status: 'DRAFT',
        createdBy: currentUser?.name || '',
        createdAt: record?.createdAt || getNowString(),
        updatedAt: getNowString()
      },
      records
    );

    const criticalErrors = validationErrors.filter((e) => e.severity === 'error');
    const warnings = validationErrors.filter((e) => e.severity === 'warning');

    if (criticalErrors.length > 0) {
      setErrors(criticalErrors);
      criticalErrors.forEach((err) => addError(err.message));
      return;
    }

    if (warnings.length > 0) {
      setErrors(warnings);
    }

    let result;
    if (isEditing && record) {
      result = updateRecord(record.id, recordData);
    } else {
      result = createRecord(recordData);
    }

    if (result.success) {
      onClose();
    } else if (result.errors) {
      result.errors.forEach((err) => addError(err));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? '编辑验收记录' : '新建验收记录'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
              {errors.map((err, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <span className={`text-sm ${err.severity === 'error' ? 'text-red-700' : 'text-yellow-700'}`}>
                    {err.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
              placeholder="例如：城市之星一期工程"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                轴线 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.axis}
                onChange={(e) => handleChange('axis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
                placeholder="例如：A-B/1-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                部位 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
                placeholder="例如：地下室负二层"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工序类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.workType}
              onChange={(e) => handleChange('workType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
            >
              <option value="">请选择工序类型</option>
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                验收日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.acceptanceDate}
                onChange={(e) => handleChange('acceptanceDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                封模日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.formworkDate}
                onChange={(e) => handleChange('formworkDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">验收说明</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-concealed-orange"
              placeholder="描述验收情况、检查结果等..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              证据材料 <span className="text-gray-500 text-xs">(验收单+照片必填)</span>
            </label>
            <EvidenceList
              evidence={localEvidence}
              onAdd={handleAddEvidence}
              onRemove={handleRemoveEvidence}
              canEdit={true}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-concealed-orange text-white hover:bg-concealed-orange-dark flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEditing ? '保存修改' : '创建记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
