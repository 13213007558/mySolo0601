import { useState, useCallback, useMemo, useEffect } from 'react';
import type { PumpRecord, ImportResult, TimelineEvent, DataMode, StartStopLog } from '../types';
import { getSampleData, getAllRecordsWithManual, generateTimeline } from '../data/sampleData';
import {
  processImportData,
  parseExcelFile,
  exportToExcel,
  createManualRecord,
  validatePumpCode,
} from '../utils/dataUtils';

interface UseInspectionDataReturn {
  records: PumpRecord[];
  timeline: TimelineEvent[];
  dataMode: DataMode;
  isLoading: boolean;
  importResult: ImportResult | null;
  selectedRecord: PumpRecord | null;
  showManualModal: boolean;
  showStartStopChart: boolean;
  stats: {
    total: number;
    normal: number;
    warning: number;
    abnormal: number;
    empty: number;
    manual: number;
  };
  setDataMode: (mode: DataMode) => void;
  loadSampleData: (mode: DataMode, includeManual?: boolean) => void;
  importData: (file: File) => Promise<void>;
  addManualRecord: (data: Partial<PumpRecord>) => boolean;
  updateRecord: (id: string, updates: Partial<PumpRecord>) => boolean;
  deleteRecord: (id: string) => void;
  selectRecord: (record: PumpRecord | null) => void;
  setShowManualModal: (show: boolean) => void;
  setShowStartStopChart: (show: boolean) => void;
  exportData: (filename?: string) => void;
  clearImportResult: () => void;
  addStartStopLog: (recordId: string, log: Omit<StartStopLog, 'timestamp'>) => boolean;
  resetAll: () => void;
}

export const useInspectionData = (): UseInspectionDataReturn => {
  const [records, setRecords] = useState<PumpRecord[]>([]);
  const [dataMode, setDataModeState] = useState<DataMode>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PumpRecord | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showStartStopChart, setShowStartStopChart] = useState(false);

  useEffect(() => {
    setRecords(getSampleData('normal'));
  }, []);

  const timeline = useMemo(() => generateTimeline(records), [records]);

  const stats = useMemo(() => {
    return {
      total: records.length,
      normal: records.filter((r) => r.status === 'normal').length,
      warning: records.filter((r) => r.status === 'warning').length,
      abnormal: records.filter((r) => r.status === 'abnormal').length,
      empty: records.filter((r) => r.status === 'empty').length,
      manual: records.filter((r) => r.manualEntry).length,
    };
  }, [records]);

  const setDataMode = useCallback((mode: DataMode) => {
    setDataModeState(mode);
    setRecords(getSampleData(mode));
    setImportResult(null);
    setSelectedRecord(null);
  }, []);

  const loadSampleData = useCallback((mode: DataMode, includeManual = false) => {
    setIsLoading(true);
    setTimeout(() => {
      if (includeManual) {
        setRecords(getAllRecordsWithManual(mode));
      } else {
        setRecords(getSampleData(mode));
      }
      setDataModeState(mode);
      setImportResult(null);
      setIsLoading(false);
    }, 300);
  }, []);

  const importData = useCallback(async (file: File) => {
    setIsLoading(true);
    setImportResult(null);
    try {
      const data = await parseExcelFile(file);
      const result = processImportData(data, records);
      setImportResult(result);

      if (result.success > 0) {
        const newRecords: PumpRecord[] = [];
        let successCount = 0;
        const existingCodes = new Set(records.map((r) => r.pumpCode.replace(/[-\s]/g, '').toUpperCase()));

        data.forEach((row) => {
          const pumpCode = String(row.pumpCode || `CP-${String(records.length + successCount + 1).padStart(3, '0')}`);
          const normalizedCode = pumpCode.replace(/[-\s]/g, '').toUpperCase();

          if (existingCodes.has(normalizedCode)) {
            return;
          }

          existingCodes.add(normalizedCode);
          successCount++;

          const record: PumpRecord = {
            id: Math.random().toString(36).substring(2, 15),
            pumpCode,
            pumpName: String(row.pumpName || '未命名冷却泵'),
            location: String(row.location || '未知位置'),
            temperature: row.temperature !== undefined && row.temperature !== null && row.temperature !== ''
              ? Number(row.temperature)
              : null,
            pressure: row.pressure !== undefined && row.pressure !== null && row.pressure !== ''
              ? Number(row.pressure)
              : null,
            flowRate: row.flowRate !== undefined && row.flowRate !== null && row.flowRate !== ''
              ? Number(row.flowRate)
              : null,
            vibration: row.vibration !== undefined && row.vibration !== null && row.vibration !== ''
              ? Number(row.vibration)
              : null,
            runningHours: row.runningHours !== undefined && row.runningHours !== null && row.runningHours !== ''
              ? Number(row.runningHours)
              : null,
            lastMaintenance: row.lastMaintenance ? String(row.lastMaintenance) : null,
            inspector: row.inspector ? String(row.inspector) : null,
            inspectionTime: row.inspectionTime ? String(row.inspectionTime) : new Date().toISOString(),
            remarks: row.remarks ? String(row.remarks) : null,
            source: 'import',
            status: 'normal',
            startStopLogs: [],
          };

          const temp = record.temperature;
          const press = record.pressure;
          const vib = record.vibration;
          const flow = record.flowRate;

          if (
            (temp !== null && temp >= 35) ||
            (press !== null && press <= 0.22) ||
            (vib !== null && vib >= 7.0) ||
            (flow !== null && flow <= 80)
          ) {
            record.status = 'abnormal';
          } else if (
            (temp !== null && temp >= 28) ||
            (press !== null && press <= 0.28) ||
            (vib !== null && vib >= 4.0) ||
            (flow !== null && flow <= 100)
          ) {
            record.status = 'warning';
          } else if (
            temp === null ||
            press === null ||
            vib === null ||
            flow === null
          ) {
            record.status = 'empty';
          }

          newRecords.push(record);
        });

        setRecords((prev) => [...prev, ...newRecords]);
      }
    } catch (error) {
      setImportResult({
        success: 0,
        skipped: 0,
        errors: [{
          row: 0,
          field: 'file',
          message: error instanceof Error ? error.message : '导入失败',
          originalValue: null,
        }],
        totalProcessed: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [records]);

  const addManualRecord = useCallback((data: Partial<PumpRecord>): boolean => {
    const code = data.pumpCode || 'CP-005';
    if (!validatePumpCode(code, records)) {
      return false;
    }

    const newRecord = createManualRecord(data);
    setRecords((prev) => [...prev, newRecord]);
    setSelectedRecord(newRecord);
    return true;
  }, [records]);

  const updateRecord = useCallback((id: string, updates: Partial<PumpRecord>): boolean => {
    if (updates.pumpCode) {
      const existing = records.find((r) => r.id === id);
      if (existing && existing.pumpCode !== updates.pumpCode) {
        if (!validatePumpCode(updates.pumpCode, records, id)) {
          return false;
        }
      }
    }

    setRecords((prev) =>
      prev.map((record) => {
        if (record.id === id) {
          const updated = { ...record, ...updates };
          const temp = updated.temperature;
          const press = updated.pressure;
          const vib = updated.vibration;
          const flow = updated.flowRate;

          if (
            (temp !== null && temp >= 35) ||
            (press !== null && press <= 0.22) ||
            (vib !== null && vib >= 7.0) ||
            (flow !== null && flow <= 80)
          ) {
            updated.status = 'abnormal';
          } else if (
            (temp !== null && temp >= 28) ||
            (press !== null && press <= 0.28) ||
            (vib !== null && vib >= 4.0) ||
            (flow !== null && flow <= 100)
          ) {
            updated.status = 'warning';
          } else if (
            temp === null ||
            press === null ||
            vib === null ||
            flow === null
          ) {
            updated.status = 'empty';
          } else {
            updated.status = 'normal';
          }

          if (selectedRecord?.id === id) {
            setSelectedRecord(updated);
          }
          return updated;
        }
        return record;
      })
    );
    return true;
  }, [records, selectedRecord]);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }
  }, [selectedRecord]);

  const selectRecord = useCallback((record: PumpRecord | null) => {
    setSelectedRecord(record);
  }, []);

  const exportData = useCallback((filename?: string) => {
    const exportFilename = filename || `冷却液泵巡检记录_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(records, exportFilename);
  }, [records]);

  const clearImportResult = useCallback(() => {
    setImportResult(null);
  }, []);

  const addStartStopLog = useCallback((recordId: string, log: Omit<StartStopLog, 'timestamp'>): boolean => {
    setRecords((prev) =>
      prev.map((record) => {
        if (record.id === recordId) {
          const newLog: StartStopLog = {
            ...log,
            timestamp: new Date().toISOString(),
          };
          const updated = {
            ...record,
            startStopLogs: [...(record.startStopLogs || []), newLog],
          };
          if (selectedRecord?.id === recordId) {
            setSelectedRecord(updated);
          }
          return updated;
        }
        return record;
      })
    );
    return true;
  }, [selectedRecord]);

  const resetAll = useCallback(() => {
    setRecords(getSampleData(dataMode));
    setImportResult(null);
    setSelectedRecord(null);
    setShowManualModal(false);
    setShowStartStopChart(false);
  }, [dataMode]);

  return {
    records,
    timeline,
    dataMode,
    isLoading,
    importResult,
    selectedRecord,
    showManualModal,
    showStartStopChart,
    stats,
    setDataMode,
    loadSampleData,
    importData,
    addManualRecord,
    updateRecord,
    deleteRecord,
    selectRecord,
    setShowManualModal,
    setShowStartStopChart,
    exportData,
    clearImportResult,
    addStartStopLog,
    resetAll,
  };
};
