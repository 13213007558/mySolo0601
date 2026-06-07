const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const { getDB } = require('./db');

const router = express.Router();
const db = getDB();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

function addAudit(recordId, action, oldValue, newValue, operator, remark) {
  const stmt = db.prepare(`
    INSERT INTO audits (record_id, action, old_value, new_value, operator, remark)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(recordId, action,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    operator, remark
  );
}

function addTimeline(recordId, eventType, eventDetail, operator) {
  const stmt = db.prepare(`
    INSERT INTO timeline_events (record_id, event_type, event_detail, operator)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(recordId, eventType, eventDetail, operator);
}

function getRecordById(id) {
  const stmt = db.prepare(`
    SELECT r.*, c.name as child_name, c.gender, c.birth_date, c.guardian, c.phone
    FROM records r
    JOIN children c ON r.child_id = c.id
    WHERE r.id = ?
  `);
  return stmt.get(id);
}

router.get('/children', (req, res) => {
  const rows = db.prepare('SELECT * FROM children ORDER BY name').all();
  res.json(rows);
});

router.post('/children', (req, res) => {
  const { name, gender, birth_date, guardian, phone, address } = req.body;
  const info = db.prepare(`
    INSERT INTO children (name, gender, birth_date, guardian, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, gender, birth_date, guardian, phone, address);
  res.json({ id: info.lastInsertRowid });
});

router.get('/records', (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, c.name as child_name, c.gender, c.birth_date
    FROM records r
    JOIN children c ON r.child_id = c.id
    ORDER BY r.record_date DESC, r.id DESC
  `).all();
  res.json(rows);
});

router.get('/records/:id', (req, res) => {
  const row = getRecordById(req.params.id);
  if (!row) return res.status(404).json({ error: '记录不存在' });
  res.json(row);
});

router.get('/records/:id/timeline', (req, res) => {
  const events = db.prepare(`
    SELECT * FROM timeline_events
    WHERE record_id = ?
    ORDER BY created_at ASC, id ASC
  `).all(req.params.id);
  const audits = db.prepare(`
    SELECT * FROM audits
    WHERE record_id = ?
    ORDER BY created_at ASC, id ASC
  `).all(req.params.id);
  res.json({ events, audits });
});

router.post('/records', upload.single('photo'), (req, res) => {
  const { child_id, record_date, sleep_start, sleep_end, sleep_duration,
    sleep_quality, environment, notes, created_by } = req.body;

  let photo_path = null;
  let photo_missing = 0;

  if (req.file) {
    photo_path = `/uploads/${req.file.filename}`;
  }

  const photoProvided = req.body.photo_provided === 'true' || req.body.photo_provided === true;
  const allowPartial = req.body.allow_partial === 'true' || req.body.allow_partial === true;

  if (!photo_path && photoProvided) {
    if (allowPartial) {
      photo_missing = 1;
    } else {
      return res.status(400).json({
        error: '照片缺失',
        partial_success: false,
        message: '未上传照片，如需部分提交请勾选"允许部分成功"'
      });
    }
  }

  const tx = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO records (child_id, record_date, sleep_start, sleep_end,
        sleep_duration, sleep_quality, environment, notes, photo_path,
        photo_missing, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(child_id, record_date, sleep_start, sleep_end,
      parseFloat(sleep_duration) || null, sleep_quality, environment,
      notes, photo_path, photo_missing, created_by);

    const recordId = info.lastInsertRowid;
    addTimeline(recordId, 'create',
      photo_missing ? `录入记录（照片缺失，已部分保存）` : `录入记录`,
      created_by);
    addAudit(recordId, 'create', null,
      { child_id, record_date, sleep_start, sleep_end, sleep_duration,
        sleep_quality, environment, notes, photo_missing },
      created_by, photo_missing ? '部分成功：照片缺失' : '新建记录');

    return recordId;
  });

  const recordId = tx();
  const rec = getRecordById(recordId);

  res.json({
    id: recordId,
    partial_success: photo_missing === 1,
    photo_missing: photo_missing === 1,
    record: rec
  });
});

router.put('/records/:id', upload.single('photo'), (req, res) => {
  const oldRec = getRecordById(req.params.id);
  if (!oldRec) return res.status(404).json({ error: '记录不存在' });

  const { child_id, record_date, sleep_start, sleep_end, sleep_duration,
    sleep_quality, environment, notes, operator } = req.body;

  let photo_path = oldRec.photo_path;
  let photo_missing = oldRec.photo_missing;

  if (req.file) {
    photo_path = `/uploads/${req.file.filename}`;
    photo_missing = 0;
  }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE records SET
        child_id = ?, record_date = ?, sleep_start = ?, sleep_end = ?,
        sleep_duration = ?, sleep_quality = ?, environment = ?, notes = ?,
        photo_path = ?, photo_missing = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(child_id, record_date, sleep_start, sleep_end,
      parseFloat(sleep_duration) || null, sleep_quality, environment,
      notes, photo_path, photo_missing, req.params.id);

    const newRec = getRecordById(req.params.id);
    const changes = {};
    ['child_id', 'record_date', 'sleep_start', 'sleep_end', 'sleep_duration',
     'sleep_quality', 'environment', 'notes', 'photo_path', 'photo_missing']
      .forEach(k => {
        if (oldRec[k] !== newRec[k]) changes[k] = { old: oldRec[k], new: newRec[k] };
      });

    addTimeline(req.params.id, 'update', `修改记录：${Object.keys(changes).join('、') || '无变更'}`, operator);
    addAudit(req.params.id, 'update',
      Object.keys(changes).length ? Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.old])
      ) : null,
      Object.keys(changes).length ? Object.fromEntries(
        Object.entries(changes).map(([k, v]) => [k, v.new])
      ) : null,
      operator, `修改字段: ${Object.keys(changes).join(', ') || '无'}`);
  });

  tx();
  const rec = getRecordById(req.params.id);
  res.json(rec);
});

router.post('/records/:id/submit', (req, res) => {
  const { operator } = req.body;
  const old = getRecordById(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });
  if (!['draft', 'rejected'].includes(old.status)) {
    return res.status(400).json({ error: '当前状态不可提交复核' });
  }

  db.prepare(`UPDATE records SET status = 'pending', updated_at = datetime('now', 'localtime') WHERE id = ?`)
    .run(req.params.id);
  addTimeline(req.params.id, 'submit', '提交复核', operator);
  addAudit(req.params.id, 'status_change', { status: old.status }, { status: 'pending' }, operator, '提交复核');
  res.json(getRecordById(req.params.id));
});

router.post('/records/:id/reject', (req, res) => {
  const { operator, remark } = req.body;
  const old = getRecordById(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });
  if (old.status !== 'pending') {
    return res.status(400).json({ error: '仅待复核记录可退回' });
  }

  db.prepare(`UPDATE records SET status = 'rejected', updated_at = datetime('now', 'localtime') WHERE id = ?`)
    .run(req.params.id);
  addTimeline(req.params.id, 'reject', `退回补充：${remark || '无备注'}`, operator);
  addAudit(req.params.id, 'status_change', { status: old.status }, { status: 'rejected' }, operator, remark || '退回补充');
  res.json(getRecordById(req.params.id));
});

router.post('/records/:id/approve', (req, res) => {
  const { operator } = req.body;
  const old = getRecordById(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });
  if (old.status !== 'pending') {
    return res.status(400).json({ error: '仅待复核记录可通过' });
  }

  db.prepare(`UPDATE records SET status = 'approved', updated_at = datetime('now', 'localtime') WHERE id = ?`)
    .run(req.params.id);
  addTimeline(req.params.id, 'approve', '复核通过', operator);
  addAudit(req.params.id, 'status_change', { status: old.status }, { status: 'approved' }, operator, '复核通过');
  res.json(getRecordById(req.params.id));
});

router.post('/records/:id/close', (req, res) => {
  const { operator } = req.body;
  const old = getRecordById(req.params.id);
  if (!old) return res.status(404).json({ error: '记录不存在' });
  if (old.status !== 'approved') {
    return res.status(400).json({ error: '仅已通过记录可归档' });
  }

  db.prepare(`UPDATE records SET status = 'closed', updated_at = datetime('now', 'localtime') WHERE id = ?`)
    .run(req.params.id);
  addTimeline(req.params.id, 'close', '关闭归档', operator);
  addAudit(req.params.id, 'status_change', { status: old.status }, { status: 'closed' }, operator, '关闭归档');
  res.json(getRecordById(req.params.id));
});

router.get('/export/summary', (req, res) => {
  const rows = db.prepare(`
    SELECT
      r.id, c.name as 儿童姓名, c.gender as 性别, c.birth_date as 出生日期,
      r.record_date as 记录日期, r.sleep_start as 入睡时间, r.sleep_end as 起床时间,
      r.sleep_duration as 睡眠时长, r.sleep_quality as 睡眠质量,
      r.environment as 环境情况, r.notes as 备注,
      CASE r.photo_missing WHEN 1 THEN '是' ELSE '否' END as 照片缺失,
      CASE r.status
        WHEN 'draft' THEN '草稿'
        WHEN 'pending' THEN '待复核'
        WHEN 'rejected' THEN '已退回'
        WHEN 'approved' THEN '已通过'
        WHEN 'closed' THEN '已归档'
      END as 状态,
      r.created_by as 录入人, r.created_at as 录入时间, r.updated_at as 最后更新
    FROM records r
    JOIN children c ON r.child_id = c.id
    ORDER BY r.record_date DESC
  `).all();

  const auditRows = db.prepare(`
    SELECT
      a.id, r.id as 记录ID, c.name as 儿童姓名,
      CASE a.action
        WHEN 'create' THEN '创建'
        WHEN 'update' THEN '修改'
        WHEN 'status_change' THEN '状态变更'
      END as 操作类型,
      a.old_value as 旧值, a.new_value as 新值,
      a.operator as 操作人, a.remark as 备注, a.created_at as 操作时间
    FROM audits a
    JOIN records r ON a.record_id = r.id
    JOIN children c ON r.child_id = c.id
    ORDER BY a.created_at DESC
  `).all();

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
      SUM(CASE WHEN photo_missing = 1 THEN 1 ELSE 0 END) as photo_missing
    FROM records
  `).get();

  const abnormalCount = db.prepare(`
    SELECT COUNT(*) as cnt FROM audits WHERE remark LIKE '%异常%' OR remark LIKE '%部分%'
  `).get().cnt;

  res.json({
    records: rows,
    audits: auditRows,
    stats: {
      ...stats,
      abnormal_count: abnormalCount,
      summary: `共${stats.total}条记录，其中草稿${stats.draft||0}，待复核${stats.pending||0}，已退回${stats.rejected||0}，已通过${stats.approved||0}，已归档${stats.closed||0}；照片缺失${stats.photo_missing||0}条，异常/部分成功记录${abnormalCount}条（详见审计表）`
    }
  });
});

router.get('/export/csv', (req, res) => {
  const data = db.prepare(`
    SELECT
      r.id, c.name as child_name, c.gender, c.birth_date,
      r.record_date, r.sleep_start, r.sleep_end,
      r.sleep_duration, r.sleep_quality, r.environment, r.notes,
      r.photo_missing, r.status, r.created_by, r.created_at, r.updated_at
    FROM records r
    JOIN children c ON r.child_id = c.id
    ORDER BY r.record_date DESC
  `).all();

  const fields = [
    { label: 'ID', value: 'id' },
    { label: '儿童姓名', value: 'child_name' },
    { label: '性别', value: 'gender' },
    { label: '出生日期', value: 'birth_date' },
    { label: '记录日期', value: 'record_date' },
    { label: '入睡时间', value: 'sleep_start' },
    { label: '起床时间', value: 'sleep_end' },
    { label: '睡眠时长(小时)', value: 'sleep_duration' },
    { label: '睡眠质量', value: 'sleep_quality' },
    { label: '环境', value: 'environment' },
    { label: '备注', value: 'notes' },
    { label: '照片缺失', value: row => row.photo_missing ? '是' : '否' },
    { label: '状态', value: row => ({draft:'草稿',pending:'待复核',rejected:'已退回',approved:'已通过',closed:'已归档'})[row.status] },
    { label: '录入人', value: 'created_by' },
    { label: '录入时间', value: 'created_at' },
    { label: '更新时间', value: 'updated_at' }
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(data);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sleep_records.csv"');
  res.send('\ufeff' + csv);
});

router.get('/export/audit/csv', (req, res) => {
  const data = db.prepare(`
    SELECT
      a.id, r.id as record_id, c.name as child_name,
      a.action, a.old_value, a.new_value, a.operator, a.remark, a.created_at
    FROM audits a
    JOIN records r ON a.record_id = r.id
    JOIN children c ON r.child_id = c.id
    ORDER BY a.created_at DESC
  `).all();

  const fields = [
    { label: '审计ID', value: 'id' },
    { label: '记录ID', value: 'record_id' },
    { label: '儿童姓名', value: 'child_name' },
    { label: '操作类型', value: row => ({create:'创建',update:'修改',status_change:'状态变更'})[row.action] || row.action },
    { label: '旧值', value: 'old_value' },
    { label: '新值', value: 'new_value' },
    { label: '操作人', value: 'operator' },
    { label: '备注', value: 'remark' },
    { label: '操作时间', value: 'created_at' }
  ];

  const parser = new Parser({ fields });
  const csv = parser.parse(data);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="audit_log.csv"');
  res.send('\ufeff' + csv);
});

module.exports = router;
