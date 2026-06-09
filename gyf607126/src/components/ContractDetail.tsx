import { useState, useEffect } from 'react';
import { X, Edit3, Save, AlertTriangle, Paperclip, User, Calendar, DollarSign, Zap, History, GitCompare, FileText } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { statusColors, anomalyColors } from '../data/mockData';
import { Contract, ContractStatus, AnomalyType } from '../types/contract';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ContractDetailProps {
  contractId: string;
  onClose: () => void;
  onCompare: (id1: string, id2: string) => void;
}

const anomalyTypes: AnomalyType[] = ['附件缺失', '状态冲突', '金额异常', '日期错误', '设备重复', '其他'];
const statusOptions: ContractStatus[] = ['待审核', '审核通过', '异常', '已退回', '草稿'];

export const ContractDetail = ({ contractId, onClose, onCompare }: ContractDetailProps) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contract>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'history'>('basic');

  const contracts = useContractStore((state) => state.contracts);
  const history = useContractStore((state) => state.history);
  const updateContract = useContractStore((state) => state.updateContract);
  const validateContract = useContractStore((state) => state.validateContract);
  const getContractsByDevice = useContractStore((state) => state.getContractsByDevice);
  const toggleAnomaly = useContractStore((state) => state.batchMarkAnomaly);
  const removeAnomaly = useContractStore((state) => state.batchRemoveAnomaly);

  useEffect(() => {
    const found = contracts.find((c) => c.id === contractId);
    if (found) {
      setContract(found);
      setEditData(found);
    }
  }, [contractId, contracts]);

  if (!contract) return null;

  const validation = validateContract(contract);
  const relatedContracts = getContractsByDevice(contract.deviceId).filter((c) => c.id !== contract.id);
  const contractHistory = history.filter((h) => h.contractId === contractId).reverse();

  const handleSave = () => {
    updateContract(contractId, editData);
    setIsEditing(false);
  };

  const handleToggleAnomaly = (type: AnomalyType) => {
    if (contract.anomalies.includes(type)) {
      removeAnomaly([contractId], type);
    } else {
      toggleAnomaly([contractId], type);
    }
  };

  const fieldLabels: Record<string, string> = {
    contractNo: '合同编号',
    customerName: '客户名称',
    customerManager: '客户经理',
    deviceId: '设备编号',
    deviceName: '设备名称',
    contractAmount: '合同金额',
    electricityPrice: '电价',
    contractDate: '合同日期',
    effectiveDate: '生效日期',
    expiryDate: '到期日期',
    status: '状态',
    hasAttachment: '有无附件',
    attachmentName: '附件名称',
    notes: '备注',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-energy-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <FileText className="w-6 h-6 text-energy-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-800">
                {contract.contractNo}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge-status ${statusColors[contract.status]}`}>
                  {contract.status}
                </span>
                {contract.isSupplement && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    <Zap className="w-3 h-3" />
                    小赵补录
                    {contract.supplementFrom && ` · 来源: ${contract.supplementFrom}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contract.isSupplement && contract.supplementFrom && (
              <button
                onClick={() => {
                  const original = contracts.find((c) => c.contractNo === contract.supplementFrom);
                  if (original) onCompare(original.id, contract.id);
                }}
                className="btn-secondary text-sm"
              >
                <GitCompare className="w-4 h-4" />
                对比差异
              </button>
            )}
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn-primary text-sm">
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
            )}
            {isEditing && (
              <>
                <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm">
                  取消
                </button>
                <button onClick={handleSave} className="btn-primary text-sm">
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-energy-600 border-b-2 border-energy-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-energy-600 border-b-2 border-energy-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            变更历史 ({contractHistory.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'basic' ? (
            <div className="space-y-6">
              {(validation.errors.length > 0 || validation.warnings.length > 0) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    校验提示
                  </h4>
                  {validation.errors.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-rose-700">错误:</p>
                      <ul className="mt-1 space-y-1">
                        {validation.errors.map((e, i) => (
                          <li key={i} className="text-sm text-rose-600 flex items-start gap-1">
                            <span className="text-rose-400 mt-0.5">•</span>
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validation.warnings.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-700">警告:</p>
                      <ul className="mt-1 space-y-1">
                        {validation.warnings.map((w, i) => (
                          <li key={i} className="text-sm text-amber-600 flex items-start gap-1">
                            <span className="text-amber-400 mt-0.5">•</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-energy-600" />
                    基本信息
                  </h3>
                  
                  {(['contractNo', 'customerName', 'customerManager', 'contractAmount', 'electricityPrice'] as const).map((field) => (
                    <div key={field} className="group">
                      <label className="block text-sm text-slate-500 mb-1">{fieldLabels[field]}</label>
                      {isEditing ? (
                        <input
                          type={field.includes('Amount') || field.includes('Price') ? 'number' : 'text'}
                          value={editData[field] || ''}
                          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                          step={field === 'electricityPrice' ? '0.01' : undefined}
                          className="input-field"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-800 font-mono">
                          {field === 'contractAmount' && contract.contractAmount > 0
                            ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(contract.contractAmount)
                            : field === 'electricityPrice'
                            ? `${contract.electricityPrice} 元/度`
                            : contract[field]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-energy-600" />
                    日期与状态
                  </h3>
                  
                  {(['contractDate', 'effectiveDate', 'expiryDate'] as const).map((field) => (
                    <div key={field}>
                      <label className="block text-sm text-slate-500 mb-1">{fieldLabels[field]}</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData[field] || ''}
                          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                          className="input-field"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-slate-50 rounded-lg text-slate-800">
                          {contract[field]}
                        </div>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm text-slate-500 mb-1">状态</label>
                    {isEditing ? (
                      <select
                        value={editData.status || ''}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value as ContractStatus })}
                        className="input-field"
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge-status ${statusColors[contract.status]} text-sm`}>
                        {contract.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-medium text-slate-800 flex items-center gap-2 mb-4">
                  <Paperclip className="w-4 h-4 text-energy-600" />
                  附件信息
                </h3>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.hasAttachment}
                      onChange={(e) => setEditData({ ...editData, hasAttachment: e.target.checked })}
                      disabled={!isEditing}
                      className="w-4 h-4 rounded border-slate-300 text-energy-600 focus:ring-energy-500"
                    />
                    <span className="text-sm text-slate-700">有附件</span>
                  </label>
                  {contract.hasAttachment && contract.attachmentName && (
                    <span className="text-sm text-slate-500">{contract.attachmentName}</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="font-medium text-slate-800 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  异常标记
                </h3>
                <div className="flex flex-wrap gap-2">
                  {anomalyTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleToggleAnomaly(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        contract.anomalies.includes(type)
                          ? `${anomalyColors[type]} ring-2 ring-offset-1 ring-current`
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {relatedContracts.length > 0 && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    同设备关联合同 ({relatedContracts.length})
                  </h3>
                  <div className="space-y-2">
                    {relatedContracts.map((rc) => (
                      <div
                        key={rc.id}
                        className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                      >
                        <div>
                          <span className="font-mono text-sm font-medium text-slate-800">{rc.contractNo}</span>
                          <span className={`ml-2 badge-status ${statusColors[rc.status]} text-xs`}>
                            {rc.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-500">
                          {rc.customerManager} · {format(new Date(rc.contractDate), 'yyyy-MM-dd', { locale: zhCN })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contract.notes && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-medium text-slate-800 mb-2">备注</h3>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{contract.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {contractHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>暂无变更历史</p>
                </div>
              ) : (
                contractHistory.map((h, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <div className="w-2 h-2 mt-2 rounded-full bg-energy-500 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{fieldLabels[h.fieldName] || h.fieldName}</span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(h.changedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded">{h.oldValue || '(空)'}</span>
                        <span className="text-slate-400">→</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">{h.newValue}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">操作人: {h.changedBy}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
