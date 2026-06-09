import dayjs from 'dayjs';
import type { User, HostInfo, AlarmRecord, SupplementRecord } from '@/types';
import { generateDataFingerprint } from './fingerprint';

export const mockUsers: User[] = [
  {
    id: '1',
    employeeId: 'OP001',
    name: '张值班',
    role: 'operator',
    permissions: ['alarm:view', 'alarm:process', 'host:view']
  },
  {
    id: '2',
    employeeId: 'EN001',
    name: '李运维',
    role: 'engineer',
    permissions: ['alarm:view', 'alarm:process', 'host:view', 'data:import', 'data:export']
  },
  {
    id: '3',
    employeeId: 'AD001',
    name: '王管理',
    role: 'admin',
    permissions: ['*']
  },
  {
    id: '4',
    employeeId: 'YE001',
    name: '叶师傅',
    role: 'master_ye',
    permissions: ['alarm:view', 'host:view', 'supplement:create', 'supplement:diff']
  }
];

export const mockHosts: HostInfo[] = [
  {
    id: 'HOST001',
    name: '1号主机',
    model: 'AC-MAX-2000',
    location: { area: 'A区', detail: '1号楼3层301机房', coordinates: { lat: 39.9042, lng: 116.4074 } },
    status: 'running',
    params: { ratedPower: 200, currentPower: 185, supplyTemp: 7, returnTemp: 12, pressure: 0.45 },
    lastMaintenance: '2026-05-15'
  },
  {
    id: 'HOST002',
    name: '2号主机',
    model: 'AC-MAX-2000',
    location: { area: 'A区', detail: '2号楼1层102机房', coordinates: { lat: 39.9123, lng: 116.4156 } },
    status: 'running',
    params: { ratedPower: 200, currentPower: 192, supplyTemp: 6.5, returnTemp: 11.8, pressure: 0.48 },
    lastMaintenance: '2026-05-20'
  },
  {
    id: 'HOST003',
    name: '3号主机',
    model: 'AC-PRO-1500',
    location: { area: 'B区', detail: '3号楼2层205机房', coordinates: { lat: 39.8956, lng: 116.4234 } },
    status: 'error',
    params: { ratedPower: 150, currentPower: 0, supplyTemp: 15, returnTemp: 16, pressure: 0.2 },
    lastMaintenance: '2026-04-10'
  },
  {
    id: 'HOST004',
    name: '4号主机',
    model: 'AC-MAX-2500',
    location: { area: 'B区', detail: '4号楼地下1层机房', coordinates: { lat: 39.8987, lng: 116.4312 } },
    status: 'stopped',
    params: { ratedPower: 250, currentPower: 0, supplyTemp: 18, returnTemp: 18, pressure: 0 },
    lastMaintenance: '2026-06-01'
  },
  {
    id: 'HOST005',
    name: '5号主机',
    model: 'AC-PRO-1500',
    location: { area: 'C区', detail: '5号楼4层401机房', coordinates: { lat: 39.9210, lng: 116.3987 } },
    status: 'running',
    params: { ratedPower: 150, currentPower: 142, supplyTemp: 7.2, returnTemp: 12.5, pressure: 0.46 },
    lastMaintenance: '2026-05-28'
  }
];

function createMockAlarm(
  id: string,
  hostId: string,
  hostName: string,
  alarmType: string,
  alarmLevel: 'critical' | 'warning' | 'info',
  status: 'pending' | 'processing' | 'completed' | 'abnormal',
  daysAgo: number,
  hoursAgo: number,
  params?: { temperature?: number; pressure?: number; voltage?: number },
  processor?: { id: string; name: string }
): AlarmRecord {
  const alarmTime = dayjs().subtract(daysAgo, 'day').subtract(hoursAgo, 'hour').toISOString();
  const history = [];
  
  if (processor) {
    history.push({
      id: `HIST_${id}_1`,
      status: status,
      operator: processor.id,
      operatorName: processor.name,
      time: dayjs().subtract(daysAgo, 'day').subtract(hoursAgo - 1, 'hour').toISOString(),
      remark: '已处理告警'
    });
  }

  return {
    id,
    hostId,
    hostName,
    alarmType,
    alarmLevel,
    alarmTime,
    status,
    processor: processor?.id,
    processorName: processor?.name,
    processTime: processor ? dayjs().subtract(daysAgo, 'day').subtract(hoursAgo - 1, 'hour').toISOString() : undefined,
    remark: status === 'completed' ? '已修复，恢复正常运行' : status === 'abnormal' ? '需要进一步排查' : undefined,
    location: mockHosts.find(h => h.id === hostId)?.location || { area: '未知区域' },
    params: params || { temperature: 25, pressure: 0.45, voltage: 220 },
    attachments: alarmLevel !== 'info' ? ['photo1.jpg', 'report.pdf'] : undefined,
    dataFingerprint: generateDataFingerprint(hostId, alarmTime),
    createdAt: alarmTime,
    history
  };
}

export const mockAlarms: AlarmRecord[] = [
  createMockAlarm('ALM001', 'HOST001', '1号主机', '温度过高', 'critical', 'pending', 0, 2, { temperature: 45, pressure: 0.5, voltage: 235 }),
  createMockAlarm('ALM002', 'HOST002', '2号主机', '压力异常', 'warning', 'processing', 0, 5, { temperature: 28, pressure: 0.75, voltage: 225 }, { id: '2', name: '李运维' }),
  createMockAlarm('ALM003', 'HOST003', '3号主机', '主机停机', 'critical', 'abnormal', 0, 8, { temperature: 15, pressure: 0.2, voltage: 0 }),
  createMockAlarm('ALM004', 'HOST001', '1号主机', '电压波动', 'warning', 'completed', 1, 3, { temperature: 22, pressure: 0.45, voltage: 250 }, { id: '1', name: '张值班' }),
  createMockAlarm('ALM005', 'HOST005', '5号主机', '常规检查', 'info', 'completed', 1, 12, { temperature: 24, pressure: 0.46, voltage: 220 }, { id: '1', name: '张值班' }),
  createMockAlarm('ALM006', 'HOST002', '2号主机', '滤网需要清洗', 'warning', 'pending', 2, 6, { temperature: 26, pressure: 0.42, voltage: 222 }),
  createMockAlarm('ALM007', 'HOST004', '4号主机', '压缩机故障', 'critical', 'completed', 3, 10, { temperature: 18, pressure: 0, voltage: 218 }, { id: '2', name: '李运维' }),
  createMockAlarm('ALM008', 'HOST003', '3号主机', '传感器故障', 'warning', 'processing', 0, 1, { temperature: 999, pressure: 0.3, voltage: 220 }, { id: '2', name: '李运维' }),
  createMockAlarm('ALM009', 'HOST001', '1号主机', '流量异常', 'info', 'pending', 0, 4, { temperature: 23, pressure: 0.44, voltage: 223 }),
  createMockAlarm('ALM010', 'HOST005', '5号主机', '冷媒不足', 'warning', 'completed', 4, 8, { temperature: 29, pressure: 0.35, voltage: 221 }, { id: '3', name: '王管理' }),
  createMockAlarm('ALM011', 'HOST002', '2号主机', '电流过载', 'critical', 'abnormal', 2, 15, { temperature: 55, pressure: 0.6, voltage: 280 }),
  createMockAlarm('ALM012', 'HOST003', '3号主机', '通讯中断', 'critical', 'pending', 0, 30, { temperature: undefined, pressure: undefined, voltage: undefined }),
];

export const mockSupplementRecords: SupplementRecord[] = [
  {
    id: 'SUP001',
    hostId: 'HOST004',
    hostName: '4号主机',
    startTime: dayjs().subtract(5, 'day').hour(8).minute(0).toISOString(),
    endTime: dayjs().subtract(5, 'day').hour(17).minute(30).toISOString(),
    operationType: 'stop',
    reason: '计划性维护保养，更换机油和过滤器',
    operator: '4',
    operatorName: '叶师傅',
    createTime: dayjs().subtract(5, 'day').hour(7).minute(30).toISOString(),
    diffFields: ['endTime'],
    originalData: {
      endTime: dayjs().subtract(5, 'day').hour(16).minute(0).toISOString(),
    }
  },
  {
    id: 'SUP002',
    hostId: 'HOST003',
    hostName: '3号主机',
    startTime: dayjs().subtract(2, 'day').hour(9).minute(15).toISOString(),
    endTime: dayjs().subtract(2, 'day').hour(14).minute(45).toISOString(),
    operationType: 'start',
    reason: '临时启动测试压缩机',
    operator: '4',
    operatorName: '叶师傅',
    createTime: dayjs().subtract(2, 'day').hour(9).minute(0).toISOString(),
  },
];

export function loginByEmployeeId(employeeId: string): User | null {
  return mockUsers.find(u => u.employeeId === employeeId) || null;
}

export function hasPermission(user: User, permission: string): boolean {
  if (user.permissions.includes('*')) return true;
  return user.permissions.includes(permission);
}

export function canAccessRoute(user: User, route: string): boolean {
  const routePermissions: Record<string, string[]> = {
    '/': ['alarm:view'],
    '/host/:id': ['host:view'],
    '/import': ['data:import'],
    '/supplement': ['supplement:create'],
  };

  const baseRoute = route.split('/').slice(0, 3).join('/').replace(/\/\d+$/, '/:id');
  const permissions = routePermissions[baseRoute] || [];

  if (permissions.length === 0) return true;

  return permissions.some(p => hasPermission(user, p));
}
