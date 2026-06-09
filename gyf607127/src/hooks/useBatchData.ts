import { useState, useMemo, useCallback } from 'react';
import type { DataScene, BatchData, StatsData, SupplyRecord, Certificate } from '@/types';
import { getMockData, getZhouConsultantCertificate } from '@/data/mockData';
import { getAbnormalCount } from '@/utils/compare';
import { exportBatchData, simulateExportReadback } from '@/utils/export';

export const useBatchData = () => {
  const [scene, setScene] = useState<DataScene>('abnormal');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batches, setBatches] = useState<BatchData[]>(() => getMockData('abnormal'));
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
  const [activePanel, setActivePanel] = useState<'detail' | 'supply'>('detail');

  const stats = useMemo<StatsData>(() => {
    const total = batches.length;
    const abnormal = getAbnormalCount(batches);
    const pending = batches.filter(b => b.status === 'pending' || b.status === 'error').length;
    const completed = batches.filter(b => b.status === 'completed').length;
    return { total, abnormal, pending, completed };
  }, [batches]);

  const selectedBatch = useMemo(() => {
    if (!selectedBatchId) return null;
    return batches.find(b => b.id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const changeScene = useCallback((newScene: DataScene) => {
    setScene(newScene);
    setBatches(getMockData(newScene));
    setSelectedBatchId(null);
  }, []);

  const selectBatch = useCallback((batchId: string | null) => {
    setSelectedBatchId(batchId);
    if (batchId) {
      setActivePanel('detail');
    }
  }, []);

  const manualSupplyCertificate = useCallback((batchId: string, note: string) => {
    const batchIndex = batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return;

    const originalBatch = batches[batchIndex];
    const beforeData = JSON.parse(JSON.stringify(originalBatch)) as BatchData;
    
    const newCert: Certificate = getZhouConsultantCertificate();
    
    const updatedBatch: BatchData = {
      ...originalBatch,
      cardCount: originalBatch.cardCount + 1,
      exportCount: originalBatch.exportCount + 1,
      amount: originalBatch.amount + newCert.power * 400,
      certificates: [...originalBatch.certificates, newCert],
      consultantNote: note || `周顾问于 ${newCert.supplyTime} 手工补录证书扫描件 1 张`,
    };

    const afterData = JSON.parse(JSON.stringify(updatedBatch)) as BatchData;
    const exportedData = simulateExportReadback(updatedBatch);

    const newBatches = [...batches];
    newBatches[batchIndex] = updatedBatch;
    setBatches(newBatches);

    const supplyRecord: SupplyRecord = {
      batchId,
      beforeData,
      afterData,
      exportedData,
      supplyTime: newCert.supplyTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      suppliedBy: '周顾问',
    };
    setSupplyRecords(prev => [...prev, supplyRecord]);
    
    return supplyRecord;
  }, [batches]);

  const triggerExport = useCallback((batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return null;
    return exportBatchData(batch);
  }, [batches]);

  return {
    scene,
    batches,
    stats,
    selectedBatch,
    selectedBatchId,
    supplyRecords,
    activePanel,
    changeScene,
    selectBatch,
    setActivePanel,
    manualSupplyCertificate,
    triggerExport,
  };
};
