import { useState, useMemo } from 'react';
import { Edit2, Trash2, Link2, FileText, AlertTriangle, CheckCircle, Clock, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { useValveStore } from '@/store/valveStore';
import { useViewStore } from '@/store/viewStore';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import type { ValveRecord } from '@/types';
import AnomalyFeedback, { useAnomalyDetection } from './AnomalyFeedback';
import { useEffect } from 'react';

const ITEMS_PER_PAGE = 8;

export default function ValveTable() {
  const {
    filteredRecords,
    selectRecord,
    selectedRecordId,
    openEditModal,
    deleteRecord,
    linkContractToRecord,
    getContractById,
    showContractPanel,
    toggleContractPanel,
    contracts,
  } = useValveStore();

  const { anomalyState, setAnomalyState } = useViewStore();
  const { detectAnomalies } = useAnomalyDetection();

  const [currentPage, setCurrentPage] = useState(1);
  const [linkingRecordId, setLinkingRecordId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    detectAnomalies();
  }, [filteredRecords.length]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRecords.length]);

  const handleRowClick = (record: ValveRecord) => {
    selectRecord(selectedRecordId === record.id ? null : record.id);
  };

  const handleEdit = (e: React.MouseEvent, record: ValveRecord) => {
    e.stopPropagation();
    openEditModal(record);
  };

  const handleDelete = (e: React.MouseEvent, record: ValveRecord) => {
    e.stopPropagation();
    const reason = prompt('请输入删除原因：');
    if (reason) {
      deleteRecord(record.id, reason);
    }
  };

  const handleCellEditStart = (e: React.MouseEvent, record: ValveRecord, field: string, value: any) => {
    e.stopPropagation();
    setEditingCell({ id: record.id, field });
    setEditValue(String(value));
  };

  const handleCellEditSave = () => {
    if (!editingCell) return;

    const record = filteredRecords.find(r => r.id === editingCell.id);
    if (!record) return;

    let value: any = editValue;
    if (['opening', 'temperature', 'pressure'].includes(editingCell.field)) {
      value = Number(editValue);
    }

    useValveStore.getState().updateRecord(editingCell.id, { [editingCell.field]: value });
    setEditingCell(null);
  };

  const handleCellEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleLinkContract = (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    setLinkingRecordId(linkingRecordId === recordId ? null : recordId);
    if (!showContractPanel) toggleContractPanel();
  };

  const handleSelectContract = (contractId: string, recordId: string) => {
    const dateMatched = linkContractToRecord(recordId, contractId);
    if (!dateMatched) {
      alert('⚠️ 合同日期与记录日期不匹配，已关联但标记为异常');
    }
    setLinkingRecordId(null);
  };

  const statusIcon = (status: ValveRecord['status']) => {
    switch (status) {
      case 'normal': return <CheckCircle size={16} className="text-industrial-green" />;
      case 'abnormal': return <AlertTriangle size={16} className="text-industrial-red" />;
      case 'manual': return <Clock size={16} className="text-industrial-orange" />;
    }
  };

  const isAllBadRows = anomalyState === 'all_bad_rows';

  if (anomalyState === 'empty_table') {
    return (
      <div className="bg-white rounded-lg shadow-industrial border border-gray-100">
        <AnomalyFeedback type="empty_table" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-industrial border border-gray-100 overflow-hidden">
      {isAllBadRows && <AnomalyFeedback type="all_bad_rows" />}

      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FileText size={18} className="text-primary-500" />
          阀门巡检记录
          <span className="text-xs font-normal text-gray-400">
            共 {filteredRecords.length} 条记录
          </span>
        </h3>
        <div className="flex items-center gap-2">
          {isAllBadRows && (
            <span className="text-xs text-industrial-red bg-industrial-red/10 px-2 py-1 rounded">
              ⚠️ 全部异常
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">记录日期</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">阀门编号</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">开度(%)</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">温度(°C)</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">压力(MPa)</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作人</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联合同</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
              <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRecords.map((record, idx) => {
              const contract = record.contractId ? getContractById(record.contractId) : null;
              const dateMismatch = contract && record.recordDate !== contract.contractDate;
              const isSelected = selectedRecordId === record.id;
              const rowIsBad = record.status === 'abnormal';

              return (
                <tr
                  key={record.id}
                  onClick={() => handleRowClick(record)}
                  className={`
                    cursor-pointer transition-colors
                    ${isAllBadRows && rowIsBad ? 'bg-industrial-red/5' : ''}
                    ${isSelected ? 'bg-primary-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                    hover:bg-primary-50/50
                    ${isAllBadRows ? 'border-l-2 border-industrial-red' : ''}
                  `}
                >
                  <td className="px-3 py-2.5">
                    {isAllBadRows && rowIsBad && (
                      <AlertTriangle size={14} className="text-industrial-red animate-pulse" />
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-sm font-mono text-gray-700">
                    {record.recordDate}
                  </td>

                  <td className="px-3 py-2.5">
                    {editingCell?.id === record.id && editingCell?.field === 'valveNo' ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={(e) => e.key === 'Enter' ? handleCellEditSave() : e.key === 'Escape' && handleCellEditCancel()}
                        className="w-full px-2 py-1 border border-primary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => handleCellEditStart(e, record, 'valveNo', record.valveNo)}
                        className="font-mono font-medium text-primary-600 hover:bg-primary-100 px-1.5 py-0.5 rounded cursor-text"
                      >
                        {record.valveNo}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    {editingCell?.id === record.id && editingCell?.field === 'opening' ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={(e) => e.key === 'Enter' ? handleCellEditSave() : e.key === 'Escape' && handleCellEditCancel()}
                        className="w-20 px-2 py-1 border border-primary-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => handleCellEditStart(e, record, 'opening', record.opening)}
                        className="font-mono hover:bg-primary-100 px-1.5 py-0.5 rounded cursor-text"
                      >
                        {record.opening}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    {editingCell?.id === record.id && editingCell?.field === 'temperature' ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={(e) => e.key === 'Enter' ? handleCellEditSave() : e.key === 'Escape' && handleCellEditCancel()}
                        className="w-20 px-2 py-1 border border-primary-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => handleCellEditStart(e, record, 'temperature', record.temperature)}
                        className={`font-mono hover:bg-primary-100 px-1.5 py-0.5 rounded cursor-text ${
                          record.temperature > 180 ? 'text-industrial-red font-bold' :
                          record.temperature < 130 ? 'text-industrial-blue' : ''
                        }`}
                      >
                        {record.temperature}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right">
                    {editingCell?.id === record.id && editingCell?.field === 'pressure' ? (
                      <input
                        autoFocus
                        type="number"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellEditSave}
                        onKeyDown={(e) => e.key === 'Enter' ? handleCellEditSave() : e.key === 'Escape' && handleCellEditCancel()}
                        className="w-20 px-2 py-1 border border-primary-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-300 font-mono"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => handleCellEditStart(e, record, 'pressure', record.pressure)}
                        className={`font-mono hover:bg-primary-100 px-1.5 py-0.5 rounded cursor-text ${
                          record.pressure < 1.8 ? 'text-industrial-orange font-medium' : ''
                        }`}
                      >
                        {record.pressure.toFixed(1)}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${STATUS_COLORS[record.status]}`}>
                      {statusIcon(record.status)}
                      {STATUS_LABELS[record.status]}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-sm text-gray-700">
                    {record.operator === '老何' ? (
                      <span className="font-medium text-industrial-orange">👷 {record.operator}</span>
                    ) : record.operator}
                  </td>

                  <td className="px-3 py-2.5">
                    {contract ? (
                      <div className="flex items-center gap-1">
                        <FileText size={14} className={dateMismatch ? 'text-industrial-orange' : 'text-industrial-green'} />
                        <span className={`text-xs font-mono ${dateMismatch ? 'text-industrial-orange' : 'text-gray-600'}`}>
                          {contract.contractNo}
                        </span>
                        {dateMismatch && (
                          <span className="text-[10px] text-industrial-orange bg-industrial-orange/10 px-1 rounded">
                            日期不匹配
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleLinkContract(e, record.id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          linkingRecordId === record.id
                            ? 'bg-primary-100 text-primary-600'
                            : 'text-gray-400 hover:text-primary-500 hover:bg-gray-100'
                        }`}
                      >
                        <Link2 size={12} />
                        关联合同
                      </button>
                    )}

                    {linkingRecordId === record.id && (
                      <div className="absolute mt-1 bg-white border border-gray-200 rounded shadow-industrial-lg py-1 min-w-[200px] z-10 animate-slide-in">
                        {contracts.map(c => {
                          const dateMatch = record.recordDate === c.contractDate;
                          return (
                            <button
                              key={c.id}
                              onClick={() => handleSelectContract(c.id, record.id)}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 flex items-center justify-between gap-2"
                            >
                              <span className="font-mono">{c.contractNo}</span>
                              <span className={`text-[10px] ${dateMatch ? 'text-industrial-green' : 'text-industrial-orange'}`}>
                                {c.contractDate} {dateMatch ? '✓' : '⚠'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2.5 max-w-[150px]">
                    {record.remarks ? (
                      <span className="text-xs text-gray-500 truncate block" title={record.remarks}>
                        {record.remarks}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => handleEdit(e, record)}
                        className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, record)}
                        className="p-1.5 text-gray-400 hover:text-industrial-red hover:bg-industrial-red/5 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          显示 {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} 条
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-7 h-7 text-xs rounded transition-colors ${
                currentPage === page
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
