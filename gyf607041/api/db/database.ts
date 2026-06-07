import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'babycare.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS babies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
      age_months INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      nurse_in_charge TEXT NOT NULL,
      admission_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('normal', 'dirty', 'empty', 'missing_material', 'pending_review')) NOT NULL DEFAULT 'pending_review',
      latest_temperature REAL,
      remark TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_babies_status ON babies(status);
    CREATE INDEX IF NOT EXISTS idx_babies_room ON babies(room_number);

    CREATE TABLE IF NOT EXISTS temperature_records (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      temperature REAL NOT NULL,
      measure_time TEXT NOT NULL,
      measured_by TEXT,
      device_id TEXT,
      is_abnormal INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'gun',
      remark TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_temp_baby ON temperature_records(baby_id);
    CREATE INDEX IF NOT EXISTS idx_temp_time ON temperature_records(measure_time);

    CREATE TABLE IF NOT EXISTS leave_photos (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_url TEXT NOT NULL,
      description TEXT,
      uploaded_at TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      is_missing_page INTEGER NOT NULL DEFAULT 0,
      missing_page_note TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_photo_baby ON leave_photos(baby_id);

    CREATE TABLE IF NOT EXISTS rectification_records (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      problem_description TEXT NOT NULL,
      rectification_measure TEXT NOT NULL,
      rectified_by TEXT NOT NULL,
      rectified_at TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) NOT NULL DEFAULT 'pending'
    );

    CREATE INDEX IF NOT EXISTS idx_rect_baby ON rectification_records(baby_id);

    CREATE TABLE IF NOT EXISTS import_audits (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      imported_by TEXT NOT NULL,
      total_count INTEGER NOT NULL,
      success_count INTEGER NOT NULL,
      failed_count INTEGER NOT NULL,
      page_count INTEGER,
      actual_record_count INTEGER,
      has_discrepancy INTEGER NOT NULL DEFAULT 0,
      discrepancy_note TEXT,
      failed_records_json TEXT
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      operator TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      before_change_json TEXT,
      after_change_json TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_log_target ON operation_logs(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_log_time ON operation_logs(timestamp);
  `);
}

initDatabase();

export default db;
