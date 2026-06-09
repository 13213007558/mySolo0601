import { useMemo } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import type { OilTempRecord } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';
import { useEditableTable } from '@/hooks/useEditableTable';
import { EditableCell } from './EditableCell';
import { AttachmentCell } from './AttachmentCell';
import { getStatusColor } from '@/utils/mockData';

interface OilTempTableProps {
  records: OilTempRecord[];
}

const EDITABLE_FIELDS: (keyof OilTempRecord)[] = ['temperature', 'status', 'remark'];

export function OilTempTable({ records }: OilTempTableProps) {
  const { selectedDevice, selectAll, clearSelection } = useOilTempStore();

  const table = useEditableTable();

  const filteredRecords = useMemo(() => {
    return records
      .filter(r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温')
      .sort((a, b) => {
        const getMinutes = (time: string) => {
          const [h, m] = time.split(':').map(Number);
          let mins = h * 60 + m;
          if (h < 12) mins += 24 * 60;
          return mins;
        };
        return getMinutes(a.timestamp) - getMinutes(b.timestamp);
      });
  }, [records, selectedDevice]);

  const allSelected = filteredRecords.length > 0 &&
    filteredRecords.every(r => table.selectedIds.includes(r.id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(r => r.deviceName === selectedDevice && r.measurePoint === '顶层油温');
    }
  };

  const getRowClassName = (record: OilTempRecord) => {
    const base = 'transition-colors';
    const isSelected = table.selectedIds.includes(record.id);
    const isAbnormal = record.status === 'abnormal';
    const hasConflict = record.attachmentMissing;

    if (isSelected) {
      return `${base} bg-blue-500/10 hover:bg-blue-500/15`;
    }
    if (isAbnormal) {
      return `${base} bg-amber-500/5 hover:bg-amber-500/10`;
    }
    if (hasConflict) {
      return `${base} bg-yellow-500/5 hover:bg-yellow-500/10`;
    }
    return `${base} hover:bg-slate-800/50`;
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-200">
          油温数据明细 - {selectedDevice}
        </h3>
        <div className="text-xs text-slate-500">
          共 {filteredRecords.length} 条记录 | 已选 {table.selectedIds.length} 条
        </div>
      </div>

      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 sticky top-0 z-10">
            <tr>
              <th className="w-10 px-3 py-2 text-left">
                <button
                  onClick={handleSelectAll}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                时间
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                油温(°C)
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                状态
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                附件
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                备注
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                修改人
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                版本
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredRecords.map((record, idx) => (
              <tr
                key={record.id}
                className={`${getRowClassName(record)} ${
                  table.editingCell?.recordId === record.id ? 'ring-1 ring-blue-500 ring-inset' : ''
                }`}
                onClick={(e) => table.handleRowClick(e, record.id)}
              >
                <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => table.toggleSelection(record.id, true)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    {table.selectedIds.includes(record.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-1.5">
                  <span className="font-mono text-slate-300">{record.timestamp}</span>
                </td>
                <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    record={record}
                    field="temperature"
                    value={record.temperature}
                    isEditing={table.isEditing(record.id, 'temperature')}
                    editValue={table.editValue}
                    onEditStart={table.startEditing}
                    onEditChange={table.setEditValue}
                    onEditCommit={table.commitEdit}
                    onEditCancel={table.cancelEditing}
                    onKeyDown={table.handleKeyDown}
                  />
                </td>
                <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    record={record}
                    field="status"
                    value={record.status}
                    isEditing={table.isEditing(record.id, 'status')}
                    editValue={table.editValue}
                    onEditStart={table.startEditing}
                    onEditChange={table.setEditValue}
                    onEditCommit={table.commitEdit}
                    onEditCancel={table.cancelEditing}
                    onKeyDown={table.handleKeyDown}
                  />
                </td>
                <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <AttachmentCell record={record} />
                </td>
                <td className="px-3 py-1.5 max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                  <EditableCell
                    record={record}
                    field="remark"
                    value={record.remark || ''}
                    isEditing={table.isEditing(record.id, 'remark')}
                    editValue={table.editValue}
                    onEditStart={table.startEditing}
                    onEditChange={table.setEditValue}
                    onEditCommit={table.commitEdit}
                    onEditCancel={table.cancelEditing}
                    onKeyDown={table.handleKeyDown}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-slate-400 text-xs">
                    {record.modifiedBy || '-'}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span className="font-mono text-slate-500 text-xs">v{record.version}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
