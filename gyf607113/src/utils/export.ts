import type { ExportData, Cylinder, StatusHistory, Photo, Approval, SupplementRecord, Anomaly } from '@/types';

export const calculateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

export const exportToJson = (
  cylinders: Cylinder[],
  statusHistories: StatusHistory[],
  photos: Photo[],
  approvals: Approval[],
  supplements: SupplementRecord[],
  anomalies: Anomaly[],
  filename: string = 'fire-cylinder-data'
): void => {
  const exportData: ExportData = {
    cylinders,
    statusHistories,
    photos,
    approvals,
    supplements,
    anomalies,
    exportedAt: new Date().toISOString(),
    checksum: '',
  };

  exportData.checksum = calculateChecksum(exportData);

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFromJson = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;
        const storedChecksum = data.checksum;
        const tempData = { ...data, checksum: '' };
        const calculatedChecksum = calculateChecksum(tempData);

        if (storedChecksum !== calculatedChecksum) {
          reject(new Error('数据校验失败，文件可能已被篡改'));
          return;
        }

        resolve(data);
      } catch (err) {
        reject(new Error('文件格式错误'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
};

export const compareObjects = (
  before: Record<string, any>,
  after: Record<string, any>
): Array<{ key: string; before: any; after: any }> => {
  const differences: Array<{ key: string; before: any; after: any }> = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  allKeys.forEach((key) => {
    const beforeVal = before[key];
    const afterVal = after[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      differences.push({ key, before: beforeVal, after: afterVal });
    }
  });

  return differences;
};

export const exportSupplementToJson = (
  supplement: SupplementRecord,
  cylinder: Cylinder
): { checksum: string; filename: string } => {
  const exportData = {
    supplement,
    cylinder,
    exportedAt: new Date().toISOString(),
    checksum: '',
  };

  exportData.checksum = calculateChecksum(exportData);

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = `supplement-${supplement.id}-${Date.now()}.json`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { checksum: exportData.checksum, filename };
};
