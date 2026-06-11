import type { Batch, DoorWindowRecord, MissingPart, ReplenishHistory, Settings } from './types';

const seedData = {
  batches: [
    { id: 'batch-001', batchNo: 'PC-2025-001', supplier: '坚美铝业', deliveryDate: '2025-05-10', status: 'delivered' as const, createdAt: '2025-05-10T08:00:00Z' },
    { id: 'batch-002', batchNo: 'PC-2025-002', supplier: '华建门窗', deliveryDate: '2025-05-18', status: 'accepted' as const, createdAt: '2025-05-18T09:00:00Z' },
    { id: 'batch-003', batchNo: 'PC-2025-003', supplier: '鑫达五金', deliveryDate: '2025-05-25', status: 'delivered' as const, createdAt: '2025-05-25T07:30:00Z' }
  ] satisfies Batch[],

  records: [
    { id: 'record-001', batchId: 'batch-001', openingCode: '1-1-3-0501-W1', openingCodeNormalized: '1-1-3-0501-W1', buildingNo: '1', unitNo: '1', floorNo: '3', roomNo: '0501', spec: '1500x1800铝合金推拉窗', glassType: '5+12A+5中空钢化', hardwareList: '风撑,拉手', status: 'accepted' as const, isDuplicate: false, createdAt: '2025-05-10T08:30:00Z', updatedAt: '2025-05-12T10:30:00Z' },
    { id: 'record-002', batchId: 'batch-001', openingCode: '1-1-3-0502-D1', openingCodeNormalized: '1-1-3-0502-D1', buildingNo: '1', unitNo: '1', floorNo: '3', roomNo: '0502', spec: '900x2100铝合金平开门', glassType: '6+12A+6中空钢化', hardwareList: '合页,锁具,拉手', status: 'accepted' as const, isDuplicate: false, createdAt: '2025-05-10T09:00:00Z', updatedAt: '2025-05-12T11:00:00Z' },
    { id: 'record-003', batchId: 'batch-001', openingCode: '1-1-4-0601-W1', openingCodeNormalized: '1-1-4-0601-W1', buildingNo: '1', unitNo: '1', floorNo: '4', roomNo: '0601', spec: '1200x1500铝合金固定窗', glassType: '5+12A+5中空钢化', hardwareList: '风撑', status: 'pending' as const, isDuplicate: false, createdAt: '2025-05-10T09:30:00Z', updatedAt: '2025-05-10T09:30:00Z' },
    { id: 'record-004', batchId: 'batch-001', openingCode: '1-1-3-0501-w1', openingCodeNormalized: '1-1-3-0501-W1', buildingNo: '1', unitNo: '1', floorNo: '3', roomNo: '0501', spec: '1500x1800铝合金推拉窗', glassType: '5+12A+5中空钢化', hardwareList: '风撑,拉手', status: 'pending' as const, isDuplicate: true, createdAt: '2025-05-11T14:00:00Z', updatedAt: '2025-05-11T14:00:00Z' },
    { id: 'record-005', batchId: 'batch-001', openingCode: '1-2-5-0801-W2', openingCodeNormalized: '1-2-5-0801-W2', buildingNo: '1', unitNo: '2', floorNo: '5', roomNo: '0801', spec: '1500x1800铝合金推拉窗', glassType: '5+12A+5中空钢化', hardwareList: '风撑,拉手,滑轮', status: 'accepted' as const, isDuplicate: false, createdAt: '2025-05-10T10:00:00Z', updatedAt: '2025-05-13T09:00:00Z' },
    { id: 'record-006', batchId: 'batch-002', openingCode: '1-1-6-0901-W1', openingCodeNormalized: '1-1-6-0901-W1', buildingNo: '1', unitNo: '1', floorNo: '6', roomNo: '0901', spec: '1500x1800铝合金推拉窗', glassType: '5+12A+5中空钢化', hardwareList: '风撑,拉手,限位器', status: 'accepted' as const, isDuplicate: false, createdAt: '2025-05-18T10:00:00Z', updatedAt: '2025-05-20T14:00:00Z' },
    { id: 'record-007', batchId: 'batch-002', openingCode: '1-2-7-1001-D1', openingCodeNormalized: '1-2-7-1001-D1', buildingNo: '1', unitNo: '2', floorNo: '7', roomNo: '1001', spec: '900x2100铝合金平开门', glassType: '6+12A+6中空钢化', hardwareList: '合页,锁具', status: 'pending' as const, isDuplicate: false, createdAt: '2025-05-18T10:30:00Z', updatedAt: '2025-05-18T10:30:00Z' },
    { id: 'record-008', batchId: 'batch-002', openingCode: '1-2-7-1001-d1', openingCodeNormalized: '1-2-7-1001-D1', buildingNo: '1', unitNo: '2', floorNo: '7', roomNo: '1001', spec: '900x2100铝合金平开门', glassType: '6+12A+6中空钢化', hardwareList: '合页,锁具', status: 'pending' as const, isDuplicate: true, createdAt: '2025-05-19T08:00:00Z', updatedAt: '2025-05-19T08:00:00Z' },
    { id: 'record-009', batchId: 'batch-002', openingCode: '1-1-8-1102-W1', openingCodeNormalized: '1-1-8-1102-W1', buildingNo: '1', unitNo: '1', floorNo: '8', roomNo: '1102', spec: '1200x1500铝合金固定窗', glassType: '5mm钢化单玻', hardwareList: '', status: 'accepted' as const, isDuplicate: false, createdAt: '2025-05-18T11:00:00Z', updatedAt: '2025-05-20T15:30:00Z' },
    { id: 'record-010', batchId: 'batch-003', openingCode: '2-1-2-0301-W1', openingCodeNormalized: '2-1-2-0301-W1', buildingNo: '2', unitNo: '1', floorNo: '2', roomNo: '0301', spec: '1500x1800铝合金推拉窗', glassType: '5+12A+5中空钢化', hardwareList: '风撑,拉手,滑轮', status: 'pending' as const, isDuplicate: false, createdAt: '2025-05-25T08:00:00Z', updatedAt: '2025-05-25T08:00:00Z' },
    { id: 'record-011', batchId: 'batch-003', openingCode: '2-1-4-0601-D1', openingCodeNormalized: '2-1-4-0601-D1', buildingNo: '2', unitNo: '1', floorNo: '4', roomNo: '0601', spec: '900x2100铝合金平开门', glassType: '6+12A+6中空钢化', hardwareList: '合页,锁具,拉手', status: 'pending' as const, isDuplicate: false, createdAt: '2025-05-25T08:30:00Z', updatedAt: '2025-05-25T08:30:00Z' },
    { id: 'record-012', batchId: 'batch-003', openingCode: '2-2-5-0801-W2', openingCodeNormalized: '2-2-5-0801-W2', buildingNo: '2', unitNo: '2', floorNo: '5', roomNo: '0801', spec: '1200x1500铝合金固定窗', glassType: '5+12A+5中空钢化', hardwareList: '', status: 'pending' as const, isDuplicate: false, createdAt: '2025-05-25T09:00:00Z', updatedAt: '2025-05-25T09:00:00Z' }
  ] satisfies DoorWindowRecord[],

  missingParts: [
    { id: 'missing-001', recordId: 'record-003', partName: '风撑', quantity: 2, photoUrl: '', status: 'missing' as const, createdAt: '2025-05-11T16:00:00Z', updatedAt: '2025-05-11T16:00:00Z' },
    { id: 'missing-002', recordId: 'record-005', partName: '滑轮', quantity: 4, photoUrl: '', status: 'partial' as const, createdAt: '2025-05-13T09:30:00Z', updatedAt: '2025-05-20T11:00:00Z' },
    { id: 'missing-003', recordId: 'record-006', partName: '限位器', quantity: 2, photoUrl: '', status: 'partial' as const, createdAt: '2025-05-19T10:00:00Z', updatedAt: '2025-05-28T16:00:00Z' },
    { id: 'missing-004', recordId: 'record-007', partName: '锁具', quantity: 1, photoUrl: '', status: 'missing' as const, createdAt: '2025-05-21T08:30:00Z', updatedAt: '2025-05-21T08:30:00Z' },
    { id: 'missing-005', recordId: 'record-010', partName: '拉手', quantity: 1, photoUrl: '', status: 'missing' as const, createdAt: '2025-05-26T14:00:00Z', updatedAt: '2025-05-26T14:00:00Z' },
    { id: 'missing-006', recordId: 'record-002', partName: '合页', quantity: 3, photoUrl: '', status: 'resolved' as const, createdAt: '2025-05-10T17:00:00Z', updatedAt: '2025-05-14T09:00:00Z' }
  ] satisfies MissingPart[],

  replenishHistories: [
    { id: 'replenish-001', missingId: 'missing-002', replenishedQty: 2, responsible: '王建国', note: '华建门窗补发滑轮2个', createdAt: '2025-05-20T11:00:00Z' },
    { id: 'replenish-002', missingId: 'missing-006', replenishedQty: 3, responsible: '李明辉', note: '坚美铝业补发合页3个，已解决', createdAt: '2025-05-14T09:00:00Z' },
    { id: 'replenish-003', missingId: 'missing-003', replenishedQty: 1, responsible: '张志强', note: '鑫达五金先补1个限位器', createdAt: '2025-05-28T16:00:00Z' }
  ] satisfies ReplenishHistory[],

  settings: { currentResponsible: '王建国', lastUpdated: '2025-05-28T16:00:00Z' } satisfies Settings
};

export function loadSeedData(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('dw_batches')) return;
  localStorage.setItem('dw_batches', JSON.stringify(seedData.batches));
  localStorage.setItem('dw_records', JSON.stringify(seedData.records));
  localStorage.setItem('dw_missing', JSON.stringify(seedData.missingParts));
  localStorage.setItem('dw_replenish', JSON.stringify(seedData.replenishHistories));
  localStorage.setItem('dw_settings', JSON.stringify(seedData.settings));
}
