import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import type { CarbonLedger, EmissionFactorNote, ExportSummary } from '@/types';

export function generateExportSummary(
  ledgers: CarbonLedger[],
  emissionFactorNote: EmissionFactorNote | null,
  exportBy: string
): ExportSummary {
  const withdrawnLedgers = ledgers.filter((l) => l.status === 'withdrawn');
  const pendingLedgers = ledgers.filter((l) => l.status === 'pending');
  const normalLedgers = ledgers.filter((l) => l.status === 'normal');

  const reasonMap = new Map<string, number>();
  const handlerMap = new Map<string, number>();

  withdrawnLedgers.forEach((l) => {
    if (l.withdrawReason) {
      reasonMap.set(l.withdrawReason, (reasonMap.get(l.withdrawReason) || 0) + 1);
    }
    if (l.handler) {
      handlerMap.set(l.handler, (handlerMap.get(l.handler) || 0) + 1);
    }
  });

  return {
    totalCount: ledgers.length,
    withdrawnCount: withdrawnLedgers.length,
    pendingCount: pendingLedgers.length,
    normalCount: normalLedgers.length,
    reasons: Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    handlers: Array.from(handlerMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    pendingRecords: pendingLedgers,
    emissionFactorNote,
    exportTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    exportBy,
  };
}

export function exportToExcel(
  ledgers: CarbonLedger[],
  emissionFactorNote: EmissionFactorNote | null,
  exportBy: string,
  filename?: string
) {
  const summary = generateExportSummary(ledgers, emissionFactorNote, exportBy);
  const exportFileName =
    filename || `碳排台账摘要_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['能源碳排台账摘要'],
    [],
    ['统计信息'],
    ['总记录数', summary.totalCount],
    ['正常记录', summary.normalCount],
    ['已撤回记录', summary.withdrawnCount],
    ['待拍板记录', summary.pendingCount],
    [],
    ['撤回原因统计'],
    ['原因', '数量'],
    ...summary.reasons.map((r) => [r.reason, r.count]),
    [],
    ['处理人统计'],
    ['处理人', '处理数量'],
    ...summary.handlers.map((h) => [h.name, h.count]),
    [],
    ['导出信息'],
    ['导出时间', summary.exportTime],
    ['导出人', summary.exportBy],
  ];

  if (summary.emissionFactorNote) {
    summaryData.push(
      [],
      ['韩工手工补录排放因子说明'],
      ['因子名称', summary.emissionFactorNote.factorName],
      ['旧值', summary.emissionFactorNote.oldValue],
      ['新值', summary.emissionFactorNote.newValue],
      ['差值', (summary.emissionFactorNote.newValue - summary.emissionFactorNote.oldValue).toFixed(4)],
      ['补录人', summary.emissionFactorNote.operator],
      ['补录时间', summary.emissionFactorNote.entryTime],
      ['补录原因', summary.emissionFactorNote.reason],
      ['数据来源', summary.emissionFactorNote.source]
    );
  }

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 20 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, '摘要');

  const pendingData = [
    ['待拍板记录明细'],
    [],
    ['台账ID', '日期', '楼宇', '用电量(kWh)', '用气量(m³)', '碳排放量(tCO2)', '排放因子', '处理人', '创建时间'],
    ...summary.pendingRecords.map((r) => [
      r.id,
      r.date,
      r.building,
      r.electricity,
      r.gas,
      r.carbonEmission,
      r.emissionFactor,
      r.handler,
      r.createdAt,
    ]),
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(pendingData);
  ws2['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '待拍板记录');

  const detailData = [
    ['全部台账明细'],
    [],
    [
      '台账ID',
      '日期',
      '楼宇',
      '用电量(kWh)',
      '用气量(m³)',
      '碳排放量(tCO2)',
      '原始排放量',
      '排放因子',
      '原始因子',
      '状态',
      '撤回原因',
      '白话提示',
      '处理人',
      '是否韩工补录',
      '补录说明',
      '创建时间',
      '更新时间',
    ],
    ...ledgers.map((r) => [
      r.id,
      r.date,
      r.building,
      r.electricity,
      r.gas,
      r.carbonEmission,
      r.originalCarbonEmission,
      r.emissionFactor,
      r.originalEmissionFactor,
      r.status === 'normal' ? '正常' : r.status === 'withdrawn' ? '已撤回' : '待拍板',
      r.withdrawReason,
      r.plainTip,
      r.handler,
      r.isManualEntry ? '是' : '否',
      r.manualEntryNote,
      r.createdAt,
      r.updatedAt,
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(detailData);
  ws3['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 15 },
    { wch: 30 },
    { wch: 10 },
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '全部明细');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(data, exportFileName);

  return exportFileName;
}

export function readExcelFile(file: File): Promise<CarbonLedger[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets['全部明细'];
        if (!ws) {
          reject(new Error('Excel文件中未找到"全部明细"工作表'));
          return;
        }
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (jsonData.length < 3) {
          reject(new Error('Excel数据格式不正确'));
          return;
        }

        const ledgers: CarbonLedger[] = [];
        for (let i = 3; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row[0]) continue;

          const statusText = row[9] as string;
          const status =
            statusText === '正常'
              ? 'normal'
              : statusText === '已撤回'
                ? 'withdrawn'
                : 'pending';

          ledgers.push({
            id: String(row[0]),
            date: String(row[1]),
            building: String(row[2]),
            electricity: Number(row[3]) || 0,
            gas: Number(row[4]) || 0,
            carbonEmission: Number(row[5]) || 0,
            originalCarbonEmission: Number(row[6]) || Number(row[5]) || 0,
            emissionFactor: String(row[7]),
            originalEmissionFactor: String(row[8]) || String(row[7]),
            status,
            withdrawReason: String(row[10] || ''),
            plainTip: String(row[11] || ''),
            handler: String(row[12]),
            isManualEntry: row[13] === '是',
            manualEntryNote: String(row[14] || ''),
            createdAt: String(row[15] || ''),
            updatedAt: String(row[16] || ''),
            selected: false,
          });
        }
        resolve(ledgers);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function generateEmailBody(summary: ExportSummary): string {
  const reasonLines = summary.reasons.map((r) => `  • ${r.reason}: ${r.count}条`).join('\n');
  const handlerLines = summary.handlers.map((h) => `  • ${h.name}: ${h.count}条`).join('\n');
  const pendingLines = summary.pendingRecords
    .map(
      (r) =>
        `  • ${r.date} ${r.building}: ${r.carbonEmission} tCO2 (处理人: ${r.handler})`
    )
    .join('\n');

  let factorNote = '';
  if (summary.emissionFactorNote) {
    const diff = (
      summary.emissionFactorNote.newValue - summary.emissionFactorNote.oldValue
    ).toFixed(4);
    factorNote = `

【韩工手工补录排放因子说明】
因子名称: ${summary.emissionFactorNote.factorName}
数值变更: ${summary.emissionFactorNote.oldValue} → ${summary.emissionFactorNote.newValue} (差值: ${diff})
补录人: ${summary.emissionFactorNote.operator}
补录时间: ${summary.emissionFactorNote.entryTime}
原因: ${summary.emissionFactorNote.reason}
来源: ${summary.emissionFactorNote.source}`;
  }

  return `【能源碳排台账摘要】

统计时间: ${summary.exportTime}
导出人: ${summary.exportBy}

【数据概览】
总记录数: ${summary.totalCount}条
正常记录: ${summary.normalCount}条
已撤回: ${summary.withdrawnCount}条
待拍板: ${summary.pendingCount}条

【撤回原因统计】
${reasonLines}

【处理人统计】
${handlerLines}

【待拍板记录】
${pendingLines || '  无待拍板记录'}${factorNote}

---
此邮件由能源碳排台账追踪面板自动生成
`;
}
