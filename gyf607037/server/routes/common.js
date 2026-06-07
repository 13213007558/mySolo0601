const express = require('express');
const db = require('../db');
const { authRequired, roleRequired, audit } = require('../auth');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.get('/babies', authRequired, (req, res) => {
  let sql = `SELECT b.*, u.name as parent_name FROM babies b LEFT JOIN users u ON b.parent_id = u.id WHERE 1=1`;
  const params = [];
  if (req.user.role === 'parent') {
    sql += ' AND b.parent_id = ?';
    params.push(req.user.id);
  }
  const rows = db.prepare(sql).all(...params);
  res.json({ babies: rows });
});

router.post('/babies', authRequired, roleRequired('consultant', 'supervisor'), (req, res) => {
  const { name, gender, birthday, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: '宝宝姓名必填' });
  const info = db.prepare(
    'INSERT INTO babies (name, gender, birthday, parent_id) VALUES (?, ?, ?, ?)'
  ).run(name, gender || null, birthday || null, parent_id || null);
  audit(req, 'create', 'baby', info.lastInsertRowid, name);
  res.json({ id: info.lastInsertRowid });
});

router.get('/classes', authRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM classes ORDER BY id').all();
  res.json({ classes: rows });
});

router.get('/baby-classes', authRequired, (req, res) => {
  const { baby_id } = req.query;
  let sql = `SELECT bc.*, b.name as baby_name, c.name as class_name
             FROM baby_classes bc
             JOIN babies b ON bc.baby_id = b.id
             JOIN classes c ON bc.class_id = c.id WHERE 1=1`;
  const params = [];
  if (baby_id) { sql += ' AND bc.baby_id = ?'; params.push(baby_id); }
  if (req.user.role === 'parent') {
    sql += ' AND b.parent_id = ?';
    params.push(req.user.id);
  }
  const rows = db.prepare(sql).all(...params);
  res.json({ baby_classes: rows });
});

router.post('/baby-classes', authRequired, roleRequired('consultant', 'supervisor'), (req, res) => {
  const { baby_id, class_id } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO baby_classes (baby_id, class_id, status) VALUES (?, ?, ?)'
    ).run(baby_id, class_id, 'active');
    audit(req, 'enroll', 'baby_class', info.lastInsertRowid, null);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    return res.status(400).json({ error: '该宝宝已在此班级' });
  }
});

router.get('/audit-logs', authRequired, roleRequired('supervisor'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.name as user_name, u.username, u.role
    FROM audit_logs a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 500
  `).all();
  res.json({ logs: rows });
});

router.get('/export', authRequired, roleRequired('consultant', 'supervisor'), (req, res) => {
  const sql = `SELECT r.id, r.title, b.name as baby_name, c.name as class_name,
                      u.name as consultant_name, r.sleep_quality, r.sleep_duration,
                      r.environment, r.current_status, r.created_at, r.updated_at
               FROM records r
               JOIN babies b ON r.baby_id = b.id
               JOIN baby_classes bc ON r.baby_class_id = bc.id
               JOIN classes c ON bc.class_id = c.id
               JOIN users u ON r.consultant_id = u.id
               ORDER BY r.id`;
  const rows = db.prepare(sql).all();

  const timelineRows = db.prepare(`
    SELECT t.record_id, t.action, t.from_status, t.to_status, t.content,
           u.name as actor_name, t.created_at
    FROM timeline_events t
    JOIN users u ON t.actor_id = u.id
    ORDER BY t.record_id, t.created_at
  `).all();

  const notesRows = db.prepare(`
    SELECT n.record_id, n.content, n.is_promise, u.name as author_name, n.created_at
    FROM notes n
    JOIN users u ON n.author_id = u.id
    ORDER BY n.record_id, n.created_at
  `).all();

  const statusMap = {
    draft: '草稿', reviewing: '复核中', returned: '退回补充', archived: '已归档'
  };

  const exportData = rows.map(r => ({
    '记录ID': r.id,
    '标题': r.title,
    '宝宝姓名': r.baby_name,
    '所在班级': r.class_name,
    '顾问': r.consultant_name,
    '睡眠质量': r.sleep_quality || '',
    '睡眠时长': r.sleep_duration || '',
    '环境': r.environment || '',
    '状态': statusMap[r.current_status] || r.current_status,
    '创建时间': r.created_at,
    '更新时间': r.updated_at,
    '时间线': timelineRows.filter(t => t.record_id === r.id)
      .map(t => `[${t.created_at}] ${t.actor_name} - ${t.content}`).join('\n'),
    '承诺/备注': notesRows.filter(n => n.record_id === r.id)
      .map(n => `${n.is_promise ? '[承诺]' : '[备注]'} ${n.author_name}(${n.created_at}): ${n.content}`).join('\n')
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, '睡眠观察记录');

  const tlWs = XLSX.utils.json_to_sheet(timelineRows.map(t => ({
    '记录ID': t.record_id,
    '时间': t.created_at,
    '操作人': t.actor_name,
    '动作': t.action,
    '原状态': t.from_status || '',
    '新状态': t.to_status || '',
    '内容': t.content || ''
  })));
  XLSX.utils.book_append_sheet(wb, tlWs, '时间线明细');

  const notesWs = XLSX.utils.json_to_sheet(notesRows.map(n => ({
    '记录ID': n.record_id,
    '时间': n.created_at,
    '作者': n.author_name,
    '类型': n.is_promise ? '承诺' : '备注',
    '内容': n.content
  })));
  XLSX.utils.book_append_sheet(wb, notesWs, '备注与承诺');

  const exportDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  const filename = `sleep_observation_${Date.now()}.xlsx`;
  const filepath = path.join(exportDir, filename);
  XLSX.writeFile(wb, filepath);

  audit(req, 'export', 'record', 0, `导出文件：${filename}`);

  res.download(filepath, filename);
});

router.get('/parents-summary', authRequired, roleRequired('parent'), (req, res) => {
  const sql = `SELECT r.id, r.title, b.name as baby_name, c.name as class_name,
                      r.current_status, r.sleep_quality, r.sleep_duration,
                      r.updated_at
               FROM records r
               JOIN babies b ON r.baby_id = b.id
               JOIN baby_classes bc ON r.baby_class_id = bc.id
               JOIN classes c ON bc.class_id = c.id
               WHERE b.parent_id = ? AND r.current_status = 'archived'
               ORDER BY r.updated_at DESC`;
  const rows = db.prepare(sql).all(req.user.id);
  res.json({ records: rows });
});

module.exports = router;
