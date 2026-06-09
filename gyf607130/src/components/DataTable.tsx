import { Eye, Edit, RotateCcw, Check, XCircle, AlertTriangle, Users, FileText } from 'lucide-react';
import { useForecastStore } from '../store/useForecastStore';
import { statusLabels, statusColors } from '../data/mockData';
import { formatDeviation, displayValue } from '../utils/calculation';
import { ForecastRecord } from '../types';
import { ManualEntryRow } from './ManualEntryRow';

const DataRow = ({ record, isSelected }: { record: ForecastRecord; isSelected: boolean }) => {
  const {
    openModal,
    reviewRecord,
    approveRecord,
    withdrawRecord,
    setChartRecordId,
    chartRecordId,
  } = useForecastStore();

  const deviation = formatDeviation(record.deviationRate);
  const isChartSelected = chartRecordId === record.id;

  const getRowClass = () => {
    let base = isChartSelected ? 'bg-blue-50' : isSelected ? 'bg-slate-50' : '';
    if (record.isAbnormal) base += ' bg-orange-50/60';
    if (record.hasStatusConflict) base += ' bg-red-50/60';
    if (record.isManualEntry) base += ' bg-blue-50/60';
    return base;
  };

  const handleRowClick = () => {
    setChartRecordId(isChartSelected ? null : record.id);
  };

  const handleWithdraw = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('withdraw', record);
  };

  return (
    <tr
      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${getRowClass()}`}
      onClick={handleRowClick}
    >
      <td className="px-4 py-3 text-sm font-mono text-slate-800">
        <div className="flex items-center gap-2">
          {record.isManualEntry && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
              补录
            </span>
          )}
          {record.deviceNo}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700">{record.deviceName}</td>
      <td className="px-4 py-3 text-sm font-mono text-slate-600 text-right">{record.forecastValue.toFixed(2)}</td>
      <td className="px-4 py-3 text-sm font-mono text-right">
        {record.revisedValue !== undefined ? (
          <span className="text-orange-600 font-medium">{record.revisedValue.toFixed(2)}</span>
        ) : (
          <span className="text-slate-400">--</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-slate-600 text-right">{record.actualValue.toFixed(2)}</td>
      <td className="px-4 py-3 text-sm font-mono text-right font-medium">
        <span className={deviation.color}>{deviation.text}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-1 text-xs rounded font-medium ${statusColors[record.status]}`}>
          {statusLabels[record.status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {record.isAbnormal && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-700" title="客服回访异常">
              <AlertTriangle size={10} />
              异常
            </span>
          )}
          {record.hasStatusConflict && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700" title="多人修改状态冲突，不计入正常汇总">
              <Users size={10} />
              冲突
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        <div>{displayValue(record.createdBy)}</div>
        {record.updatedBy && record.updatedBy !== record.createdBy && (
          <div className="text-red-500">→ {record.updatedBy}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openModal('detail', record)}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-blue-600"
            title="查看详情"
          >
            <Eye size={14} />
          </button>

          {record.status === 'pending' && (
            <>
              <button
                onClick={() => openModal('revise', record)}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-orange-600"
                title="补录修正"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => reviewRecord(record.id)}
                className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-green-600"
                title="复核通过"
              >
                <Check size={14} />
              </button>
            </>
          )}

          {(record.status === 'reviewed' || record.status === 'approved') && (
            <button
              onClick={handleWithdraw}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-red-600"
              title="撤回结论"
            >
              <RotateCcw size={14} />
            </button>
          )}

          {record.status === 'withdrawn' && (
            <button
              onClick={() => openModal('withdraw', record)}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-blue-600"
              title="重新提交"
            >
              <FileText size={14} />
            </button>
          )}

          {record.status === 'reviewed' && (
            <button
              onClick={() => approveRecord(record.id)}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-600 hover:text-green-600"
              title="主管审批"
            >
              <Check size={14} />
            </button>
          )}

          {record.hasStatusConflict && (
            <span
              className="p-1.5 text-red-400 cursor-not-allowed"
              title="状态冲突，已排除出正常汇总"
            >
              <XCircle size={14} />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

export const DataTable = () => {
  const { getFilteredRecords, records, toggleSelectRecord, selectedRecordIds } = useForecastStore();
  const filteredRecords = getFilteredRecords();
  const manualEntries = filteredRecords.filter(r => r.isManualEntry);
  const normalRecords = filteredRecords.filter(r => !r.isManualEntry);

  const normalSummary = records.filter(r => !r.hasStatusConflict && !r.isAbnormal);
  const conflictCount = records.filter(r => r.hasStatusConflict).length;
  const abnormalCount = records.filter(r => r.isAbnormal).length;

  return (
    <div className="mx-6 mt-4 mb-6">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  设备编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  设备名称
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  原始预测(MW)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-orange-600 uppercase tracking-wider">
                  日前修正(MW)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  实际值(MW)
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  偏差率
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  标记
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  操作人
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {normalRecords.length === 0 && manualEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    暂无匹配的记录
                  </td>
                </tr>
              ) : (
                <>
                  {normalRecords.map(record => (
                    <DataRow
                      key={record.id}
                      record={record}
                      isSelected={selectedRecordIds.includes(record.id)}
                    />
                  ))}
                  <ManualEntryRow />
                  {manualEntries.map(record => (
                    <DataRow
                      key={record.id}
                      record={record}
                      isSelected={selectedRecordIds.includes(record.id)}
                    />
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>共 <strong className="text-slate-800">{filteredRecords.length}</strong> 条记录</span>
            <span className="text-green-600">
              正常汇总 <strong>{normalSummary.length}</strong> 条
            </span>
            <span className="text-orange-600">
              客服回访异常 <strong>{abnormalCount}</strong> 条
            </span>
            <span className="text-red-600">
              状态冲突排除 <strong>{conflictCount}</strong> 条
            </span>
            {manualEntries.length > 0 && (
              <span className="text-blue-600">
                手工补录 <strong>{manualEntries.length}</strong> 条
              </span>
            )}
          </div>
          <div className="text-slate-400">
            点击行查看对应负荷曲线 · 状态冲突和异常数据不纳入正常汇总
          </div>
        </div>
      </div>
    </div>
  );
};
