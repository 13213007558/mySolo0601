const express = require('express');
const db = require('../db');
const { authRequired, roleRequired, audit, canAccessRecord } = require('../auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const { baby_id, class_id, status } = req.query;
  let sql = `SELECT DISTINCT r.*, b.name as baby_name, b.gender, b.birthday,
                    c.name as class_name, bc.status as enrollment_status,
                    u.name as consultant_name
             FROM records r
             JOIN babies b ON r.baby_id = b.id
             JOIN baby_classes bc ON r.baby_class_id = bc.id
             JOIN classes c ON bc.class_id = c.id
             JOIN users u ON r.consultant_id = u.id
             WHERE 1=1`;
  const params = [];

  if (req.user.role === 'consultant') {
    sql += ' AND r.consultant_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'parent') {
    sql += ' AND b.parent_id = ?';
    params.push(req.user.id);
  }

  if (baby_id) { sql += ' AND r.baby_id = ?'; params.push(baby_id); }
  if (class_id) { sql += ' AND bc.class_id = ?'; params.push(class_id); }
  if (status) { sql += ' AND r.current_status = ?'; params.push(status); }

  sql += ' ORDER BY r.updated_at DESC';
  const rows = db.prepare(sql).all(...params);

  rows.forEach(r => {
    if (!canAccessRecord(req.user, r)) {
      audit(req, 'unauthorized_access_attempt', 'record', r.id,
        `用户${req.user.role}尝试查看非授权记录`);
    }
  });

  res.json({ records: rows });
});

router.get('/:id', authRequired, (req, res) => {
  const record = db.prepare(`
    SELECT r.*, b.name as baby_name, b.gender, b.birthday, b.parent_id,
           c.name as class_name, bc.status as enrollment_status, bc.class_id,
           u.name as consultant_name, up.name as parent_name
    FROM records r
    JOIN babies b ON r.baby_id = b.id
    JOIN baby_classes bc ON r.baby_class_id = bc.id
    JOIN classes c ON bc.class_id = c.id
    JOIN users u ON r.consultant_id = u.id
    LEFT JOIN users up ON b.parent_id = up.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!record) return res.status(404).json({ error: '记录不存在' });

  if (!canAccessRecord(req.user, record)) {
    audit(req, 'unauthorized_view', 'record', record.id,
      `越权查看记录 ID:${record.id}`);
    return res.status(403).json({ error: '无权查看该记录（已留痕审计）' });
  }

  audit(req, 'view', 'record', record.id, null);

  const timeline = db.prepare(`
    SELECT t.*, u.name as actor_name, u.role as actor_role
    FROM timeline_events t
    JOIN users u ON t.actor_id = u.id
    WHERE t.record_id = ?
    ORDER BY t.created_at ASC
  `).all(record.id);

  const notes = db.prepare(`
    SELECT n.*, u.name as author_name, u.role as author_role
    FROM notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.record_id = ?
    ORDER BY n.created_at ASC
  `).all(record.id);

  const returns = db.prepare(`
    SELECT rr.*, u.name as requester_name
    FROM return_requests rr
    JOIN users u ON rr.requester_id = u.id
    WHERE rr.record_id = ?
    ORDER BY rr.created_at DESC
  `).all(record.id);

  res.json({ record, timeline, notes, returns });
});

router.post('/', authRequired, roleRequired('consultant'), (req, res) => {
  const { baby_id, baby_class_id, title, sleep_quality, sleep_duration, environment, materials } = req.body;
  if (!baby_id || !baby_class_id || !title) {
    return res.status(400).json({ error: '必填字段缺失' });
  }

  const info = db.prepare(`
    INSERT INTO records (baby_id, baby_class_id, consultant_id, title, sleep_quality, sleep_duration, environment, materials, current_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(baby_id, baby_class_id, req.user.id, title, sleep_quality || null, sleep_duration || null, environment || null, materials || null);

  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'create', NULL, 'draft', ?)
  `).run(info.lastInsertRowid, req.user.id, '录入观察材料');

  audit(req, 'create', 'record', info.lastInsertRowid, title);
  res.json({ id: info.lastInsertRowid });
});

router.put('/:id', authRequired, roleRequired('consultant'), (req, res) => {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  if (record.consultant_id !== req.user.id) {
    return res.status(403).json({ error: '只能修改自己的记录' });
  }
  if (record.current_status === 'archived') {
    return res.status(400).json({ error: '已归档记录不可修改' });
  }

  const { title, sleep_quality, sleep_duration, environment, materials } = req.body;
  db.prepare(`
    UPDATE records SET title=?, sleep_quality=?, sleep_duration=?, environment=?, materials=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(title, sleep_quality, sleep_duration, environment, materials, req.params.id);

  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'edit', ?, ?, '修改观察材料')
  `).run(req.params.id, req.user.id, record.current_status, record.current_status);

  audit(req, 'edit', 'record', req.params.id, null);
  res.json({ ok: true });
});

router.post('/:id/submit', authRequired, roleRequired('consultant'), (req, res) => {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  if (record.consultant_id !== req.user.id) return res.status(403).json({ error: '只能提交自己的记录' });
  if (record.current_status !== 'draft' && record.current_status !== 'returned') {
    return res.status(400).json({ error: '当前状态不可提交复核' });
  }

  db.prepare("UPDATE records SET current_status='reviewing', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'submit', ?, 'reviewing', ?)
  `).run(req.params.id, req.user.id, record.current_status, req.body.comment || '提交复核');

  audit(req, 'submit', 'record', req.params.id, null);
  res.json({ ok: true });
});

router.post('/:id/return', authRequired, roleRequired('consultant', 'supervisor'), (req, res) => {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  if (record.current_status !== 'reviewing') {
    return res.status(400).json({ error: '只有复核中状态可退回' });
  }

  const { reason, required_fields } = req.body;
  if (!reason) return res.status(400).json({ error: '退回原因必填' });

  db.prepare("UPDATE records SET current_status='returned', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'return', 'reviewing', 'returned', ?)
  `).run(req.params.id, req.user.id, `退回补充：${reason}`);

  db.prepare(`
    INSERT INTO return_requests (record_id, requester_id, reason, required_fields)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, reason, required_fields || null);

  audit(req, 'return', 'record', req.params.id, reason);
  res.json({ ok: true });
});

router.post('/:id/archive', authRequired, roleRequired('consultant', 'supervisor'), (req, res) => {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  if (record.current_status !== 'reviewing') {
    return res.status(400).json({ error: '只有复核通过后可归档' });
  }

  db.prepare("UPDATE records SET current_status='archived', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.params.id);
  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'archive', 'reviewing', 'archived', ?)
  `).run(req.params.id, req.user.id, req.body.comment || '复核通过，关闭归档');

  audit(req, 'archive', 'record', req.params.id, null);
  res.json({ ok: true });
});

router.post('/:id/notes', authRequired, roleRequired('consultant'), (req, res) => {
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  if (record.consultant_id !== req.user.id) return res.status(403).json({ error: '无权添加备注' });

  const { content, is_promise } = req.body;
  if (!content) return res.status(400).json({ error: '备注内容必填' });

  const info = db.prepare(`
    INSERT INTO notes (record_id, author_id, content, is_promise) VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, content, is_promise ? 1 : 0);

  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'note_add', ?, ?, ?)
  `).run(req.params.id, req.user.id, record.current_status, record.current_status,
    is_promise ? `新增承诺备注：${content}` : `新增备注：${content}`);

  audit(req, 'note_add', 'record', req.params.id, content);
  res.json({ id: info.lastInsertRowid });
});

router.post('/:id/transfer', authRequired, roleRequired('consultant', 'supervisor'), (req, res) => {
  const { record_id, to_class_id, baby_id } = req.body;
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(record_id || req.params.id);
  if (!record) return res.status(404).json({ error: '记录不存在' });

  const actualBabyId = baby_id || record.baby_id;
  const currentBC = db.prepare('SELECT * FROM baby_classes WHERE id = ?').get(record.baby_class_id);

  let newBC = db.prepare('SELECT * FROM baby_classes WHERE baby_id = ? AND class_id = ?')
    .get(actualBabyId, to_class_id);

  let partialSuccess = false;
  let bcId = null;

  if (!newBC) {
    try {
      const info = db.prepare(`
        INSERT INTO baby_classes (baby_id, class_id, status, transferred_from_id)
        VALUES (?, ?, 'active', ?)
      `).run(actualBabyId, to_class_id, currentBC ? currentBC.id : null);
      bcId = info.lastInsertRowid;
    } catch (e) {
      partialSuccess = true;
    }
  } else {
    bcId = newBC.id;
  }

  if (currentBC && (!newBC || newBC.status !== 'active')) {
    try {
      db.prepare("UPDATE baby_classes SET status='transferred' WHERE id = ?").run(currentBC.id);
    } catch (e) {
      partialSuccess = true;
    }
  }

  if (bcId) {
    db.prepare('UPDATE records SET baby_class_id = ?, updated_at=CURRENT_TIMESTAMP WHERE id = ?')
      .run(bcId, record.id);
  }

  const className = db.prepare('SELECT name FROM classes WHERE id = ?').get(to_class_id);
  db.prepare(`
    INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content)
    VALUES (?, ?, 'transfer', ?, ?, ?)
  `).run(record.id, req.user.id, record.current_status, record.current_status,
    `换班至${className ? className.name : '新班级'}${partialSuccess ? '（部分成功，原班级状态需手工核查）' : ''}`);

  audit(req, 'transfer', 'record', record.id,
    `换班到class ${to_class_id}${partialSuccess ? ' - partial' : ''}`);

  res.json({ ok: true, partial_success: partialSuccess });
});

module.exports = router;
