PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20
);

CREATE TABLE IF NOT EXISTS babies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_id_card TEXT NOT NULL,
  home_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal',
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE IF NOT EXISTS disinfection_records (
  id TEXT PRIMARY KEY,
  baby_id TEXT NOT NULL,
  baby_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  operate_time TEXT NOT NULL,
  is_manual INTEGER NOT NULL DEFAULT 0,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS exception_records (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  baby_id TEXT NOT NULL,
  baby_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  handler_id TEXT,
  handler_name TEXT,
  handle_measure TEXT,
  handle_time TEXT,
  create_time TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_comment TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  operator_id TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  operate_time TEXT NOT NULL,
  before_data TEXT,
  after_data TEXT,
  sync_status TEXT NOT NULL DEFAULT 'success',
  retry_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS compensation_tasks (
  id TEXT PRIMARY KEY,
  audit_log_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_records_baby ON disinfection_records(baby_id);
CREATE INDEX IF NOT EXISTS idx_records_class ON disinfection_records(class_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_baby ON exception_records(baby_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exception_records(status);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON compensation_tasks(status);
