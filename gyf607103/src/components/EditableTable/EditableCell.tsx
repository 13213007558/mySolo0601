import React, { useState, useRef, useEffect } from 'react';
import { getStatusBgColor } from '@/utils/thresholdInterpreter';
import type { RoofShadowRecord } from '@/types';

interface EditableCellProps {
  record: RoofShadowRecord;
  field: keyof RoofShadowRecord;
  onUpdate: (id: string, updates: Partial<RoofShadowRecord>) => boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({ record, field, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string | number>(record[field] as string | number);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (field === 'originalShadowHours' || field === 'originalPowerEfficiency' || field === 'roofId' || field === 'createdAt' || field === 'id') {
      return;
    }
    setIsEditing(true);
    setValue(record[field] as string | number);
    setError(null);
  };

  const handleBlur = () => {
    if (!isEditing) return;

    if (field === 'shadowHours' || field === 'powerEfficiency') {
      const numValue = parseFloat(String(value));
      if (isNaN(numValue)) {
        setError('请输入有效数字');
        return;
      }
      if (field === 'shadowHours' && (numValue < 0 || numValue > 24)) {
        setError('阴影时长需在0-24之间');
        return;
      }
      if (field === 'powerEfficiency' && (numValue < 0 || numValue > 100)) {
        setError('发电效率需在0-100之间');
        return;
      }
      const success = onUpdate(record.id, { [field]: numValue });
      if (!success) {
        setError('更新失败');
        return;
      }
    } else {
      const success = onUpdate(record.id, { [field]: value });
      if (!success) {
        setError('更新失败');
        return;
      }
    }

    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue(record[field] as string | number);
      setError(null);
    }
  };

  const displayValue = record[field];
  const isOriginalField = field === 'originalShadowHours' || field === 'originalPowerEfficiency';

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type={field === 'shadowHours' || field === 'powerEfficiency' ? 'number' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 border-2 border-primary-400 bg-white rounded focus:outline-none focus:ring-2 focus:ring-primary-300"
          step={field === 'shadowHours' || field === 'powerEfficiency' ? '0.1' : undefined}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-danger-100 text-danger-700 text-xs rounded whitespace-nowrap z-10">
            {error}
          </div>
        )}
      </div>
    );
  }

  const statusBadge = field === 'status' && (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusBgColor(record.status)}`}>
      <span className={`w-2 h-2 rounded-full mr-1.5 ${record.status === 'normal' ? 'bg-success-500' : record.status === 'warning' ? 'bg-warning-500' : 'bg-danger-500'} ${record.status !== 'normal' ? 'animate-pulse-slow' : ''}`}></span>
      {record.status === 'normal' ? '正常' : record.status === 'warning' ? '警告' : '危险'}
    </span>
  );

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`min-h-[32px] flex items-center px-1 rounded transition-colors ${
        isOriginalField 
          ? 'text-gray-500 bg-gray-50 cursor-not-allowed italic' 
          : 'cursor-cell hover:bg-primary-50'
      } ${field === 'shadowHours' || field === 'powerEfficiency' ? 'font-mono' : ''}`}
      title={isOriginalField ? '原始值不可修改' : '双击编辑'}
    >
      {statusBadge || (
        <>
          {displayValue !== undefined && displayValue !== null ? String(displayValue) : '-'}
          {!isOriginalField && field !== 'status' && (
            <span className="ml-auto text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
          )}
        </>
      )}
    </div>
  );
};
