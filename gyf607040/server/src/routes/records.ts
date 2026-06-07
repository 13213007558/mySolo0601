import { Router, Request, Response } from 'express';
import { db } from '../db';

export const recordsRouter = Router();

interface QueryFilter {
  baby_id?: string;
  record_date_from?: string;
  record_date_to?: string;
  status?: string;
  shift?: string;
  keyword?: string;
}

recordsRouter.get('/', (req: Request, res: Response) => {
  const q = req.query as QueryFilter & { page?: string; pageSize?: string };
  const page = Math.max(1, parseInt(q.page || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(q.pageSize || '20', 10)));
  const offset = (page - 1) * pageSize;

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

  const countRow = db.prepare(`
    SELECT COUNT(*) as total
    FROM milk_records r
    LEFT JOIN babies b ON r.baby_id = b.id
    ${whereClause}
  `).get(...params) as { total: number };

  const rows = db.prepare(`
    SELECT r.*, b.name as baby_name, b.room_no, b.bed_no, b.mother_name,
      CASE
        WHEN r.photo_path IS NULL OR r.photo_path = '' THEN 1 ELSE 0
      END as photo_missing,
      CASE
        WHEN r.is_dirty = 1 THEN '是' ELSE '否'
      END as dirty_flag
    FROM milk_records r
    LEFT JOIN babies b ON r.baby_id = b.id
    ${whereClause}
    ORDER BY r.record_date DESC, r.record_time DESC, r.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  res.json({
    total: countRow.total,
    page,
    pageSize,
    list: rows,
  });
});

recordsRouter.get('/:id', (req: Request, res: Response) => {
  const row: any = db.prepare(`
    SELECT r.*, b.name as baby_name, b.room_no, b.bed_no, b.mother_name
    FROM milk_records r
    LEFT JOIN babies b ON r.baby_id = b.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!row) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  const issues: string[] = [];
  if (!row.photo_path) {
    issues.push('照片缺失：该条记录未上传喂奶照片，属于待完善数据');
  }
  if (row.status === 'abnormal' && !row.review_note) {
    issues.push('异常未复核：该条记录状态为异常但尚未填写复核意见');
  }
  if (row.status === 'normal' && row.abnormal_reason) {
    issues.push(`数据冲突：状态标记为"正常"但存在异常原因：${row.abnormal_reason}，请核对`);
  }
  if (row.is_dirty === 1) {
    issues.push(`脏数据标记：${row.dirty_reason || '原因未知'}，该记录已被隔离，不计入正常汇总`);
  }
  if (row.milk_amount <= 0 || row.milk_amount > 300) {
    issues.push(`奶量异常：${row.milk_amount}ml 超出正常范围（0-300ml）`);
  }

  row.issues = issues;
  res.json(row);
});

recordsRouter.post('/', (req: Request, res: Response) => {
  const body = req.body;
  const info = db.prepare(`
    INSERT INTO milk_records
      (baby_id, record_date, record_time, shift, milk_amount, milk_type, photo_path, status, abnormal_reason, handler)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    body.baby_id,
    body.record_date,
    body.record_time,
    body.shift,
    body.milk_amount,
    body.milk_type || '母乳',
    body.photo_path || null,
    body.status || 'pending',
    body.abnormal_reason || null,
    body.handler || null,
  );
  const row = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

recordsRouter.put('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  const existing: any = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  if (!existing) {
    (res as Response).status(404).json({ error: '记录不存在' });
    return;
  }

  const allowed = ['baby_id', 'record_date', 'record_time', 'shift', 'milk_amount', 'milk_type', 'photo_path', 'status', 'abnormal_reason', 'handler'];
  const fields: string[] = [];
  const values: any[] = [];
  allowed.forEach(k => {
    if (body[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(body[k]);
    }
  });
  fields.push("updated_at = datetime('now','localtime')");
  values.push(id);

  db.prepare(`UPDATE milk_records SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  (res as Response).json(row);
});

recordsRouter.post('/:id/review', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  const existing: any = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }

  db.prepare(`
    UPDATE milk_records
    SET status = ?,
        reviewer = ?,
        review_note = ?,
        review_time = datetime('now','localtime'),
        updated_at = datetime('now','localtime'),
        abnormal_reason = COALESCE(?, abnormal_reason)
    WHERE id = ?
  `).run(
    body.status || existing.status,
    body.reviewer,
    body.review_note,
    body.abnormal_reason || null,
    id,
  );

  const row = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  res.json(row);
});

recordsRouter.post('/:id/mark-dirty', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const body = req.body;
  const existing: any = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: '记录不存在' });
    return;
  }
  db.prepare(`
    UPDATE milk_records
    SET is_dirty = 1, dirty_reason = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(body.reason || '脏数据', id);
  res.json({ ok: true });
});

recordsRouter.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  db.prepare('DELETE FROM milk_records WHERE id = ?').run(id);
  res.json({ ok: true });
});

recordsRouter.get('/summary/stats', (_req: Request, res: Response) => {
  const row: any = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'normal' AND is_dirty = 0 THEN 1 ELSE 0 END) as normal_count,
      SUM(CASE WHEN status = 'abnormal' AND is_dirty = 0 THEN 1 ELSE 0 END) as abnormal_count,
      SUM(CASE WHEN status = 'pending' AND is_dirty = 0 THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN (photo_path IS NULL OR photo_path = '') AND is_dirty = 0 THEN 1 ELSE 0 END) as photo_missing_count,
      SUM(CASE WHEN is_dirty = 1 THEN 1 ELSE 0 END) as dirty_count
    FROM milk_records
  `).get();
  res.json(row);
});
