import React from 'react';
import { Edit2, Trash2, Plug, Unplug } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, getActionText } from '../utils/time';

interface RecordTableProps {
  records?: {
    id: string;
    gunCode: string;
    timestamp: string;
    operator: string;
    action: 'insert' | 'remove';
    remark: string;
    status: any;
    isManualEntry: boolean;
    manualEntryBy?: string;
    source: string;
  }[];
  showActions?: boolean;
  title?: string;
}

export const RecordTable: React.FC<RecordTableProps> = ({ 
  records: propRecords,
  showActions = true,
  title
}) => {
  const { 
    getFilteredRecords, 
    toggleRecordSelection, 
    selectedRecordIds,
    deleteRecord,
    setManualEntryModalOpen,
    editingRecord
  } = useRecordStore();

  const records = propRecords || getFilteredRecords();

  const handleEdit = (record: any) => {
    setManualEntryModalOpen(true, record);
  };

  const handleDelete = (id: string, gunCode: string) => {
    if (window.confirm(`确定要删除 ${gunCode} 的这条记录吗？`)) {
      deleteRecord(id);
    }
  };

  if (records.length === 0) {
    return (
      <div className="card-panel m-4 p-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-xl font-medium text-gray-300 mb-2">暂无记录</h3>
        <p className="text-gray-500">
          点击"加载样例"按钮体验内置样例数据，或使用"导入数据"上传文件
        </p>
      </div>
    );
  }

  return (
    <div className="m-4 overflow-x-auto">
      {title && (
        <h2 className="text-lg font-mono font-semibold text-gray-200 mb-3">{title}</h2>
      )}
      <div className="card-panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">
                <span className="sr-only">选择</span>
              </th>
              <th className="font-mono">枪编号</th>
              <th className="font-mono">插拔时间</th>
              <th>操作人</th>
              <th>动作</th>
              <th>状态</th>
              <th>备注</th>
              <th>数据来源</th>
              {showActions && <th className="w-28">操作</th>}
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const isSelected = selectedRecordIds.includes(record.id);
              const animationDelay = `${index * 0.05}s`;
              
              return (
                <tr 
                  key={record.id} 
                  className={`animate-fade-in ${isSelected ? 'bg-primary-900/30' : ''}`}
                  style={{ animationDelay }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRecordSelection(record.id)}
                      className="w-4 h-4 accent-primary-500 cursor-pointer"
                    />
                  </td>
                  <td className="font-mono font-medium text-primary-300">
                    {record.gunCode}
                  </td>
                  <td className="font-mono text-gray-300">
                    {formatDateTime(record.timestamp)}
                  </td>
                  <td className="text-gray-200">
                    {record.operator}
                    {record.isManualEntry && record.manualEntryBy && (
                      <span className="ml-1 text-xs text-violet-400">
                        (补录: {record.manualEntryBy})
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      record.action === 'insert' 
                        ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' 
                        : 'bg-amber-900/50 text-amber-400 border border-amber-700'
                    }`}>
                      {record.action === 'insert' ? <Plug size={12} /> : <Unplug size={12} />}
                      {getActionText(record.action)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="text-gray-400 max-w-xs truncate" title={record.remark}>
                    {record.remark || <span className="text-gray-600">—</span>}
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded ${
                      record.source === 'sample' 
                        ? 'bg-blue-900/50 text-blue-400' 
                        : record.source === 'manual'
                          ? 'bg-violet-900/50 text-violet-400'
                          : 'bg-gray-700 text-gray-300'
                    }`}>
                      {record.source === 'sample' ? '样例' : 
                       record.source === 'manual' ? '手工' : '导入'}
                    </span>
                  </td>
                  {showActions && (
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-bgdark-600 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.gunCode)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
