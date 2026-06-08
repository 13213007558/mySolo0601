import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import { MilkRecord, Child } from '@prisma/client';

interface ExportRecord extends MilkRecord {
  child: Child;
}

const STATUS_TEXT: Record<string, string> = {
  PENDING: '待确认',
  CONFIRMED: '已确认',
  REVIEWED: '已复核',
  REJECTED: '已驳回',
  SUSPICIOUS: '可疑',
};

const SOURCE_TEXT: Record<string, string> = {
  PARENT_MESSAGE: '家长群留言',
  PAPER_RECEIPT: '纸质交接单',
};

export async function exportToCsv(records: ExportRecord[]): Promise<string> {
  const exportDir = path.join(__dirname, '../../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const fileName = `奶量交接记录_${new Date().toISOString().slice(0, 10)}.csv`;
  const filePath = path.join(exportDir, fileName);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'date', title: '日期' },
      { id: 'childName', title: '儿童姓名' },
      { id: 'age', title: '年龄' },
      { id: 'amount', title: '奶量(ml)' },
      { id: 'source', title: '来源' },
      { id: 'status', title: '状态' },
      { id: 'parentMessage', title: '家长留言' },
      { id: 'paperNote', title: '交接单编号' },
      { id: 'reason', title: '处理原因' },
      { id: 'handledBy', title: '处理人' },
      { id: 'handledAt', title: '处理时间' },
    ],
  });

  const csvRecords = records.map((record) => ({
    date: record.recordDate.toISOString().slice(0, 10),
    childName: record.child.name,
    age: record.child.age,
    amount: record.amount,
    source: SOURCE_TEXT[record.source] || record.source,
    status: STATUS_TEXT[record.status] || record.status,
    parentMessage: record.parentMessage || '',
    paperNote: record.paperNote || '',
    reason: record.reason || '',
    handledBy: record.handledBy || '',
    handledAt: record.handledAt ? record.handledAt.toISOString().slice(0, 10) : '',
  }));

  await csvWriter.writeRecords(csvRecords);
  return filePath;
}
