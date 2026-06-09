import { useState, useCallback, useEffect } from 'react';
import type { OilTempRecord, RecordStatus } from '@/types';
import { useOilTempStore } from '@/store/useOilTempStore';

interface UseEditableTableOptions {
  onEditStart?: (recordId: string, field: string) => void;
  onEditComplete?: (recordId: string, field: string, value: unknown) => void;
  onEditCancel?: () => void;
}

export function useEditableTable(options: UseEditableTableOptions = {}) {
  const {
    editingCell,
    setEditingCell,
    updateRecord,
    toggleSelection,
    selectedIds,
  } = useOilTempStore();

  const [editValue, setEditValue] = useState<string>('');

  const startEditing = useCallback((record: OilTempRecord, field: keyof OilTempRecord) => {
    setEditingCell({ recordId: record.id, field });
    const value = record[field];
    setEditValue(value !== undefined && value !== null ? String(value) : '');
    options.onEditStart?.(record.id, field);
  }, [setEditingCell, options]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;

    const { recordId, field } = editingCell;
    let parsedValue: unknown = editValue;

    if (field === 'temperature') {
      parsedValue = parseFloat(editValue) || 0;
    } else if (field === 'status') {
      parsedValue = editValue as RecordStatus;
    }

    updateRecord(recordId, { [field]: parsedValue } as Partial<OilTempRecord>);
    options.onEditComplete?.(recordId, field, parsedValue);
    setEditingCell(null);
  }, [editingCell, editValue, updateRecord, setEditingCell, options]);

  const cancelEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
    options.onEditCancel?.();
  }, [setEditingCell, options]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editingCell) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  }, [editingCell, commitEdit, cancelEditing]);

  const handleRowClick = useCallback((e: React.MouseEvent, recordId: string) => {
    if (editingCell) return;
    toggleSelection(recordId, e.ctrlKey || e.metaKey || e.shiftKey);
  }, [editingCell, toggleSelection]);

  useEffect(() => {
    if (!editingCell) {
      setEditValue('');
    }
  }, [editingCell]);

  return {
    editingCell,
    editValue,
    setEditValue,
    startEditing,
    commitEdit,
    cancelEditing,
    handleKeyDown,
    handleRowClick,
    toggleSelection,
    selectedIds,
    isEditing: (recordId: string, field: string) =>
      editingCell?.recordId === recordId && editingCell?.field === field,
  };
}
