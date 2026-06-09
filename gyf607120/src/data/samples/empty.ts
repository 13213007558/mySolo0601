import type { SampleDataset } from '@/types';

export const emptySample: SampleDataset = {
  paymentFlows: [],
  gunInfos: [
    { gunNo: 'G-01', stationId: 'ST-001', status: 'available', power: 120, lastUsedTime: '-', todayUsageCount: 0 },
    { gunNo: 'G-02', stationId: 'ST-001', status: 'available', power: 120, lastUsedTime: '-', todayUsageCount: 0 },
    { gunNo: 'G-03', stationId: 'ST-001', status: 'available', power: 180, lastUsedTime: '-', todayUsageCount: 0 },
    { gunNo: 'G-04', stationId: 'ST-001', status: 'available', power: 120, lastUsedTime: '-', todayUsageCount: 0 },
    { gunNo: 'G-05', stationId: 'ST-002', status: 'available', power: 250, lastUsedTime: '-', todayUsageCount: 0 },
    { gunNo: 'G-06', stationId: 'ST-002', status: 'available', power: 250, lastUsedTime: '-', todayUsageCount: 0 }
  ],
  refundRecords: [],
  driverQueues: []
};
