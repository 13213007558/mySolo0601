import { useEffect, useRef } from 'react';
import type { OilTempRecord, RecordStatus } from '@/types';
import { getStatusColor, getStatusText } from '@/utils/mockData';

interface EditableCellProps {
  record: OilTempRecord;
  field: keyof OilTempRecord;
  value: unknown;
  isEditing: boolean;
  editValue: string;
  onEditStart: (record: OilTempRecord, field: keyof OilTempRecord) => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const STATUS_OPTIONS: { value: RecordStatus; label: string }[] = [
  { value: 'normal', label: '正常' },
  { value: 'abnormal', label: '异常' },
  { value: 'pending', label: '待复核' },
  { value: 'unmarked', label: '未标记' },
];

export function EditableCell({
  record,
  field,
  value,
  isEditing,
  editValue,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditCancel,
  onKeyDown,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (!isEditing) {
      onEditStart(record, field);
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      onEditCommit();
    }
  };

  const renderDisplayValue = () => {
    if (field === 'status') {
      const status = value as RecordStatus;
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(status)}`}>
          {getStatusText(status)}
        </span>
      );
    }
    if (field === 'temperature') {
      return <span className="font-mono">{value as number}°C</span>;
    }
    if (field === 'remark' && !value) {
      return <span className="text-slate-500 italic">双击添加备注</span>;
    }
    return <span>{String(value ?? '')}</span>;
  };

  const renderEditor = () => {
    if (field === 'status') {
      return (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          className="w-full bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    if (field === 'temperature') {
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          step="0.1"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          className="w-full bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }
    if (field === 'remark') {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={onKeyDown}
          rows={2}
          className="w-full bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => onEditChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        className="w-full bg-slate-800 border border-blue-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  return (
    <div
      className={`min-h-[32px] flex items-center cursor-pointer transition-colors ${
        isEditing ? 'bg-slate-800/50' : 'hover:bg-slate-700/30'
      } px-2 py-1 rounded`}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? renderEditor() : renderDisplayValue()}
    </div>
  );
}
