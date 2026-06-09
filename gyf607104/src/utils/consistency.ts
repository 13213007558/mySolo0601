import type { HotSpotRecord } from '@/types';
import { getRecordById, MOCK_RECORDS } from '@/data/mockData';

export interface ConsistencyCheckResult {
  recordId: string;
  listId: string;
  detailId: string;
  exportedId: string;
  allMatch: boolean;
  consistencyIdMatch: boolean;
  errors: string[];
}

export function checkRecordConsistency(
  recordFromList: HotSpotRecord | undefined,
  recordFromDetail: HotSpotRecord | undefined,
  exportedRecord?: Record<string, unknown>
): ConsistencyCheckResult {
  const errors: string[] = [];
  const listId = recordFromList?.id || '';
  const detailId = recordFromDetail?.id || '';
  const exportedId = exportedRecord ? String(exportedRecord['记录ID'] || '') : '';
  const recordId = listId || detailId || exportedId;
  
  if (listId && detailId && listId !== detailId) {
    errors.push(`列表记录ID(${listId})与详情记录ID(${detailId})不匹配`);
  }
  
  if (exportedId && listId && exportedId !== listId) {
    errors.push(`导出记录ID(${exportedId})与列表记录ID(${listId})不匹配`);
  }
  
  if (exportedId && detailId && exportedId !== detailId) {
    errors.push(`导出记录ID(${exportedId})与详情记录ID(${detailId})不匹配`);
  }
  
  const listConsistencyId = recordFromList?._consistencyCheckId || '';
  const detailConsistencyId = recordFromDetail?._consistencyCheckId || '';
  const exportedConsistencyId = exportedRecord ? String(exportedRecord['一致性校验ID'] || '') : '';
  
  let consistencyIdMatch = true;
  if (listConsistencyId && detailConsistencyId && listConsistencyId !== detailConsistencyId) {
    errors.push(`列表一致性ID与详情一致性ID不匹配`);
    consistencyIdMatch = false;
  }
  
  if (exportedConsistencyId && listConsistencyId && exportedConsistencyId !== listConsistencyId) {
    errors.push(`导出一致性ID与列表一致性ID不匹配`);
    consistencyIdMatch = false;
  }
  
  const sourceRecord = getRecordById(recordId);
  if (sourceRecord) {
    if (recordFromList?.supplementalRecord && !recordFromDetail?.supplementalRecord) {
      errors.push('详情页缺少补录记录数据');
    }
    if (recordFromDetail?.isManuallySupplemented !== sourceRecord.isManuallySupplemented) {
      errors.push('补录标记状态不一致');
    }
  }
  
  return {
    recordId,
    listId,
    detailId,
    exportedId,
    allMatch: errors.length === 0,
    consistencyIdMatch,
    errors,
  };
}

export function validateSupplementalRecord(record: HotSpotRecord): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (record.isManuallySupplemented) {
    if (!record.supplementedBy) {
      issues.push('补录记录缺少补录人信息');
    }
    if (!record.supplementedAt) {
      issues.push('补录记录缺少补录时间');
    }
    if (!record.supplementalRecord) {
      issues.push('补录记录缺少补录详情');
    }
    if (!record.recheckImages.some(img => img.isSupplemental)) {
      issues.push('补录记录缺少补录的复测截图');
    }
    if (!record.versionHistory.some(vh => vh.changeType === '补录')) {
      issues.push('版本历史中缺少补录操作记录');
    }
    if (record.supplementalRecord && record.supplementalRecord.originalRecordId !== record.id) {
      issues.push('补录记录的原始记录ID不匹配');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

export function generateConsistencyReport(recordId: string): string {
  const record = getRecordById(recordId);
  if (!record) {
    return `记录 ${recordId} 不存在`;
  }
  
  const validation = validateSupplementalRecord(record);
  const lines = [
    `一致性校验报告 - 记录 ${recordId}`,
    `================================`,
    `记录ID: ${record.id}`,
    `组件编号: ${record.componentId}`,
    `一致性校验ID: ${record._consistencyCheckId}`,
    `是否人工补录: ${record.isManuallySupplemented ? '是' : '否'}`,
    `补录人: ${record.supplementedBy || '无'}`,
    `补录时间: ${record.supplementedAt || '无'}`,
    `复测图片数量: ${record.recheckImages.length}`,
    `补录图片数量: ${record.recheckImages.filter(img => img.isSupplemental).length}`,
    `版本历史数量: ${record.versionHistory.length}`,
    ``,
    `补录数据校验: ${validation.valid ? '通过' : '失败'}`,
  ];
  
  if (!validation.valid) {
    lines.push('问题列表:');
    validation.issues.forEach(issue => lines.push(`  - ${issue}`));
  }
  
  if (record.supplementalRecord) {
    lines.push('');
    lines.push('补录差异信息:');
    Object.entries(record.supplementalRecord.diffFromOriginal).forEach(([field, diff]) => {
      lines.push(`  - ${field}: ${JSON.stringify(diff.old)} → ${JSON.stringify(diff.new)}`);
    });
  }
  
  return lines.join('\n');
}

export function findSupplementalRecords(): HotSpotRecord[] {
  return MOCK_RECORDS.filter(r => r.isManuallySupplemented);
}
