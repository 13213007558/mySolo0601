const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'sleep-review.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('supervisor','parent','elder','nanny')),
      display_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_name TEXT NOT NULL,
      sleep_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      sleep_quality TEXT CHECK(sleep_quality IN ('good','normal','poor')),
      environment TEXT,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','returned','archived')),
      created_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS timelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      observation_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('create','update','submit','return','approve','archive','partial_success','rollback')),
      actor_id INTEGER NOT NULL,
      from_status TEXT,
      to_status TEXT,
      comment TEXT,
      fields_changed TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (observation_id) REFERENCES observations(id),
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      observation_id INTEGER,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (observation_id) REFERENCES observations(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_obs_status ON observations(status);
    CREATE INDEX IF NOT EXISTS idx_obs_created ON observations(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_timeline_obs ON timelines(observation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_obs ON audits(observation_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audits(user_id, created_at DESC);
  `);
}

initSchema();

module.exports = db;
