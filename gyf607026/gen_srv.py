import os
P = '/Users/guo/pro/solo/workspaces/gyf607026'
os.makedirs(P + '/public', exist_ok=True)
os.makedirs(P + '/data', exist_ok=True)

with open(P + '/server.js', 'w', encoding='utf-8') as f:
    f.write("""const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'auth_tracker.db'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

db.exec(`
  CREATE TABLE IF NOT EXISTS auth_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baby_id TEXT NOT NULL,
    baby_name TEXT NOT NULL,
    parent_phone TEXT,
    store_name TEXT,
    class_name TEXT,
    photo_type TEXT,
    auth_status TEXT,
    conclusion TEXT,
    conclusion_source TEXT,
    operator TEXT,
    remark TEXT,
    is_bad_data INTEGER DEFAULT 0,
    bad_data_reason TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    version INTEGER DEFAULT 1,
    is_latest INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS auth_record_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    baby_id TEXT NOT NULL,
    baby_name TEXT NOT NULL,
    parent_phone TEXT,
    store_name TEXT,
    class_name TEXT,
    photo_type TEXT,
    auth_status TEXT,
    conclusion TEXT,
    conclusion_source TEXT,
    operator TEXT,
    remark TEXT,
    is_bad_data INTEGER DEFAULT 0,
    bad_data_reason TEXT,
    created_at TEXT,
    updated_at TEXT,
    version INTEGER,
    is_latest INTEGER DEFAULT 0,
    change_reason TEXT,
    FOREIGN KEY (record_id) REFERENCES auth_records(id)
  );
  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER,
    operation_type TEXT NOT NULL,
    operator TEXT,
    operator_role TEXT,
    reason TEXT,
    detail TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);
""")
print('server.js part 1 ok')
