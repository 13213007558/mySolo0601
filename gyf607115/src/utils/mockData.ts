import type { Alarm, StatusHistory, OperationHistory, ManualEntry } from '../types';
import { maskPhone, formatAmountDisplay, generateId } from './formatters';
import { README_INCONSISTENCY_ALARM_ID, README_EXPECTED_DATA } from './validators';

export const SITES = ['能源站A', '能源站B', '能源站C', '产业园东', '产业园西', '物流中心'];
export const DEVICES = ['BMS-001', 'BMS-002', 'BMS-003', 'BMS-004', 'BMS-005', 'BMS-006'];
export const OPERATORS = ['张三', '李四', '王五', '赵六', '孟经理'];

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

export function generateMockAlarms(): Alarm[] {
  const alarms: Alarm[] = [];

  alarms.push({
    id: README_INCONSISTENCY_ALARM_ID,
    alarmCode: README_EXPECTED_DATA.alarmCode,
    siteName: README_EXPECTED_DATA.siteName,
    deviceName: README_EXPECTED_DATA.deviceName,
    level: 'warning',
    description: README_EXPECTED_DATA.description,
    amount: README_EXPECTED_DATA.amount,
    amountDisplay: README_EXPECTED_DATA.amountDisplay,
    phone: README_EXPECTED_DATA.phone,
    phoneMasked: maskPhone(README_EXPECTED_DATA.phone),
    status: 'pending',
    source: 'auto',
    createdAt: randomDate(5),
    updatedAt: randomDate(2),
  });

  const precisionAmounts = [0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2, 0.1, 0.2];
  precisionAmounts.forEach((amount, idx) => {
    const id = `alarm-prec-${String(idx + 1).padStart(3, '0')}`;
    alarms.push({
      id,
      alarmCode: `BMS-PREC-${String(idx + 1).padStart(3, '0')}`,
      siteName: '精度测试站',
      deviceName: `BMS-PREC-${String(idx + 1).padStart(2, '0')}`,
      level: 'info',
      description: `小数精度测试告警 ${idx + 1}`,
      amount,
      amountDisplay: formatAmountDisplay(amount),
      phone: '139' + String(10000000 + idx).slice(-8),
      phoneMasked: maskPhone('139' + String(10000000 + idx).slice(-8)),
      status: idx % 3 === 0 ? 'resolved' : idx % 3 === 1 ? 'processing' : 'pending',
      source: 'auto',
      createdAt: randomDate(10),
      updatedAt: randomDate(3),
    });
  });

  const phoneNumbers = ['13800138001', '13900139002', '13700137003'];
  phoneNumbers.forEach((phone, idx) => {
    const id = `alarm-leak-${String(idx + 1).padStart(3, '0')}`;
    alarms.push({
      id,
      alarmCode: `BMS-LEAK-${String(idx + 1).padStart(3, '0')}`,
      siteName: '脱敏测试站',
      deviceName: `BMS-LEAK-${String(idx + 1).padStart(2, '0')}`,
      level: 'critical',
      description: `手机号脱敏测试告警 ${idx + 1}`,
      amount: 5000 + idx * 1000,
      amountDisplay: formatAmountDisplay(5000 + idx * 1000),
      phone,
      phoneMasked: idx === 0 ? phone : maskPhone(phone),
      status: 'pending',
      source: 'auto',
      createdAt: randomDate(7),
      updatedAt: randomDate(1),
    });
  });

  const normalDescriptions = [
    '电池组温度过高告警',
    'SOC异常波动告警',
    '充电电流异常告警',
    '绝缘电阻偏低告警',
    '单体电压不一致告警',
    '通信中断告警',
    'BMS自检失败告警',
    '冷却系统故障告警',
    '容量衰减告警',
    '均衡异常告警',
  ];

  for (let i = 0; i < 15; i++) {
    const phone = '138' + String(10000000 + i * 7).slice(-8);
    alarms.push({
      id: `alarm-normal-${String(i + 1).padStart(3, '0')}`,
      alarmCode: `BMS-${String(100 + i)}`,
      siteName: SITES[i % SITES.length],
      deviceName: DEVICES[i % DEVICES.length],
      level: (['critical', 'warning', 'info'] as const)[i % 3],
      description: normalDescriptions[i % normalDescriptions.length],
      amount: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
      amountDisplay: formatAmountDisplay(Math.round((Math.random() * 10000 + 1000) * 100) / 100),
      phone,
      phoneMasked: maskPhone(phone),
      status: (['pending', 'processing', 'resolved', 'ignored'] as const)[i % 4],
      source: 'auto',
      createdAt: randomDate(30),
      updatedAt: randomDate(5),
    });
  }

  alarms.push({
    id: 'alarm-manual-001',
    alarmCode: 'BMS-MANUAL-001',
    siteName: '物流中心',
    deviceName: 'BMS-006',
    level: 'critical',
    description: '孟经理手工补录-电池包严重告警',
    amount: 28500.0,
    amountDisplay: '28500.00',
    phone: '13600136006',
    phoneMasked: maskPhone('13600136006'),
    status: 'processing',
    source: 'manual',
    bmsPhotoUrl:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=BMS%20battery%20management%20system%20screen%20display%20showing%20red%20critical%20alarm%20warning%2C%20industrial%20control%20panel%2C%20dark%20theme%20UI&image_size=square_hd',
    createdAt: randomDate(1),
    updatedAt: randomDate(1),
  });

  return alarms;
}

export function generateStatusHistory(alarmIds: string[]): StatusHistory[] {
  const histories: StatusHistory[] = [];
  const statuses: Array<'pending' | 'processing' | 'resolved'> = ['pending', 'processing', 'resolved'];

  alarmIds.forEach((alarmId) => {
    const steps = Math.floor(Math.random() * 3) + 1;
    let currentStatus: 'pending' | 'processing' | 'resolved' = 'pending';

    for (let i = 0; i < steps; i++) {
      const nextStatus = statuses[Math.min(i + 1, statuses.length - 1)];
      histories.push({
        id: generateId(),
        alarmId,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        operator: OPERATORS[Math.floor(Math.random() * OPERATORS.length)],
        reason: [
          '开始处理告警',
          '现场排查完成',
          '问题已修复',
          '需要更换部件',
          '联系厂家支持',
          '确认无误关闭',
        ][Math.floor(Math.random() * 6)],
        createdAt: randomDate(5),
      });
      currentStatus = nextStatus;
    }
  });

  return histories;
}

export function generateOperationHistory(alarmIds: string[]): OperationHistory[] {
  const histories: OperationHistory[] = [];

  alarmIds.forEach((alarmId) => {
    histories.push({
      id: generateId(),
      alarmId,
      operationType: 'create',
      operator: '系统',
      detail: '告警自动创建',
      createdAt: randomDate(10),
    });

    if (Math.random() > 0.5) {
      histories.push({
        id: generateId(),
        alarmId,
        operationType: 'export',
        operator: OPERATORS[Math.floor(Math.random() * OPERATORS.length)],
        detail: '导出告警数据',
        createdAt: randomDate(3),
      });
    }
  });

  return histories;
}

export function generateManualEntries(): ManualEntry[] {
  return [
    {
      id: 'entry-001',
      alarmId: 'alarm-manual-001',
      photoUrl:
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=BMS%20battery%20management%20system%20screen%20display%20showing%20red%20critical%20alarm%20warning%2C%20industrial%20control%20panel%2C%20dark%20theme%20UI&image_size=square_hd',
      enteredBy: '孟经理',
      entryNote: '2026-06-08 现场巡检发现BMS屏幕告警，拍照补录。电池包温度异常，已安排维修。',
      alarmData: {
        alarmCode: 'BMS-MANUAL-001',
        siteName: '物流中心',
        deviceName: 'BMS-006',
        level: 'critical',
        description: '孟经理手工补录-电池包严重告警',
        amount: 28500.0,
        amountDisplay: '28500.00',
        phone: '13600136006',
        status: 'processing',
      },
      diffData: {
        amount: { old: 25000, new: 28500 },
        level: { old: 'warning', new: 'critical' },
        description: { old: '电池包温度告警', new: '孟经理手工补录-电池包严重告警' },
      },
      createdAt: randomDate(1),
    },
  ];
}

export const MOCK_ALARMS = generateMockAlarms();
export const MOCK_STATUS_HISTORY = generateStatusHistory(MOCK_ALARMS.map((a) => a.id));
export const MOCK_OPERATION_HISTORY = generateOperationHistory(MOCK_ALARMS.map((a) => a.id));
export const MOCK_MANUAL_ENTRIES = generateManualEntries();
