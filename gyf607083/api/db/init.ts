import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'disinfection.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      teacher_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS babies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      class_id TEXT NOT NULL REFERENCES classes(id),
      allergy_history TEXT,
      parent_phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS supply_records (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id),
      class_id TEXT NOT NULL REFERENCES classes(id),
      item_name TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('bottle', 'towel', 'clothes', 'other')),
      sterilized INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      is_manual INTEGER NOT NULL DEFAULT 0,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS status_changes (
      id TEXT PRIMARY KEY,
      record_id TEXT NOT NULL REFERENCES supply_records(id),
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      reason TEXT NOT NULL,
      operator_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'customer_service', 'staff')),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operator_id TEXT,
      operator_role TEXT,
      ip_address TEXT,
      request_params TEXT,
      response_data TEXT,
      success INTEGER NOT NULL DEFAULT 1,
      error_message TEXT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_supply_records_class_id ON supply_records(class_id);
    CREATE INDEX IF NOT EXISTS idx_supply_records_baby_id ON supply_records(baby_id);
    CREATE INDEX IF NOT EXISTS idx_supply_records_status ON supply_records(status);
    CREATE INDEX IF NOT EXISTS idx_status_changes_record_id ON status_changes(record_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  const classCount = db.prepare('SELECT COUNT(*) as count FROM classes').get() as { count: number };
  if (classCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const insertClass = db.prepare(
    'INSERT INTO classes (id, name, teacher_name) VALUES (?, ?, ?)'
  );
  const insertBaby = db.prepare(
    'INSERT INTO babies (id, name, age, class_id, allergy_history, parent_phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)'
  );
  const insertRecord = db.prepare(
    'INSERT INTO supply_records (id, baby_id, class_id, item_name, item_type, sterilized, status, is_manual, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertStatusChange = db.prepare(
    'INSERT INTO status_changes (id, record_id, from_status, to_status, reason, operator_id) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertAuditLog = db.prepare(
    'INSERT INTO audit_logs (id, operation_type, entity_type, entity_id, operator_id, operator_role, ip_address, request_params, response_data, success) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const tx = db.transaction(() => {
    insertClass.run('class1', '小班（樱桃班）', '李老师');
    insertClass.run('class2', '中班（草莓班）', '王老师');
    insertClass.run('class3', '大班（芒果班）', '张老师');

    insertBaby.run('baby1', '陈小明', 3, 'class1', '牛奶、花生过敏', '13812345678', '北京市朝阳区建国路88号');
    insertBaby.run('baby2', '李小红', 3, 'class1', '青霉素过敏', '13987654321', '北京市海淀区中关村大街1号');
    insertBaby.run('baby3', '王小满', 4, 'class2', '海鲜过敏', '13611112222', '北京市西城区金融街100号');
    insertBaby.run('baby4', '张小刚', 4, 'class2', null, '13733334444', '北京市东城区王府井大街50号');
    insertBaby.run('baby5', '刘小美', 5, 'class3', '鸡蛋过敏', '13555556666', '北京市丰台区南三环西路');

    insertUser.run('user1', 'admin', 'hash1', 'admin', '系统管理员');
    insertUser.run('user2', 'supervisor', 'hash2', 'supervisor', '赵主管');
    insertUser.run('user3', 'cs001', 'hash3', 'customer_service', '客服小王');
    insertUser.run('user4', 'cs002', 'hash4', 'customer_service', '客服小李');
    insertUser.run('user5', 'staff001', 'hash5', 'staff', '员工小张');

    insertRecord.run('record1', 'baby3', 'class2', '奶瓶', 'bottle', 0, 'rejected', 0, '未清洁用品再次发放 - 小满那条');
    insertRecord.run('record2', 'baby1', 'class1', '毛巾', 'towel', 1, 'pending', 0, null);
    insertRecord.run('record3', 'baby2', 'class1', '换洗衣物', 'clothes', 1, 'approved', 0, null);
    insertRecord.run('record4', 'baby4', 'class2', '奶瓶', 'bottle', 0, 'pending', 0, '未清洁');
    insertRecord.run('record5', 'baby5', 'class3', '水杯', 'other', 1, 'closed', 0, null);
    insertRecord.run('record6', 'baby3', 'class2', '毛巾', 'towel', 0, 'rejected', 0, '未清洁');

    insertStatusChange.run('change1', 'record1', 'pending', 'rejected', '未清洁，拒绝发放', 'user3');
    insertStatusChange.run('change2', 'record1', 'rejected', 'reissued', '已清洁，同意补发', 'user4');

    insertRecord.run('record7', 'baby3', 'class2', '备用奶瓶', 'bottle', 1, 'manual', 1, '手工补录 - 家长自行带来的备用奶瓶');
    insertStatusChange.run('change3', 'record7', 'pending', 'manual', '手工补录记录', 'user3');

    insertAuditLog.run('audit1', 'update', 'supply_record', 'record1', 'user3', 'customer_service', '192.168.1.100', '{"action":"reject"}', '{"success":true}', 1);
    insertAuditLog.run('audit2', 'update', 'supply_record', 'record1', null, null, '192.168.1.101', '{"action":"reissue"}', '{"success":true}', 1);
    insertAuditLog.run('audit3', 'create', 'supply_record', 'record7', 'user3', 'customer_service', '192.168.1.100', '{"isManual":true}', '{"success":true}', 1);
  });

  tx();
}

export default db;
