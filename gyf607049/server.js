const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const db = require('./db');
const { logAudit, getAuditByAuth, getAllAudit, getMissingOperatorAudits, VALID_OPERATORS } = require('./audit');
const { getFullAuth, getAllAuths, buildSummary } = require('./auth-service');
const { exportCsv, exportMarkdown } = require('./exporter');

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    cb(null, `${ts}-${file.originalname.replace(/[^\w.\-]/g, '_')}`);
  }
});
const upload = multer({ storage });

const app = express();
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

function touchAuth(id) {
  db.prepare("UPDATE authorizations SET updated_at = datetime('now','localtime') WHERE id = ?").run(id);
}

app.get('/api/operators', (req, res) => {
  res.json(VALID_OPERATORS);
});

app.get('/api/authorizations', (req, res) => {
  res.json(getAllAuths());
});

app.get('/api/authorizations/:id', (req, res) => {
  const auth = getFullAuth(req.params.id);
  if (!auth) return res.status(404).json({ error: '记录不存在' });
  res.json(auth);
});

app.post('/api/authorizations', (req, res) => {
  const b = req.body || {};
  if (!b.baby_name || !b.authorized_person) {
    return res.status(400).json({ error: '宝宝姓名和被授权人必填' });
  }
  const stmt = db.prepare(`
    INSERT INTO authorizations
    (baby_name, baby_dob, room_number, mother_name, authorized_person,
     id_card, phone, relationship, auth_type, phone_auth_by, phone_auth_note,
     temp_auntie_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    b.baby_name, b.baby_dob || null, b.room_number || null, b.mother_name || null,
    b.authorized_person, b.id_card || null, b.phone || null, b.relationship || null,
    b.auth_type || 'normal',
    b.phone_auth_by || null, b.phone_auth_note || null,
    b.temp_auntie_name || null,
    b.status || 'pending'
  );
  const id = info.lastInsertRowid;
  logAudit({
    authorization_id: id,
    action: 'create',
    operator: b.operator,
    detail: `创建授权记录：${b.baby_name}-${b.authorized_person}`
  });
  res.json(getFullAuth(id));
});

app.put('/api/authorizations/:id', (req, res) => {
  const id = Number(req.params.id);
  const old = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(id);
  if (!old) return res.status(404).json({ error: '记录不存在' });
  const b = req.body || {};
  const fields = ['baby_name', 'baby_dob', 'room_number', 'mother_name',
    'authorized_person', 'id_card', 'phone', 'relationship',
    'auth_type', 'phone_auth_by', 'phone_auth_note', 'temp_auntie_name', 'status'];
  const updates = {};
  for (const f of fields) {
    if (b[f] !== undefined) {
      updates[f] = b[f];
      if (old[f] !== b[f]) {
        logAudit({
          authorization_id: id, action: 'update', field: f,
          old_value: old[f], new_value: b[f], operator: b.operator
        });
      }
    }
  }
  if (Object.keys(updates).length) {
    const sets = Object.keys(updates).map(k => `${k}=?`).join(',');
    const vals = Object.values(updates);
    db.prepare(`UPDATE authorizations SET ${sets}, updated_at=datetime('now','localtime') WHERE id=?`)
      .run(...vals, id);
  }
  if (b.status === 'closed' && old.status !== 'closed') {
    db.prepare("UPDATE authorizations SET closed_at=datetime('now','localtime'), closed_by=? WHERE id=?")
      .run(b.operator || null, id);
    logAudit({ authorization_id: id, action: 'close', operator: b.operator, detail: '关闭授权记录' });
  }
  res.json(getFullAuth(id));
});

app.post('/api/authorizations/:id/append-materials', upload.array('photos', 10), (req, res) => {
  const id = Number(req.params.id);
  const auth = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(id);
  if (!auth) return res.status(404).json({ error: '记录不存在' });
  const operator = req.body.operator;
  const descriptions = Array.isArray(req.body.descriptions) ? req.body.descriptions : [];
  const results = { photos: { success: [], failed: [] }, rectifications: { success: [], failed: [] }, warnings: [] };

  if (auth.status === 'closed') {
    results.warnings.push('记录已关闭，允许部分追加但需主管复查');
  }

  const files = req.files || [];
  files.forEach((file, idx) => {
    try {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/i)) {
        results.photos.failed.push({ name: file.originalname, reason: '文件格式不支持' });
        try { fs.unlinkSync(file.path); } catch (e) {}
        return;
      }
      const desc = descriptions[idx] || '';
      const info = db.prepare(`
        INSERT INTO photos (authorization_id, filename, description, uploaded_by)
        VALUES (?, ?, ?, ?)
      `).run(id, file.filename, desc, operator || null);
      results.photos.success.push({ id: info.lastInsertRowid, filename: file.filename, description: desc });
      logAudit({
        authorization_id: id, action: 'append_photo', operator,
        detail: `追加照片：${file.filename} (${desc || '无说明'})`
      });
    } catch (e) {
      results.photos.failed.push({ name: file.originalname, reason: e.message });
    }
  });

  const rectList = Array.isArray(req.body.rectifications) ? req.body.rectifications : [];
  rectList.forEach((r, idx) => {
    try {
      if (!r || !r.content) {
        results.rectifications.failed.push({ index: idx, reason: '整改内容为空' });
        return;
      }
      if (r.content.length > 500) {
        results.rectifications.failed.push({ index: idx, reason: '整改内容超过500字' });
        return;
      }
      const info = db.prepare(`
        INSERT INTO rectifications (authorization_id, content, handler, status)
        VALUES (?, ?, ?, ?)
      `).run(id, r.content, r.handler || null, r.status || 'pending');
      results.rectifications.success.push({ id: info.lastInsertRowid, content: r.content });
      logAudit({
        authorization_id: id, action: 'append_rectification', operator,
        detail: `追加整改：${r.content.substring(0, 40)}`
      });
    } catch (e) {
      results.rectifications.failed.push({ index: idx, reason: e.message });
    }
  });

  touchAuth(id);
  const okCount = results.photos.success.length + results.rectifications.success.length;
  const failCount = results.photos.failed.length + results.rectifications.failed.length;
  const hasFail = failCount > 0;

  if (hasFail) {
    logAudit({
      authorization_id: id, action: 'append_partial_failure', operator,
      detail: `部分成功：成功${okCount}项，失败${failCount}项`
    });
  } else {
    logAudit({
      authorization_id: id, action: 'append_materials', operator,
      detail: `追加材料成功：${okCount}项`
    });
  }

  res.status(hasFail ? 207 : 200).json({
    ok: okCount > 0,
    partial: hasFail,
    success_count: okCount,
    fail_count: failCount,
    results,
    authorization: getFullAuth(id)
  });
});

app.put('/api/photos/:id', (req, res) => {
  const id = Number(req.params.id);
  const p = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: '照片不存在' });
  const b = req.body || {};
  if (b.description !== undefined && p.description !== b.description) {
    logAudit({
      authorization_id: p.authorization_id, action: 'update', field: 'photo_description',
      old_value: p.description, new_value: b.description, operator: b.operator,
      detail: `照片#${p.id}说明修改`
    });
    db.prepare('UPDATE photos SET description = ? WHERE id = ?').run(b.description, id);
    touchAuth(p.authorization_id);
  }
  res.json(db.prepare('SELECT * FROM photos WHERE id = ?').get(id));
});

app.put('/api/rectifications/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare('SELECT * FROM rectifications WHERE id = ?').get(id);
  if (!r) return res.status(404).json({ error: '整改记录不存在' });
  const b = req.body || {};
  const updates = {};
  if (b.content !== undefined) updates.content = b.content;
  if (b.status !== undefined) updates.status = b.status;
  if (b.handler !== undefined) updates.handler = b.handler;
  for (const [k, v] of Object.entries(updates)) {
    if (r[k] !== v) {
      logAudit({
        authorization_id: r.authorization_id, action: 'update', field: `rectification_${k}`,
        old_value: r[k], new_value: v, operator: b.operator,
        detail: `整改#${r.id}字段${k}变更`
      });
    }
  }
  if (Object.keys(updates).length) {
    const sets = Object.keys(updates).map(k => `${k}=?`).join(',');
    const vals = Object.values(updates);
    db.prepare(`UPDATE rectifications SET ${sets}, updated_at=datetime('now','localtime') WHERE id=?`)
      .run(...vals, id);
    touchAuth(r.authorization_id);
  }
  res.json(db.prepare('SELECT * FROM rectifications WHERE id = ?').get(id));
});

app.get('/api/authorizations/:id/audit', (req, res) => {
  res.json(getAuditByAuth(req.params.id));
});

app.get('/api/audit', (req, res) => {
  if (req.query.missing_operator === '1') {
    res.json(getMissingOperatorAudits());
  } else {
    res.json(getAllAudit());
  }
});

app.get('/api/export/csv', (req, res) => {
  const id = req.query.id ? Number(req.query.id) : null;
  const csv = exportCsv(id);
  const fname = id ? `authorization-${id}.csv` : `authorizations-${Date.now()}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  res.send('\ufeff' + csv);
});

app.get('/api/export/markdown', (req, res) => {
  const id = req.query.id ? Number(req.query.id) : null;
  const md = exportMarkdown(id);
  const fname = id ? `authorization-${id}.md` : `authorizations-${Date.now()}.md`;
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  res.send(md);
});

app.get('/api/export/preview', (req, res) => {
  const id = req.query.id ? Number(req.query.id) : null;
  res.json({
    csv: exportCsv(id),
    markdown: exportMarkdown(id),
    summary_line: id
      ? (getFullAuth(id) ? buildSummary(getFullAuth(id)) : null)
      : `共 ${getAllAuths().length} 条记录`
  });
});

function seedDemo() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM authorizations').get().c;
  if (count > 0) return;
  const samples = [
    {
      baby_name: '李小宝', baby_dob: '2026-05-01', room_number: '302', mother_name: '王女士',
      authorized_person: '李建国', id_card: '310101198001011234', phone: '13800138000',
      relationship: '父亲', auth_type: 'normal', status: 'approved'
    },
    {
      baby_name: '张小美', baby_dob: '2026-05-10', room_number: '405', mother_name: '刘女士',
      authorized_person: '赵阿姨', phone: '13900139000',
      relationship: '临时护理', auth_type: 'phone',
      phone_auth_by: '张护士(电话138xxxx1234)', phone_auth_note: '母亲住院，电话委托赵阿姨接3天',
      status: 'pending'
    },
    {
      baby_name: '王豆豆', baby_dob: '2026-04-20', room_number: '201', mother_name: '陈女士',
      authorized_person: '孙阿姨', phone: '13700137000',
      relationship: '临时阿姨', auth_type: 'mixed',
      phone_auth_by: '陈主管', phone_auth_note: '电话确认+临时阿姨双重授权',
      temp_auntie_name: '孙美华', status: 'rectifying'
    }
  ];
  for (const s of samples) {
    const stmt = db.prepare(`
      INSERT INTO authorizations
      (baby_name, baby_dob, room_number, mother_name, authorized_person,
       id_card, phone, relationship, auth_type, phone_auth_by, phone_auth_note,
       temp_auntie_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      s.baby_name, s.baby_dob, s.room_number, s.mother_name, s.authorized_person,
      s.id_card || null, s.phone || null, s.relationship || null, s.auth_type,
      s.phone_auth_by || null, s.phone_auth_note || null, s.temp_auntie_name || null, s.status
    );
    logAudit({ authorization_id: info.lastInsertRowid, action: 'create', operator: 'nurse_zhang',
      detail: `初始化示例数据：${s.baby_name}` });
    if (s.auth_type === 'mixed' || s.auth_type === 'phone') {
      logAudit({ authorization_id: info.lastInsertRowid, action: 'phone_auth_confirm', operator: null,
        detail: '电话授权确认，操作人未能从会话中获取，主管需复查' });
    }
  }
  const mixedId = db.prepare("SELECT id FROM authorizations WHERE auth_type='mixed' ORDER BY id").get()?.id;
  if (mixedId) {
    db.prepare(`INSERT INTO photos (authorization_id, filename, description, uploaded_by)
      VALUES (?, ?, ?, ?)`).run(mixedId, 'demo-idcard-front.jpg', '接送人身份证正面', 'nurse_li');
    db.prepare(`INSERT INTO rectifications (authorization_id, content, handler, status)
      VALUES (?, ?, ?, ?)`).run(mixedId, '临时阿姨健康证有效期待核对，补充最新体检报告', 'auntie_wang', 'pending');
    logAudit({ authorization_id: mixedId, action: 'append_materials', operator: 'nurse_li',
      detail: '初始化示例：追加照片和整改记录' });
  }
}

const PORT = process.env.PORT || 3000;
seedDemo();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`婴幼儿接送授权回访册 服务已启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
