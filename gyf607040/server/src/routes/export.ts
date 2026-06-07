import { Router, Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db';
import dayjs from 'dayjs';

export const exportRouter = Router();

const STATUS_MAP: Record<string, string> = {
  pending: '待复核',
  normal: '正常',
  abnormal: '异常',
};

exportRouter.get('/records', (req: Request, res: Response) => {
  const q = req.query as any;
  const where: string[] = [];
  const params: any[] = [];

  if (q.baby_id) {
    where.push('r.baby_id = ?');
    params.push(q.baby_id);
  }
  if (q.record_date_from) {
    where.push('r.record_date >= ?');
    params.push(q.record_date_from);
  }
  if (q.record_date_to) {
    where.push('r.record_date <= ?');
    params.push(q.record_date_to);
  }
  if (q.status && q.status !== 'all') {
    where.push('r.status = ?');
    params.push(q.status);
  }
  if (q.shift && q.shift !== 'all') {
    where.push('r.shift = ?');
    params.push(q.shift);
  }
  if (q.keyword) {
    where.push('(b.name LIKE ? OR r.abnormal_reason LIKE ? OR r.review_note LIKE ? OR r.handler LIKE ?)');
    const kw = `%${q.keyword}%`;
    params.push(kw, kw, kw, kw);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows: any[] = db.prepare(`
    SELECT r.*, b.name as baby_name, b.room_no, b.bed_no, b.mother_name
    FROM milk_records r
    LEFT JOIN babies b ON r.baby_id = b.id
    ${whereClause}
    ORDER BY r.record_date DESC, r.record_time DESC, r.id DESC
  `).all(...params);

  const exportData = rows.map((r, idx) => {
    const obj: Record<string, any> = {};
    obj['序号'] = idx + 1;
    obj['日期'] = r.record_date;
    obj['时间'] = r.record_time;
    obj['班次'] = r.shift;
    obj['房间'] = r.room_no;
    obj['床位'] = r.bed_no;
    obj['婴儿姓名'] = r.baby_name;
    obj['母亲姓名'] = r.mother_name || '';
    obj['奶量(ml)'] = r.milk_amount;
    obj['奶型'] = r.milk_type;
    obj['状态'] = STATUS_MAP[r.status] || r.status;
    obj['数量'] = r.milk_amount;
    obj['异常原因'] = r.abnormal_reason || '';
    obj['照片'] = r.photo_path ? '已上传' : '缺失';
    obj['处理人'] = r.handler || '';
    obj['复核人'] = r.reviewer || '';
    obj['复核意见'] = r.review_note || '';
    obj['复核时间'] = r.review_time || '';
    obj['是否脏数据'] = r.is_dirty ? '是' : '否';
    obj['脏数据原因'] = r.dirty_reason || '';
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '奶量交接记录');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const filename = `奶量交接记录_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buf));
});
