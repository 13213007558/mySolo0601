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

const dbPath = path.join(dataDir, 'photo_auth.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const ddl = `
CREATE TABLE IF NOT EXISTS photo_authorizations (
  id TEXT PRIMARY KEY,
  baby_name TEXT NOT NULL,
  baby_birthday TEXT,
  class_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK(auth_type IN ('class_activity','promotion','social_media','print_material','other')),
  photo_scope TEXT NOT NULL CHECK(photo_scope IN ('class_only','store_wide','chain_wide','public')),
  status TEXT NOT NULL CHECK(status IN ('pending','authorized','partial','revoked','expired','bad_data')),
  valid_start TEXT,
  valid_end TEXT,
  original_commitment TEXT NOT NULL DEFAULT '',
  is_manual_entry INTEGER NOT NULL DEFAULT 0,
  is_bad_data INTEGER NOT NULL DEFAULT 0,
  bad_data_reason TEXT,
  handler_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pa_status ON photo_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_pa_class ON photo_authorizations(class_name);
CREATE INDEX IF NOT EXISTS idx_pa_phone ON photo_authorizations(parent_phone);
CREATE INDEX IF NOT EXISTS idx_pa_created ON photo_authorizations(created_at);

CREATE TABLE IF NOT EXISTS remark_histories (
  id TEXT PRIMARY KEY,
  auth_id TEXT NOT NULL REFERENCES photo_authorizations(id),
  timestamp TEXT NOT NULL,
  operator_id TEXT,
  operator_name TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('original_commitment','supplement','status_change','parent_revision'))
);
CREATE INDEX IF NOT EXISTS idx_rm_auth ON remark_histories(auth_id);
CREATE INDEX IF NOT EXISTS idx_rm_time ON remark_histories(timestamp);

CREATE TABLE IF NOT EXISTS photo_auth_versions (
  id TEXT PRIMARY KEY,
  auth_id TEXT NOT NULL REFERENCES photo_authorizations(id),
  version INTEGER NOT NULL,
  snapshot TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_v_auth ON photo_auth_versions(auth_id);
CREATE INDEX IF NOT EXISTS idx_v_version ON photo_auth_versions(auth_id, version);

CREATE TABLE IF NOT EXISTS system_events (
  id TEXT PRIMARY KEY,
  auth_id TEXT REFERENCES photo_authorizations(id),
  event_type TEXT NOT NULL CHECK(event_type IN ('service_start','service_restart','data_recovery','history_loss_detected','bad_data_isolated','db_migrated')),
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_se_auth ON system_events(auth_id);
CREATE INDEX IF NOT EXISTS idx_se_time ON system_events(created_at);
CREATE INDEX IF NOT EXISTS idx_se_type ON system_events(event_type);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  auth_id TEXT NOT NULL REFERENCES photo_authorizations(id),
  action TEXT NOT NULL CHECK(action IN ('create','update','status_change','supplement_remark','manual_entry','mark_bad','restore','export')),
  operator_id TEXT,
  operator_name TEXT NOT NULL,
  operator_role TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  timestamp TEXT NOT NULL,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_al_auth ON audit_logs(auth_id);
CREATE INDEX IF NOT EXISTS idx_al_time ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_al_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS photo_materials (
  id TEXT PRIMARY KEY,
  auth_id TEXT NOT NULL REFERENCES photo_authorizations(id),
  name TEXT NOT NULL,
  url TEXT,
  upload_time TEXT NOT NULL,
  uploader TEXT NOT NULL,
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_pm_auth ON photo_materials(auth_id);
`;

db.exec(ddl);

export function initSchema() {
  db.exec(ddl);
}
