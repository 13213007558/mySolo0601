import { ForecastRecord, ForecastVersion, ChartDataPoint } from '../types';

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const formatDateTime = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);

export const mockForecastVersions: ForecastVersion[] = [
  { id: 'v1', name: 'V1.0 基础预测版', date: '2026-06-01', isCurrent: false },
  { id: 'v2', name: 'V2.0 修正预测版', date: '2026-06-05', isCurrent: false },
  { id: 'v3', name: 'V3.0 最新预测版', date: '2026-06-08', isCurrent: true },
];

export const mockRecords: ForecastRecord[] = [
  {
    id: 'rec-001',
    deviceNo: 'DEV-A-001',
    deviceName: '城东变电站A相',
    forecastDate: formatDate(today),
    forecastValue: 1250.5,
    actualValue: 1302.3,
    deviationRate: 4.14,
    status: 'reviewed',
    isAbnormal: false,
    hasStatusConflict: false,
    createdBy: '张三',
    updatedBy: '李四',
    updatedAt: formatDateTime(new Date(today.getTime() - 3600000)),
    remarks: [
      {
        id: 'r1',
        content: '预测值在合理范围内，天气因素已考虑',
        author: '张三',
        createdAt: formatDateTime(new Date(today.getTime() - 7200000)),
        type: 'new',
      },
    ],
    sourceMaterial: '客服回访表#2026-06-08-001',
  },
  {
    id: 'rec-002',
    deviceNo: 'DEV-B-003',
    deviceName: '西区工业园区主变',
    forecastDate: formatDate(today),
    forecastValue: 2800.0,
    actualValue: 2650.8,
    deviationRate: -5.33,
    status: 'pending',
    isAbnormal: true,
    hasStatusConflict: true,
    createdBy: '王五',
    updatedBy: '赵六',
    updatedAt: formatDateTime(new Date(today.getTime() - 1800000)),
    remarks: [
      {
        id: 'r2',
        content: '初始审核通过，偏差在允许范围内',
        author: '王五',
        createdAt: formatDateTime(new Date(today.getTime() - 5400000)),
        type: 'original',
      },
      {
        id: 'r3',
        content: '客服回访发现该区域有临时停产，数据异常',
        author: '钟姐',
        createdAt: formatDateTime(new Date(today.getTime() - 1800000)),
        type: 'new',
      },
    ],
    sourceMaterial: '客服回访表#2026-06-08-002',
  },
  {
    id: 'rec-003',
    deviceNo: 'DEV-C-007',
    deviceName: '南区商业中心配变',
    forecastDate: formatDate(today),
    forecastValue: 980.2,
    revisedValue: 1050.0,
    actualValue: 1045.6,
    deviationRate: 6.67,
    status: 'approved',
    isAbnormal: false,
    hasStatusConflict: false,
    createdBy: '钟姐',
    updatedAt: formatDateTime(new Date(today.getTime() - 900000)),
    remarks: [
      {
        id: 'r4',
        content: '日前预测修正已完成，考虑促销活动影响',
        author: '钟姐',
        createdAt: formatDateTime(new Date(today.getTime() - 900000)),
        type: 'new',
      },
    ],
    sourceMaterial: '',
  },
  {
    id: 'rec-004',
    deviceNo: 'DEV-A-005',
    deviceName: '城北住宅区1号变',
    forecastDate: formatDate(today),
    forecastValue: 1560.0,
    actualValue: 1498.2,
    deviationRate: -3.96,
    status: 'withdrawn',
    isAbnormal: true,
    hasStatusConflict: false,
    createdBy: '李四',
    updatedBy: '主管',
    updatedAt: formatDateTime(new Date(today.getTime() - 600000)),
    remarks: [
      {
        id: 'r5',
        content: '居民用电高峰预计准确',
        author: '李四',
        createdAt: formatDateTime(new Date(today.getTime() - 3600000)),
        type: 'original',
      },
      {
        id: 'r6',
        content: '主管撤回：需重新核实空调负荷占比',
        author: '主管',
        createdAt: formatDateTime(new Date(today.getTime() - 600000)),
        type: 'new',
      },
    ],
    sourceMaterial: '客服回访表#2026-06-08-004',
  },
  {
    id: 'rec-005',
    deviceNo: 'DEV-D-002',
    deviceName: '东区科技园区总负荷',
    forecastDate: formatDate(today),
    forecastValue: 3200.0,
    actualValue: 3215.8,
    deviationRate: 0.49,
    status: 'approved',
    isAbnormal: false,
    hasStatusConflict: false,
    createdBy: '张三',
    updatedAt: formatDateTime(new Date(today.getTime() - 300000)),
    remarks: [],
    sourceMaterial: '客服回访表#2026-06-08-005',
  },
  {
    id: 'rec-006',
    deviceNo: 'DEV-B-008',
    deviceName: '西区工厂区2号变',
    forecastDate: formatDate(today),
    forecastValue: 2100.0,
    actualValue: 1980.5,
    deviationRate: -5.69,
    status: 'pending',
    isAbnormal: true,
    hasStatusConflict: true,
    createdBy: '王五',
    updatedBy: '张三',
    updatedAt: formatDateTime(new Date(today.getTime() - 120000)),
    remarks: [
      {
        id: 'r7',
        content: '设备检修计划未纳入预测',
        author: '王五',
        createdAt: formatDateTime(new Date(today.getTime() - 240000)),
        type: 'original',
      },
      {
        id: 'r8',
        content: '两人同时修改状态，需确认最终值',
        author: '张三',
        createdAt: formatDateTime(new Date(today.getTime() - 120000)),
        type: 'new',
      },
    ],
    sourceMaterial: undefined,
  },
  {
    id: 'rec-007',
    deviceNo: 'DEV-E-001',
    deviceName: '新区数据中心专变',
    forecastDate: formatDate(today),
    forecastValue: 4500.0,
    actualValue: 4522.3,
    deviationRate: 0.50,
    status: 'reviewed',
    isAbnormal: false,
    hasStatusConflict: false,
    createdBy: '赵六',
    updatedAt: formatDateTime(new Date(today.getTime() - 60000)),
    remarks: [
      {
        id: 'r9',
        content: 'IDC负荷稳定，预测准确',
        author: '赵六',
        createdAt: formatDateTime(new Date(today.getTime() - 60000)),
        type: 'new',
      },
    ],
    sourceMaterial: '客服回访表#2026-06-08-007',
  },
];

export const generateChartData = (hasRevised: boolean = false): ChartDataPoint[] => {
  const baseForecast = [
    1200, 1150, 1100, 1080, 1050, 1020, 1100, 1250, 1400, 1480, 1520, 1550,
    1530, 1500, 1480, 1450, 1420, 1480, 1550, 1600, 1580, 1500, 1400, 1300,
  ];
  const baseActual = [
    1220, 1180, 1120, 1100, 1080, 1050, 1130, 1280, 1420, 1510, 1560, 1580,
    1560, 1520, 1500, 1470, 1450, 1510, 1580, 1630, 1610, 1530, 1430, 1330,
  ];
  const revised = hasRevised ? [
    1230, 1190, 1130, 1110, 1090, 1060, 1140, 1290, 1430, 1520, 1570, 1590,
    1570, 1530, 1510, 1480, 1460, 1520, 1590, 1640, 1620, 1540, 1440, 1340,
  ] : baseForecast;

  return baseForecast.map((f, i) => ({
    hour: i,
    forecast: f,
    revised: revised[i],
    actual: baseActual[i],
    deviation: Number(((baseActual[i] - f) / f * 100).toFixed(2)),
  }));
};

export const statusLabels: Record<ForecastRecord['status'], string> = {
  pending: '待复核',
  reviewed: '已复核',
  withdrawn: '已撤回',
  approved: '已通过',
};

export const statusColors: Record<ForecastRecord['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800',
  withdrawn: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-800',
};
