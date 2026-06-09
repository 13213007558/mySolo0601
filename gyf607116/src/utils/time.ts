import type { GunRecord, AlertMessage } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sortRecordsByTime(records: GunRecord[]): GunRecord[] {
  return [...records].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function detectCrossDayIssues(records: GunRecord[]): AlertMessage[] {
  const alerts: AlertMessage[] = [];
  
  const grouped = groupBy(records, r => r.gunCode);
  
  Object.entries(grouped).forEach(([gunCode, gunRecords]) => {
    const sorted = sortRecordsByTime(gunRecords);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      
      const currDate = new Date(curr.timestamp);
      const nextDate = new Date(next.timestamp);
      
      const isCrossDay = currDate.getHours() >= 22 && 
                        nextDate.getHours() <= 2 &&
                        nextDate.getDate() > currDate.getDate();
      
      if (isCrossDay && curr.action === 'insert' && next.action === 'remove') {
        const durationMs = nextDate.getTime() - currDate.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        alerts.push({
          id: `crossday-${gunCode}-${i}-${generateId()}`,
          type: 'warning',
          message: `${gunCode} 存在跨日操作：${formatTime(curr.timestamp)} 插入，${formatTime(next.timestamp)} 拔出`,
          plainText: `值班员请注意：${gunCode} 号枪在昨晚${currDate.getHours()}点${currDate.getMinutes()}分插上，今天凌晨${nextDate.getHours()}点${nextDate.getMinutes()}分拔出。充电时长约${durationHours}小时${durationMinutes}分钟。系统已按实际时间排序，但跨日记录已标记，请留意充电时长是否合理，如有疑问请联系现场确认。`
        });
      }

      const isOutOfOrder = new Date(curr.timestamp).getTime() > new Date(next.timestamp).getTime();
      if (isOutOfOrder) {
        alerts.push({
          id: `order-${gunCode}-${i}-${generateId()}`,
          type: 'warning',
          message: `${gunCode} 记录顺序异常：${formatDateTime(curr.timestamp)} ${curr.action === 'insert' ? '插入' : '拔出'} 排在 ${formatDateTime(next.timestamp)} ${next.action === 'insert' ? '插入' : '拔出'} 之前`,
          plainText: `值班员请注意：${gunCode} 号枪的记录顺序有点乱。${formatDateTime(curr.timestamp)} 的操作跑到了 ${formatDateTime(next.timestamp)} 的前面。系统已自动按时间重新排序，但还是请您核对一下这些记录的先后顺序对不对。`
        });
      }
    }
  });
  
  return alerts;
}

export function getActionText(action: 'insert' | 'remove'): string {
  return action === 'insert' ? '插入' : '拔出';
}

export function getDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  
  if (durationMs < 0) {
    return '时间异常';
  }
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

export function isToday(isoString: string): boolean {
  const today = new Date();
  const date = new Date(isoString);
  return today.getFullYear() === date.getFullYear() &&
         today.getMonth() === date.getMonth() &&
         today.getDate() === date.getDate();
}

export function getDaysDiff(isoString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(isoString);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}
