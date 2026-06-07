const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const { initDb, queryAll, queryOne, run, lastInsertId, now, saveDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const EXPORT_DIR = path.join(__dirname, 'exports');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('仅允许上传图片文件'));
  },
});

const VALID_TRANSITIONS = {
  DRAFT: ['REVIEW'],
  REVIEW: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: [],
};

function isValidTransition(from, to) {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

function writeAudit(observationId, action, fromStatus, toStatus, operator, remark, snapshot) {
  run(
    `INSERT INTO audit_log (observation_id, action, from_status, to_status, operator, remark, snapshot_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [observationId, action, fromStatus || null, toStatus || null, operator, remark || null, snapshot ? JSON.stringify(snapshot) : null, now()]
  );
}

function getObsDetail(id) {
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!obs) return null;
  const photos = queryAll('SELECT * FROM photos WHERE observation_id = ? ORDER BY uploaded_at', [id]);
  const corrections = queryAll('SELECT * FROM corrections WHERE observation_id = ? ORDER BY rejected_at', [id]);
  const audit = queryAll('SELECT * FROM audit_log WHERE observation_id = ? ORDER BY created_at, id', [id]);
  return { ...obs, photos, corrections, audit };
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: now() });
});

app.get('/api/observations', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM observations';
  const params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = queryAll(sql, params);
  res.json(rows);
});

app.post('/api/observations', (req, res) => {
  const { baby_name, room_no, nurse_name, sleep_start, sleep_end, sleep_quality, position, notes } = req.body || {};
  if (!baby_name || !nurse_name || !sleep_start) {
    return res.status(400).json({ error: '缺少必填字段：baby_name, nurse_name, sleep_start' });
  }
  const ts = now();
  run(
    `INSERT INTO observations (baby_name, room_no, nurse_name, sleep_start, sleep_end, sleep_quality, position, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
    [baby_name, room_no || null, nurse_name, sleep_start, sleep_end || null, sleep_quality || null, position || null, notes || null, ts, ts]
  );
  const id = lastInsertId();
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'CREATE', null, 'DRAFT', nurse_name || 'system', '创建睡眠观察记录', obs);
  res.status(201).json(obs);
});

app.get('/api/observations/:id', (req, res) => {
  const detail = getObsDetail(req.params.id);
  if (!detail) return res.status(404).json({ error: '记录不存在' });
  res.json(detail);
});

app.put('/api/observations/:id', (req, res) => {
  const id = Number(req.params.id);
  const existing = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  if (existing.status === 'ARCHIVED') return res.status(400).json({ error: '已归档记录不可修改' });

  const { baby_name, room_no, nurse_name, sleep_start, sleep_end, sleep_quality, position, notes } = req.body || {};
  const ts = now();
  run(
    `UPDATE observations SET baby_name=?, room_no=?, nurse_name=?, sleep_start=?, sleep_end=?, sleep_quality=?, position=?, notes=?, updated_at=? WHERE id=?`,
    [
      baby_name ?? existing.baby_name,
      room_no ?? existing.room_no,
      nurse_name ?? existing.nurse_name,
      sleep_start ?? existing.sleep_start,
      sleep_end ?? existing.sleep_end,
      sleep_quality ?? existing.sleep_quality,
      position ?? existing.position,
      notes ?? existing.notes,
      ts,
      id,
    ]
  );
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'UPDATE', existing.status, existing.status, (req.body || {}).nurse_name || existing.nurse_name, '更新记录内容', obs);
  res.json(obs);
});

app.post('/api/observations/:id/photos', upload.single('photo'), (req, res) => {
  const id = Number(req.params.id);
  const existing = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  if (!req.file) return res.status(400).json({ error: '未上传文件' });
  const description = req.body.description || '';
  const relativePath = `/uploads/${req.file.filename}`;
  run(
    `INSERT INTO photos (observation_id, file_path, description, uploaded_at) VALUES (?, ?, ?, ?)`,
    [id, relativePath, description, now()]
  );
  const photoId = lastInsertId();
  const photo = queryOne('SELECT * FROM photos WHERE id = ?', [photoId]);
  writeAudit(id, 'UPLOAD_PHOTO', existing.status, existing.status, req.body.operator || 'nurse', `上传照片：${description || req.file.originalname}`, photo);
  res.status(201).json(photo);
});

app.post('/api/observations/:id/submit', (req, res) => {
  const id = Number(req.params.id);
  const existing = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  if (!isValidTransition(existing.status, 'REVIEW')) {
    return res.status(400).json({ error: `当前状态 ${existing.status} 不可提交复核` });
  }
  const { operator } = req.body || {};
  const ts = now();
  run(`UPDATE observations SET status='REVIEW', updated_at=? WHERE id=?`, [ts, id]);
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'SUBMIT', existing.status, 'REVIEW', operator || existing.nurse_name, '提交复核', obs);
  res.json(obs);
});

app.post('/api/observations/:id/reject', (req, res) => {
  const id = Number(req.params.id);
  const existing = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  if (!isValidTransition(existing.status, 'DRAFT')) {
    return res.status(400).json({ error: `当前状态 ${existing.status} 不可退回` });
  }
  const { reject_reason, rejected_by } = req.body || {};
  if (!reject_reason || !rejected_by) return res.status(400).json({ error: '缺少 reject_reason 或 rejected_by' });
  const ts = now();
  run(`UPDATE observations SET status='DRAFT', updated_at=? WHERE id=?`, [ts, id]);
  run(
    `INSERT INTO corrections (observation_id, reject_reason, rejected_by, rejected_at) VALUES (?, ?, ?, ?)`,
    [id, reject_reason, rejected_by, ts]
  );
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'REJECT', existing.status, 'DRAFT', rejected_by, `退回补充：${reject_reason}`, obs);
  res.json(obs);
});

app.post('/api/observations/:id/correct', (req, res) => {
  const id = Number(req.params.id);
  const existing = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  const { correction_content, corrected_by } = req.body || {};
  if (!correction_content || !corrected_by) return res.status(400).json({ error: '缺少 correction_content 或 corrected_by' });
  const ts = now();
  const lastCorrection = queryOne(
    `SELECT * FROM corrections WHERE observation_id = ? ORDER BY rejected_at DESC LIMIT 1`,
    [id]
  );
  if (!lastCorrection) return res.status(400).json({ error: '无待整改记录' });
  run(
    `UPDATE corrections SET correction_content=?, corrected_by=?, corrected_at=? WHERE id=?`,
    [correction_content, corrected_by, ts, lastCorrection.id]
  );
  run(`UPDATE observations SET updated_at=? WHERE id=?`, [ts, id]);
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'CORRECT', existing.status, existing.status, corrected_by, `整改补充：${correction_content}`, obs);
  res.json(obs);
});

app.post('/api/observations/:id/archive', (req, res) => {
  const id = Number(req.params.id);
  const existing = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: '记录不存在' });
  if (!isValidTransition(existing.status, 'ARCHIVED')) {
    return res.status(400).json({ error: `当前状态 ${existing.status} 不可归档，请先提交复核` });
  }
  const { operator } = req.body || {};
  const ts = now();
  run(`UPDATE observations SET status='ARCHIVED', updated_at=? WHERE id=?`, [ts, id]);
  const obs = queryOne('SELECT * FROM observations WHERE id = ?', [id]);
  writeAudit(id, 'ARCHIVE', existing.status, 'ARCHIVED', operator || 'supervisor', '关闭归档', obs);
  res.json(obs);
});

app.get('/api/observations/:id/audit', (req, res) => {
  const rows = queryAll(
    'SELECT * FROM audit_log WHERE observation_id = ? ORDER BY created_at, id',
    [req.params.id]
  );
  res.json(rows);
});

app.get('/api/export', (req, res) => {
  const rows = queryAll(`
    SELECT o.*,
      (SELECT GROUP_CONCAT(file_path || '|' || COALESCE(description,''), '; ') FROM photos p WHERE p.observation_id = o.id) AS photos,
      (SELECT COUNT(*) FROM audit_log a WHERE a.observation_id = o.id) AS audit_count
    FROM observations o
    ORDER BY o.created_at DESC
  `);
  const filename = `export-${Date.now()}.csv`;
  const filePath = path.join(EXPORT_DIR, filename);
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      { id: 'id', title: 'ID' },
      { id: 'baby_name', title: '婴幼儿姓名' },
      { id: 'room_no', title: '房间号' },
      { id: 'nurse_name', title: '护理员' },
      { id: 'sleep_start', title: '睡眠开始' },
      { id: 'sleep_end', title: '睡眠结束' },
      { id: 'sleep_quality', title: '睡眠质量' },
      { id: 'position', title: '睡姿' },
      { id: 'notes', title: '备注' },
      { id: 'status', title: '状态' },
      { id: 'photos', title: '照片' },
      { id: 'audit_count', title: '审计条数' },
      { id: 'created_at', title: '创建时间' },
      { id: 'updated_at', title: '更新时间' },
    ],
  });
  csvWriter.writeRecords(rows).then(() => {
    res.download(filePath, filename, (err) => {
      if (err) console.error('下载失败', err);
    });
  }).catch((err) => {
    res.status(500).json({ error: '导出失败', detail: err.message });
  });
});

app.get('/api/export/audit/:id?', (req, res) => {
  const params = [];
  let sql = `SELECT a.*, o.baby_name FROM audit_log a LEFT JOIN observations o ON a.observation_id = o.id`;
  if (req.params.id) {
    sql += ' WHERE a.observation_id = ?';
    params.push(Number(req.params.id));
  }
  sql += ' ORDER BY a.created_at, a.id';
  const rows = queryAll(sql, params);
  const filename = `audit-export-${Date.now()}.csv`;
  const filePath = path.join(EXPORT_DIR, filename);
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      { id: 'id', title: '审计ID' },
      { id: 'observation_id', title: '记录ID' },
      { id: 'baby_name', title: '婴幼儿姓名' },
      { id: 'action', title: '动作' },
      { id: 'from_status', title: '原状态' },
      { id: 'to_status', title: '新状态' },
      { id: 'operator', title: '操作人' },
      { id: 'remark', title: '备注' },
      { id: 'created_at', title: '时间' },
    ],
  });
  csvWriter.writeRecords(rows).then(() => {
    res.download(filePath, filename);
  }).catch((err) => {
    res.status(500).json({ error: '导出失败', detail: err.message });
  });
});

app.get('/api/crash-test', (req, res) => {
  const obs = queryOne('SELECT * FROM observations ORDER BY id DESC LIMIT 1');
  if (obs) {
    writeAudit(obs.id, 'CRASH_TEST', obs.status, obs.status, 'system', '异常测试前写入的审计记录（即使服务崩溃也保留）', obs);
  }
  saveDb();
  res.json({ ok: true, note: '已写入审计记录。现在可以用 Ctrl+C 手动杀进程模拟服务重启，重启后详情页仍可看到审计、照片和整改记录。' });
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  saveDb();
  res.status(500).json({ error: err.message || '服务器错误' });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`服务已启动: http://localhost:${PORT}`);
    console.log(`数据库文件: ${path.join(__dirname, 'data', 'app.db')}`);
    console.log(`照片目录: ${UPLOAD_DIR}`);
    console.log(`导出目录: ${EXPORT_DIR}`);
  });
}).catch((err) => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
