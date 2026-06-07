import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'auth_cleaning.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS authorizations (
      id TEXT PRIMARY KEY,
      baby_name TEXT NOT NULL,
      baby_birth TEXT,
      parent_phone TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      store_name TEXT NOT NULL,
      auth_type TEXT NOT NULL CHECK(auth_type IN ('primary','temporary','phone')),
      auth_status TEXT NOT NULL CHECK(auth_status IN ('active','revoked','expired','pending','failed','corrected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_operator TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_authorizations_parent_phone ON authorizations(parent_phone);
    CREATE INDEX IF NOT EXISTS idx_authorizations_status ON authorizations(auth_status);
    CREATE INDEX IF NOT EXISTS idx_authorizations_store ON authorizations(store_name);

    CREATE TABLE IF NOT EXISTS pickup_persons (
      id TEXT PRIMARY KEY,
      auth_id TEXT NOT NULL REFERENCES authorizations(id),
      name TEXT NOT NULL,
      relation TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      is_phone_auth INTEGER NOT NULL DEFAULT 0,
      auth_start TEXT,
      auth_end TEXT,
      remark TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pickup_auth ON pickup_persons(auth_id);

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      auth_id TEXT NOT NULL REFERENCES authorizations(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('auth_letter','id_card','other')),
      status TEXT NOT NULL CHECK(status IN ('ok','missing','damaged')),
      uploaded_at TEXT NOT NULL,
      uploader TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_materials_auth ON materials(auth_id);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      auth_id TEXT NOT NULL REFERENCES authorizations(id),
      operator TEXT NOT NULL,
      operator_role TEXT NOT NULL,
      action TEXT NOT NULL,
      field TEXT,
      old_value TEXT,
      new_value TEXT,
      reason TEXT,
      timestamp TEXT NOT NULL,
      ip TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_auth ON audit_logs(auth_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

    CREATE TABLE IF NOT EXISTS export_records (
      id TEXT PRIMARY KEY,
      operator TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('csv','markdown')),
      filter_criteria TEXT,
      page_count INTEGER NOT NULL,
      export_count INTEGER NOT NULL,
      diff_count INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('success','partial','failed','rejected')),
      missing_ids TEXT,
      created_at TEXT NOT NULL,
      remark TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_export_created ON export_records(created_at);

    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY,
      auth_id TEXT NOT NULL REFERENCES authorizations(id),
      before_data TEXT NOT NULL,
      after_data TEXT NOT NULL,
      reason TEXT NOT NULL,
      operator TEXT NOT NULL,
      reviewed_by TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_corrections_auth ON corrections(auth_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_status ON corrections(status);
  `);
}
