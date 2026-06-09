import type { OilTempRecord, SupplementRecord, SupplementPoint } from '@/types';
import { generateId, calculateHash } from './hash';

const DEVICES = ['1#箱变', '2#箱变', '3#箱变', '4#箱变'];
const MEASURE_POINTS = ['顶层油温', '绕组温度', '环境温度'];

function generateNightTimePoints(): string[] {
  const times: string[] = [];
  for (let hour = 22; hour <= 23; hour++) {
    for (let min = 0; min < 60; min += 15) {
      times.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  for (let hour = 0; hour <= 6; hour++) {
    for (let min = 0; min < 60; min += 15) {
      times.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  return times;
}

function generateBaseTemp(hour: number, anomaly: boolean): number {
  let base: number;
  if (hour >= 22 || hour < 2) {
    base = 58 + Math.sin(hour * 0.5) * 3;
  } else if (hour >= 2 && hour < 5) {
    base = 54 + Math.sin(hour * 0.8) * 2;
  } else {
    base = 56 + Math.sin(hour * 0.6) * 4;
  }
  if (anomaly) {
    base += 8 + Math.random() * 5;
  }
  return Math.round((base + (Math.random() - 0.5) * 2) * 10) / 10;
}

export function generateMockRecords(): OilTempRecord[] {
  const records: OilTempRecord[] = [];
  const times = generateNightTimePoints();
  const now = Date.now();

  DEVICES.forEach((device, deviceIdx) => {
    MEASURE_POINTS.forEach((point, pointIdx) => {
      const anomalyDevice = deviceIdx === 1 && pointIdx === 0;
      times.forEach((time, timeIdx) => {
        const hour = parseInt(time.split(':')[0], 10);
        const isAnomalyPoint = anomalyDevice && timeIdx >= 10 && timeIdx <= 18;
        const hasAttachment = Math.random() > 0.1;
        const attachmentMissing = !hasAttachment && Math.random() > 0.7;

        let status: OilTempRecord['status'] = 'unmarked';
        if (timeIdx % 7 === 0) status = 'normal';
        if (isAnomalyPoint && timeIdx % 3 === 0) status = 'abnormal';
        if (timeIdx % 11 === 0) status = 'pending';

        records.push({
          id: generateId(),
          deviceName: device,
          measurePoint: point,
          timestamp: time,
          temperature: generateBaseTemp(hour, isAnomalyPoint),
          status,
          attachmentUrl: hasAttachment ? `/attachments/${device}_${point}_${time}.png` : undefined,
          attachmentMissing,
          remark: isAnomalyPoint ? '夜间巡查发现温度偏高' : undefined,
          modifiedBy: status !== 'unmarked' ? (Math.random() > 0.5 ? '管理员' : '值班员') : undefined,
          modifiedAt: now - Math.floor(Math.random() * 3600000),
          version: 1,
        });
      });
    });
  });

  return records;
}

export function generateZhaoSupplementData(): SupplementRecord {
  const times = generateNightTimePoints();
  const points: SupplementPoint[] = times.map((time, idx) => {
    const hour = parseInt(time.split(':')[0], 10);
    let baseTemp: number;
    if (hour >= 22 || hour < 2) {
      baseTemp = 59 + Math.sin(hour * 0.5) * 2;
    } else if (hour >= 2 && hour < 5) {
      baseTemp = 55 + Math.sin(hour * 0.8) * 1.5;
    } else {
      baseTemp = 57 + Math.sin(hour * 0.6) * 3;
    }
    if (idx >= 12 && idx <= 16) {
      baseTemp += 6;
    }
    return {
      time,
      temperature: Math.round((baseTemp + (Math.random() - 0.5)) * 10) / 10,
    };
  });

  return {
    id: generateId(),
    deviceName: '2#箱变',
    operator: '小赵',
    recordDate: new Date().toISOString().split('T')[0],
    points,
    originalDataHash: calculateHash(points),
    createdAt: Date.now(),
    remark: '2024年6月8日夜间手工抄录，2#箱变顶层油温',
  };
}

export function getStatusColor(status: OilTempRecord['status']): string {
  const colors: Record<string, string> = {
    normal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    abnormal: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    pending: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    unmarked: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
  };
  return colors[status] || colors.unmarked;
}

export function getStatusText(status: OilTempRecord['status']): string {
  const texts: Record<string, string> = {
    normal: '正常',
    abnormal: '异常',
    pending: '待复核',
    unmarked: '未标记',
  };
  return texts[status] || status;
}
