import type { PumpRecord, StartStopLog, TimelineEvent, DataMode } from '../types';

const normalizePumpCode = (code: string): string => {
  return code.replace(/[-\s]/g, '').toUpperCase();
};

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const normalStartStopLogs: StartStopLog[] = [
  { timestamp: '2026-06-01 08:00:00', action: 'start', operator: '李工', reason: '日常启动' },
  { timestamp: '2026-06-01 22:00:00', action: 'stop', operator: '李工', reason: '夜间停机' },
  { timestamp: '2026-06-02 08:00:00', action: 'start', operator: '王工', reason: '日常启动' },
  { timestamp: '2026-06-02 22:00:00', action: 'stop', operator: '王工', reason: '夜间停机' },
  { timestamp: '2026-06-03 08:00:00', action: 'start', operator: '张工', reason: '日常启动' },
];

const abnormalStartStopLogs: StartStopLog[] = [
  { timestamp: '2026-06-01 08:00:00', action: 'start', operator: '李工', reason: '日常启动' },
  { timestamp: '2026-06-01 14:30:00', action: 'stop', operator: '系统', reason: '温度过高保护' },
  { timestamp: '2026-06-01 15:45:00', action: 'start', operator: '张工', reason: '故障排除后重启' },
  { timestamp: '2026-06-02 03:15:00', action: 'stop', operator: '系统', reason: '压力异常保护' },
  { timestamp: '2026-06-02 08:30:00', action: 'start', operator: '张工', reason: '检修完成重启' },
  { timestamp: '2026-06-03 08:00:00', action: 'start', operator: '张工', reason: '日常启动' },
];

const manualStartStopLogs: StartStopLog[] = [
  { timestamp: '2026-06-08 14:00:00', action: 'stop', operator: '张工', reason: '手工补录：计划性维护停机' },
  { timestamp: '2026-06-08 16:30:00', action: 'start', operator: '张工', reason: '手工补录：维护完成重启' },
];

export const normalRecords: PumpRecord[] = [
  {
    id: generateId(),
    pumpCode: 'CP-001',
    pumpName: '1号主冷却泵',
    location: 'A区能源站1层',
    status: 'normal',
    temperature: 24.5,
    pressure: 0.32,
    flowRate: 125.8,
    vibration: 2.1,
    runningHours: 8520,
    lastMaintenance: '2026-05-15',
    inspector: '李工',
    inspectionTime: '2026-06-03 10:30:00',
    remarks: '运行正常，各项参数稳定',
    source: 'system',
    startStopLogs: normalStartStopLogs,
  },
  {
    id: generateId(),
    pumpCode: 'CP-002',
    pumpName: '2号主冷却泵',
    location: 'A区能源站1层',
    status: 'normal',
    temperature: 25.1,
    pressure: 0.31,
    flowRate: 123.5,
    vibration: 2.3,
    runningHours: 8450,
    lastMaintenance: '2026-05-15',
    inspector: '李工',
    inspectionTime: '2026-06-03 10:35:00',
    remarks: '运行正常，轴承声音略大但在正常范围',
    source: 'system',
    startStopLogs: normalStartStopLogs,
  },
  {
    id: generateId(),
    pumpCode: 'CP-003',
    pumpName: '3号备用冷却泵',
    location: 'A区能源站2层',
    status: 'normal',
    temperature: 22.8,
    pressure: 0.33,
    flowRate: 128.2,
    vibration: 1.9,
    runningHours: 3200,
    lastMaintenance: '2026-05-20',
    inspector: '王工',
    inspectionTime: '2026-06-03 11:00:00',
    remarks: '备用泵状态良好，随时可启动',
    source: 'system',
    startStopLogs: normalStartStopLogs.slice(0, 2),
  },
  {
    id: generateId(),
    pumpCode: 'CP-004',
    pumpName: '4号精密冷却泵',
    location: 'B区数据中心',
    status: 'normal',
    temperature: 23.9,
    pressure: 0.35,
    flowRate: 95.6,
    vibration: 1.5,
    runningHours: 5680,
    lastMaintenance: '2026-06-01',
    inspector: '王工',
    inspectionTime: '2026-06-03 14:20:00',
    remarks: '数据中心专用泵，运行参数完美',
    source: 'system',
    startStopLogs: normalStartStopLogs,
  },
];

export const abnormalRecords: PumpRecord[] = [
  {
    id: generateId(),
    pumpCode: 'CP-001',
    pumpName: '1号主冷却泵',
    location: 'A区能源站1层',
    status: 'abnormal',
    temperature: 38.7,
    pressure: 0.18,
    flowRate: 85.3,
    vibration: 8.5,
    runningHours: 8520,
    lastMaintenance: '2026-05-15',
    inspector: '张工',
    inspectionTime: '2026-06-03 15:45:00',
    remarks: '温度过高，振动超标，已触发保护停机，建议立即检修',
    source: 'system',
    startStopLogs: abnormalStartStopLogs,
  },
  {
    id: generateId(),
    pumpCode: 'CP-002',
    pumpName: '2号主冷却泵',
    location: 'A区能源站1层',
    status: 'warning',
    temperature: 29.5,
    pressure: 0.25,
    flowRate: 105.0,
    vibration: 4.8,
    runningHours: 8450,
    lastMaintenance: '2026-05-15',
    inspector: '张工',
    inspectionTime: '2026-06-03 15:50:00',
    remarks: '温度偏高，振动接近警戒值，建议密切关注',
    source: 'system',
    startStopLogs: abnormalStartStopLogs.slice(0, 3),
  },
  {
    id: generateId(),
    pumpCode: 'CP-003',
    pumpName: '3号备用冷却泵',
    location: 'A区能源站2层',
    status: 'normal',
    temperature: 22.8,
    pressure: 0.33,
    flowRate: 128.2,
    vibration: 1.9,
    runningHours: 3210,
    lastMaintenance: '2026-05-20',
    inspector: '张工',
    inspectionTime: '2026-06-03 16:00:00',
    remarks: '已启动作为主泵替代，运行正常',
    source: 'system',
    startStopLogs: normalStartStopLogs,
  },
  {
    id: generateId(),
    pumpCode: 'CP-004',
    pumpName: '4号精密冷却泵',
    location: 'B区数据中心',
    status: 'normal',
    temperature: 23.9,
    pressure: 0.35,
    flowRate: 95.6,
    vibration: 1.5,
    runningHours: 5680,
    lastMaintenance: '2026-06-01',
    inspector: '王工',
    inspectionTime: '2026-06-03 14:20:00',
    remarks: '数据中心专用泵，运行参数完美',
    source: 'system',
    startStopLogs: normalStartStopLogs,
  },
];

export const emptyRecords: PumpRecord[] = [];

export const manualEntryRecord: PumpRecord = {
  id: generateId(),
  pumpCode: 'CP-005',
  pumpName: '5号应急冷却泵',
  location: 'C区备用电站',
  status: 'normal',
  temperature: 24.2,
  pressure: 0.32,
  flowRate: 110.5,
  vibration: 2.0,
  runningHours: 1250,
  lastMaintenance: '2026-05-25',
  inspector: '张工',
  inspectionTime: '2026-06-08 16:30:00',
  remarks: '张工手工补录：应急泵月度测试完成，运行正常',
  source: 'manual',
  manualEntry: true,
  startStopLogs: manualStartStopLogs,
};

export const generateTimeline = (records: PumpRecord[]): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  records.forEach((record) => {
    events.push({
      id: generateId(),
      time: record.inspectionTime,
      type: record.manualEntry ? 'manual_entry' : 'inspection',
      title: `${record.pumpName} - ${record.status === 'normal' ? '巡检正常' : record.status === 'abnormal' ? '异常告警' : '预警提醒'}`,
      description: record.remarks || `${record.inspector} 完成巡检`,
      pumpCode: record.pumpCode,
      operator: record.inspector || undefined,
    });

    if (record.startStopLogs) {
      record.startStopLogs.forEach((log) => {
        events.push({
          id: generateId(),
          time: log.timestamp,
          type: 'start_stop',
          title: `${record.pumpName} - ${log.action === 'start' ? '启动' : '停机'}`,
          description: log.reason || `${log.operator} 执行${log.action === 'start' ? '启动' : '停机'}操作`,
          pumpCode: record.pumpCode,
          operator: log.operator,
        });
      });
    }
  });

  return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const getSampleData = (mode: DataMode): PumpRecord[] => {
  switch (mode) {
    case 'normal':
      return [...normalRecords];
    case 'abnormal':
      return [...abnormalRecords];
    case 'empty':
      return [...emptyRecords];
    default:
      return [...normalRecords];
  }
};

export const getAllRecordsWithManual = (mode: DataMode): PumpRecord[] => {
  const baseRecords = getSampleData(mode);
  return [...baseRecords, { ...manualEntryRecord, id: generateId() }];
};

export { normalizePumpCode, generateId };
