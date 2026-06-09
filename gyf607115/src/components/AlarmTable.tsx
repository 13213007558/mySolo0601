import { useNavigate } from 'react-router-dom';
import { ChevronRight, Download, Image, CheckSquare, Square } from 'lucide-react';
import { useAlarmStore } from '../stores/useAlarmStore';
import { StatusBadge } from './StatusBadge';
import { LevelBadge } from './LevelBadge';
import { formatShortDate } from '../utils/formatters';
import { DATA_SOURCE_LABELS } from '../types';
import { cn } from '../lib/utils';

interface AlarmTableProps {
  className?: string;
  onExport?: () => void;
}

export function AlarmTable({ className, onExport }: AlarmTableProps) {
  const navigate = useNavigate();
  const {
    getFilteredAlarms,
    selectedAlarmIds,
    toggleSelected,
    selectAll,
    clearSelected,
  } = useAlarmStore();

  const alarms = getFilteredAlarms();
  const allSelected = alarms.length > 0 && selectedAlarmIds.length === alarms.length;
  const someSelected = selectedAlarmIds.length > 0 && selectedAlarmIds.length < alarms.length;

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelected();
    } else {
      selectAll(alarms.map((a) => a.id));
    }
  };

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-700">
            告警列表
            <span className="ml-2 text-xs text-slate-400">共 {alarms.length} 条</span>
          </h3>
          {selectedAlarmIds.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              已选择 {selectedAlarmIds.length} 条
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            导出数据
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : someSelected ? (
                    <div className="h-4 w-4 border-2 border-blue-600 rounded bg-blue-600/20" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                告警编号
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                站点/设备
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                级别
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                描述
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                金额
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                联系人
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                来源
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alarms.map((alarm, idx) => (
              <tr
                key={alarm.id}
                className={cn(
                  'transition-all duration-150 hover:bg-blue-50/50 cursor-pointer group',
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                  selectedAlarmIds.includes(alarm.id) && 'bg-blue-50'
                )}
                onClick={() => navigate(`/alarm/${alarm.id}`)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleSelected(alarm.id)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {selectedAlarmIds.includes(alarm.id) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 group-hover:text-slate-500" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                    {alarm.alarmCode}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{alarm.siteName}</div>
                    <div className="text-xs text-slate-500">{alarm.deviceName}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <LevelBadge level={alarm.level} />
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-sm text-slate-700 truncate">{alarm.description}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-mono font-medium text-slate-800">
                    ¥{alarm.amountDisplay}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-600">{alarm.phoneMasked}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={alarm.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {alarm.source === 'manual' && <Image className="h-3 w-3 text-amber-500" />}
                    <span className="text-xs text-slate-500">
                      {DATA_SOURCE_LABELS[alarm.source]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-slate-500">
                    {formatShortDate(alarm.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/alarm/${alarm.id}`);
                    }}
                  >
                    详情
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alarms.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <p>暂无符合条件的告警数据</p>
        </div>
      )}
    </div>
  );
}
