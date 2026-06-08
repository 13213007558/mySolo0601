const express = require('express');
const cors = require('cors');
const dayjs = require('dayjs');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

function getCurrentUser(req) {
  const userId = parseInt(req.headers['x-user-id'] || '2', 10);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) || db.prepare('SELECT * FROM users WHERE id = 2').get();
  return user;
}

function logAudit(record_id, baby_id, action, field_name, old_value, new_value, user, reason) {
  db.prepare(`INSERT INTO audit_logs (record_id, baby_id, action, field_name, old_value, new_value, operator_id, operator_name, operator_role, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    record_id, baby_id, action, field_name,
    old_value != null ? String(old_value) : null,
    new_value != null ? String(new_value) : null,
    user.id, user.name, user.role, reason || null
  );
}

function buildFilterQuery(filters) {
  const where = [];
  const params = {};
  where.push('cr.is_valid = :is_valid');
  params.is_valid = filters.include_invalid ? 1 : 1;

  if (filters.record_type) {
    where.push('cr.record_type = :record_type');
    params.record_type = filters.record_type;
  }
  if (filters.baby_id) {
    where.push('cr.baby_id = :baby_id');
    params.baby_id = filters.baby_id;
  }
  if (filters.status) {
    where.push('cr.status = :status');
    params.status = filters.status;
  }
  if (filters.shift) {
    where.push('cr.shift = :shift');
    params.shift = filters.shift;
  }
  if (filters.date_from) {
    where.push('cr.record_date >= :date_from');
    params.date_from = filters.date_from;
  }
  if (filters.date_to) {
    where.push('cr.record_date <= :date_to');
    params.date_to = filters.date_to;
  }
  if (filters.keyword) {
    where.push('(b.name LIKE :keyword OR cr.batch_no LIKE :keyword OR cr.nurse_name LIKE :keyword)');
    params.keyword = `%${filters.keyword}%`;
  }
  if (filters.include_temp === 'false' || filters.include_temp === false) {
    where.push("cr.record_type != 'temp_supplement'");
  }
  if (filters.only_bad) {
    where.push("cr.record_type = 'bad_row'");
  }
  return { where: where.join(' AND '), params };
}

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY id').all();
  res.json(users);
});

app.get('/api/babies', (req, res) => {
  const babies = db.prepare('SELECT * FROM babies ORDER BY id').all();
  res.json(babies);
});

app.get('/api/records', (req, res) => {
  const user = getCurrentUser(req);
  const filters = req.query;

  const { where, params } = buildFilterQuery(filters);

  const page = parseInt(req.query.page || '1', 10);
  const pageSize = parseInt(req.query.pageSize || '20', 10);
  const offset = (page - 1) * pageSize;

  const sql = `
    SELECT cr.*, b.name as baby_name, b.room_no,
      CASE WHEN cr.status = 'pending_review' THEN '待复核'
           WHEN cr.status = 'reviewed' THEN '已复核'
           WHEN cr.status = 'rejected' THEN '已驳回' END as status_text,
      CASE WHEN cr.shift = 'morning' THEN '早班'
           WHEN cr.shift = 'afternoon' THEN '午班'
           WHEN cr.shift = 'night' THEN '夜班' END as shift_text,
      CASE WHEN cr.record_type = 'normal' THEN '正常'
           WHEN cr.record_type = 'temp_supplement' THEN '临时补充'
           WHEN cr.record_type = 'bad_row' THEN '坏行' END as type_text,
      CASE WHEN cr.rectification_status = 'none' THEN '无'
           WHEN cr.rectification_status = 'pending' THEN '待整改'
           WHEN cr.rectification_status = 'done' THEN '已整改' END as rect_text
    FROM care_records cr
    LEFT JOIN babies b ON cr.baby_id = b.id
    WHERE ${where}
    ORDER BY cr.record_date DESC, cr.id DESC
    LIMIT :limit OFFSET :offset
  `;
  params.limit = pageSize;
  params.offset = offset;

  const records = db.prepare(sql).all(params);

  const countSql = `SELECT COUNT(*) as total FROM care_records cr LEFT JOIN babies b ON cr.baby_id = b.id WHERE ${where}`;
  const { total } = db.prepare(countSql).get(params);

  const validStatsSql = `SELECT COUNT(*) as cnt FROM care_records WHERE is_valid = 1 AND record_type != 'bad_row' AND record_type != 'temp_supplement'`;
  const validStats = db.prepare(validStatsSql).get();

  const tempStatsSql = `SELECT COUNT(*) as cnt FROM care_records WHERE is_valid = 1 AND record_type = 'temp_supplement'`;
  const tempStats = db.prepare(tempStatsSql).get();

  const badStatsSql = `SELECT COUNT(*) as cnt FROM care_records WHERE is_valid = 1 AND record_type = 'bad_row'`;
  const badStats = db.prepare(badStatsSql).get();

  const pendingStatsSql = `SELECT COUNT(*) as cnt FROM care_records WHERE is_valid = 1 AND status = 'pending_review' AND record_type != 'bad_row'`;
  const pendingStats = db.prepare(pendingStatsSql).get();

  res.json({
    data: records,
    total,
    page,
    pageSize,
    stats: {
      valid: validStats.cnt,
      temp_supplement: tempStats.cnt,
      bad_row: badStats.cnt,
      pending_review: pendingStats.cnt
    }
  });
});

app.get('/api/records/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const record = db.prepare(`
    SELECT cr.*, b.name as baby_name, b.room_no, b.birth_date, b.admission_date,
      b.guardian_name, b.guardian_phone
    FROM care_records cr
    LEFT JOIN babies b ON cr.baby_id = b.id
    WHERE cr.id = ?
  `).get(id);

  if (!record) return res.status(404).json({ error: '记录不存在' });

  const canViewInternal = ['admin', 'supervisor', 'morning_teacher', 'teacher'].includes(user.role);
  const isParent = user.role === 'parent';

  if (isParent) {
    const isAuthorized = user.username.includes('youyou') && record.baby_name === '柚柚';
    if (!isAuthorized) {
      record.unauthorized_view_reason = `家长用户(${user.name})越权查看非本人宝宝(${record.baby_name})的记录`;
      logAudit(id, record.baby_id, 'view_unauthorized', null, null, null, user, '家长越权查看非本人宝宝记录');
    }
    delete record.notes_internal;
    delete record.rectification_note;
  }

  if (!canViewInternal && !isParent) {
    logAudit(id, record.baby_id, 'view_unauthorized', null, null, null, user, `角色${user.role}无权限查看护理记录`);
    record.unauthorized_view_reason = `用户角色(${user.role})无权限查看该记录详情`;
  }

  const sameDayOtherShifts = db.prepare(`
    SELECT * FROM care_records
    WHERE baby_id = ? AND record_date = ? AND id != ?
    ORDER BY shift
  `).all(record.baby_id, record.record_date, id);

  if (sameDayOtherShifts.length > 0) {
    record.cross_shift_reason = `该宝宝(${record.baby_name})在${record.record_date}还有 ${sameDayOtherShifts.map(r => r.shift === 'morning' ? '早班' : r.shift === 'afternoon' ? '午班' : '夜班').join('、')} 的护理记录，需注意跨班交接`;
    record.cross_shift_records = sameDayOtherShifts;
  }

  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs
    WHERE record_id = ? OR baby_id = ?
    ORDER BY created_at DESC
  `).all(id, record.baby_id);
  record.audit_logs = auditLogs;

  res.json(record);
});

app.post('/api/records', (req, res) => {
  const user = getCurrentUser(req);
  const body = req.body;

  const info = db.prepare(`INSERT INTO care_records (
    baby_id, batch_no, record_type, record_date, shift, nurse_id, nurse_name,
    temperature, weight, feeding_amount, diaper_count, sleep_hours,
    notes_public, notes_internal, photo_url, photo_description,
    cross_shift_reason, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    body.baby_id, body.batch_no, body.record_type || 'normal',
    body.record_date, body.shift, body.nurse_id, body.nurse_name || user.name,
    body.temperature, body.weight, body.feeding_amount, body.diaper_count, body.sleep_hours,
    body.notes_public, body.notes_internal,
    body.photo_url, body.photo_description,
    body.cross_shift_reason, user.id
  );

  const newId = info.lastInsertRowid;
  logAudit(newId, body.baby_id, 'create', null, null, JSON.stringify(body), user, body.record_type === 'temp_supplement' ? '临时补充录入' : body.record_type === 'bad_row' ? '坏行标记录入' : '正常录入');

  const record = db.prepare('SELECT * FROM care_records WHERE id = ?').get(newId);
  res.json(record);
});

app.put('/api/records/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const oldRecord = db.prepare('SELECT * FROM care_records WHERE id = ?').get(id);
  if (!oldRecord) return res.status(404).json({ error: '记录不存在' });

  const body = req.body;
  const fields = [
    'baby_id', 'batch_no', 'record_type', 'record_date', 'shift',
    'temperature', 'weight', 'feeding_amount', 'diaper_count', 'sleep_hours',
    'notes_public', 'notes_internal', 'photo_url', 'photo_description',
    'rectification_note', 'rectification_status', 'cross_shift_reason'
  ];

  const updates = [];
  const values = [];
  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(body[f]);
      if (oldRecord[f] != body[f]) {
        logAudit(id, oldRecord.baby_id, 'update', f, oldRecord[f], body[f], user);
      }
    }
  }
  updates.push("updated_at = datetime('now','localtime')");
  values.push(id);

  db.prepare(`UPDATE care_records SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const record = db.prepare('SELECT * FROM care_records WHERE id = ?').get(id);
  res.json(record);
});

app.post('/api/records/:id/review', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const { action, reason } = req.body;
  const oldRecord = db.prepare('SELECT * FROM care_records WHERE id = ?').get(id);
  if (!oldRecord) return res.status(404).json({ error: '记录不存在' });

  const newStatus = action === 'approve' ? 'reviewed' : action === 'reject' ? 'rejected' : oldRecord.status;
  if (action === 'mark_bad') {
    db.prepare("UPDATE care_records SET record_type = 'bad_row', status = 'rejected', is_valid = 1, updated_at = datetime('now','localtime'), reviewed_by = ?, reviewed_at = datetime('now','localtime') WHERE id = ?").run(user.id, id);
    logAudit(id, oldRecord.baby_id, 'reject', 'record_type', oldRecord.record_type, 'bad_row', user, reason || '标记为坏行，不进入正常统计');
  } else {
    db.prepare("UPDATE care_records SET status = ?, updated_at = datetime('now','localtime'), reviewed_by = ?, reviewed_at = datetime('now','localtime') WHERE id = ?").run(newStatus, user.id, id);
    logAudit(id, oldRecord.baby_id, action === 'approve' ? 'review' : 'reject', 'status', oldRecord.status, newStatus, user, reason || (action === 'approve' ? '复核通过' : '复核驳回'));
  }

  const record = db.prepare('SELECT * FROM care_records WHERE id = ?').get(id);
  res.json(record);
});

app.post('/api/records/:id/invalidate', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const { reason } = req.body;
  const oldRecord = db.prepare('SELECT * FROM care_records WHERE id = ?').get(id);
  if (!oldRecord) return res.status(404).json({ error: '记录不存在' });

  db.prepare("UPDATE care_records SET is_valid = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(id);
  logAudit(id, oldRecord.baby_id, 'delete', 'is_valid', 1, 0, user, reason || '软删除记录');

  res.json({ success: true });
});

app.get('/api/records/:id/history', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const record = db.prepare('SELECT baby_id FROM care_records WHERE id = ?').get(id);
  if (!record) return res.status(404).json({ error: '记录不存在' });

  const logs = db.prepare(`
    SELECT al.*,
      CASE WHEN al.action = 'create' THEN '创建'
           WHEN al.action = 'update' THEN '修改'
           WHEN al.action = 'review' THEN '复核通过'
           WHEN al.action = 'reject' THEN '复核驳回'
           WHEN al.action = 'delete' THEN '删除'
           WHEN al.action = 'view_unauthorized' THEN '越权查看'
           WHEN al.action = 'cross_shift' THEN '跨班交接' END as action_text
    FROM audit_logs al
    WHERE al.record_id = ? OR al.baby_id = ?
    ORDER BY al.created_at DESC
  `).all(id, record.baby_id);

  res.json(logs);
});

app.get('/api/export', (req, res) => {
  const user = getCurrentUser(req);
  const filters = req.query;
  const { where, params } = buildFilterQuery(filters);

  const records = db.prepare(`
    SELECT cr.*, b.name as baby_name, b.room_no
    FROM care_records cr
    LEFT JOIN babies b ON cr.baby_id = b.id
    WHERE ${where}
    ORDER BY cr.record_date DESC, cr.id DESC
  `).all(params);

  const canViewInternal = ['admin', 'supervisor', 'morning_teacher'].includes(user.role);

  const rows = records.map(r => ({
    '记录ID': r.id,
    '宝宝姓名': r.baby_name,
    '房间号': r.room_no,
    '批次号': r.batch_no,
    '记录类型': r.record_type === 'normal' ? '正常' : r.record_type === 'temp_supplement' ? '临时补充' : '坏行',
    '记录日期': r.record_date,
    '班次': r.shift === 'morning' ? '早班' : r.shift === 'afternoon' ? '午班' : '夜班',
    '护理员': r.nurse_name,
    '体温(℃)': r.temperature,
    '体重(kg)': r.weight,
    '喂奶量(ml)': r.feeding_amount,
    '换尿布次数': r.diaper_count,
    '睡眠时长(h)': r.sleep_hours,
    '家长可见备注': r.notes_public || '',
    '内部备注': canViewInternal ? (r.notes_internal || '') : '[无权限查看]',
    '状态': r.status === 'pending_review' ? '待复核' : r.status === 'reviewed' ? '已复核' : '已驳回',
    '整改状态': r.rectification_status === 'none' ? '无' : r.rectification_status === 'pending' ? '待整改' : '已整改',
    '整改记录': canViewInternal ? (r.rectification_note || '') : '[无权限查看]',
    '创建时间': r.created_at,
    '最后更新': r.updated_at
  }));

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
    { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 25 },
    { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 20 }
  ];
  xlsx.utils.book_append_sheet(wb, ws, '护理记录');

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `护理记录导出_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '无文件' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.originalname });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: dayjs().format('YYYY-MM-DD HH:mm:ss') });
});

app.listen(PORT, () => {
  console.log(`月子护理追溯系统 API 服务运行在 http://localhost:${PORT}`);
});
