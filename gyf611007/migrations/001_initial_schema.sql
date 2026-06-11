CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('chief','assistant','admin')),
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_code TEXT NOT NULL UNIQUE,
  tea_name TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT '',
  standard_sample_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','locked','downgraded')),
  re_eval_count INTEGER NOT NULL DEFAULT 0,
  locked_at TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  sample_code TEXT NOT NULL,
  spoon_verified INTEGER NOT NULL DEFAULT 0,
  sip_duration_ms INTEGER,
  avg_volume_db REAL,
  volume_threshold_db REAL NOT NULL DEFAULT 35.0,
  sip_valid INTEGER,
  invalidate_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sipping','scored','invalid')),
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(batch_id, sample_code)
);

CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sample_id INTEGER NOT NULL REFERENCES samples(id),
  scorer_id INTEGER NOT NULL REFERENCES users(id),
  appearance REAL NOT NULL CHECK(appearance >= 0 AND appearance <= 100),
  aroma REAL NOT NULL CHECK(aroma >= 0 AND aroma <= 100),
  taste REAL NOT NULL CHECK(taste >= 0 AND taste <= 100),
  leaf REAL NOT NULL CHECK(leaf >= 0 AND leaf <= 100),
  total REAL NOT NULL,
  deviation REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sample_id, scorer_id)
);

CREATE TABLE certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES batches(id),
  content_json TEXT NOT NULL,
  signed_by INTEGER REFERENCES users(id),
  signed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
