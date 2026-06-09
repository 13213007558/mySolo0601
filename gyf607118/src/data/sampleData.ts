import type { BatteryRecord, SupplementRecord } from '../types';
import { generateId, formatDate, detectBatteryNoFormat, checkAnomaly } from '../utils/validation';

const today = new Date();
const d = (offset: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - offset);
  return formatDate(date);
};

export const sampleBatteryRecords: Omit<BatteryRecord, 'id' | 'originalBatteryNo' | 'originalStatus' | 'createdAt' | 'updatedAt'>[] = [
  {
    batteryNo: 'B-202406-0001',
    status: 'normal',
    exchangeDate: d(0),
    location: 'A区换电站',
    operator: '张师傅',
    voltage: 3.8,
    temperature: 25,
    remark: '正常换电',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: '李班长',
    reviewedAt: new Date().toISOString(),
  },
  {
    batteryNo: 'B-202406-0002',
    status: 'pending',
    exchangeDate: d(0),
    location: 'B区换电站',
    operator: '王师傅',
    voltage: 3.6,
    temperature: 28,
    remark: '待复核',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    batteryNo: 'BAT-2024-003',
    status: 'pending',
    exchangeDate: d(1),
    location: 'A区换电站',
    operator: '张师傅',
    voltage: 3.9,
    temperature: 30,
    remark: '旧格式编号',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    batteryNo: 'B-202406-0004',
    status: 'pending',
    exchangeDate: d(1),
    location: 'C区换电站',
    operator: '刘师傅',
    voltage: 2.8,
    temperature: 18,
    remark: '电压异常偏低',
    formatIssue: null,
    isAnomaly: true,
    anomalyReason: null,
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    batteryNo: 'B-202406-0005',
    status: 'normal',
    exchangeDate: d(2),
    location: 'B区换电站',
    operator: '王师傅',
    voltage: 4.0,
    temperature: 32,
    remark: '正常',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: '李班长',
    reviewedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    batteryNo: 'BAT-2024-006',
    status: 'pending',
    exchangeDate: d(2),
    location: 'A区换电站',
    operator: '张师傅',
    voltage: 4.5,
    temperature: 60,
    remark: '温度过高',
    formatIssue: null,
    isAnomaly: true,
    anomalyReason: null,
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    batteryNo: 'B-202406-0007',
    status: 'anomaly',
    exchangeDate: d(3),
    location: 'C区换电站',
    operator: '赵师傅',
    voltage: 3.5,
    temperature: 22,
    remark: '已标记异常',
    formatIssue: null,
    isAnomaly: true,
    anomalyReason: '外观损坏',
    reviewedBy: '李班长',
    reviewedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    batteryNo: 'B-202405-0008',
    status: 'normal',
    exchangeDate: d(4),
    location: 'B区换电站',
    operator: '王师傅',
    voltage: 3.7,
    temperature: 27,
    remark: '正常',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: '李班长',
    reviewedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    batteryNo: 'BAD-NO-001',
    status: 'pending',
    exchangeDate: d(4),
    location: 'A区换电站',
    operator: '陈师傅',
    voltage: 3.8,
    temperature: 29,
    remark: '编号格式错误',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: null,
    reviewedAt: null,
  },
  {
    batteryNo: 'B-202406-0010',
    status: 'pending',
    exchangeDate: d(5),
    location: 'C区换电站',
    operator: '刘师傅',
    voltage: 3.9,
    temperature: 31,
    remark: '待复核',
    formatIssue: null,
    isAnomaly: false,
    anomalyReason: null,
    reviewedBy: null,
    reviewedAt: null,
  },
];

export const sampleSupplementRecords: Omit<SupplementRecord, 'id' | 'createdAt' | 'beforeData' | 'afterData'>[] = [
  {
    batteryNo: 'B-202406-0001',
    boxNo: 'BOX-A-001',
    transferDate: d(0),
    fromLocation: 'A区换电站',
    toLocation: '中心仓库',
    operator: '小廖',
    remark: '正常流转',
    isManual: false,
  },
  {
    batteryNo: 'B-202406-0002',
    boxNo: 'BOX-B-002',
    transferDate: d(1),
    fromLocation: 'B区换电站',
    toLocation: '维修站',
    operator: '小廖',
    remark: '手工补录：系统漏记',
    isManual: true,
  },
  {
    batteryNo: 'BAT-2024-003',
    boxNo: 'BOX-A-003',
    transferDate: d(1),
    fromLocation: 'A区换电站',
    toLocation: '中心仓库',
    operator: '小廖',
    remark: '正常流转',
    isManual: false,
  },
];

export const createSampleBatteryRecords = (): BatteryRecord[] => {
  const records: BatteryRecord[] = [];
  return sampleBatteryRecords.map(record => {
    const id = generateId();
    const now = new Date().toISOString();
    const formatIssue = detectBatteryNoFormat(record.batteryNo);
    const anomalyCheck = checkAnomaly(record, records);
    const processedRecord = {
      ...record,
      id,
      originalBatteryNo: record.batteryNo,
      originalStatus: record.status,
      formatIssue: formatIssue.hasIssue ? formatIssue.message : null,
      isAnomaly: anomalyCheck.isAnomaly,
      anomalyReason: anomalyCheck.reasons.length > 0 ? anomalyCheck.reasons.join('; ') : null,
      createdAt: now,
      updatedAt: now,
    };
    records.push(processedRecord);
    return processedRecord;
  });
};

export const createSampleSupplementRecords = (): SupplementRecord[] => {
  return sampleSupplementRecords.map(record => {
    const id = generateId();
    const now = new Date().toISOString();
    return {
      ...record,
      id,
      createdAt: now,
      beforeData: null,
      afterData: null,
    };
  });
};
