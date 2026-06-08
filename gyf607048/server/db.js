const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','supervisor','morning_teacher','teacher','parent')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS babies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_date TEXT,
    room_no TEXT,
    admission_date TEXT,
    discharge_date TEXT,
    guardian_name TEXT,
    guardian_phone TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','discharged')),
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS care_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id INTEGER NOT NULL,
    batch_no TEXT,
    record_type TEXT NOT NULL DEFAULT 'normal' CHECK(record_type IN ('normal','temp_supplement','bad_row')),
    record_date TEXT NOT NULL,
    shift TEXT CHECK(shift IN ('morning','afternoon','night')),
    nurse_id INTEGER,
    nurse_name TEXT,
    temperature REAL,
    weight REAL,
    feeding_amount REAL,
    diaper_count INTEGER,
    sleep_hours REAL,
    notes_public TEXT,
    notes_internal TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('pending_review','reviewed','rejected')),
    reviewed_by INTEGER,
    reviewed_at TEXT,
    photo_url TEXT,
    photo_description TEXT,
    rectification_note TEXT,
    rectification_status TEXT DEFAULT 'none' CHECK(rectification_status IN ('none','pending','done')),
    is_valid INTEGER NOT NULL DEFAULT 1 CHECK(is_valid IN (0,1)),
    cross_shift_reason TEXT,
    unauthorized_view_reason TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    created_by INTEGER,
    FOREIGN KEY(baby_id) REFERENCES babies(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER,
    baby_id INTEGER,
    action TEXT NOT NULL CHECK(action IN ('create','update','review','reject','delete','view_unauthorized','cross_shift')),
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    operator_id INTEGER,
    operator_name TEXT,
    operator_role TEXT,
    reason TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_records_baby ON care_records(baby_id);
  CREATE INDEX IF NOT EXISTS idx_records_date ON care_records(record_date);
  CREATE INDEX IF NOT EXISTS idx_records_valid ON care_records(is_valid);
  CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(record_id);
  CREATE INDEX IF NOT EXISTS idx_audit_baby ON audit_logs(baby_id);
`);

const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
if (userCount === 0) {
  const insertUser = db.prepare(`INSERT INTO users (username, name, role) VALUES (?, ?, ?)`);
  insertUser.run('admin', '系统管理员', 'admin');
  insertUser.run('supervisor', '护理主管', 'supervisor');
  insertUser.run('morning', '早班张老师', 'morning_teacher');
  insertUser.run('nurse_li', '李护士', 'teacher');
  insertUser.run('parent_youyou', '柚柚家长', 'parent');
}

const babyCount = db.prepare('SELECT COUNT(*) as cnt FROM babies').get().cnt;
if (babyCount === 0) {
  const insertBaby = db.prepare(`INSERT INTO babies (name, birth_date, room_no, admission_date, guardian_name, guardian_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertBaby.run('柚柚', '2026-05-20', 'VIP-301', '2026-05-25', '柚柚妈妈', '13800000001', 'active');
  insertBaby.run('乐乐', '2026-05-18', 'VIP-302', '2026-05-22', '乐乐爸爸', '13800000002', 'active');
}

module.exports = db;
