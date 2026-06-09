import type { FuseAlarm, ExportData } from '@/types';
import { EXPORT_VERSION } from './export';

export const validateImportData = (data: unknown): data is ExportData => {
  if (!data || typeof data !== 'object') return false;
  
  const obj = data as Record<string, unknown>;
  
  if (obj.version !== EXPORT_VERSION) {
    console.warn(`版本不匹配: 期望 ${EXPORT_VERSION}, 实际 ${obj.version}`);
  }
  
  if (!Array.isArray(obj.data)) return false;
  
  return obj.data.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false;
    const fuse = item as Record<string, unknown>;
    return typeof fuse.id === 'string' && 
           typeof fuse.fuseNo === 'string' &&
           Array.isArray(fuse.history);
  });
};

export const importFromJson = (file: File): Promise<FuseAlarm[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!validateImportData(parsed)) {
          reject(new Error('导入数据格式无效'));
          return;
        }
        
        resolve(parsed.data);
      } catch (err) {
        reject(new Error('JSON解析失败: ' + (err as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file);
  });
};

export const mergeImportData = (
  existing: FuseAlarm[],
  imported: FuseAlarm[]
): FuseAlarm[] => {
  const existingMap = new Map(existing.map(item => [item.id, item]));
  const result = [...existing];
  
  imported.forEach(item => {
    if (existingMap.has(item.id)) {
      const index = result.findIndex(r => r.id === item.id);
      if (index !== -1) {
        const existingItem = result[index];
        result[index] = {
          ...item,
          history: [
            ...existingItem.history,
            ...item.history.filter(
              h => !existingItem.history.some(eh => eh.id === h.id)
            )
          ]
        };
      }
    } else {
      result.push(item);
    }
  });
  
  return result;
};
