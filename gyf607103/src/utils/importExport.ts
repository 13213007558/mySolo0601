import type { RoofShadowRecord, AerialAnnotation, ExportAudit } from '@/types';
import { calculateChecksum } from './diffCalculator';
import { generateId } from './mockData';

export const exportToJSON = (
  records: RoofShadowRecord[],
  annotations: AerialAnnotation[],
  exportType: 'raw' | 'modified' = 'modified',
  exportedBy: string = '值班员'
): { data: string; audit: ExportAudit } => {
  const exportData = exportType === 'raw'
    ? records.map(r => ({
        ...r,
        shadowHours: r.originalShadowHours,
        powerEfficiency: r.originalPowerEfficiency,
      }))
    : records;

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    exportType,
    exportedBy,
    records: exportData,
    annotations,
  };

  const audit: ExportAudit = {
    id: generateId(),
    exportedAt: data.exportedAt,
    exportedBy,
    exportType,
    recordCount: records.length,
    checksum: calculateChecksum(exportData),
  };

  return {
    data: JSON.stringify(data, null, 2),
    audit,
  };
};

export const exportToCSV = (
  records: RoofShadowRecord[],
  exportType: 'raw' | 'modified' = 'modified'
): string => {
  const headers = [
    '屋顶ID',
    '建筑名称',
    '记录日期',
    '阴影时长(小时)',
    '发电效率(%)',
    '状态',
    '标记人',
    '标记时间',
    '备注',
  ];

  const rows = records.map(r => {
    const shadow = exportType === 'raw' ? r.originalShadowHours : r.shadowHours;
    const efficiency = exportType === 'raw' ? r.originalPowerEfficiency : r.powerEfficiency;
    const statusMap: Record<string, string> = {
      normal: '正常',
      warning: '警告',
      danger: '危险',
    };
    return [
      r.roofId,
      r.buildingName,
      r.recordDate,
      shadow,
      efficiency,
      statusMap[r.status] || r.status,
      r.markedBy || '',
      r.markedAt || '',
      r.notes || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface ImportResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export const importFromJSON = (fileContent: string): ImportResult<{
  records: RoofShadowRecord[];
  annotations: AerialAnnotation[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(fileContent);

    if (!parsed.records || !Array.isArray(parsed.records)) {
      errors.push('JSON格式错误：缺少records字段');
      return { success: false, errors, warnings };
    }

    if (parsed.checksum) {
      const actualChecksum = calculateChecksum(parsed.records);
      if (actualChecksum !== parsed.checksum) {
        warnings.push('数据校验和不匹配，文件可能已被修改');
      }
    }

    if (parsed.version && parsed.version !== '1.0.0') {
      warnings.push(`数据版本为${parsed.version}，可能存在兼容性问题`);
    }

    const requiredFields = ['id', 'roofId', 'buildingName', 'recordDate', 'shadowHours'];
    parsed.records.forEach((record: RoofShadowRecord, index: number) => {
      requiredFields.forEach(field => {
        if (!(field in record)) {
          errors.push(`第${index + 1}条记录缺少必填字段: ${field}`);
        }
      });

      if (record.originalShadowHours === undefined) {
        record.originalShadowHours = record.shadowHours;
        warnings.push(`第${index + 1}条记录缺少原始值，已自动填充`);
      }
      if (record.originalPowerEfficiency === undefined) {
        record.originalPowerEfficiency = record.powerEfficiency;
        warnings.push(`第${index + 1}条记录缺少原始效率值，已自动填充`);
      }
      if (record.status === undefined) {
        record.status = 'normal';
      }
      if (record.isDeleted === undefined) {
        record.isDeleted = false;
      }
      if (!record.createdAt) {
        record.createdAt = new Date().toISOString();
      }
      if (!record.updatedAt) {
        record.updatedAt = new Date().toISOString();
      }
    });

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    return {
      success: true,
      data: {
        records: parsed.records,
        annotations: parsed.annotations || [],
      },
      errors,
      warnings,
    };
  } catch (e) {
    errors.push(`JSON解析失败: ${e instanceof Error ? e.message : String(e)}`);
    return { success: false, errors, warnings };
  }
};

export const importFromCSV = (fileContent: string): ImportResult<{ records: RoofShadowRecord[] }> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const lines = fileContent.trim().split('\n');
    if (lines.length < 2) {
      errors.push('CSV文件为空或格式错误');
      return { success: false, errors, warnings };
    }

    const statusMap: Record<string, 'normal' | 'warning' | 'danger'> = {
      '正常': 'normal',
      '警告': 'warning',
      '危险': 'danger',
      'normal': 'normal',
      'warning': 'warning',
      'danger': 'danger',
    };

    const records: RoofShadowRecord[] = [];
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    const expectedHeaders = ['屋顶ID', '建筑名称', '记录日期', '阴影时长(小时)', '发电效率(%)'];
    expectedHeaders.forEach((h, i) => {
      if (headers[i] !== h && headers[i]?.trim() !== h.trim()) {
        warnings.push(`第${i + 1}列表头应为"${h}"，实际为"${headers[i]}"`);
      }
    });

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 5) {
        errors.push(`第${i + 1}行数据字段不足`);
        continue;
      }

      const shadowHours = parseFloat(values[3]);
      const powerEfficiency = parseFloat(values[4]);

      if (isNaN(shadowHours)) {
        errors.push(`第${i + 1}行阴影时长格式错误`);
        continue;
      }
      if (isNaN(powerEfficiency)) {
        errors.push(`第${i + 1}行发电效率格式错误`);
        continue;
      }

      const statusStr = values[5]?.toLowerCase() || 'normal';
      const status = statusMap[statusStr] || 'normal';

      records.push({
        id: generateId(),
        roofId: values[0],
        buildingName: values[1],
        recordDate: values[2],
        shadowHours,
        originalShadowHours: shadowHours,
        powerEfficiency,
        originalPowerEfficiency: powerEfficiency,
        status,
        markedBy: values[6] || undefined,
        markedAt: values[7] || undefined,
        notes: values[8] || undefined,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    return {
      success: true,
      data: { records },
      errors,
      warnings,
    };
  } catch (e) {
    errors.push(`CSV解析失败: ${e instanceof Error ? e.message : String(e)}`);
    return { success: false, errors, warnings };
  }
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
