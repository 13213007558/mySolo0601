const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'erbao.db');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const SESSIONS = {};
let db;

function nowStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
    p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  while (stmt.step()) {}
  stmt.free();
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length ? rows[0] : null;
}

function lastInsertRowid() {
  return Number(queryOne('SELECT last_insert_rowid() AS id').id);
}

function saveDb() {
  try {
    const data = db.export();
    fs.writeFileSync(DB_FILE, Buffer.from(data));
  } catch (e) {
    console.log('保存DB失败', e.message);
  }
}

setInterval(saveDb, 5000);

function hashPassword(pwd) { return bcrypt.hashSync(pwd, 10); }
function verifyPassword(pwd, hash) { return bcrypt.compareSync(pwd, hash); }

function genRecordNo() {
  const d = new Date();
  const s = d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  return 'HX' + s + String(Math.floor(Math.random() * 9000) + 1000);
}

function requireAuth(req, res, next) {
  const sid = req.cookies.sid;
  const sess = SESSIONS[sid];
  if (!sess) { res.status(401).json({ error: '未登录' }); return; }
  req.user = sess; next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      run(`INSERT INTO audit_logs(user_id,username,action,target_type,detail,is_unauthorized)
        VALUES (?,?,?,?,?,1)`, [
        req.user.id, req.user.username, 'UNAUTHORIZED_ACCESS',
        req.path, '角色越权:需要' + role + ' 实际:' + req.user.role
      ]);
      res.status(403).json({ error: '无权访问,已记录审计' }); return;
    }
    next();
  };
}

function writeHistory(recordId, field, oldVal, newVal, opId) {
  if (String(oldVal) === String(newVal)) return;
  run(`INSERT INTO verification_history(record_id,field_name,old_value,new_value,operator_id,changed_at)
    VALUES (?,?,?,?,?,?)`, [
    recordId, field,
    oldVal === null || oldVal === undefined ? null : String(oldVal),
    newVal === null || newVal === undefined ? null : String(newVal), opId, nowStr()
  ]);
}

function checkBalanceNegative() {
  const now = new Date();
  const mk = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const rows = queryAll(`SELECT a.baby_id,a.balance,b.name FROM accounts a
    JOIN babies b ON b.id=a.baby_id WHERE a.balance < 0`);
  for (const r of rows) {
    const ex = queryOne('SELECT id FROM balance_alerts WHERE baby_id=? AND month_key=?', [r.baby_id, mk]);
    if (!ex) run(`INSERT INTO balance_alerts(baby_id,balance,alert_type,month_key)
      VALUES (?,?,?,?)`, [r.baby_id, r.balance, 'negative_balance', mk]);
  }
  return rows;
}

function initData() {
  const uc = queryOne('SELECT COUNT(*) AS c FROM users').c;
  if (uc === 0) {
    run(`INSERT INTO users(username,password_hash,role,real_name,created_at) VALUES (?,?,?,?,?)`,
      ['nurse01', hashPassword('123456'), 'nurse', '李护士', nowStr()]);
    run(`INSERT INTO users(username,password_hash,role,real_name,created_at) VALUES (?,?,?,?,?)`,
      ['nurse02', hashPassword('123456'), 'nurse', '王护士', nowStr()]);
    run(`INSERT INTO users(username,password_hash,role,real_name,created_at) VALUES (?,?,?,?,?)`,
      ['super01', hashPassword('123456'), 'supervisor', '张主管', nowStr()]);
  }
  const bc = queryOne('SELECT COUNT(*) AS c FROM babies').c;
  if (bc === 0) {
    const babies = [
      ['B2024001', '小明', '男', '2023-05-10', '陈先生', '13800138001', '太阳班'],
      ['B2024002', '小红', '女', '2023-08-15', '李女士', '13800138002', '月亮班'],
      ['B2024003', '小刚', '男', '2023-11-20', '王先生', '13800138003', '星星班'],
      ['B2024004', '小美', '女', '2024-01-05', '赵女士', '13800138004', '太阳班'],
    ];
    for (const b of babies) {
      run(`INSERT INTO babies(baby_no,name,gender,birth_date,guardian,phone,class_name,created_at)
        VALUES (?,?,?,?,?,?,?,?)`, [...b, nowStr()]);
      const bid = lastInsertRowid();
      run(`INSERT INTO accounts(baby_id,balance,last_updated) VALUES (?,?,?)`,
        [bid, 500 + Math.floor(Math.random() * 2000), nowStr()]);
    }
  }
}

function initDb() {
  run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('nurse','supervisor')),
    real_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  run(`CREATE TABLE IF NOT EXISTS babies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    birth_date TEXT,
    guardian TEXT,
    phone TEXT,
    class_name TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id INTEGER NOT NULL UNIQUE,
    balance REAL NOT NULL DEFAULT 0,
    last_updated TEXT
  )`);
  run(`CREATE TABLE IF NOT EXISTS verification_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_no TEXT UNIQUE NOT NULL,
    baby_id INTEGER NOT NULL,
    service_date TEXT NOT NULL,
    service_type TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','success','partial_success','failed','cancelled')),
    class_name TEXT,
    shift TEXT,
    is_cross_class INTEGER DEFAULT 0,
    partial_note TEXT,
    source TEXT NOT NULL DEFAULT 'normal' CHECK(source IN ('normal','manual','sample')),
    operator_id INTEGER NOT NULL,
    reviewer_id INTEGER,
    review_time TEXT,
    created_at TEXT,
    updated_at TEXT,
    is_active INTEGER DEFAULT 1,
    sample_batch TEXT
  )`);
  run(`CREATE TABLE IF NOT EXISTS verification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    operator_id INTEGER NOT NULL,
    changed_at TEXT
  )`);
  run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    detail TEXT,
    ip TEXT,
    is_unauthorized INTEGER DEFAULT 0,
    created_at TEXT
  )`);
  run(`CREATE TABLE IF NOT EXISTS sample_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_no TEXT UNIQUE NOT NULL,
    imported_at TEXT,
    imported_by INTEGER,
    record_count INTEGER
  )`);
  run(`CREATE TABLE IF NOT EXISTS balance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id INTEGER NOT NULL,
    balance REAL NOT NULL,
    alert_type TEXT NOT NULL,
    month_key TEXT NOT NULL,
    created_at TEXT
  )`);
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const u = queryOne('SELECT * FROM users WHERE username=?', [username]);
  if (!u || !verifyPassword(password, u.password_hash)) {
    run(`INSERT INTO audit_logs(username,action,detail,is_unauthorized,created_at) VALUES (?,?,?,1,?)`,
      [username || 'unknown', 'LOGIN_FAILED', '用户名或密码错误', nowStr()]);
    res.status(401).json({ error: '用户名或密码错误' }); return;
  }
  const sid = Math.random().toString(36).slice(2);
  SESSIONS[sid] = { id: u.id, username: u.username, role: u.role, realName: u.real_name };
  run(`INSERT INTO audit_logs(user_id,username,action,created_at) VALUES (?,?,?,?)`,
    [u.id, u.username, 'LOGIN', nowStr()]);
  res.cookie('sid', sid, { httpOnly: true });
  res.json({ ok: true, user: SESSIONS[sid] });
});

app.post('/api/logout', requireAuth, (req, res) => {
  delete SESSIONS[req.cookies.sid];
  res.clearCookie('sid');
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/babies', requireAuth, (req, res) => {
  const rows = queryAll(`SELECT b.*, a.balance FROM babies b LEFT JOIN accounts a ON a.baby_id=b.id`);
  res.json({ babies: rows });
});

app.get('/api/stats', requireAuth, (req, res) => {
  const total = queryOne(`SELECT COUNT(*) AS c FROM verification_records WHERE is_active=1`).c;
  const success = queryOne(`SELECT COUNT(*) AS c FROM verification_records WHERE status='success' AND is_active=1`).c;
  const partial = queryOne(`SELECT COUNT(*) AS c FROM verification_records WHERE status='partial_success' AND is_active=1`).c;
  const pending = queryOne(`SELECT COUNT(*) AS c FROM verification_records WHERE status='pending' AND is_active=1`).c;
  const negatives = checkBalanceNegative();
  res.json({ total, success, partial, pending, negativeCount: negatives.length });
});

app.get('/api/records', requireAuth, (req, res) => {
  const { status } = req.query;
  let sql = `SELECT vr.*, b.name AS baby_name, b.baby_no, b.class_name AS baby_class,
    u1.real_name AS operator_name, u2.real_name AS reviewer_name
    FROM verification_records vr
    JOIN babies b ON b.id=vr.baby_id
    JOIN users u1 ON u1.id=vr.operator_id
    LEFT JOIN users u2 ON u2.id=vr.reviewer_id
    WHERE vr.is_active=1`;
  const params = [];
  if (status) { sql += ' AND vr.status=?'; params.push(status); }
  sql += ' ORDER BY vr.created_at DESC LIMIT 200';
  const rows = queryAll(sql, params);

  if (req.user.role === 'nurse') {
    const filtered = rows.map(r => ({
      id: r.id, record_no: r.record_no, baby_id: r.baby_id, baby_no: r.baby_no,
      baby_name: r.baby_name, class_name: r.class_name || r.baby_class,
      service_date: r.service_date,
      service_type: r.service_type, amount: r.amount, status: r.status,
      shift: r.shift, is_cross_class: r.is_cross_class, partial_note: r.partial_note,
      source: r.source, operator_name: r.operator_name, review_time: r.review_time,
      created_at: r.created_at
    }));
    res.json({ records: filtered });
  } else {
    res.json({ records: rows.map(r => ({ ...r, class_name: r.class_name || r.baby_class })) });
  }
});

app.get('/api/records/:id', requireAuth, (req, res) => {
  const r = queryOne(`SELECT vr.*, b.name AS baby_name, b.baby_no, b.class_name AS baby_class,
    u1.real_name AS operator_name, u2.real_name AS reviewer_name
    FROM verification_records vr
    JOIN babies b ON b.id=vr.baby_id
    JOIN users u1 ON u1.id=vr.operator_id
    LEFT JOIN users u2 ON u2.id=vr.reviewer_id
    WHERE vr.id=?`, [req.params.id]);
  if (!r) { res.status(404).json({ error: '不存在' }); return; }
  const history = queryAll(`SELECT vh.*, u.real_name AS operator_name
    FROM verification_history vh JOIN users u ON u.id=vh.operator_id
    WHERE vh.record_id=? ORDER BY vh.changed_at DESC`, [req.params.id]);
  r.class_name = r.class_name || r.baby_class;

  if (req.user.role === 'nurse') {
    res.json({
      record: {
        id: r.id, record_no: r.record_no, baby_id: r.baby_id, baby_no: r.baby_no,
        baby_name: r.baby_name, class_name: r.class_name, service_date: r.service_date,
        service_type: r.service_type, amount: r.amount, status: r.status,
        shift: r.shift, is_cross_class: r.is_cross_class, partial_note: r.partial_note,
        source: r.source, operator_name: r.operator_name, review_time: r.review_time,
        created_at: r.created_at, updated_at: r.updated_at, reviewer_id: r.reviewer_id
      },
      history: history.map(h => ({
        id: h.id, field_name: h.field_name, old_value: h.old_value,
        new_value: h.new_value, operator_name: h.operator_name, changed_at: h.changed_at
      }))
    });
  } else {
    res.json({ record: r, history });
  }
});

app.post('/api/records', requireAuth, (req, res) => {
  const { baby_id, service_date, service_type, amount, shift, class_name,
    is_cross_class, partial_note, source } = req.body;
  if (!baby_id || !service_date || !service_type || !amount) {
    res.status(400).json({ error: '缺少必填项' }); return;
  }
  const baby = queryOne('SELECT * FROM babies WHERE id=?', [baby_id]);
  if (!baby) { res.status(404).json({ error: '宝宝不存在' }); return; }

  let status = 'success';
  if (is_cross_class && partial_note) status = 'partial_success';
  const recNo = genRecordNo();
  const src = source || 'normal';
  const ts = nowStr();

  run(`INSERT INTO verification_records
    (record_no,baby_id,service_date,service_type,amount,status,class_name,shift,
     is_cross_class,partial_note,source,operator_id,created_at,updated_at,is_active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
    recNo, baby_id, service_date, service_type, amount, status,
    class_name || baby.class_name, shift || '', is_cross_class ? 1 : 0,
    partial_note || null, src, req.user.id, ts, ts, 1
  ]);
  const newId = lastInsertRowid();

  const acct = queryOne('SELECT * FROM accounts WHERE baby_id=?', [baby_id]);
  const newBal = (acct ? acct.balance : 0) - Number(amount);
  if (acct) {
    run('UPDATE accounts SET balance=?, last_updated=? WHERE baby_id=?',
      [newBal, nowStr(), baby_id]);
  } else {
    run('INSERT INTO accounts(baby_id,balance,last_updated) VALUES (?,?,?)',
      [baby_id, newBal, nowStr()]);
  }
  run(`INSERT INTO audit_logs(user_id,username,action,target_type,target_id,detail,created_at)
    VALUES (?,?,?,?,?,?,?)`, [
    req.user.id, req.user.username, 'CREATE_RECORD',
    'verification_record', newId,
    '创建核销单 ' + recNo + ' 金额' + amount + ' 状态' + status, nowStr()
  ]);
  checkBalanceNegative();
  saveDb();
  res.json({ ok: true, id: newId, record_no: recNo, status });
});

app.put('/api/records/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const old = queryOne('SELECT * FROM verification_records WHERE id=? AND is_active=1', [id]);
  if (!old) { res.status(404).json({ error: '记录不存在' }); return; }

  const fields = ['service_date', 'service_type', 'amount', 'status', 'class_name', 'shift',
    'is_cross_class', 'partial_note'];
  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined && req.body[f] !== old[f]) {
      const v = f === 'is_cross_class' ? (req.body[f] ? 1 : 0) : req.body[f];
      updates.push(f + '=?');
      values.push(v);
      writeHistory(id, f, old[f], v, req.user.id);
    }
  }
  if (updates.length === 0) { res.json({ ok: true, noChange: true }); return; }

  values.push(nowStr());
  values.push(id);
  run(`UPDATE verification_records SET ${updates.join(',')}, updated_at=? WHERE id=?`, values);

  if (req.body.amount !== undefined && Number(req.body.amount) !== Number(old.amount)) {
    const diff = Number(req.body.amount) - Number(old.amount);
    const acct = queryOne('SELECT * FROM accounts WHERE baby_id=?', [old.baby_id]);
    if (acct) {
      run('UPDATE accounts SET balance=?, last_updated=? WHERE baby_id=?',
        [acct.balance - diff, nowStr(), old.baby_id]);
    }
  }

  run(`INSERT INTO audit_logs(user_id,username,action,target_type,target_id,detail,created_at)
    VALUES (?,?,?,?,?,?,?)`, [
    req.user.id, req.user.username, 'UPDATE_RECORD',
    'verification_record', id, '修改核销单 ' + old.record_no, nowStr()
  ]);
  checkBalanceNegative();
  saveDb();
  res.json({ ok: true });
});

app.post('/api/records/:id/review', requireAuth, requireRole('supervisor'), (req, res) => {
  const id = req.params.id;
  const old = queryOne('SELECT * FROM verification_records WHERE id=? AND is_active=1', [id]);
  if (!old) { res.status(404).json({ error: '记录不存在' }); return; }
  const ts = nowStr();
  run(`UPDATE verification_records SET reviewer_id=?, review_time=?, updated_at=? WHERE id=?`,
    [req.user.id, ts, ts, id]);
  writeHistory(id, 'reviewer_id', old.reviewer_id, req.user.id, req.user.id);
  writeHistory(id, 'review_time', old.review_time, ts, req.user.id);
  run(`INSERT INTO audit_logs(user_id,username,action,target_type,target_id,detail,created_at)
    VALUES (?,?,?,?,?,?,?)`, [
    req.user.id, req.user.username, 'REVIEW_RECORD',
    'verification_record', id, '复核核销单 ' + old.record_no, nowStr()
  ]);
  saveDb();
  res.json({ ok: true });
});

app.post('/api/records/:id/cancel', requireAuth, (req, res) => {
  const id = req.params.id;
  const old = queryOne('SELECT * FROM verification_records WHERE id=? AND is_active=1', [id]);
  if (!old) { res.status(404).json({ error: '记录不存在' }); return; }
  writeHistory(id, 'status', old.status, 'cancelled', req.user.id);
  run(`UPDATE verification_records SET status='cancelled', updated_at=? WHERE id=?`,
    [nowStr(), id]);
  const acct = queryOne('SELECT * FROM accounts WHERE baby_id=?', [old.baby_id]);
  if (acct) {
    run('UPDATE accounts SET balance=?, last_updated=? WHERE baby_id=?',
      [acct.balance + Number(old.amount), nowStr(), old.baby_id]);
  }
  run(`INSERT INTO audit_logs(user_id,username,action,target_type,target_id,detail,created_at)
    VALUES (?,?,?,?,?,?,?)`, [
    req.user.id, req.user.username, 'CANCEL_RECORD',
    'verification_record', id, '取消核销单 ' + old.record_no, nowStr()
  ]);
  saveDb();
  res.json({ ok: true });
});

app.get('/api/audit', requireAuth, requireRole('supervisor'), (req, res) => {
  const logs = queryAll(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 300`);
  const negatives = queryAll(`SELECT ba.*, b.name, b.baby_no FROM balance_alerts ba
    JOIN babies b ON b.id=ba.baby_id ORDER BY ba.created_at DESC LIMIT 100`);
  res.json({ logs, negatives });
});

app.post('/api/import-samples', requireAuth, (req, res) => {
  const batchNo = 'SAMPLE-' + new Date().toISOString().slice(0, 10);
  const exist = queryOne('SELECT id FROM sample_imports WHERE batch_no=?', [batchNo]);
  if (exist) {
    run(`UPDATE verification_records SET is_active=0 WHERE sample_batch=? AND source='sample'`, [batchNo]);
    run(`DELETE FROM sample_imports WHERE batch_no=?`, [batchNo]);
  }
  run(`INSERT INTO sample_imports(batch_no,imported_at,imported_by,record_count) VALUES (?,?,?,?)`,
    [batchNo, nowStr(), req.user.id, 0]);
  const babies = queryAll('SELECT * FROM babies ORDER BY id LIMIT 3');
  const serviceTypes = ['常规儿保', '疫苗接种', '体检复查', '营养咨询'];
  let count = 0;
  for (const baby of babies) {
    const serviceDate = new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000)
      .toISOString().slice(0, 10);
    const amt = Math.floor(Math.random() * 300) + 50;
    run(`INSERT INTO verification_records
      (record_no,baby_id,service_date,service_type,amount,status,class_name,shift,
       is_cross_class,partial_note,source,operator_id,sample_batch,is_active,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
      genRecordNo(), baby.id, serviceDate,
      serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
      amt, 'success', baby.class_name,
      Math.random() > 0.5 ? '上午班' : '下午班', 0, null, 'sample',
      req.user.id, batchNo, 1, nowStr(), nowStr()
    ]);
    const acct = queryOne('SELECT * FROM accounts WHERE baby_id=?', [baby.id]);
    if (acct) {
      run('UPDATE accounts SET balance=?, last_updated=? WHERE baby_id=?',
        [acct.balance - amt, nowStr(), baby.id]);
    }
    count++;
  }
  run('UPDATE sample_imports SET record_count=? WHERE batch_no=?', [count, batchNo]);

  const manualBaby = babies[0] || queryOne('SELECT * FROM babies LIMIT 1');
  const today = new Date().toISOString().slice(0, 10);
  run(`INSERT INTO verification_records
    (record_no,baby_id,service_date,service_type,amount,status,class_name,shift,
     is_cross_class,partial_note,source,operator_id,sample_batch,is_active,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [
    genRecordNo(), manualBaby.id, today, '手工补录-补打疫苗费', 120,
    'success', manualBaby.class_name, '下午班', 0,
    '昨日漏录,今日手工补录', 'manual', req.user.id, batchNo, 1, nowStr(), nowStr()
  ]);
  count++;
  run('UPDATE sample_imports SET record_count=? WHERE batch_no=?', [count, batchNo]);

  run(`INSERT INTO audit_logs(user_id,username,action,detail,created_at) VALUES (?,?,?,?,?)`, [
    req.user.id, req.user.username, 'IMPORT_SAMPLES',
    '导入样例数据批次 ' + batchNo + ',共' + count + '条(含1条手工补录)', nowStr()
  ]);
  saveDb();
  res.json({ ok: true, batchNo, count });
});

app.get('/api/workflow/steps', requireAuth, (req, res) => {
  res.json({
    steps: [
      { step: 1, title: '选择宝宝', desc: '通过宝宝编号或姓名搜索并确认服务对象', required: true },
      { step: 2, title: '核对服务信息', desc: '确认服务日期、类型、班次,宝宝当前班级是否正确', required: true },
      { step: 3, title: '录入费用金额', desc: '输入服务费用,系统自动从账户余额扣减', required: true },
      { step: 4, title: '处理跨班情况', desc: '若宝宝跨班,勾选"跨班"并填写部分完成说明,系统标记部分成功', required: false },
      { step: 5, title: '检查余额预警', desc: '提交前查看余额,若为负系统自动预警,通知主管', required: false },
      { step: 6, title: '提交核销', desc: '确认后提交,核销记录生成,等待主管复核', required: true }
    ]
  });
});

async function start() {
  const SQL = await initSqlJs();
  let fileBuffer;
  try { fileBuffer = fs.readFileSync(DB_FILE); } catch (e) { fileBuffer = null; }
  db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
  initDb();
  initData();
  saveDb();

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('婴幼儿费用核销回访册儿保随访版 已启动 http://localhost:' + PORT);
    console.log('测试账号: nurse01/123456 (护士)  super01/123456 (主管)');
  });
}

start().catch(e => { console.error('启动失败', e); process.exit(1); });

module.exports = { app, getDb: () => db };
