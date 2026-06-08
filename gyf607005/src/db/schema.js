const TABLES = {
  BABIES: 'babies',
  FLOWS: 'flows',
  HX_RECORDS: 'hx_records',
  BL_RECORDS: 'bl_records',
  AUDIT_LOGS: 'audit_logs',
  ROLES: 'roles',
  VIEWS: 'views'
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLES.BABIES} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_name TEXT NOT NULL,
  baby_code TEXT NOT NULL UNIQUE,
  parent_name TEXT,
  phone TEXT,
  class_name TEXT,
  enrollment_date TEXT,
  status TEXT DEFAULT '在托',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ${TABLES.FLOWS} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_no TEXT NOT NULL,
  baby_id INTEGER,
  package_name TEXT,
  package_type TEXT,
  total_hours INTEGER DEFAULT 0,
  total_amount REAL DEFAULT 0,
  purchase_date TEXT,
  valid_until TEXT,
  data_source TEXT DEFAULT '系统导入',
  batch_no TEXT,
  record_status TEXT DEFAULT '有效',
  data_abnormal INTEGER DEFAULT 0,
  abnormal_reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (baby_id) REFERENCES ${TABLES.BABIES}(id)
);

CREATE TABLE IF NOT EXISTS ${TABLES.HX_RECORDS} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hx_no TEXT NOT NULL,
  flow_id INTEGER,
  baby_id INTEGER,
  hx_date TEXT,
  hx_hours INTEGER DEFAULT 0,
  hx_amount REAL DEFAULT 0,
  process_status TEXT DEFAULT '待处理',
  process_result TEXT,
  operator TEXT,
  process_time TEXT,
  is_closed INTEGER DEFAULT 0,
  allow_partial_success INTEGER DEFAULT 0,
  row_abnormal TEXT DEFAULT '正常',
  abnormal_reason TEXT,
  is_manual INTEGER DEFAULT 0,
  bl_ids TEXT DEFAULT '[]',
  audit_ids TEXT DEFAULT '[]',
  remark TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flow_id) REFERENCES ${TABLES.FLOWS}(id),
  FOREIGN KEY (baby_id) REFERENCES ${TABLES.BABIES}(id)
);

CREATE TABLE IF NOT EXISTS ${TABLES.BL_RECORDS} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bl_no TEXT NOT NULL,
  hx_id INTEGER,
  baby_id INTEGER,
  material_type TEXT,
  material_desc TEXT,
  submit_time TEXT,
  submitter TEXT,
  process_status TEXT DEFAULT '待处理',
  process_result TEXT,
  operator TEXT,
  process_time TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hx_id) REFERENCES ${TABLES.HX_RECORDS}(id),
  FOREIGN KEY (baby_id) REFERENCES ${TABLES.BABIES}(id)
);

CREATE TABLE IF NOT EXISTS ${TABLES.AUDIT_LOGS} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_no TEXT NOT NULL,
  hx_id INTEGER,
  operation_type TEXT,
  before_status TEXT,
  after_status TEXT,
  operator_id TEXT,
  operator_name TEXT NOT NULL,
  operation_time TEXT,
  operation_source TEXT DEFAULT '人工操作',
  need_review INTEGER DEFAULT 0,
  review_status TEXT DEFAULT '未复查',
  reviewer TEXT,
  review_remark TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hx_id) REFERENCES ${TABLES.HX_RECORDS}(id)
);

CREATE TABLE IF NOT EXISTS ${TABLES.ROLES} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name TEXT NOT NULL UNIQUE,
  role_type TEXT NOT NULL,
  table_permissions TEXT,
  field_permissions TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ${TABLES.VIEWS} (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  view_name TEXT NOT NULL,
  role_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  visible_fields TEXT,
  filter_condition TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flow_no ON ${TABLES.FLOWS}(flow_no);
CREATE INDEX IF NOT EXISTS idx_flow_batch ON ${TABLES.FLOWS}(batch_no);
CREATE INDEX IF NOT EXISTS idx_flow_status ON ${TABLES.FLOWS}(record_status);
CREATE INDEX IF NOT EXISTS idx_hx_flow ON ${TABLES.HX_RECORDS}(flow_id);
CREATE INDEX IF NOT EXISTS idx_hx_baby ON ${TABLES.HX_RECORDS}(baby_id);
CREATE INDEX IF NOT EXISTS idx_hx_status ON ${TABLES.HX_RECORDS}(process_status);
CREATE INDEX IF NOT EXISTS idx_hx_row_abnormal ON ${TABLES.HX_RECORDS}(row_abnormal);
CREATE INDEX IF NOT EXISTS idx_bl_hx ON ${TABLES.BL_RECORDS}(hx_id);
CREATE INDEX IF NOT EXISTS idx_audit_hx ON ${TABLES.AUDIT_LOGS}(hx_id);
CREATE INDEX IF NOT EXISTS idx_audit_need_review ON ${TABLES.AUDIT_LOGS}(need_review);
`;

module.exports = {
  TABLES,
  SCHEMA_SQL
};
