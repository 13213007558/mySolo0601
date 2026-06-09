import { useState, useEffect } from 'react';
import { X, Edit3, Save, AlertCircle } from 'lucide-react';
import type { PumpRecord } from '../types';
import { validatePumpCode } from '../utils/dataUtils';

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PumpRecord>) => boolean;
  existingRecords: PumpRecord[];
}

export const ManualEntryModal = ({
  isOpen,
  onClose,
  onSubmit,
  existingRecords,
}: ManualEntryModalProps) => {
  const [formData, setFormData] = useState({
    pumpCode: 'CP-005',
    pumpName: '5号应急冷却泵',
    location: 'C区备用电站',
    temperature: '24.2',
    pressure: '0.32',
    flowRate: '110.5',
    vibration: '2.0',
    runningHours: '1250',
    lastMaintenance: '2026-05-25',
    inspector: '张工',
    remarks: '张工手工补录：应急泵月度测试完成，运行正常',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        pumpCode: 'CP-005',
        pumpName: '5号应急冷却泵',
        location: 'C区备用电站',
        temperature: '24.2',
        pressure: '0.32',
        flowRate: '110.5',
        vibration: '2.0',
        runningHours: '1250',
        lastMaintenance: '2026-05-25',
        inspector: '张工',
        remarks: '张工手工补录：应急泵月度测试完成，运行正常',
      });
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pumpCode.trim()) {
      newErrors.pumpCode = '泵编号不能为空';
    } else if (!validatePumpCode(formData.pumpCode, existingRecords)) {
      newErrors.pumpCode = '该编号已存在，请使用其他编号';
    }

    if (!formData.pumpName.trim()) {
      newErrors.pumpName = '泵名称不能为空';
    }

    if (!formData.location.trim()) {
      newErrors.location = '位置不能为空';
    }

    if (formData.temperature && isNaN(Number(formData.temperature))) {
      newErrors.temperature = '请输入有效数字';
    }

    if (formData.pressure && isNaN(Number(formData.pressure))) {
      newErrors.pressure = '请输入有效数字';
    }

    if (formData.flowRate && isNaN(Number(formData.flowRate))) {
      newErrors.flowRate = '请输入有效数字';
    }

    if (formData.vibration && isNaN(Number(formData.vibration))) {
      newErrors.vibration = '请输入有效数字';
    }

    if (formData.runningHours && isNaN(Number(formData.runningHours))) {
      newErrors.runningHours = '请输入有效数字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const submitData: Partial<PumpRecord> = {
      pumpCode: formData.pumpCode.trim(),
      pumpName: formData.pumpName.trim(),
      location: formData.location.trim(),
      temperature: formData.temperature ? Number(formData.temperature) : null,
      pressure: formData.pressure ? Number(formData.pressure) : null,
      flowRate: formData.flowRate ? Number(formData.flowRate) : null,
      vibration: formData.vibration ? Number(formData.vibration) : null,
      runningHours: formData.runningHours ? Number(formData.runningHours) : null,
      lastMaintenance: formData.lastMaintenance || null,
      inspector: formData.inspector.trim() || null,
      remarks: formData.remarks.trim() || null,
    };

    const success = onSubmit(submitData);
    if (success) {
      onClose();
    } else {
      setSubmitError('保存失败，请检查编号是否重复');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  const inputFields = [
    { name: 'pumpCode', label: '泵编号', type: 'text', required: true },
    { name: 'pumpName', label: '泵名称', type: 'text', required: true },
    { name: 'location', label: '位置', type: 'text', required: true },
    { name: 'temperature', label: '温度 (°C)', type: 'number', step: '0.1' },
    { name: 'pressure', label: '压力 (MPa)', type: 'number', step: '0.01' },
    { name: 'flowRate', label: '流量 (m³/h)', type: 'number', step: '0.1' },
    { name: 'vibration', label: '振动 (mm/s)', type: 'number', step: '0.1' },
    { name: 'runningHours', label: '运行小时', type: 'number', step: '1' },
    { name: 'lastMaintenance', label: '上次维护日期', type: 'date' },
    { name: 'inspector', label: '巡检人员', type: 'text' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="card-header flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">张工手工补录</h2>
              <p className="text-sm text-gray-500">填写冷却泵巡检信息</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)] scrollbar-thin">
          <div className="p-5 space-y-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{submitError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inputFields.map((field) => (
                <div key={field.name}>
                  <label className="label">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={(formData as Record<string, string>)[field.name]}
                    onChange={handleChange}
                    step={field.step}
                    className={`input ${
                      errors[field.name] ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  {errors[field.name] && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="label">备注</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
                className="input resize-none"
                placeholder="输入备注信息..."
              />
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                此记录将标记为"张工手工补录"，并同步到卡片列表、时间线和导出表中
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-success flex items-center gap-2">
              <Save className="w-4 h-4" />
              保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
