const express = require('express');
const cors = require('cors');
const { Parser } = require('json2csv');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const CURRENT_USER_ID = 1;

const STATUS_LABELS = {
  pending: '待对账',
  matched: '已核对',
  mismatched: '不一致',
  missing_material: '材料缺页',
  bad_data: '坏数据'
};

function getCurrentUser() {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(CURRENT_USER_ID);
}

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY role, name').all();
  res.json({ currentUserId: CURRENT_USER_ID, users });
});

app.get('/api/records', (req, res) => {
  const { status, dateFrom, dateTo, babyName, includeBadData } = req.query;
  
  let sql = 'SELECT * FROM milk_records WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (!includeBadData || includeBadData === 'false') {
    sql += ' AND is_bad_data = 0';
  }
  if (dateFrom) {
    sql += ' AND record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND record_date <= ?';
    params.push(dateTo);
  }
  if (babyName) {
    sql += ' AND baby_name LIKE ?';
    params.push(`%${babyName}%`);
  }

  sql += ' ORDER BY record_date DESC, id DESC';
  
  const records = db.prepare(sql).all(...params).map(r => ({
    ...r,
    status_label: STATUS_LABELS[r.status] || r.status,
    discrepancy: r.source_chat_amount !== null && r.source_paper_amount !== null
      ? r.source_chat_amount - r.source_paper_amount
      : null
  }));

  res.json({ records });
});

app.get('/api/records/:id', (req, res) => {
  const record = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const history = db.prepare(`
    SELECT h.*, u.name as changed_by_name 
    FROM status_history h 
    LEFT JOIN users u ON h.changed_by = u.id 
    WHERE h.record_id = ? 
    ORDER BY h.changed_at DESC
  `).all(req.params.id);

  const notes = db.prepare(`
    SELECT n.*, u.name as author_name 
    FROM notes n 
    LEFT JOIN users u ON n.author_id = u.id 
    WHERE n.record_id = ? 
    ORDER BY n.created_at DESC
  `).all(req.params.id);

  record.status_label = STATUS_LABELS[record.status] || record.status;
  record.discrepancy = record.source_chat_amount !== null && record.source_paper_amount !== null
    ? record.source_chat_amount - record.source_paper_amount
    : null;

  res.json({ record, history, notes });
});

app.post('/api/records/:id/review', (req, res) => {
  const { id } = req.params;
  const { status, change_note, new_promise } = req.body;
  const user = getCurrentUser();

  const record = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  if (!STATUS_LABELS[status]) {
    return res.status(400).json({ error: '无效的状态值' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO status_history (record_id, old_status, new_status, old_promise, new_promise, changed_by, change_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, record.status, status, record.original_promise, new_promise || null, user.id, change_note || null);

    const updateFields = ['status = ?', 'updated_at = datetime(\'now\', \'localtime\')'];
    const updateParams = [status];

    if (new_promise !== undefined && new_promise !== null) {
      updateFields.push('original_promise = ?');
      updateParams.push(new_promise);
    }
    if (change_note) {
      updateFields.push('reconciliation_note = ?');
      updateParams.push(change_note);
    }

    if (status === 'bad_data') {
      updateFields.push('is_bad_data = 1');
    }

    updateParams.push(id);
    db.prepare(`UPDATE milk_records SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateParams);
  });

  tx();

  const updated = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  updated.status_label = STATUS_LABELS[updated.status];
  res.json({ record: updated });
});

app.post('/api/records/:id/notes', (req, res) => {
  const { id } = req.params;
  const { content, is_parent_correction } = req.body;
  const user = getCurrentUser();

  if (!content || !content.trim()) {
    return res.status(400).json({ error: '备注内容不能为空' });
  }

  const record = db.prepare('SELECT id FROM milk_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const info = db.prepare(`
    INSERT INTO notes (record_id, content, author_id, is_parent_correction)
    VALUES (?, ?, ?, ?)
  `).run(id, content.trim(), user.id, is_parent_correction ? 1 : 0);

  const note = db.prepare(`
    SELECT n.*, u.name as author_name 
    FROM notes n 
    LEFT JOIN users u ON n.author_id = u.id 
    WHERE n.id = ?
  `).get(info.lastInsertRowid);

  res.json({ note });
});

app.put('/api/records/:id/flag-bad', (req, res) => {
  const { id } = req.params;
  const { bad_data_reason, export_count_reason } = req.body;
  const user = getCurrentUser();

  const record = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const tx = db.transaction(() => {
    if (record.status !== 'bad_data') {
      db.prepare(`
        INSERT INTO status_history (record_id, old_status, new_status, old_promise, new_promise, changed_by, change_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, record.status, 'bad_data', record.original_promise, null, user.id, bad_data_reason || '标记为坏数据');
    }

    db.prepare(`
      UPDATE milk_records SET 
        is_bad_data = 1, 
        status = 'bad_data',
        bad_data_reason = ?,
        export_count_mismatch = 1,
        export_count_reason = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(bad_data_reason || null, export_count_reason || null, id);
  });

  tx();

  const updated = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  updated.status_label = STATUS_LABELS[updated.status];
  res.json({ record: updated });
});

app.put('/api/records/:id/unflag-bad', (req, res) => {
  const { id } = req.params;
  const user = getCurrentUser();

  const record = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO status_history (record_id, old_status, new_status, old_promise, new_promise, changed_by, change_note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, record.status, 'pending', record.original_promise, null, user.id, '恢复为正常数据，重新对账');

    db.prepare(`
      UPDATE milk_records SET 
        is_bad_data = 0, 
        status = 'pending',
        bad_data_reason = NULL,
        export_count_mismatch = 0,
        export_count_reason = NULL,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(id);
  });

  tx();

  const updated = db.prepare('SELECT * FROM milk_records WHERE id = ?').get(id);
  updated.status_label = STATUS_LABELS[updated.status];
  res.json({ record: updated });
});

app.get('/api/export', (req, res) => {
  const { status, dateFrom, dateTo, babyName, includeBadData } = req.query;
  
  let sql = 'SELECT * FROM milk_records WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (!includeBadData || includeBadData === 'false') {
    sql += ' AND is_bad_data = 0';
  }
  if (dateFrom) {
    sql += ' AND record_date >= ?';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND record_date <= ?';
    params.push(dateTo);
  }
  if (babyName) {
    sql += ' AND baby_name LIKE ?';
    params.push(`%${babyName}%`);
  }

  sql += ' ORDER BY record_date DESC, id DESC';
  const records = db.prepare(sql).all(...params);

  const user = getCurrentUser();

  const exportData = records.map(r => ({
    '日期': r.record_date,
    '幼儿姓名': r.baby_name,
    '家长姓名': r.parent_name,
    '班级': r.class_name || '',
    '群留言奶量(ml)': r.source_chat_amount ?? '',
    '纸质单奶量(ml)': r.source_paper_amount ?? '',
    '差异(ml)': r.source_chat_amount !== null && r.source_paper_amount !== null
      ? r.source_chat_amount - r.source_paper_amount
      : '',
    '数量': (r.source_chat_amount ?? 0) + (r.source_paper_amount ?? 0),
    '状态': STATUS_LABELS[r.status] || r.status,
    '原始承诺': r.original_promise || '',
    '原因': [
      r.bad_data_reason,
      r.material_pages_expected && r.material_pages < r.material_pages_expected
        ? `材料缺页：实际${r.material_pages}页/应有${r.material_pages_expected}页`
        : null,
      r.export_count_mismatch ? r.export_count_reason : null,
      r.reconciliation_note
    ].filter(Boolean).join('；') || '',
    '处理人': user.name,
    '更新时间': r.updated_at
  }));

  const parser = new Parser();
  const csv = parser.parse(exportData);

  const filename = `milk_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent('奶量对账')}_${new Date().toISOString().slice(0, 10)}.csv`);
  res.send('\uFEFF' + csv);
});

app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      status, 
      COUNT(*) as count
    FROM milk_records 
    GROUP BY status
  `).all();

  const total = db.prepare('SELECT COUNT(*) as total FROM milk_records').get().total;
  const badCount = db.prepare('SELECT COUNT(*) as count FROM milk_records WHERE is_bad_data = 1').get().count;

  res.json({ stats, total, badCount });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`奶量对账后端服务已启动: http://localhost:${PORT}`);
});
