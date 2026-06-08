const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'auth_tracker.db'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.exec(`
  CREATE TABLE IF NOT EXISTS auth_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id TEXT NOT NULL,
    baby_name TEXT NOT NULL,
    parent_phone TEXT,
    store_name TEXT,
    class_name TEXT,
    photo_type TEXT,
    auth_status TEXT,
    conclusion TEXT,
    conclusion_source TEXT,
    operator TEXT,
    remark TEXT,
    is_bad_data INTEGER DEFAULT 0,
    bad_data_reason TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    version INTEGER DEFAULT 1,
    is_latest INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS auth_record_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    baby_id TEXT NOT NULL,
    baby_name TEXT NOT NULL,
    parent_phone TEXT,
    store_name TEXT,
    class_name TEXT,
    photo_type TEXT,
    auth_status TEXT,
    conclusion TEXT,
    conclusion_source TEXT,
    operator TEXT,
    remark TEXT,
    is_bad_data INTEGER DEFAULT 0,
    bad_data_reason TEXT,
    created_at TEXT,
    updated_at TEXT,
    version INTEGER,
    is_latest INTEGER DEFAULT 0,
    change_reason TEXT,
    FOREIGN KEY (record_id) REFERENCES auth_records(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER,
    operation_type TEXT NOT NULL,
    operator TEXT,
    operator_role TEXT,
    reason TEXT,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

function snapshotToVersion(record, changeReason) {
  const stmt = db.prepare(`
    INSERT INTO auth_record_versions (
      record_id, baby_id, baby_name, parent_phone, store_name, class_name,
      photo_type, auth_status, conclusion, conclusion_source, operator, remark,
      is_bad_data, bad_data_reason, created_at, updated_at, version, is_latest, change_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);
  stmt.run(
    record.id, record.baby_id, record.baby_name, record.parent_phone,
    record.store_name, record.class_name, record.photo_type, record.auth_status,
    record.conclusion, record.conclusion_source, record.operator, record.remark,
    record.is_bad_data, record.bad_data_reason, record.created_at, record.updated_at,
    record.version, changeReason || '系统变更'
  );
}

function addOperationLog(recordId, operationType, operator, operatorRole, reason, detail) {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (record_id, operation_type, operator, operator_role, reason, detail)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(recordId, operationType, operator, operatorRole || '系统', reason, detail);
}

function detectCrossClass(babyId, excludeRecordId, className) {
  const stmt = db.prepare(`
    SELECT DISTINCT class_name FROM auth_records
    WHERE baby_id = ? AND id != ? AND is_bad_data = 0 AND is_latest = 1
  `);
  const classes = stmt.all(babyId, excludeRecordId).map(r => r.class_name).filter(Boolean);
  if (classes.length > 0 && className && !classes.includes(className)) {
    return `检测到宝宝 ${babyId} 在其他班级也有记录: ${classes.join(', ')}，当前记录班级为 ${className}，存在跨班异常`;
  }
  if (classes.length > 0) {
    return `检测到宝宝 ${babyId} 在多个班级有记录: ${[...classes, className].filter(Boolean).join(', ')}`;
  }
  return null;
}

app.get('/api/records', (req, res) => {
  const { phone, include_bad } = req.query;
  let sql = `SELECT * FROM auth_records WHERE is_latest = 1`;
  const params = [];

  if (include_bad !== '1') {
    sql += ` AND is_bad_data = 0`;
  }
  if (phone) {
    sql += ` AND parent_phone LIKE ?`;
    params.push(`%${phone}%`);
  }
  sql += ` ORDER BY updated_at DESC`;

  const records = db.prepare(sql).all(...params);
  res.json(records);
});

app.get('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const record = db.prepare(`SELECT * FROM auth_records WHERE id = ?`).get(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const versions = db.prepare(`
    SELECT * FROM auth_record_versions WHERE record_id = ? ORDER BY version DESC
  `).all(id);

  const logs = db.prepare(`
    SELECT * FROM operation_logs WHERE record_id = ? ORDER BY created_at DESC
  `).all(id);

  const sameBaby = db.prepare(`
    SELECT * FROM auth_records
    WHERE baby_id = ? AND id != ? AND is_latest = 1
    ORDER BY updated_at DESC
  `).all(record.baby_id, id);

  const accessReason = detectCrossClass(record.baby_id, record.id, record.class_name);

  res.json({ record, versions, logs, sameBaby, accessReason });
});

app.get('/api/records/:id/versions', (req, res) => {
  const id = parseInt(req.params.id);
  const versions = db.prepare(`
    SELECT * FROM auth_record_versions WHERE record_id = ? ORDER BY version DESC
  `).all(id);
  res.json(versions);
});

app.post('/api/records/:id/supplement', (req, res) => {
  const id = parseInt(req.params.id);
  const { auth_status, conclusion, remark, operator, change_reason } = req.body;

  const record = db.prepare(`SELECT * FROM auth_records WHERE id = ?`).get(id);
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }

  snapshotToVersion(record, change_reason || '手工补录');

  const newVersion = record.version + 1;
  const updateStmt = db.prepare(`
    UPDATE auth_records SET
      auth_status = ?,
      conclusion = ?,
      remark = ?,
      operator = ?,
      conclusion_source = '手工补录',
      updated_at = datetime('now', 'localtime'),
      version = ?
    WHERE id = ?
  `);
  updateStmt.run(
    auth_status || record.auth_status,
    conclusion || record.conclusion,
    remark !== undefined ? remark : record.remark,
    operator || record.operator,
    newVersion,
    id
  );

  addOperationLog(
    id,
    '手工补录',
    operator || '系统',
    '售后',
    change_reason || '手工补录',
    `版本由 v${record.version} 更新至 v${newVersion}，状态: ${record.auth_status} → ${auth_status || record.auth_status}`
  );

  const updated = db.prepare(`SELECT * FROM auth_records WHERE id = ?`).get(id);
  res.json(updated);
});

app.post('/api/records', (req, res) => {
  const {
    baby_id, baby_name, parent_phone, store_name, class_name,
    photo_type, auth_status, conclusion, operator, remark
  } = req.body;

  if (!baby_id || !baby_name) {
    return res.status(400).json({ error: '宝宝ID和姓名为必填项' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO auth_records (
      baby_id, baby_name, parent_phone, store_name, class_name,
      photo_type, auth_status, conclusion, conclusion_source,
      operator, remark, is_bad_data, version, is_latest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '手工补录', ?, ?, 0, 1, 1)
  `);

  const result = insertStmt.run(
    baby_id, baby_name, parent_phone || '', store_name || '',
    class_name || '', photo_type || '', auth_status || '未授权',
    conclusion || '', operator || '系统', remark || ''
  );

  const newId = result.lastInsertRowid;
  const newRecord = db.prepare(`SELECT * FROM auth_records WHERE id = ?`).get(newId);

  snapshotToVersion(newRecord, '新建补录记录');
  addOperationLog(newId, '新建补录', operator || '系统', '售后', '新建补录', `新建记录: ${baby_id} ${baby_name}`);

  res.status(201).json(newRecord);
});

app.get('/api/export', (req, res) => {
  const { phone, include_bad } = req.query;
  let sql = `SELECT * FROM auth_records WHERE is_latest = 1`;
  const params = [];

  if (include_bad !== '1') {
    sql += ` AND is_bad_data = 0`;
  }
  if (phone) {
    sql += ` AND parent_phone LIKE ?`;
    params.push(`%${phone}%`);
  }
  sql += ` ORDER BY updated_at DESC`;

  const records = db.prepare(sql).all(...params);

  const headers = [
    '宝宝ID', '宝宝姓名', '家长手机', '门店', '班级', '照片类型',
    '授权状态', '结论', '结论来源', '操作人', '备注', '版本号',
    '是否坏数据', '坏数据原因', '创建时间', '更新时间'
  ];

  const rows = records.map(r => [
    r.baby_id, r.baby_name, r.parent_phone || '', r.store_name || '',
    r.class_name || '', r.photo_type || '', r.auth_status || '',
    r.conclusion || '', r.conclusion_source || '', r.operator || '',
    (r.remark || '').replace(/\r?\n/g, ' '), r.version,
    r.is_bad_data ? '是' : '否', r.bad_data_reason || '',
    r.created_at, r.updated_at
  ]);

  const escapeCSV = (val) => {
    const s = String(val ?? '');
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const csvContent = '\uFEFF' + [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=auth_records.csv');
  res.send(csvContent);
});

app.get('/api/stats', (req, res) => {
  const total = db.prepare(`SELECT COUNT(*) as count FROM auth_records WHERE is_latest = 1 AND is_bad_data = 0`).get().count;
  const badData = db.prepare(`SELECT COUNT(*) as count FROM auth_records WHERE is_latest = 1 AND is_bad_data = 1`).get().count;

  const byStatus = db.prepare(`
    SELECT auth_status, COUNT(*) as count FROM auth_records
    WHERE is_latest = 1 AND is_bad_data = 0
    GROUP BY auth_status
  `).all();

  const bySource = db.prepare(`
    SELECT conclusion_source, COUNT(*) as count FROM auth_records
    WHERE is_latest = 1 AND is_bad_data = 0
    GROUP BY conclusion_source
  `).all();

  const totalVersions = db.prepare(`SELECT COUNT(*) as count FROM auth_record_versions`).get().count;

  res.json({ total, badData, byStatus, bySource, totalVersions });
});

function seedData() {
  const count = db.prepare(`SELECT COUNT(*) as count FROM auth_records`).get().count;
  if (count > 0) return;

  const samples = [
    {
      baby_id: 'B001', baby_name: '张小宝', parent_phone: '13800138001',
      store_name: '阳光门店', class_name: '小班A', photo_type: '证件照',
      auth_status: '已授权', conclusion: '家长已签署授权同意书',
      conclusion_source: '系统判断', operator: '系统', remark: '',
      is_bad_data: 0, bad_data_reason: null
    },
    {
      baby_id: 'B002', baby_name: '李萌萌', parent_phone: '13800138002',
      store_name: '阳光门店', class_name: '小班B', photo_type: '活动照',
      auth_status: '授权撤回', conclusion: '家长通过电话撤回授权',
      conclusion_source: '系统判断', operator: '系统', remark: '家长来电要求撤回',
      is_bad_data: 0, bad_data_reason: null
    },
    {
      baby_id: 'B003', baby_name: '王豆豆', parent_phone: '13800138003',
      store_name: '彩虹门店', class_name: '中班A', photo_type: '日常照',
      auth_status: '未授权', conclusion: '尚未联系到家长',
      conclusion_source: '系统判断', operator: '系统', remark: '多次拨打未接听',
      is_bad_data: 0, bad_data_reason: null
    },
    {
      baby_id: 'B002', baby_name: '李萌萌', parent_phone: '13800138002',
      store_name: '阳光门店', class_name: '中班A', photo_type: '毕业照',
      auth_status: '授权撤回', conclusion: '跨班检测：宝宝在多个班级存在记录',
      conclusion_source: '系统判断', operator: '系统', remark: '与小班B记录冲突，需核实',
      is_bad_data: 0, bad_data_reason: null
    },
    {
      baby_id: 'B999', baby_name: '测试宝宝', parent_phone: '',
      store_name: '', class_name: '', photo_type: '',
      auth_status: '', conclusion: '',
      conclusion_source: '系统判断', operator: '系统', remark: '',
      is_bad_data: 1, bad_data_reason: '数据格式异常，缺少关键信息'
    },
    {
      baby_id: 'B004', baby_name: '陈西西', parent_phone: '13800138004',
      store_name: '星光门店', class_name: '大班A', photo_type: '艺术照',
      auth_status: '已授权', conclusion: '通过售后电话联系，家长确认授权',
      conclusion_source: '手工补录', operator: '售后专员-李明', remark: '家长之前未收到通知，已补签电子授权书',
      is_bad_data: 0, bad_data_reason: null
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO auth_records (
      baby_id, baby_name, parent_phone, store_name, class_name,
      photo_type, auth_status, conclusion, conclusion_source,
      operator, remark, is_bad_data, bad_data_reason, version, is_latest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  `);

  samples.forEach((s, idx) => {
    const result = insertStmt.run(
      s.baby_id, s.baby_name, s.parent_phone, s.store_name, s.class_name,
      s.photo_type, s.auth_status, s.conclusion, s.conclusion_source,
      s.operator, s.remark, s.is_bad_data, s.bad_data_reason
    );
    const recordId = result.lastInsertRowid;

    const record = db.prepare(`SELECT * FROM auth_records WHERE id = ?`).get(recordId);
    snapshotToVersion(record, '系统初始化数据');

    const reason = s.is_bad_data ? '坏数据初始化' : (s.conclusion_source === '手工补录' ? '手工补录初始化' : '系统初始化');
    addOperationLog(
      recordId, '初始化数据', s.operator,
      s.conclusion_source === '手工补录' ? '售后' : '系统',
      reason,
      `初始创建记录: ${s.baby_id} ${s.baby_name} - ${s.auth_status || '无状态'}`
    );
  });

  console.log('样例数据初始化完成，共 6 条记录');
}

seedData();

console.log('test edit works');

app.listen(PORT, () => {
  console.log(`婴幼儿照片授权追踪台门店售后版 服务已启动: http://localhost:${PORT}`);
});
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>婴幼儿照片授权追踪台门店售后版</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:linear-gradient(135deg,#e8f2ff 0%,#f0f7ff 100%);min-height:100vh;color:#1a2b4a}
.header{background:linear-gradient(135deg,#1e4b8c 0%,#2563b8 100%);color:white;padding:20px 32px;box-shadow:0 2px 12px rgba(30,75,140,0.3)}
.header h1{font-size:22px;font-weight:600}
.header .subtitle{font-size:13px;opacity:.85;margin-top:4px}
.container{padding:24px 32px;max-width:1600px;margin:0 auto}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:white;border-radius:12px;padding:18px 20px;box-shadow:0 2px 8px rgba(30,75,140,0.08);border-left:4px solid #2563b8}
.stat-card.green{border-left-color:#10b981}
.stat-card.red{border-left-color:#ef4444}
.stat-card.orange{border-left-color:#f59e0b}
.stat-card.purple{border-left-color:#8b5cf6}
.stat-card.gray{border-left-color:#6b7280}
.stat-card.cyan{border-left-color:#06b6d4}
.stat-label{font-size:12px;color:#64748b;margin-bottom:6px}
.stat-value{font-size:28px;font-weight:700;color:#1e4b8c}
.stat-card.green .stat-value{color:#059669}
.stat-card.red .stat-value{color:#dc2626}
.stat-card.orange .stat-value{color:#d97706}
.stat-card.purple .stat-value{color:#7c3aed}
.stat-card.gray .stat-value{color:#4b5563}
.stat-card.cyan .stat-value{color:#0891b2}
.toolbar{background:white;border-radius:12px;padding:16px 20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(30,75,140,0.08);display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.toolbar label{font-size:13px;color:#475569;font-weight:500}
.toolbar input[type=text]{padding:8px 14px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;width:200px;outline:none;transition:border-color .2s}
.toolbar input[type=text]:focus{border-color:#2563b8}
.btn{padding:8px 18px;border:none;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
.btn-primary{background:#2563b8;color:white}
.btn-primary:hover{background:#1e4b8c}
.btn-success{background:#10b981;color:white}
.btn-success:hover{background:#059669}
.btn-warning{background:#f59e0b;color:white}
.btn-warning:hover{background:#d97706}
.btn-default{background:#f1f5f9;color:#334155}
.btn-default:hover{background:#e2e8f0}
.btn-sm{padding:5px 12px;font-size:12px}
.table-wrapper{background:white;border-radius:12px;box-shadow:0 2px 8px rgba(30,75,140,0.08);overflow:hidden}
table{width:100%;border-collapse:collapse}
thead{background:#f8fafc}
th{padding:14px 16px;text-align:left;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0}
td{padding:12px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
tr:hover{background:#f8fafc}
.status-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}
.status-authorized{background:#d1fae5;color:#065f46}
.status-unauthorized{background:#fee2e2;color:#991b1b}
.status-revoked{background:#fef3c7;color:#92400e}
.status-unknown{background:#e2e8f0;color:#475569}
.source-tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;background:#e0e7ff;color:#3730a3}
.source-tag.manual{background:#fce7f3;color:#9d174d}
.cell-actions{display:flex;gap:8px}
.empty{padding:60px 20px;text-align:center;color:#94a3b8;font-size:14px}
.modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.6);z-index:1000;justify-content:center;align-items:flex-start;padding:40px 20px;overflow-y:auto}
.modal-overlay.active{display:flex}
.modal{background:white;border-radius:16px;width:100%;max-width:800px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;animation:modalIn .25s ease}
@keyframes modalIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
.modal-header{background:linear-gradient(135deg,#1e4b8c 0%,#2563b8 100%);color:white;padding:18px 24px;display:flex;justify-content:space-between;align-items:center}
.modal-header h2{font-size:17px;font-weight:600}
.modal-close{background:none;border:none;color:white;font-size:24px;cursor:pointer;line-height:1;opacity:.85}
.modal-close:hover{opacity:1}
.modal-body{padding:24px}
.modal-body h3{font-size:15px;color:#1e4b8c;margin:20px 0 12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;font-weight:600}
.modal-body h3:first-child{margin-top:0}
.alert-box{background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px;color:#991b1b;font-size:13px;margin-bottom:16px}
.alert-box strong{color:#7f1d1d}
.info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px 20px;margin-bottom:12px}
.info-item{display:flex;flex-direction:column;gap:4px}
.info-label{font-size:12px;color:#64748b}
.info-value{font-size:14px;color:#1e293b;font-weight:500}
.info-value.full{grid-column:1/-1}
.timeline{position:relative;padding-left:24px}
.timeline::before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:#e2e8f0}
.timeline-item{position:relative;padding:12px 0;border-bottom:1px solid #f1f5f9}
.timeline-item:last-child{border-bottom:none}
.timeline-item::before{content:"";position:absolute;left:-21px;top:16px;width:14px;height:14px;border-radius:50%;background:#2563b8;border:3px solid white;box-shadow:0 0 0 2px #bfdbfe}
.timeline-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.timeline-version{font-weight:600;color:#1e4b8c;font-size:14px}
.timeline-time{font-size:12px;color:#64748b}
.timeline-body{font-size:13px;color:#475569}
.timeline-body p{margin:3px 0}
.timeline-body .change-reason{color:#f59e0b;font-style:italic}
.log-list{display:flex;flex-direction:column;gap:8px}
.log-item{background:#f8fafc;border-radius:8px;padding:10px 14px;font-size:13px}
.log-head{display:flex;justify-content:space-between;margin-bottom:4px}
.log-type{font-weight:600;color:#1e4b8c}
.log-time{font-size:12px;color:#64748b}
.log-detail{color:#475569;font-size:12px}
.log-op{color:#64748b;font-size:12px}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:13px;font-weight:500;color:#334155;margin-bottom:6px}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s;font-family:inherit}
.form-group input:focus,.form-group select:focus,.form-group textarea:focus{border-color:#2563b8}
.form-group textarea{resize:vertical;min-height:72px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.modal-footer{padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px}
.version-tag{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;background:#f1f5f9;color:#475563}
</style>
</head>
<body>
<div class="header">
  <h1>婴幼儿照片授权追踪台 · 门店售后版</h1>
  <div class="subtitle">Baby Photo Authorization Tracker · Store Support Edition</div>
</div>
<div class="container">
  <div class="stats-grid" id="statsGrid"></div>
  <div class="toolbar">
    <label for="phoneFilter">家长手机号：</label>
    <input type="text" id="phoneFilter" placeholder="输入手机号搜索...">
    <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="includeBad"> 包含坏数据</label>
    <button class="btn btn-primary" onclick="loadRecords()">查询</button>
    <button class="btn btn-success" onclick="exportCSV()">导出 CSV</button>
    <button class="btn btn-warning" onclick="openCreateModal()">+ 新建补录</button>
  </div>
  <div class="table-wrapper">
    <table>
      <thead><tr>
        <th>宝宝ID / 姓名</th><th>家长手机</th><th>门店 / 班级</th><th>照片类型</th>
        <th>授权状态</th><th>结论</th><th>结论来源</th><th>版本</th><th>操作人</th><th>更新时间</th><th>操作</th>
      </tr></thead>
      <tbody id="recordsTbody"></tbody>
    </table>
  </div>
</div>
<div class="modal-overlay" id="detailModal"><div class="modal">
  <div class="modal-header"><h2 id="detailTitle">记录详情</h2><button class="modal-close" onclick="closeModal('detailModal')">×</button></div>
  <div class="modal-body" id="detailBody"></div>
  <div class="modal-footer"><button class="btn btn-default" onclick="closeModal('detailModal')">关闭</button></div>
</div></div>
<div class="modal-overlay" id="supplementModal"><div class="modal">
  <div class="modal-header"><h2>手工补录</h2><button class="modal-close" onclick="closeModal('supplementModal')">×</button></div>
  <div class="modal-body"><form id="supplementForm">
    <input type="hidden" id="supplementRecordId">
    <div class="form-row">
      <div class="form-group"><label>授权状态</label><select id="suppAuthStatus">
        <option value="已授权">已授权</option><option value="未授权">未授权</option><option value="授权撤回">授权撤回</option>
      </select></div>
      <div class="form-group"><label>操作人</label><input type="text" id="suppOperator" placeholder="请输入操作人姓名"></div>
    </div>
    <div class="form-group"><label>结论</label><input type="text" id="suppConclusion" placeholder="请输入处理结论"></div>
    <div class="form-group"><label>变更原因</label><input type="text" id="suppChangeReason" placeholder="请输入本次变更原因"></div>
    <div class="form-group"><label>备注</label><textarea id="suppRemark" placeholder="请输入补充备注..."></textarea></div>
  </form></div>
  <div class="modal-footer">
    <button class="btn btn-default" onclick="closeModal('supplementModal')">取消</button>
    <button class="btn btn-primary" onclick="submitSupplement()">提交补录</button>
  </div>
</div></div>
<div class="modal-overlay" id="createModal"><div class="modal">
  <div class="modal-header"><h2>新建补录记录</h2><button class="modal-close" onclick="closeModal('createModal')">×</button></div>
  <div class="modal-body"><form id="createForm">
    <div class="form-row">
      <div class="form-group"><label>宝宝ID *</label><input type="text" id="createBabyId" placeholder="例如：B005"></div>
      <div class="form-group"><label>宝宝姓名 *</label><input type="text" id="createBabyName" placeholder="请输入宝宝姓名"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>家长手机</label><input type="text" id="createParentPhone" placeholder="请输入家长手机号"></div>
      <div class="form-group"><label>门店</label><input type="text" id="createStoreName" placeholder="请输入门店名称"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>班级</label><input type="text" id="createClassName" placeholder="例如：小班A"></div>
      <div class="form-group"><label>照片类型</label><select id="createPhotoType">
        <option value="">请选择</option><option value="证件照">证件照</option><option value="活动照">活动照</option>
        <option value="日常照">日常照</option><option value="毕业照">毕业照</option><option value="艺术照">艺术照</option>
      </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>授权状态</label><select id="createAuthStatus">
        <option value="已授权">已授权</option><option value="未授权">未授权</option><option value="授权撤回">授权撤回</option>
      </select></div>
      <div class="form-group"><label>操作人</label><input type="text" id="createOperator" placeholder="请输入操作人姓名"></div>
    </div>
    <div class="form-group"><label>结论</label><input type="text" id="createConclusion" placeholder="请输入处理结论"></div>
    <div class="form-group"><label>备注</label><textarea id="createRemark" placeholder="请输入备注信息..."></textarea></div>
  </form></div>
  <div class="modal-footer">
    <button class="btn btn-default" onclick="closeModal('createModal')">取消</button>
    <button class="btn btn-primary" onclick="submitCreate()">创建记录</button>
  </div>
</div></div>
<script>
function statusClass(s){if(s==="已授权")return"status-authorized";if(s==="未授权")return"status-unauthorized";if(s==="授权撤回")return"status-revoked";return"status-unknown"}
async function loadStats(){try{const res=await fetch("/api/stats");const data=await res.json();const au=(data.byStatus.find(x=>x.auth_status==="已授权")||{}).count||0;const un=(data.byStatus.find(x=>x.auth_status==="未授权")||{}).count||0;const re=(data.byStatus.find(x=>x.auth_status==="授权撤回")||{}).count||0;const ma=(data.bySource.find(x=>x.conclusion_source==="手工补录")||{}).count||0;document.getElementById("statsGrid").innerHTML='<div class="stat-card"><div class="stat-label">总记录数</div><div class="stat-value">'+data.total+'</div></div><div class="stat-card green"><div class="stat-label">已授权</div><div class="stat-value">'+au+'</div></div><div class="stat-card red"><div class="stat-label">未授权</div><div class="stat-value">'+un+'</div></div><div class="stat-card orange"><div class="stat-label">授权撤回</div><div class="stat-value">'+re+'</div></div><div class="stat-card purple"><div class="stat-label">手工补录数</div><div class="stat-value">'+ma+'</div></div><div class="stat-card gray"><div class="stat-label">坏数据数</div><div class="stat-value">'+data.badData+'</div></div><div class="stat-card cyan"><div class="stat-label">历史版本总数</div><div class="stat-value">'+data.totalVersions+'</div></div>'}catch(e){console.error("加载统计失败",e)}}
async function loadRecords(){const phone=document.getElementById("phoneFilter").value.trim();const ib=document.getElementById("includeBad").checked?"1":"0";let url="/api/records?include_bad="+ib;if(phone)url+="&phone="+encodeURIComponent(phone);try{const res=await fetch(url);const rs=await res.json();const tb=document.getElementById("recordsTbody");if(rs.length===0){tb.innerHTML='<tr><td colspan="11" class="empty">暂无记录</td></tr>';return}tb.innerHTML=rs.map(r=>'<tr><td><strong>'+r.baby_id+'</strong> · '+r.baby_name+'</td><td>'+(r.parent_phone||'-')+'</td><td>'+(r.store_name||'-')+' / '+(r.class_name||'-')+'</td><td>'+(r.photo_type||'-')+'</td><td><span class="status-badge '+statusClass(r.auth_status)+'">'+(r.auth_status||'-')+'</span></td><td>'+(r.conclusion||'-')+'</td><td><span class="source-tag '+(r.conclusion_source==="手工补录"?"manual":"")+'">'+(r.conclusion_source||'-')+'</span></td><td><span class="version-tag">v'+r.version+'</span></td><td>'+(r.operator||'-')+'</td><td style="color:#64748b;font-size:12px;">'+r.updated_at+'</td><td><div class="cell-actions"><button class="btn btn-sm btn-primary" onclick="viewDetail('+r.id+')">详情</button><button class="btn btn-sm btn-warning" onclick="openSupplement('+r.id+')">补录</button></div></td></tr>').join("")}catch(e){console.error("加载列表失败",e)}}
async function viewDetail(id){try{const res=await fetch("/api/records/"+id);const d=await res.json();const r=d.record;document.getElementById("detailTitle").textContent=r.baby_id+" · "+r.baby_name+" - 记录详情";let h="";if(d.accessReason)h+='<div class="alert-box"><strong>⚠️ 跨班/异常提示：</strong>'+d.accessReason+'</div>';h+='<h3>📋 基本信息</h3><div class="info-grid"><div class="info-item"><span class="info-label">宝宝ID</span><span class="info-value">'+r.baby_id+'</span></div><div class="info-item"><span class="info-label">宝宝姓名</span><span class="info-value">'+r.baby_name+'</span></div><div class="info-item"><span class="info-label">家长手机</span><span class="info-value">'+(r.parent_phone||'-')+'</span></div><div class="info-item"><span class="info-label">门店 / 班级</span><span class="info-value">'+(r.store_name||'-')+' / '+(r.class_name||'-')+'</span></div><div class="info-item"><span class="info-label">照片类型</span><span class="info-value">'+(r.photo_type||'-')+'</span></div><div class="info-item"><span class="info-label">当前版本</span><span class="info-value"><span class="version-tag">v'+r.version+'</span></span></div><div class="info-item"><span class="info-label">授权状态</span><span class="info-value"><span class="status-badge '+statusClass(r.auth_status)+'">'+(r.auth_status||'-')+'</span></span></div><div class="info-item"><span class="info-label">结论来源</span><span class="info-value"><span class="source-tag '+(r.conclusion_source==="手工补录"?"manual":"")+'">'+(r.conclusion_source||'-')+'</span></span></div><div class="info-item full"><span class="info-label">结论</span><span class="info-value">'+(r.conclusion||'-')+'</span></div><div class="info-item full"><span class="info-label">备注</span><span class="info-value">'+(r.remark||'-')+'</span></div><div class="info-item"><span class="info-label">操作人</span><span class="info-value">'+(r.operator||'-')+'</span></div><div class="info-item"><span class="info-label">更新时间</span><span class="info-value" style="font-size:13px;">'+r.updated_at+'</span></div></div>';if(d.sameBaby&&d.sameBaby.length>0){h+='<h3>👶 同宝宝其他记录 ('+d.sameBaby.length+')</h3>';d.sameBaby.forEach(s=>{h+='<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:13px;"><strong>'+s.baby_id+' · '+s.baby_name+'</strong><span style="margin:0 8px;color:#cbd5e1;">|</span>'+(s.store_name||'-')+' / '+(s.class_name||'-')+'<span style="margin:0 8px;color:#cbd5e1;">|</span><span class="status-badge '+statusClass(s.auth_status)+'">'+(s.auth_status||'-')+'</span><span style="margin:0 8px;color:#cbd5e1;">|</span><span class="source-tag '+(s.conclusion_source==="手工补录"?"manual":"")+'">'+(s.conclusion_source||'-')+'</span><span style="margin:0 8px;color:#cbd5e1;">|</span><span class="version-tag">v'+s.version+'</span><div style="margin-top:6px;color:#475569;">'+(s.conclusion||'')+'</div></div>'})}h+='<h3>🕐 历史版本时间线 ('+d.versions.length+')</h3>';if(d.versions.length===0)h+='<div class="empty" style="padding:24px;">暂无历史版本</div>';else{h+='<div class="timeline">';d.versions.forEach(v=>{h+='<div class="timeline-item"><div class="timeline-head"><span class="timeline-version">v'+v.version+' · <span class="status-badge '+statusClass(v.auth_status)+'" style="font-size:11px;">'+(v.auth_status||'-')+'</span></span><span class="timeline-time">'+v.updated_at+'</span></div><div class="timeline-body"><p><strong>结论：</strong>'+(v.conclusion||'-')+'</p><p><strong>操作人：</strong>'+(v.operator||'-')+'</p>'+(v.change_reason?'<p class="change-reason">💬 '+v.change_reason+'</p>':'')+'</div></div>'});h+='</div>'}h+='<h3>📝 操作日志 ('+d.logs.length+')</h3>';if(d.logs.length===0)h+='<div class="empty" style="padding:24px;">暂无操作日志</div>';else{h+='<div class="log-list">';d.logs.forEach(l=>{h+='<div class="log-item"><div class="log-head"><span class="log-type">'+l.operation_type+'</span><span class="log-time">'+l.created_at+'</span></div><div class="log-detail">'+(l.detail||'')+'</div><div class="log-op">👤 '+(l.operator||'-')+' · '+(l.operator_role||'')+(l.reason?' · 原因: '+l.reason:'')+'</div></div>'});h+='</div>'}document.getElementById("detailBody").innerHTML=h;openModal("detailModal")}catch(e){console.error("加载详情失败",e)}}
function openSupplement(id){document.getElementById("supplementRecordId").value=id;document.getElementById("suppAuthStatus").value="已授权";document.getElementById("suppOperator").value="";document.getElementById("suppConclusion").value="";document.getElementById("suppChangeReason").value="";document.getElementById("suppRemark").value="";openModal("supplementModal")}
async function submitSupplement(){const id=document.getElementById("supplementRecordId").value;const p={auth_status:document.getElementById("suppAuthStatus").value,conclusion:document.getElementById("suppConclusion").value,remark:document.getElementById("suppRemark").value,operator:document.getElementById("suppOperator").value,change_reason:document.getElementById("suppChangeReason").value};try{const res=await fetch("/api/records/"+id+"/supplement",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!res.ok)throw new Error("提交失败");closeModal("supplementModal");loadRecords();loadStats()}catch(e){alert("提交失败: "+e.message)}}
function openCreateModal(){document.getElementById("createForm").reset();openModal("createModal")}
async function submitCreate(){const bi=document.getElementById("createBabyId").value.trim();const bn=document.getElementById("createBabyName").value.trim();if(!bi||!bn){alert("宝宝ID和姓名为必填项");return}const p={baby_id:bi,baby_name:bn,parent_phone:document.getElementById("createParentPhone").value.trim(),store_name:document.getElementById("createStoreName").value.trim(),class_name:document.getElementById("createClassName").value.trim(),photo_type:document.getElementById("createPhotoType").value,auth_status:document.getElementById("createAuthStatus").value,conclusion:document.getElementById("createConclusion").value.trim(),operator:document.getElementById("createOperator").value.trim(),remark:document.getElementById("createRemark").value.trim()};try{const res=await fetch("/api/records",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(!res.ok){const err=await res.json();throw new Error(err.error||"创建失败")}closeModal("createModal");loadRecords();loadStats()}catch(e){alert("创建失败: "+e.message)}}
async function exportCSV(){const phone=document.getElementById("phoneFilter").value.trim();const ib=document.getElementById("includeBad").checked?"1":"0";let url="/api/export?include_bad="+ib;if(phone)url+="&phone="+encodeURIComponent(phone);window.location.href=url}
function openModal(id){document.getElementById(id).classList.add("active");document.body.style.overflow="hidden"}
function closeModal(id){document.getElementById(id).classList.remove("active");document.body.style.overflow=""}
document.querySelectorAll(".modal-overlay").forEach(o=>{o.addEventListener("click",e=>{if(e.target===o)closeModal(o.id)})});
document.getElementById("phoneFilter").addEventListener("keydown",e=>{if(e.key==="Enter")loadRecords()});
loadStats();loadRecords();
</script>
</body>
</html>`;
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'index.html'), html, 'utf8');
  console.log('前端页面已生成: public/index.html');
}
generateIndexHtml();

app.listen(PORT, () => {
  console.log(`婴幼儿照片授权追踪台门店售后版 服务已启动: http://localhost:${PORT}`);
});
