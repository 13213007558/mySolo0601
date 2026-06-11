import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getMockRecordsForBatch } from '@/data/seedData';

export function useSeedBatchRecords() {
  const batches = useAppStore((s) => s.batches);
  const silkRecords = useAppStore((s) => s.silkRecords);
  const setBatchRecords = useAppStore((s) => s.setBatchRecords);

  useEffect(() => {
    if (silkRecords.length > 0) return;

    batches.forEach((batch) => {
      if (batch.inspectedCount === 0) return;
      const existing = silkRecords.filter((r) => r.batchId === batch.id);
      if (existing.length > 0) return;
      const records = getMockRecordsForBatch(
        batch.id,
        batch.totalQuantity,
        batch.inspectedCount
      );
      setBatchRecords(batch.id, records);
    });
  }, [batches, silkRecords, setBatchRecords]);
}
