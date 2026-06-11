export interface TemperaturePoint {
  timestamp: Date;
  temperature: number;
  isAnomaly?: boolean;
}

export interface CellarPosition {
  id: string;
  code: string;
  row: string;
  shelf: number;
  isOccupied: boolean;
  currentCheeseWheelId?: string;
}

export interface YeastBatch {
  id: string;
  batchNumber: string;
  strain: string;
  productionDate: Date;
  expiryDate: Date;
  quantity: number;
  status: 'active' | 'used' | 'expired';
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'technician' | 'manager' | 'supervisor';
  email: string;
  avatar?: string;
  isActive: boolean;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'duration' | 'sensor';
  condition: {
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
    value: number;
    value2?: number;
    durationMinutes?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notificationChannels: string[];
}

export interface CheeseWheel {
  id: string;
  batchNumber: string;
  productionDate: Date;
  estimatedMaturityDate: Date;
  currentStage: 'salting' | 'ripening' | 'matured' | 'aging';
  positionId: string;
  yeastBatchId: string;
  createdBy: string;
  temperatureHistory: TemperaturePoint[];
  currentTemperature: number;
  targetTemperatureMin: number;
  targetTemperatureMax: number;
  status: 'normal' | 'warning' | 'alert';
  weight: number;
  notes?: string;
}

export function generateTemperatureHistory(
  startDate: Date,
  hours: number,
  options: {
    startTemp?: number;
    targetMin?: number;
    targetMax?: number;
    anomaly?: {
      type: 'heat_spike' | 'data_gap' | 'cold_drop';
      startHour: number;
      durationHours: number;
    };
    intervalMinutes?: number;
  } = {}
): TemperaturePoint[] {
  const {
    startTemp = 8,
    targetMin = 12,
    targetMax = 14,
    anomaly,
    intervalMinutes = 30,
  } = options;

  const points: TemperaturePoint[] = [];
  const totalPoints = Math.floor((hours * 60) / intervalMinutes);
  const targetTemp = (targetMin + targetMax) / 2;
  const rampUpHours = hours * 0.4;
  const rampUpPoints = Math.floor((rampUpHours * 60) / intervalMinutes);

  let currentTemp = startTemp;

  for (let i = 0; i < totalPoints; i++) {
    const currentHour = (i * intervalMinutes) / 60;
    const timestamp = new Date(startDate.getTime() + i * intervalMinutes * 60 * 1000);

    if (anomaly?.type === 'data_gap') {
      const gapStartHour = anomaly.startHour;
      const gapEndHour = anomaly.startHour + anomaly.durationHours;
      if (currentHour >= gapStartHour && currentHour < gapEndHour) {
        continue;
      }
    }

    if (i < rampUpPoints) {
      const progress = i / rampUpPoints;
      const targetRampTemp = startTemp + (targetTemp - startTemp) * (1 - Math.exp(-progress * 3));
      const trend = targetRampTemp - currentTemp;
      const maxChange = 0.15;
      const change = Math.max(-maxChange, Math.min(maxChange, trend));
      currentTemp += change;
    } else {
      const randomWalk = (Math.random() - 0.5) * 0.12;
      const pullback = (targetTemp - currentTemp) * 0.05;
      currentTemp += randomWalk + pullback;
      currentTemp = Math.max(targetMin - 0.5, Math.min(targetMax + 0.5, currentTemp));
    }

    let isAnomaly = false;
    if (anomaly?.type === 'heat_spike') {
      const spikeStartHour = anomaly.startHour;
      const spikeEndHour = anomaly.startHour + anomaly.durationHours;
      if (currentHour >= spikeStartHour && currentHour < spikeEndHour) {
        const spikeProgress = (currentHour - spikeStartHour) / anomaly.durationHours;
        const spikeIntensity = Math.sin(spikeProgress * Math.PI) * 6;
        currentTemp += spikeIntensity;
        isAnomaly = true;
      }
    }

    if (anomaly?.type === 'cold_drop') {
      const dropStartHour = anomaly.startHour;
      const dropEndHour = anomaly.startHour + anomaly.durationHours;
      if (currentHour >= dropStartHour && currentHour < dropEndHour) {
        const dropProgress = (currentHour - dropStartHour) / anomaly.durationHours;
        const dropIntensity = Math.sin(dropProgress * Math.PI) * 4;
        currentTemp -= dropIntensity;
        isAnomaly = true;
      }
    }

    points.push({
      timestamp,
      temperature: Math.round(currentTemp * 100) / 100,
      isAnomaly,
    });
  }

  return points;
}

export function getCurrentTemperature(history: TemperaturePoint[]): number {
  if (history.length === 0) return 0;
  return history[history.length - 1].temperature;
}

export function calculateStatus(
  currentTemp: number,
  targetMin: number,
  targetMax: number,
  history: TemperaturePoint[]
): 'normal' | 'warning' | 'alert' {
  const recentPoints = history.slice(-6);
  const hasRecentAnomaly = recentPoints.some(p => p.isAnomaly);

  if (hasRecentAnomaly) {
    return 'alert';
  }

  if (currentTemp >= targetMin && currentTemp <= targetMax) {
    return 'normal';
  }

  const outOfRangeCount = recentPoints.filter(
    p => p.temperature < targetMin || p.temperature > targetMax
  ).length;

  if (outOfRangeCount >= 3) {
    return 'alert';
  }

  if (outOfRangeCount >= 1) {
    return 'warning';
  }

  return 'normal';
}

export const cellarPositions: CellarPosition[] = [
  { id: 'CP001', code: 'A-01', row: 'A', shelf: 1, isOccupied: true, currentCheeseWheelId: 'CW001' },
  { id: 'CP002', code: 'A-02', row: 'A', shelf: 2, isOccupied: true, currentCheeseWheelId: 'CW002' },
  { id: 'CP003', code: 'A-03', row: 'A', shelf: 3, isOccupied: true, currentCheeseWheelId: 'CW003' },
  { id: 'CP004', code: 'A-04', row: 'A', shelf: 4, isOccupied: true, currentCheeseWheelId: 'CW004' },
  { id: 'CP005', code: 'A-05', row: 'A', shelf: 5, isOccupied: true, currentCheeseWheelId: 'CW005' },
  { id: 'CP006', code: 'A-06', row: 'A', shelf: 6, isOccupied: true, currentCheeseWheelId: 'CW006' },
];

export const yeastBatches: YeastBatch[] = [
  {
    id: 'YB001',
    batchNumber: 'YST-2024-001',
    strain: 'Penicillium camemberti',
    productionDate: new Date('2024-01-15'),
    expiryDate: new Date('2024-07-15'),
    quantity: 500,
    status: 'active',
  },
  {
    id: 'YB002',
    batchNumber: 'YST-2024-002',
    strain: 'Penicillium roqueforti',
    productionDate: new Date('2024-02-20'),
    expiryDate: new Date('2024-08-20'),
    quantity: 300,
    status: 'active',
  },
  {
    id: 'YB003',
    batchNumber: 'YST-2023-008',
    strain: 'Brevibacterium linens',
    productionDate: new Date('2023-11-10'),
    expiryDate: new Date('2024-05-10'),
    quantity: 0,
    status: 'expired',
  },
];

export const users: User[] = [
  {
    id: 'U001',
    username: 'tech01',
    name: '张明',
    role: 'technician',
    email: 'zhangming@cheese.com',
    isActive: true,
  },
  {
    id: 'U002',
    username: 'mgr01',
    name: '李华',
    role: 'manager',
    email: 'lihua@cheese.com',
    isActive: true,
  },
  {
    id: 'U003',
    username: 'sup01',
    name: '王芳',
    role: 'supervisor',
    email: 'wangfang@cheese.com',
    isActive: true,
  },
];

export const alertRules: AlertRule[] = [
  {
    id: 'AR001',
    name: '高温告警',
    type: 'temperature',
    condition: {
      operator: 'gt',
      value: 15,
      durationMinutes: 30,
    },
    severity: 'high',
    enabled: true,
    notificationChannels: ['email', 'sms'],
  },
  {
    id: 'AR002',
    name: '低温告警',
    type: 'temperature',
    condition: {
      operator: 'lt',
      value: 10,
      durationMinutes: 60,
    },
    severity: 'medium',
    enabled: true,
    notificationChannels: ['email'],
  },
  {
    id: 'AR003',
    name: '温度异常波动',
    type: 'temperature',
    condition: {
      operator: 'between',
      value: 8,
      value2: 18,
      durationMinutes: 15,
    },
    severity: 'critical',
    enabled: true,
    notificationChannels: ['email', 'sms', 'app'],
  },
];

const baseDate = new Date('2024-06-01T08:00:00');

const history1 = generateTemperatureHistory(baseDate, 72, {
  startTemp: 8,
  targetMin: 12,
  targetMax: 14,
});

const history2 = generateTemperatureHistory(baseDate, 96, {
  startTemp: 8,
  targetMin: 12,
  targetMax: 14,
  anomaly: {
    type: 'heat_spike',
    startHour: 48,
    durationHours: 8,
  },
});

const history3 = generateTemperatureHistory(baseDate, 84, {
  startTemp: 8,
  targetMin: 12,
  targetMax: 14,
  anomaly: {
    type: 'data_gap',
    startHour: 36,
    durationHours: 12,
  },
});

const history4 = generateTemperatureHistory(baseDate, 108, {
  startTemp: 8,
  targetMin: 12,
  targetMax: 14,
  anomaly: {
    type: 'cold_drop',
    startHour: 72,
    durationHours: 6,
  },
});

const history5 = generateTemperatureHistory(baseDate, 66, {
  startTemp: 8,
  targetMin: 12,
  targetMax: 14,
});

const history6 = generateTemperatureHistory(baseDate, 120, {
  startTemp: 8,
  targetMin: 12,
  targetMax: 14,
  anomaly: {
    type: 'heat_spike',
    startHour: 96,
    durationHours: 10,
  },
});

export const cheeseWheels: CheeseWheel[] = [
  {
    id: 'CW001',
    batchNumber: 'CHS-2024-0601',
    productionDate: new Date('2024-06-01'),
    estimatedMaturityDate: new Date('2024-08-15'),
    currentStage: 'ripening',
    positionId: 'CP001',
    yeastBatchId: 'YB001',
    createdBy: 'U001',
    temperatureHistory: history1,
    currentTemperature: getCurrentTemperature(history1),
    targetTemperatureMin: 12,
    targetTemperatureMax: 14,
    status: calculateStatus(getCurrentTemperature(history1), 12, 14, history1),
    weight: 12.5,
    notes: '卡门贝尔奶酪，正常熟成中',
  },
  {
    id: 'CW002',
    batchNumber: 'CHS-2024-0602',
    productionDate: new Date('2024-06-01'),
    estimatedMaturityDate: new Date('2024-08-20'),
    currentStage: 'ripening',
    positionId: 'CP002',
    yeastBatchId: 'YB001',
    createdBy: 'U001',
    temperatureHistory: history2,
    currentTemperature: getCurrentTemperature(history2),
    targetTemperatureMin: 12,
    targetTemperatureMax: 14,
    status: calculateStatus(getCurrentTemperature(history2), 12, 14, history2),
    weight: 13.2,
    notes: '布里奶酪，曾出现异常升温',
  },
  {
    id: 'CW003',
    batchNumber: 'CHS-2024-0603',
    productionDate: new Date('2024-06-01'),
    estimatedMaturityDate: new Date('2024-09-01'),
    currentStage: 'ripening',
    positionId: 'CP003',
    yeastBatchId: 'YB002',
    createdBy: 'U001',
    temperatureHistory: history3,
    currentTemperature: getCurrentTemperature(history3),
    targetTemperatureMin: 12,
    targetTemperatureMax: 14,
    status: calculateStatus(getCurrentTemperature(history3), 12, 14, history3),
    weight: 11.8,
    notes: '洛克福奶酪，存在数据中断记录',
  },
  {
    id: 'CW004',
    batchNumber: 'CHS-2024-0604',
    productionDate: new Date('2024-05-30'),
    estimatedMaturityDate: new Date('2024-08-10'),
    currentStage: 'ripening',
    positionId: 'CP004',
    yeastBatchId: 'YB002',
    createdBy: 'U001',
    temperatureHistory: history4,
    currentTemperature: getCurrentTemperature(history4),
    targetTemperatureMin: 12,
    targetTemperatureMax: 14,
    status: calculateStatus(getCurrentTemperature(history4), 12, 14, history4),
    weight: 12.0,
    notes: '戈贡佐拉奶酪，曾出现异常降温',
  },
  {
    id: 'CW005',
    batchNumber: 'CHS-2024-0605',
    productionDate: new Date('2024-06-02'),
    estimatedMaturityDate: new Date('2024-08-25'),
    currentStage: 'salting',
    positionId: 'CP005',
    yeastBatchId: 'YB001',
    createdBy: 'U002',
    temperatureHistory: history5,
    currentTemperature: getCurrentTemperature(history5),
    targetTemperatureMin: 12,
    targetTemperatureMax: 14,
    status: calculateStatus(getCurrentTemperature(history5), 12, 14, history5),
    weight: 12.8,
    notes: '艾曼塔奶酪，盐渍阶段',
  },
  {
    id: 'CW006',
    batchNumber: 'CHS-2024-0606',
    productionDate: new Date('2024-05-28'),
    estimatedMaturityDate: new Date('2024-08-05'),
    currentStage: 'aging',
    positionId: 'CP006',
    yeastBatchId: 'YB003',
    createdBy: 'U002',
    temperatureHistory: history6,
    currentTemperature: getCurrentTemperature(history6),
    targetTemperatureMin: 12,
    targetTemperatureMax: 14,
    status: calculateStatus(getCurrentTemperature(history6), 12, 14, history6),
    weight: 13.5,
    notes: '帕玛森奶酪，后期熟成，曾出现持续高温',
  },
];
