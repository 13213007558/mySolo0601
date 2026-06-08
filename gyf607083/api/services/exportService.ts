import * as XLSX from 'xlsx';
import { SupplyRecord, ExportOptions, STATUS_LABELS, ITEM_TYPE_LABELS, UserRole } from '../../shared/types';
import { getSupplyRecords } from './supplyRecordService';
import { filterPrivacyFields } from '../middleware/privacyFilter';
import { recordAuditLog } from '../middleware/audit';

export function generateExportData(
  options: ExportOptions,
  userRole?: UserRole,
  operatorId?: string,
  ipAddress: string = 'unknown'
): { headers: string[]; rows: any[] } {
  const records = getSupplyRecords({
    classId: options.classId,
    status: options.status
  });

  const filteredRecords = userRole ? filterPrivacyFields(records, userRole) : records;

  const headers = [
    '记录ID',
    '宝宝姓名',
    '所属班级',
    '物品名称',
    '物品类型',
    '是否消毒',
    '当前状态',
    '是否手工补录',
    '备注',
    '创建时间',
    '更新时间'
  ];

  if (options.includeStatusHistory) {
    headers.push('状态变更历史');
  }

  const rows = filteredRecords.map(record => {
    const row: any = {
      '记录ID': record.id,
      '宝宝姓名': record.babyName,
      '所属班级': record.className,
      '物品名称': record.itemName,
      '物品类型': ITEM_TYPE_LABELS[record.itemType],
      '是否消毒': record.sterilized ? '是' : '否',
      '当前状态': STATUS_LABELS[record.status],
      '是否手工补录': record.isManual ? '是' : '否',
      '备注': record.remark || '',
      '创建时间': record.createdAt,
      '更新时间': record.updatedAt
    };

    if (options.includeStatusHistory && record.statusHistory.length > 0) {
      row['状态变更历史'] = record.statusHistory
        .map(change => 
          `${change.createdAt}: ${STATUS_LABELS[change.fromStatus]} → ${STATUS_LABELS[change.toStatus]} (${change.reason}) [处理人: ${change.operatorName || '未知'}]`
        )
        .join('\n');
    }

    return row;
  });

  recordAuditLog(
    'export',
    'supply_records',
    'export',
    operatorId,
    userRole,
    ipAddress,
    options,
    { recordCount: rows.length },
    true
  );

  return { headers, rows };
}

export function exportToExcel(
  options: ExportOptions,
  userRole?: UserRole,
  operatorId?: string,
  ipAddress: string = 'unknown'
): Buffer {
  const { headers, rows } = generateExportData(options, userRole, operatorId, ipAddress);
  
  const wsData = [headers, ...rows.map(row => headers.map(h => row[h]))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 80 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '用品发放记录');

  if (options.includeStatusHistory) {
    const historyHeaders = [
      '记录ID', '变更时间', '原状态', '新状态', '变更原因', '处理人'
    ];
    const historyRows: any[] = [];
    
    const filteredRecords = userRole ? filterPrivacyFields(getSupplyRecords(options), userRole) : getSupplyRecords(options);
    
    for (const record of filteredRecords) {
      for (const change of record.statusHistory) {
        historyRows.push([
          record.id,
          change.createdAt,
          STATUS_LABELS[change.fromStatus],
          STATUS_LABELS[change.toStatus],
          change.reason,
          change.operatorName || '未知'
        ]);
      }
    }
    
    const historyWsData = [historyHeaders, ...historyRows];
    const historyWs = XLSX.utils.aoa_to_sheet(historyWsData);
    historyWs['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, historyWs, '状态变更历史');
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function exportToJson(
  options: ExportOptions,
  userRole?: UserRole,
  operatorId?: string,
  ipAddress: string = 'unknown'
): string {
  const records = getSupplyRecords({
    classId: options.classId,
    status: options.status
  });

  const filteredRecords = userRole ? filterPrivacyFields(records, userRole) : records;

  const exportData = {
    exportTime: new Date().toISOString(),
    options,
    recordCount: filteredRecords.length,
    records: filteredRecords.map(r => ({
      ...r,
      statusLabel: STATUS_LABELS[r.status],
      itemTypeLabel: ITEM_TYPE_LABELS[r.itemType]
    }))
  };

  recordAuditLog(
    'export',
    'supply_records',
    'export_json',
    operatorId,
    userRole,
    ipAddress,
    options,
    { recordCount: filteredRecords.length },
    true
  );

  return JSON.stringify(exportData, null, 2);
}
