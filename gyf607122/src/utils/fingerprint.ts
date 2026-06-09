import CryptoJS from 'crypto-js';
import type { AlarmRecord, ImportRecord } from '@/types';

export function generateDataFingerprint(hostId: string, alarmTime: string): string {
  const timestamp = new Date(alarmTime).getTime();
  const raw = `${hostId}_${timestamp}`;
  return CryptoJS.SHA256(raw).toString();
}

export function detectDuplicates(
  incomingRecords: Partial<AlarmRecord>[],
  existingRecords: AlarmRecord[]
): ImportRecord[] {
  const existingFingerprints = new Set(existingRecords.map(r => r.dataFingerprint));
  const processedFingerprints = new Set<string>();

  return incomingRecords.map((data, index) => {
    if (!data.hostId || !data.alarmTime) {
      return {
        rowIndex: index,
        data,
        status: 'abnormal',
        errorMessage: '缺少主机ID或告警时间'
      };
    }

    const fingerprint = generateDataFingerprint(data.hostId, data.alarmTime);

    if (existingFingerprints.has(fingerprint) || processedFingerprints.has(fingerprint)) {
      return {
        rowIndex: index,
        data,
        status: 'duplicate',
        errorMessage: '记录已存在，请勿重复导入'
      };
    }

    processedFingerprints.add(fingerprint);

    return {
      rowIndex: index,
      data: { ...data, dataFingerprint: fingerprint },
      status: 'valid'
    };
  });
}

export function validateAbnormalData(records: ImportRecord[]): ImportRecord[] {
  const threshold = {
    temperature: { min: -10, max: 50 },
    pressure: { min: 0, max: 1.0 },
    voltage: { min: 180, max: 260 },
  };

  return records.map(record => {
    if (record.status !== 'valid') return record;

    const { params } = record.data;
    const errors: string[] = [];

    if (params?.temperature !== undefined) {
      if (params.temperature < threshold.temperature.min || params.temperature > threshold.temperature.max) {
        errors.push(`温度值 ${params.temperature}℃ 超出正常范围（${threshold.temperature.min}~${threshold.temperature.max}℃）`);
      }
    }

    if (params?.pressure !== undefined) {
      if (params.pressure < threshold.pressure.min || params.pressure > threshold.pressure.max) {
        errors.push(`压力值 ${params.pressure}MPa 超出正常范围（${threshold.pressure.min}~${threshold.pressure.max}MPa）`);
      }
    }

    if (params?.voltage !== undefined) {
      if (params.voltage < threshold.voltage.min || params.voltage > threshold.voltage.max) {
        errors.push(`电压值 ${params.voltage}V 超出正常范围（${threshold.voltage.min}~${threshold.voltage.max}V）`);
      }
    }

    if (errors.length > 0) {
      return {
        ...record,
        status: 'abnormal',
        errorMessage: errors.join('；')
      };
    }

    return record;
  });
}

export function validateAttachments(records: ImportRecord[]): ImportRecord[] {
  const requiredAttachmentTypes = ['critical', 'warning'];

  return records.map(record => {
    if (record.status !== 'valid') return record;

    if (requiredAttachmentTypes.includes(record.data.alarmLevel || '') && 
        (!record.data.attachments || record.data.attachments.length === 0)) {
      return {
        ...record,
        status: 'missing_attachment',
        errorMessage: '严重或警告级别的告警必须上传附件（照片/视频）'
      };
    }

    return record;
  });
}

export function canSubmit(records: ImportRecord[]): boolean {
  return records.every(r => r.status === 'valid');
}

export function getImportStats(records: ImportRecord[]) {
  return {
    total: records.length,
    valid: records.filter(r => r.status === 'valid').length,
    duplicate: records.filter(r => r.status === 'duplicate').length,
    abnormal: records.filter(r => r.status === 'abnormal').length,
    missingAttachments: records.filter(r => r.status === 'missing_attachment').length,
  };
}
