import type { BatchData, Certificate } from '@/types';

export const exportBatchData = (batch: BatchData): BatchData => {
  const exportCount = batch.exportCount;
  const exportAmount = exportCount * 400;
  
  const certsToExport = batch.certificates.slice(0, exportCount);
  
  return {
    ...batch,
    exportCount,
    amount: exportAmount,
    certificates: certsToExport,
  };
};

export const simulateExportReadback = (batch: BatchData): BatchData => {
  const exported = exportBatchData(batch);
  return {
    ...exported,
    consultantNote: `[导出读回] ${exported.consultantNote || ''}`.trim(),
  };
};

export const generateExportFilename = (batchNo: string, type: string = 'data'): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${batchNo}_${type}_${timestamp}.json`;
};

export const downloadAsJson = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportBatchAsJson = (batch: BatchData): void => {
  const exportedData = exportBatchData(batch);
  const filename = generateExportFilename(batch.batchNo, 'export');
  downloadAsJson(exportedData, filename);
};

export const compareExportWithCard = (batch: BatchData): {
  match: boolean;
  countDiff: number;
  amountDiff: number;
  exportCount: number;
  cardCount: number;
  exportAmount: number;
  cardAmount: number;
} => {
  const exported = exportBatchData(batch);
  const cardAmount = batch.cardCount * 400;
  const exportAmount = exported.amount;
  
  return {
    match: exported.exportCount === batch.cardCount && exportAmount === cardAmount,
    countDiff: batch.cardCount - exported.exportCount,
    amountDiff: cardAmount - exportAmount,
    exportCount: exported.exportCount,
    cardCount: batch.cardCount,
    exportAmount,
    cardAmount,
  };
};

export const getManualCertificates = (certs: Certificate[]): Certificate[] => {
  return certs.filter(c => c.isManualSupply);
};
