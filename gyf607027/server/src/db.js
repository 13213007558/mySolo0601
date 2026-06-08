const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_no TEXT UNIQUE NOT NULL,
      baby_name TEXT NOT NULL,
      baby_age_months INTEGER,
      parent_phone TEXT NOT NULL,
      store_name TEXT,
      current_status TEXT NOT NULL DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      closed_by TEXT
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_title TEXT NOT NULL,
      description TEXT,
      operator_id TEXT,
      operator_name TEXT,
      operator_missing INTEGER DEFAULT 0,
      status_before TEXT,
      status_after TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      material_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      file_name TEXT,
      uploaded_by TEXT,
      is_supplement INTEGER DEFAULT 0,
      part_of_closed_case INTEGER DEFAULT 0,
      process_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER,
      event_id INTEGER,
      action TEXT NOT NULL,
      detail TEXT,
      operator_id TEXT,
      operator_name TEXT,
      operator_missing INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_cases_phone ON cases(parent_phone);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(current_status);
    CREATE INDEX IF NOT EXISTS idx_timeline_case ON timeline_events(case_id);
    CREATE INDEX IF NOT EXISTS idx_materials_case ON materials(case_id);
    CREATE INDEX IF NOT EXISTS idx_audits_case ON audits(case_id);
  `);
}

initDB();

module.exports = db;
