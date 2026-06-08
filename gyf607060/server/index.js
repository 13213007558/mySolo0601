const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

function getCurrentUser(req) {
  const uid = parseInt(req.header('X-User-Id') || '1', 10);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
  return user || db.prepare('SELECT * FROM users WHERE id = 1').get();
}

function canViewRecord(user, record) {
  if (user.role === 'supervisor') return { ok: true };
  if (!record.shift || user.shift === 'all') return { ok: true };
  if (record.shift === user.shift) return { ok: true };
  return {
    ok: false,
    reason: '越权查看：该记录属于 ' + record.shift + ' 班次，你是 ' + user.shift + ' 班次前台。如需复核请联系主管。'
  };
}

app.get('/api/me', (req, res) => {
  res.json(getCurrentUser(req));
});

app.get('/api/users', (req, res) => {
  res.json(db.prepare('SELECT * FROM users ORDER BY id').all());
});

app.get('/api/babies', (req, res) => {
  res.json(db.prepare('SELECT * FROM babies ORDER BY id').all());
});

function buildFilterQuery(query, user) {
  const where = [];
  const params = {};
  if (query.status) {
    where.push('r.status = @status');
    params.status = query.status;
  }
  if (query.baby_id) {
    where.push('r.baby_id = @baby_id');
    params.baby_id = parseInt(query.baby_id, 10);
  }
  if (query.is_valid !== undefined && query.is_valid !== '') {
    where.push('r.is_valid = @is_valid');
    params.is_valid = parseInt(query.is_valid, 10);
  }
  if (query.keyword) {
    where.push('(b.name LIKE @kw OR b.card_no LIKE @kw OR r.scan_code LIKE @kw)');
    params.kw = '%' + query.keyword + '%';
  }
  if (query.from_date) {
    where.push('date(r.created_at) >= date(@from_date)');
    params.from_date = query.from_date;
  }
  if (query.to_date) {
    where.push('date(r.created_at) <= date(@to_date)');
    params.to_date = query.to_date;
  }
  if (user.role !== 'supervisor' && user.shift !== 'all') {
    where.push('r.shift = @shift');
    params.shift = user.shift;
  }
  const sql = ' FROM nursing_records r JOIN babies b ON r.baby_id = b.id' +
    (where.length ? ' WHERE ' + where.join(' AND ') : '');
  return { sql, params };
}

app.get('/api/records', (req, res) => {
  const user = getCurrentUser(req);
  const { sql, params } = buildFilterQuery(req.query, user);
  const rows = db.prepare(
    'SELECT r.*, b.name as baby_name, b.card_no as baby_card_no ' + sql + ' ORDER BY r.id DESC LIMIT 500'
  ).all(params);
  res.json(rows);
});

app.get('/api/records/:id', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const row = db.prepare(
    'SELECT r.*, b.name as baby_name, b.card_no as baby_card_no, b.guardian, b.phone ' +
    'FROM nursing_records r JOIN babies b ON r.baby_id = b.id WHERE r.id = ?'
  ).get(id);
  if (!row) return res.status(404).json({ error: '记录不存在' });

  const perm = canViewRecord(user, row);
  const crossShift = row.shift && user.shift !== 'all' && user.role !== 'supervisor' && row.shift !== user.shift;

  const otherShifts = db.prepare(
    'SELECT DISTINCT shift FROM nursing_records WHERE baby_id = ? AND is_valid = 1 AND shift IS NOT NULL'
  ).all(row.baby_id).map(x => x.shift);

  res.json({
    record: row,
    permission: {
      canEdit: perm.ok,
      reason: perm.reason || null,
      isCrossShift: crossShift,
      crossShiftExplanation: crossShift
        ? '同一宝宝跨班：该宝宝在班次 [' + otherShifts.join(', ') + '] 均有记录。当前查看班次为 ' + row.shift + '。'
        : null,
      allShiftsForBaby: otherShifts
    }
  });
});

app.post('/api/records', (req, res) => {
  const user = getCurrentUser(req);
  const { baby_id, scan_code, milk_amount, feed_time, temperature, note, shift } = req.body || {};

  if (!baby_id || !scan_code || milk_amount === undefined || milk_amount === null) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const dup = db.prepare(
    "SELECT * FROM nursing_records WHERE scan_code = ? AND is_valid = 1 AND date(created_at) = date('now','localtime')"
  ).get(scan_code);
  if (dup) {
    return res.status(409).json({
      error: '重复扫描',
      message: '扫码 ' + scan_code + ' 已在今天录入（记录 #' + dup.id + '），请前往详情页复核，不要重复创建。',
      duplicate_record_id: dup.id
    });
  }

  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(parseInt(baby_id, 10));
  if (!baby) return res.status(400).json({ error: '宝宝不存在' });

  let is_valid = 1;
  let invalid_reason = null;
  if (milk_amount < 0 || milk_amount > 500) {
    is_valid = 0;
    invalid_reason = '奶量异常：' + milk_amount + 'ml，超出合理范围 0-500ml';
  }
  if (temperature && (temperature < 30 || temperature > 45)) {
    is_valid = 0;
    invalid_reason = (invalid_reason ? invalid_reason + '；' : '') + '温度异常：' + temperature + '℃';
  }

  const info = db.prepare(
    'INSERT INTO nursing_records (baby_id, scan_code, milk_amount, feed_time, temperature, note, shift, operator_id, operator_name, is_valid, invalid_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    parseInt(baby_id, 10),
    String(scan_code),
    parseFloat(milk_amount),
    feed_time || null,
    temperature ? parseFloat(temperature) : null,
    note || null,
    shift || user.shift || null,
    user.id,
    user.name,
    is_valid,
    invalid_reason
  );

  const row = db.prepare(
    'SELECT r.*, b.name as baby_name, b.card_no as baby_card_no FROM nursing_records r JOIN babies b ON r.baby_id = b.id WHERE r.id = ?'
  ).get(info.lastInsertRowid);

  res.status(201).json({ record: row, flagged_invalid: !is_valid, invalid_reason });
});

app.post('/api/records/:id/review', (req, res) => {
  const user = getCurrentUser(req);
  const id = parseInt(req.params.id, 10);
  const row = db.prepare('SELECT * FROM nursing_records WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: '记录不存在' });

  const perm = canViewRecord(user, row);
  if (!perm.ok && user.role !== 'supervisor') {
    return res.status(403).json({ error: perm.reason });
  }

  const { status, review_note, mark_valid } = req.body || {};

  let is_valid = row.is_valid;
  let invalid_reason = row.invalid_reason;
  if (mark_valid === true) {
    is_valid = 1;
    invalid_reason = null;
  } else if (mark_valid === false) {
    is_valid = 0;
    invalid_reason = invalid_reason || '复核标记为坏数据';
  }

  db.prepare(
    'UPDATE nursing_records SET status = ?, review_note = ?, reviewer_id = ?, reviewer_name = ?, reviewed_at = datetime("now","localtime"), is_valid = ?, invalid_reason = ?, updated_at = datetime("now","localtime") WHERE id = ?'
  ).run(
    status || row.status,
    review_note || row.review_note,
    user.id,
    user.name,
    is_valid,
    invalid_reason,
    id
  );

  const updated = db.prepare(
    'SELECT r.*, b.name as baby_name, b.card_no as baby_card_no FROM nursing_records r JOIN babies b ON r.baby_id = b.id WHERE r.id = ?'
  ).get(id);
  res.json({ record: updated });
});

app.get('/api/export', (req, res) => {
  const user = getCurrentUser(req);
  const { sql, params } = buildFilterQuery(req.query, user);
  const rows = db.prepare(
    'SELECT r.id, b.name as baby_name, b.card_no, r.scan_code, r.milk_amount, r.feed_time, r.temperature, r.shift, r.status, r.is_valid, r.invalid_reason, r.operator_name as handler, r.reviewer_name as reviewer, r.created_at, r.reviewed_at