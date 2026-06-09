import { X, GitCompare, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useContractStore } from '../store/contractStore';
import { statusColors } from '../data/mockData';

interface DiffCompareProps {
  id1: string;
  id2: string;
  onClose: () => void;
}

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
  isSupplement: '是否补录',
  createdAt: '创建时间',
  updatedAt: '更新时间',
  updatedBy: '更新人',
};

const formatCurrency = (amount: number) => {
  if (typeof amount === 'number' && amount > 0) {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  }
  return String(amount);
};

export const DiffCompare = ({ id1, id2, onClose }: DiffCompareProps) => {
  const compareContracts = useContractStore((state) => state.compareContracts);
  const contracts = useContractStore((state) => state.contracts);

  const c1 = contracts.find((c) => c.id === id1);
  const c2 = contracts.find((c) => c.id === id2);

  if (!c1 || !c2) return null;

  const diff = compareContracts(id1, id2);
  const hasDifferences = diff.length > 0;

  const formatValue = (field: string, value: unknown) => {
    if (field === 'contractAmount') return formatCurrency(value as number);
    if (field === 'electricityPrice') return `${value} 元/度`;
    if (field === 'hasAttachment') return value ? '有附件' : '无附件';
    if (field === 'isSupplement') return value ? '是' : '否';
    return String(value);
  };

  const allFields = [
    'contractNo', 'customerName', 'customerManager', 'deviceId', 'deviceName',
    'contractAmount', 'electricityPrice', 'contractDate', 'effectiveDate', 'expiryDate',
    'status', 'hasAttachment', 'attachmentName', 'notes', 'createdAt', 'updatedAt', 'updatedBy',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <GitCompare className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-800">
                合同差异对比
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                <span className={`badge-status ${statusColors[c1.status]} text-xs`}>
                  {c1.contractNo}
                </span>
                <ArrowRight className="w-4 h-4" />
                <span className={`badge-status ${statusColors[c2.status]} text-xs`}>
                  {c2.contractNo}
                </span>
                {c2.isSupplement && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    小赵补录
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {hasDifferences && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">
                  检测到 {diff.length} 处差异
                </span>
              </div>
            </div>
          )}

          {!hasDifferences && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-800">
                  两份合同完全一致，无差异
                </span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                    字段
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {c1.contractNo}
                    {c1.updatedBy && <span className="block font-normal text-xs text-slate-400 mt-0.5">操作人: {c1.updatedBy}</span>}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">
                    变更
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {c2.contractNo}
                    {c2.isSupplement && <span className="block font-normal text-xs text-amber-500 mt-0.5">小赵补录</span>}
                    {c2.updatedBy && <span className="block font-normal text-xs text-slate-400 mt-0.5">操作人: {c2.updatedBy}</span>}
                  </th>
                </tr>
              </thead>
              <tbody>
                {allFields.map((field) => {
                  const v1 = c1[field as keyof typeof c1];
                  const v2 = c2[field as keyof typeof c2];
                  const hasDiff = String(v1) !== String(v2);

                  return (
                    <tr
                      key={field}
                      className={`border-b border-slate-100 ${hasDiff ? 'bg-rose-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {fieldLabels[field] || field}
                      </td>
                      <td className={`px-4 py-3 ${hasDiff ? 'bg-rose-100/50 text-rose-700' : 'text-slate-600'}`}>
                        {field === 'status' ? (
                          <span className={`badge-status ${statusColors[String(v1)]} text-xs`}>
                            {String(v1)}
                          </span>
                        ) : (
                          <span className="font-mono text-sm">{formatValue(field, v1)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasDiff ? (
                          <ArrowRight className="w-5 h-5 mx-auto text-rose-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mx-auto text-slate-300" />
                        )}
                      </td>
                      <td className={`px-4 py-3 ${hasDiff ? 'bg-emerald-100/50 text-emerald-700' : 'text-slate-600'}`}>
                        {field === 'status' ? (
                          <span className={`badge-status ${statusColors[String(v2)]} text-xs`}>
                            {String(v2)}
                          </span>
                        ) : (
                          <span className="font-mono text-sm">{formatValue(field, v2)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {c1.notes && (
              <div className="p-4 bg-slate-50 rounded-xl">
                <h4 className="text-sm font-medium text-slate-700 mb-2">{c1.contractNo} 备注</h4>
                <p className="text-slate-600">{c1.notes}</p>
              </div>
            )}
            {c2.notes && (
              <div className="p-4 bg-amber-50 rounded-xl">
                <h4 className="text-sm font-medium text-amber-700 mb-2">{c2.contractNo} 备注</h4>
                <p className="text-amber-800">{c2.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
