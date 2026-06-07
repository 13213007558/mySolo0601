const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'authorization.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS authorizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_name TEXT NOT NULL,
  baby_dob TEXT,
  room_number TEXT,
  mother_name TEXT,
  authorized_person TEXT NOT NULL,
  id_card TEXT,
  phone TEXT,
  relationship TEXT,
  auth_type TEXT NOT NULL DEFAULT 'normal',
  phone_auth_by TEXT,
  phone_auth_note TEXT,
  temp_auntie_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  summary TEXT,
  closed_at TEXT,
  closed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorization_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  description TEXT,
  uploaded_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (authorization_id) REFERENCES authorizations(id)
);

CREATE TABLE IF NOT EXISTS rectifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorization_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  handler TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (authorization_id) REFERENCES authorizations(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorization_id INTEGER,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  operator TEXT,
  operator_display TEXT NOT NULL DEFAULT '未知处理人',
  operator_found INTEGER DEFAULT 1,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_auth_status ON authorizations(status);
CREATE INDEX IF NOT EXISTS idx_audit_auth ON audit_logs(authorization_id);
CREATE INDEX IF NOT EXISTS idx_photos_auth ON photos(authorization_id);
CREATE INDEX IF NOT EXISTS idx_rect_auth ON rectifications(authorization_id);
`);

module.exports = db;
