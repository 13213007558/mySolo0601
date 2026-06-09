import type { GunRecord, SampleType } from '../types';

export const normalSamples: GunRecord[] = [
  {
    id: 'sample-normal-1',
    gunCode: 'CG-001',
    timestamp: '2026-06-09T08:30:00',
    operator: '张工',
    action: 'insert',
    remark: '早班充电开始',
    status: 'normal',
    isManualEntry: false,
    createdAt: '2026-06-09T08:30:00',
    updatedAt: '2026-06-09T08:30:00',
    source: 'sample'
  },
  {
    id: 'sample-normal-2',
    gunCode: 'CG-001',
    timestamp: '2026-06-09T12:30:00',
    operator: '张工',
    action: 'remove',
    remark: '充电完成，电量100%',
    status: 'normal',
    isManualEntry: false,
    createdAt: '2026-06-09T12:30:00',
    updatedAt: '2026-06-09T12:30:00',
    source: 'sample'
  },
  {
    id: 'sample-normal-3',
    gunCode: 'CG-002',
    timestamp: '2026-06-09T09:15:00',
    operator: '李工',
    action: 'insert',
    remark: '备用车辆充电',
    status: 'normal',
    isManualEntry: false,
    createdAt: '2026-06-09T09:15:00',
    updatedAt: '2026-06-09T09:15:00',
    source: 'sample'
  },
  {
    id: 'sample-normal-4',
    gunCode: 'CG-002',
    timestamp: '2026-06-09T11:45:00',
    operator: '李工',
    action: 'remove',
    remark: '临时调度，充电中断',
    status: 'normal',
    isManualEntry: false,
    createdAt: '2026-06-09T11:45:00',
    updatedAt: '2026-06-09T11:45:00',
    source: 'sample'
  },
  {
    id: 'sample-normal-5',
    gunCode: 'CG-005',
    timestamp: '2026-06-09T13:00:00',
    operator: '王工',
    action: 'insert',
    remark: '午班充电',
    status: 'normal',
    isManualEntry: false,
    createdAt: '2026-06-09T13:00:00',
    updatedAt: '2026-06-09T13:00:00',
    source: 'sample'
  }
];

export const abnormalSamples: GunRecord[] = [
  {
    id: 'sample-abnormal-1',
    gunCode: 'CG-003',
    timestamp: '2026-06-08T23:45:00',
    operator: '王工',
    action: 'insert',
    remark: '夜间充电，跨零点',
    status: 'crossday',
    isManualEntry: false,
    createdAt: '2026-06-08T23:45:00',
    updatedAt: '2026-06-08T23:45:00',
    source: 'sample'
  },
  {
    id: 'sample-abnormal-2',
    gunCode: 'CG-003',
    timestamp: '2026-06-09T00:15:00',
    operator: '王工',
    action: 'remove',
    remark: '充电完成，跨日记录',
    status: 'crossday',
    isManualEntry: false,
    createdAt: '2026-06-09T00:15:00',
    updatedAt: '2026-06-09T00:15:00',
    source: 'sample'
  },
  {
    id: 'sample-abnormal-3',
    gunCode: 'CG-001',
    timestamp: '2026-06-09T08:30:00',
    operator: '张工',
    action: 'insert',
    remark: '重复导入的记录',
    status: 'duplicate',
    originalRecordId: 'sample-normal-1',
    originalValue: normalSamples[0],
    isManualEntry: false,
    createdAt: '2026-06-09T08:30:00',
    updatedAt: '2026-06-09T10:00:00',
    source: 'sample'
  },
  {
    id: 'sample-abnormal-4',
    gunCode: 'CG-006',
    timestamp: '2026-06-08T22:30:00',
    operator: '赵工',
    action: 'insert',
    remark: '夜班充电开始',
    status: 'crossday',
    isManualEntry: false,
    createdAt: '2026-06-08T22:30:00',
    updatedAt: '2026-06-08T22:30:00',
    source: 'sample'
  },
  {
    id: 'sample-abnormal-5',
    gunCode: 'CG-006',
    timestamp: '2026-06-09T01:30:00',
    operator: '赵工',
    action: 'remove',
    remark: '夜班充电结束',
    status: 'crossday',
    isManualEntry: false,
    createdAt: '2026-06-09T01:30:00',
    updatedAt: '2026-06-09T01:30:00',
    source: 'sample'
  }
];

export const linjieSample: GunRecord = {
  id: 'sample-linjie-1',
  gunCode: 'CG-004',
  timestamp: '2026-06-09T14:20:00',
  operator: '林姐',
  action: 'insert',
  remark: '现场巡视发现未登记，手工补录',
  status: 'manual',
  isManualEntry: true,
  manualEntryBy: '林姐',
  createdAt: '2026-06-09T15:00:00',
  updatedAt: '2026-06-09T15:00:00',
  source: 'manual'
};

export const emptySamples: GunRecord[] = [];

export const sampleDescriptions: Record<SampleType, { name: string; description: string }> = {
  normal: {
    name: '正常数据样例',
    description: '5条完整的正常插拔记录，无异常，用于体验正常操作流程'
  },
  abnormal: {
    name: '异常数据样例',
    description: '包含跨日排序问题和重复导入记录，用于测试异常检测和提示功能'
  },
  empty: {
    name: '清空数据',
    description: '清除所有记录，恢复空状态'
  },
  linjie: {
    name: '林姐补录样例',
    description: '添加一条林姐手工补录的记录，用于测试补录功能和差异对比'
  }
};

export function getSampleData(type: SampleType): GunRecord[] {
  switch (type) {
    case 'normal':
      return [...normalSamples];
    case 'abnormal':
      return [...normalSamples, ...abnormalSamples];
    case 'empty':
      return [];
    case 'linjie':
      return [{ ...linjieSample }];
    default:
      return [];
  }
}
