import type { GunRecord, AlertMessage } from '../types';
import { generateId, formatDateTime } from './time';

export function validateRecordData(record: Partial<GunRecord>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!record.gunCode || record.gunCode.trim() === '') {
    errors.push('枪编号不能为空');
  } else if (!/^CG-\d{3}$/.test(record.gunCode)) {
    errors.push('枪编号格式应为 CG-XXX，如 CG-001');
  }
  
  if (!record.timestamp) {
    errors.push('插拔时间不能为空');
  } else {
    const date = new Date(record.timestamp);
    if (isNaN(date.getTime())) {
      errors.push('插拔时间格式不正确');
    } else if (date > new Date()) {
      errors.push('插拔时间不能晚于当前时间');
    }
  }
  
  if (!record.operator || record.operator.trim() === '') {
    errors.push('操作人不能为空');
  }
  
  if (!record.action) {
    errors.push('请选择插拔动作');
  } else if (record.action !== 'insert' && record.action !== 'remove') {
    errors.push('动作类型不正确');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function detectAnomalies(records: GunRecord[]): AlertMessage[] {
  const alerts: AlertMessage[] = [];
  
  const groupedByGun = records.reduce((acc, r) => {
    if (!acc[r.gunCode]) acc[r.gunCode] = [];
    acc[r.gunCode].push(r);
    return acc;
  }, {} as Record<string, GunRecord[]>);
  
  Object.entries(groupedByGun).forEach(([gunCode, gunRecords]) => {
    const sorted = [...gunRecords].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    let lastAction: 'insert' | 'remove' | null = null;
    
    for (const record of sorted) {
      if (lastAction === record.action) {
        alerts.push({
          id: `anomaly-${gunCode}-${record.id}-${generateId()}`,
          type: 'warning',
          message: `${gunCode} 连续${record.action === 'insert' ? '插入' : '拔出'}：${formatDateTime(record.timestamp)}`,
          plainText: `值班员请注意：${gunCode} 号枪在 ${formatDateTime(record.timestamp)} ${record.action === 'insert' ? '又插了一次' : '又拔了一次'}。同一动作连续出现两次，请核对一下是不是中间漏记了。比如插了两次之间是不是应该有一次拔出？`
        });
      }
      lastAction = record.action;
    }
    
    if (sorted.length > 0) {
      const firstRecord = sorted[0];
      const lastRecord = sorted[sorted.length - 1];
      
      if (lastRecord.action === 'insert') {
        alerts.push({
          id: `unclosed-${gunCode}-${generateId()}`,
          type: 'info',
          message: `${gunCode} 当前处于插入状态，自 ${formatDateTime(lastRecord.timestamp)} 起`,
          plainText: `提示：${gunCode} 号枪从 ${formatDateTime(lastRecord.timestamp)} 插上后还没拔下来。如果是正常充电中就没问题，如果是忘记登记拔出时间，记得补上。`
        });
      }
      
      const durationMs = 
        new Date(lastRecord.timestamp).getTime() - new Date(firstRecord.timestamp).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      
      if (durationHours > 24 && sorted.length < 3) {
        alerts.push({
          id: `long-duration-${gunCode}-${generateId()}`,
          type: 'warning',
          message: `${gunCode} 记录间隔超过24小时但记录数过少`,
          plainText: `值班员请注意：${gunCode} 号枪最早一条记录是 ${formatDateTime(firstRecord.timestamp)}，最晚是 ${formatDateTime(lastRecord.timestamp)}，间隔超过24小时但只有 ${sorted.length} 条记录。是不是中间有漏记的？`
        });
      }
    }
  });
  
  const recordsWithoutRemark = records.filter(r => !r.remark || r.remark.trim() === '');
  if (recordsWithoutRemark.length > 0) {
    alerts.push({
      id: `missing-remark-${generateId()}`,
      type: 'info',
      message: `有 ${recordsWithoutRemark.length} 条记录缺少备注`,
      plainText: `提示：有 ${recordsWithoutRemark.length} 条记录没填备注。建议给每条记录简单写一下原因（比如"早班充电"、"临时调度"等），以后查起来方便。`
    });
  }
  
  return alerts;
}

export function getRecordDiff(
  oldRecord: Partial<GunRecord>,
  newRecord: Partial<GunRecord>
): { field: string; oldValue: string; newValue: string }[] {
  const diffs: { field: string; oldValue: string; newValue: string }[] = [];
  const fieldNames: Record<string, string> = {
    gunCode: '枪编号',
    timestamp: '插拔时间',
    operator: '操作人',
    action: '动作',
    remark: '备注',
    status: '状态'
  };
  
  const fields: (keyof GunRecord)[] = ['gunCode', 'timestamp', 'operator', 'action', 'remark'];
  
  for (const field of fields) {
    const oldVal = oldRecord[field];
    const newVal = newRecord[field];
    
    if (oldVal !== newVal) {
      diffs.push({
        field: fieldNames[field] || field,
        oldValue: formatFieldValue(field, oldVal),
        newValue: formatFieldValue(field, newVal)
      });
    }
  }
  
  return diffs;
}

function formatFieldValue(field: keyof GunRecord, value: unknown): string {
  if (value === undefined || value === null) return '（空）';
  
  if (field === 'action') {
    return value === 'insert' ? '插入' : '拔出';
  }
  
  if (field === 'timestamp') {
    return formatDateTime(value as string);
  }
  
  if (field === 'status') {
    const statusNames: Record<string, string> = {
      normal: '正常',
      abnormal: '异常',
      crossday: '跨日',
      duplicate: '重复',
      manual: '补录'
    };
    return statusNames[value as string] || String(value);
  }
  
  return String(value);
}
