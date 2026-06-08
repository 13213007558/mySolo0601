const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'nursing.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  shift TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS babies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  card_no TEXT UNIQUE NOT NULL,
  guardian TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS nursing_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id INTEGER NOT NULL REFERENCES babies(id),
  scan_code TEXT NOT NULL,
  milk_amount REAL NOT NULL,
  feed_time TEXT,
  temperature REAL,
  note TEXT,
  shift TEXT,
  operator_id INTEGER REFERENCES users(id),
  operator_name TEXT,
  status TEXT DEFAULT 'pending',
  is_valid INTEGER DEFAULT 1,
  invalid_reason TEXT,
  review_note TEXT,
  reviewer_id INTEGER REFERENCES users(id),
  reviewer_name TEXT,
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS idx_nursing_scan ON nursing_records(scan_code);
CREATE INDEX IF NOT EXISTS idx_nursing_baby ON nursing_records(baby_id);
CREATE INDEX IF NOT EXISTS idx_nursing_status ON nursing_records(status);
CREATE INDEX IF NOT EXISTS idx_nursing_valid ON nursing_records(is_valid);
`);

const initStmt = db.prepare('SELECT COUNT(*) as c FROM users');
if (initStmt.get().c === 0) {
  const insUser = db.prepare('INSERT INTO users (name, role, shift) VALUES (?, ?, ?)');
  insUser.run('张主管', 'supervisor', 'all');
  insUser.run('李前台', 'staff', 'morning');
  insUser.run('王前台', 'staff', 'evening');
  insUser.run('赵前台', 'staff', 'night');

  const insBaby = db.prepare('INSERT INTO babies (name, card_no, guardian, phone) VALUES (?, ?, ?, ?)');
  insBaby.run('小明', 'B001', '明妈妈', '13800000001');
  insBaby.run('小红', 'B002', '红爸爸', '13800000002');
  insBaby.run('豆豆', 'B003', '豆奶奶', '13800000003');
}

module.exports = db;
