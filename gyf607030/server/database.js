const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('consultant', 'gatekeeper')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS milk_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT,
      class_name TEXT,
      record_date TEXT NOT NULL,
      source_chat_amount INTEGER,
      source_paper_amount INTEGER,
      original_promise TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'mismatched', 'missing_material', 'bad_data')),
      reconciliation_note TEXT,
      is_bad_data INTEGER NOT NULL DEFAULT 0,
      bad_data_reason TEXT,
      material_pages INTEGER,
      material_pages_expected INTEGER,
      export_count_mismatch INTEGER NOT NULL DEFAULT 0,
      export_count_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      old_promise TEXT,
      new_promise TEXT,
      changed_by INTEGER NOT NULL,
      change_note TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (record_id) REFERENCES milk_records(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      is_parent_correction INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (record_id) REFERENCES milk_records(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_milk_records_date ON milk_records(record_date);
    CREATE INDEX IF NOT EXISTS idx_milk_records_status ON milk_records(status);
    CREATE INDEX IF NOT EXISTS idx_status_history_record ON status_history(record_id);
    CREATE INDEX IF NOT EXISTS idx_notes_record ON notes(record_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (name, role) VALUES (?, ?)');
    insertUser.run('张顾问', 'consultant');
    insertUser.run('李顾问', 'consultant');
    insertUser.run('王门岗', 'gatekeeper');
    insertUser.run('赵门岗', 'gatekeeper');
  }
}

initDatabase();

module.exports = db;
