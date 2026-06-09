import { useState, useRef, useEffect } from 'react';
import { CheckSquare, Square, Edit3, Save, X, AlertTriangle, Paperclip, User, Calendar, DollarSign, Zap, Trash2 } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { statusColors, anomalyColors, customerManagers } from '../data/mockData';
import { Contract, ContractStatus, AnomalyType } from '../types/contract';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface EditableCellProps {
  value: string | number;
  field: keyof Contract;
  contractId: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  onValidate?: (value: string | number) => { valid: boolean; message?: string };
}

const EditableCell = ({ value, field, contractId, type = 'text', options, onValidate }: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const updateContract = useContractStore((state) => state.updateContract);
  const setEditingId = useContractStore((state) => state.setEditingId);
  const editingId = useContractStore((state) => state.editingId);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editingId !== contractId && isEditing) {
      handleCancel();
    }
  }, [editingId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(String(value));
    setError(null);
    setEditingId(contractId);
  };

  const handleSave = () => {
    let parsedValue: string | number = editValue;
    if (type === 'number') {
      parsedValue = Number(editValue);
      if (isNaN(parsedValue)) {
        setError('请输入有效数字');
        return;
      }
    }

    if (onValidate) {
      const result = onValidate(parsedValue);
      if (!result.valid) {
        setError(result.message || '输入无效');
        return;
      }
    }

    updateContract(contractId, { [field]: parsedValue } as Partial<Contract>);
    setIsEditing(false);
    setEditingId(null);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(String(value));
    setError(null);
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (!isEditing) {
    return (
      <div
        onClick={handleEdit}
        className="group cursor-pointer table-cell-edit flex items-center gap-1"
      >
        <span className="flex-1 truncate">{value || '-'}</span>
        <Edit3 className="w-3.5 h-3.5 text-slate-300 group-hover:text-energy-500 transition-colors opacity-0 group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'select' && options ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="table-cell-edit w-full bg-white"
          autoFocus
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`table-cell-edit w-full ${error ? 'border-rose-500 bg-rose-50' : ''}`}
          step={type === 'number' ? '0.01' : undefined}
        />
      )}
      <button
        onClick={handleSave}
        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
      >
        <Save className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleCancel}
        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-rose-500 text-white text-xs rounded z-10 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

interface ContractTableRowProps {
  contract: Contract;
  isSelected: boolean;
  onToggleSelect: () => void;
  onViewDetail: (id: string) => void;
}

const ContractTableRow = ({ contract, isSelected, onToggleSelect, onViewDetail }: ContractTableRowProps) => {
  const validateAmount = (value: string | number) => {
    if (Number(value) <= 0) return { valid: false, message: '金额必须大于0' };
    return { valid: true };
  };

  const validatePrice = (value: string | number) => {
    const num = Number(value);
    if (num <= 0 || num > 2) return { valid: false, message: '电价应在0-2元/度之间' };
    return { valid: true };
  };

  const validateDates = (field: string, value: string | number) => {
    if (field === 'expiryDate' && contract.effectiveDate) {
      if (new Date(String(value)) <= new Date(contract.effectiveDate)) {
        return { valid: false, message: '到期日期必须晚于生效日期' };
      }
    }
    return { valid: true };
  };

  const statusOptions: ContractStatus[] = ['待审核', '审核通过', '异常', '已退回', '草稿'];

  return (
    <tr
      className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors group ${
        isSelected ? 'bg-energy-50/50' : ''
      } ${contract.anomalies.length > 0 ? 'bg-rose-50/30' : ''} ${contract.isSupplement ? 'bg-amber-50/30' : ''}`}
    >
      <td className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="text-slate-400 hover:text-energy-600 transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-energy-600" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
      </td>

      <td className="px-4 py-3">
        <div className="font-mono text-sm font-medium text-slate-800">{contract.contractNo}</div>
        {contract.isSupplement && (
          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            <Zap className="w-3 h-3" />
            补录
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-slate-800">{contract.customerName}</div>
        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <User className="w-3 h-3" />
          {contract.customerManager}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-sm text-slate-800">{contract.deviceName}</div>
        <div className="text-xs text-slate-400 font-mono">{contract.deviceId}</div>
      </td>

      <td className="px-4 py-3 relative">
        <EditableCell
          value={contract.contractAmount}
          field="contractAmount"
          contractId={contract.id}
          type="number"
          onValidate={validateAmount}
        />
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          电价: {contract.electricityPrice}元/度
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm text-slate-600">{contract.contractDate}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {contract.effectiveDate} ~ {contract.expiryDate}
        </div>
      </td>

      <td className="px-4 py-3">
        <select
          value={contract.status}
          onChange={(e) => {
            useContractStore.getState().updateContract(contract.id, {
              status: e.target.value as ContractStatus,
            });
          }}
          className={`badge-status ${statusColors[contract.status]} cursor-pointer appearance-none pr-6 bg-no-repeat bg-right`}
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27currentColor%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27 /%3E%3C/svg%3E")', backgroundSize: '12px' }}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {contract.hasAttachment ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded">
              <Paperclip className="w-3 h-3" />
              有附件
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">
              <Paperclip className="w-3 h-3" />
              缺失
            </span>
          )}
        </div>
        {contract.attachmentName && (
          <div className="text-xs text-slate-400 mt-1 truncate max-w-[120px]">
            {contract.attachmentName}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {contract.anomalies.length > 0 ? (
            contract.anomalies.map((a) => (
              <span
                key={a}
                className={`badge-anomaly ${anomalyColors[a] || anomalyColors['其他']}`}
                title={a}
              >
                <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                {a}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="text-xs text-slate-500">
          <div>{format(new Date(contract.updatedAt), 'MM-dd HH:mm', { locale: zhCN })}</div>
          <div className="text-slate-400">{contract.updatedBy}</div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewDetail(contract.id)}
            className="p-1.5 text-energy-600 hover:bg-energy-50 rounded transition-colors"
            title="查看详情"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export const ContractTable = ({ onViewDetail }: { onViewDetail: (id: string) => void }) => {
  const getFilteredContracts = useContractStore((state) => state.getFilteredContracts);
  const selectedIds = useContractStore((state) => state.selectedIds);
  const toggleSelect = useContractStore((state) => state.toggleSelect);
  const selectAll = useContractStore((state) => state.selectAll);
  const clearSelection = useContractStore((state) => state.clearSelection);

  const contracts = getFilteredContracts();
  const allSelected = contracts.length > 0 && selectedIds.length === contracts.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < contracts.length;

  return (
    <div className="card-industrial overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <button
                  onClick={() => {
                    if (allSelected) clearSelection();
                    else selectAll(contracts.map((c) => c.id));
                  }}
                  className="text-slate-400 hover:text-energy-600 transition-colors"
                >
                  {allSelected || someSelected ? (
                    <CheckSquare className={`w-4 h-4 ${allSelected ? 'text-energy-600' : 'text-slate-400'}`} />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                合同编号
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                客户信息
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                设备信息
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                合同金额
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                日期
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                附件
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                异常标记
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                最后更新
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-10">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract, index) => (
              <ContractTableRow
                key={contract.id}
                contract={contract}
                isSelected={selectedIds.includes(contract.id)}
                onToggleSelect={() => toggleSelect(contract.id)}
                onViewDetail={onViewDetail}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
