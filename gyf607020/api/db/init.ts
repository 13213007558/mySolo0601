import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'milk_records.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const ddl = `
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  baby_name TEXT NOT NULL,
  baby_birthday TEXT,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_id_card TEXT,
  milk_quantity INTEGER NOT NULL,
  milk_unit TEXT NOT NULL DEFAULT 'ml',
  authorization_no TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  review_reason TEXT,
  handler_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_at TEXT,
  is_bad_data INTEGER NOT NULL DEFAULT 0,
  data_issues_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_records_phone ON records(parent_phone);
CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at);

CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT,
  handler_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (record_id) REFERENCES records(id)
);

CREATE INDEX IF NOT EXISTS idx_review_logs_record ON review_logs(record_id);

CREATE TABLE IF NOT EXISTS bad_records (
  id TEXT PRIMARY KEY,
  original_record_id TEXT NOT NULL,
  baby_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  reason TEXT NOT NULL,
  marked_by TEXT NOT NULL,
  marked_at TEXT NOT NULL,
  FOREIGN KEY (original_record_id) REFERENCES records(id)
);
`;

db.exec(ddl);
