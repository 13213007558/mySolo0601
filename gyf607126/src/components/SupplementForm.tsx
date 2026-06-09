import { useState } from 'react';
import { X, Save, Plus, Zap, FileText } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { Contract, ContractStatus } from '../types/contract';
import { customerManagers, statusColors } from '../data/mockData';

interface SupplementFormProps {
  onClose: () => void;
  onSuccess: (id: string) => void;
}

const statusOptions: ContractStatus[] = ['草稿', '待审核', '审核通过', '已退回'];

export const SupplementForm = ({ onClose, onSuccess }: SupplementFormProps) => {
  const addContract = useContractStore((state) => state.addContract);
  const contracts = useContractStore((state) => state.contracts);

  const today = new Date().toISOString().split('T')[0];
  const nextContractNo = `SD-2026-${String(contracts.length + 1).padStart(3, '0')}`;

  const [formData, setFormData] = useState<Partial<Contract>>({
    contractNo: nextContractNo,
    customerName: '',
    customerManager: '小赵',
    deviceId: '',
    deviceName: '',
    contractAmount: 0,
    electricityPrice: 0.65,
    contractDate: today,
    effectiveDate: today,
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: '草稿',
    hasAttachment: false,
    anomalies: [],
    isSupplement: true,
    supplementFrom: '',
    notes: '',
    updatedBy: '小赵',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerName) newErrors.customerName = '客户名称不能为空';
    if (!formData.deviceId) newErrors.deviceId = '设备编号不能为空';
    if (!formData.deviceName) newErrors.deviceName = '设备名称不能为空';
    if (!formData.contractAmount || formData.contractAmount <= 0) newErrors.contractAmount = '合同金额必须大于0';
    if (formData.effectiveDate && formData.expiryDate && new Date(formData.effectiveDate) >= new Date(formData.expiryDate)) {
      newErrors.expiryDate = '到期日期必须晚于生效日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date().toISOString();
    const newContract: Contract = {
      id: `supplement_${Date.now()}`,
      contractNo: formData.contractNo!,
      customerName: formData.customerName!,
      customerManager: formData.customerManager!,
      deviceId: formData.deviceId!,
      deviceName: formData.deviceName!,
      contractAmount: formData.contractAmount!,
      electricityPrice: formData.electricityPrice!,
      contractDate: formData.contractDate!,
      effectiveDate: formData.effectiveDate!,
      expiryDate: formData.expiryDate!,
      status: formData.status!,
      hasAttachment: formData.hasAttachment!,
      attachmentName: formData.attachmentName,
      anomalies: [],
      createdAt: now,
      updatedAt: now,
      updatedBy: '小赵',
      isSupplement: true,
      supplementFrom: formData.supplementFrom,
      notes: formData.notes,
    };

    addContract(newContract);
    onSuccess(newContract.id);
  };

  const sourceContracts = contracts.filter((c) => !c.isSupplement);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-800">
                小赵补录合同
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                手工补录遗漏的合同信息，系统将自动记录补录来源和差异
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                合同编号
              </label>
              <input
                type="text"
                value={formData.contractNo}
                onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                客户经理
              </label>
              <select
                value={formData.customerManager}
                onChange={(e) => setFormData({ ...formData, customerManager: e.target.value })}
                className="input-field"
              >
                {customerManagers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                客户名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="请输入客户名称"
                className={`input-field ${errors.customerName ? 'border-rose-500' : ''}`}
              />
              {errors.customerName && <p className="text-xs text-rose-500 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                补录来源合同
              </label>
              <select
                value={formData.supplementFrom}
                onChange={(e) => setFormData({ ...formData, supplementFrom: e.target.value })}
                className="input-field"
              >
                <option value="">选择原合同（可选）</option>
                {sourceContracts.map((c) => (
                  <option key={c.id} value={c.contractNo}>
                    {c.contractNo} - {c.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                设备编号 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                placeholder="如: DEV-010"
                className={`input-field font-mono ${errors.deviceId ? 'border-rose-500' : ''}`}
              />
              {errors.deviceId && <p className="text-xs text-rose-500 mt-1">{errors.deviceId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                设备名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deviceName}
                onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                placeholder="如: 10号备用变压器"
                className={`input-field ${errors.deviceName ? 'border-rose-500' : ''}`}
              />
              {errors.deviceName && <p className="text-xs text-rose-500 mt-1">{errors.deviceName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                合同金额(元) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.contractAmount}
                onChange={(e) => setFormData({ ...formData, contractAmount: Number(e.target.value) })}
                className={`input-field font-mono ${errors.contractAmount ? 'border-rose-500' : ''}`}
              />
              {errors.contractAmount && <p className="text-xs text-rose-500 mt-1">{errors.contractAmount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                电价(元/度)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.electricityPrice}
                onChange={(e) => setFormData({ ...formData, electricityPrice: Number(e.target.value) })}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                合同日期
              </label>
              <input
                type="date"
                value={formData.contractDate}
                onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                className="input-field"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                生效日期
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                到期日期
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className={`input-field ${errors.expiryDate ? 'border-rose-500' : ''}`}
              />
              {errors.expiryDate && <p className="text-xs text-rose-500 mt-1">{errors.expiryDate}</p>}
            </div>
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">附件与备注</span>
            </div>
            <div className="mt-3 flex items-start gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasAttachment}
                  onChange={(e) => setFormData({ ...formData, hasAttachment: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-energy-600 focus:ring-energy-500"
                />
                <span className="text-sm text-slate-700">有附件</span>
              </label>
              {formData.hasAttachment && (
                <input
                  type="text"
                  placeholder="附件名称"
                  value={formData.attachmentName || ''}
                  onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                  className="flex-1 input-field text-sm"
                />
              )}
            </div>
            <div className="mt-3">
              <textarea
                placeholder="补录说明（如：补录原合同遗漏的备用设备条款）"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-500">
              <span className={`badge-status ${statusColors[formData.status!]} text-xs mr-2`}>
                {formData.status}
              </span>
              补录人: 小赵
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary">
                取消
              </button>
              <button type="submit" className="btn-primary">
                <Save className="w-4 h-4" />
                保存补录
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
