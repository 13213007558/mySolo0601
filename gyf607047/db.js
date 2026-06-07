const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'data', 'app.db');
const DB_DIR = path.dirname(DB_PATH);

let db = null;
let SQL = null;

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

async function initDb() {
  if (db) return db;
  SQL = await initSqlJs();
  ensureDir();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_name TEXT NOT NULL,
      room_no TEXT,
      nurse_name TEXT NOT NULL,
      sleep_start TEXT NOT NULL,
      sleep_end TEXT,
      sleep_quality TEXT,
      position TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      observation_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      operator TEXT NOT NULL,
      remark TEXT,
      snapshot_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(observation_id) REFERENCES observations(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      observation_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY(observation_id) REFERENCES observations(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      observation_id INTEGER NOT NULL,
      reject_reason TEXT NOT NULL,
      rejected_by TEXT NOT NULL,
      rejected_at TEXT NOT NULL,
      correction_content TEXT,
      corrected_by TEXT,
      corrected_at TEXT,
      FOREIGN KEY(observation_id) REFERENCES observations(id)
    )
  `);

  saveDb();
  return db;
}

function saveDb() {
  if (!db) return;
  ensureDir();
  const data = db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buf);
}

function now() {
  return new Date().toISOString();
}

function queryAll(sql, params = []) {
  try {
    if (params.length === 0) {
      const result = db.exec(sql);
      if (!result || !result.length) return [];
      const cols = result[0].columns;
      return result[0].values.map(row => {
        const obj = {};
        cols.forEach((c, i) => { obj[c] = row[i]; });
        return obj;
      });
    }
    const stmt = db.prepare(sql);
    stmt.bind(params.map(p => (p === undefined ? null : p)));
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('[DB queryAll ERROR]', sql, params, e.message);
    throw e;
  }
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params.map(p => (p === undefined ? null : p)));
  saveDb();
}

function lastInsertId() {
  const row = queryOne('SELECT last_insert_rowid() AS id');
  if (row && row.id > 0) return row.id;
  const maxRow = queryOne('SELECT MAX(id) AS id FROM observations');
  return (maxRow && maxRow.id) || 1;
}

module.exports = {
  initDb,
  saveDb,
  now,
  queryAll,
  queryOne,
  run,
  lastInsertId,
};
