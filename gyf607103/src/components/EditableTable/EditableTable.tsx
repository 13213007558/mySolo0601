import React, { useState, useMemo } from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { EditableCell } from './EditableCell';
import { TableToolbar } from './TableToolbar';
import { interpretRecord } from '@/utils/thresholdInterpreter';
import { hasRecordChanges } from '@/utils/diffCalculator';
import { Info, ArrowUpDown } from 'lucide-react';
import type { RoofShadowRecord } from '@/types';

type SortField = keyof Pick<RoofShadowRecord, 'recordDate' | 'buildingName' | 'shadowHours' | 'powerEfficiency' | 'status'>;
type SortDirection = 'asc' | 'desc';

export const EditableTable: React.FC = () => {
  const { getVisibleRecords, updateRecord, toggleSelection, selectedIds, thresholdConfig } = useShadowStore();
  const [sortField, setSortField] = useState<SortField>('recordDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredRecord, setHoveredRecord] = useState<string | null>(null);

  const visibleRecords = getVisibleRecords();

  const sortedRecords = useMemo(() => {
    return [...visibleRecords].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'buildingName') {
        comparison = a.buildingName.localeCompare(b.buildingName, 'zh-CN');
      } else if (sortField === 'status') {
        const statusOrder = { danger: 0, warning: 1, normal: 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      } else {
        comparison = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [visibleRecords, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortHeader: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-primary-50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={14} className={sortField === field ? 'text-primary-600' : 'text-gray-300'} />
      </div>
    </th>
  );

  const columns: { key: keyof RoofShadowRecord; label: string; width?: string; sortable?: boolean }[] = [
    { key: 'roofId', label: '屋顶ID', width: '100px' },
    { key: 'buildingName', label: '建筑名称', width: '140px', sortable: true },
    { key: 'recordDate', label: '记录日期', width: '120px', sortable: true },
    { key: 'shadowHours', label: '阴影时长(h)', width: '110px', sortable: true },
    { key: 'originalShadowHours', label: '原始阴影(h)', width: '110px' },
    { key: 'powerEfficiency', label: '发电效率(%)', width: '110px', sortable: true },
    { key: 'originalPowerEfficiency', label: '原始效率(%)', width: '110px' },
    { key: 'status', label: '状态', width: '100px', sortable: true },
    { key: 'markedBy', label: '标记人', width: '90px' },
    { key: 'notes', label: '备注', width: '150px' },
  ];

  if (sortedRecords.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <TableToolbar visibleCount={visibleRecords.length} />
      
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse group">
          <thead className="sticky top-0 bg-gray-50 border-b-2 border-gray-200 z-10">
            <tr>
              <th className="w-12 px-4 py-3">
                <span className="text-xs text-gray-400">选</span>
              </th>
              {columns.map(col => (
                col.sortable ? (
                  <SortHeader key={col.key} field={col.key as SortField} label={col.label} />
                ) : (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                )
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRecords.map((record, index) => {
              const isSelected = selectedIds.includes(record.id);
              const hasChanges = hasRecordChanges(record);
              const isHovered = hoveredRecord === record.id;

              return (
                <tr
                  key={record.id}
                  className={`transition-all duration-200 group/row ${
                    isSelected
                      ? 'bg-primary-50 border-l-4 border-l-primary-500'
                      : record.status === 'danger'
                        ? 'bg-danger-50/50 hover:bg-danger-50'
                        : record.status === 'warning'
                          ? 'bg-warning-50/30 hover:bg-warning-50'
                          : 'hover:bg-gray-50'
                  }`}
                  style={{
                    animationDelay: `${index * 10}ms`,
                    opacity: 0,
                    animation: 'fadeInUp 0.4s ease-out forwards',
                  }}
                  onMouseEnter={() => setHoveredRecord(record.id)}
                  onMouseLeave={() => setHoveredRecord(null)}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(record.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-2 text-sm relative ${
                        hasChanges && col.key === 'shadowHours' ? 'ring-2 ring-inset ring-warning-300 rounded' : ''
                      }`}
                      style={{ width: col.width }}
                    >
                      <EditableCell
                        record={record}
                        field={col.key}
                        onUpdate={updateRecord}
                      />
                      {isHovered && col.key === 'shadowHours' && (
                        <div className="absolute left-0 top-full mt-1 z-30 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-xs">
                          <div className="flex items-start gap-2">
                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{interpretRecord(record, thresholdConfig)}</span>
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
