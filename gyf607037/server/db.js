const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data.db');

let db;
let SQL;

async function init() {
  SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
    createTables();
    initData();
    save();
  }
}

function save() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables() {
  db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('consultant','parent','supervisor')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS babies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gender TEXT,
  birthday TEXT,
  parent_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS baby_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id INTEGER NOT NULL REFERENCES babies(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','transferred','dropped')),
  transferred_from_id INTEGER REFERENCES baby_classes(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(baby_id, class_id)
);

CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baby_id INTEGER NOT NULL REFERENCES babies(id),
  baby_class_id INTEGER NOT NULL REFERENCES baby_classes(id),
  consultant_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  sleep_quality TEXT,
  sleep_duration TEXT,
  environment TEXT,
  materials TEXT,
  current_status TEXT NOT NULL DEFAULT 'draft' CHECK(current_status IN ('draft','reviewing','returned','archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL REFERENCES records(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL REFERENCES records(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_promise INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  detail TEXT,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS return_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL REFERENCES records(id),
  requester_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  required_fields TEXT,
  resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);
}

function initData() {
  const count = db.exec('SELECT COUNT(*) as c FROM users')[0].values[0][0];
  if (count > 0) return;

  const hash = (p) => bcrypt.hashSync(p, 10);

  function insert(sql, ...params) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  }

  const consultantId = insert('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', 'consultant1', hash('123456'), '王顾问', 'consultant');
  insert('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', 'consultant2', hash('123456'), '李顾问', 'consultant');
  const parentId = insert('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', 'parent1', hash('123456'), '张妈妈', 'parent');
  const parent2Id = insert('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', 'parent2', hash('123456'), '刘妈妈', 'parent');
  insert('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', 'supervisor', hash('123456'), '赵主管', 'supervisor');

  const baby1Id = insert('INSERT INTO babies (name, gender, birthday, parent_id) VALUES (?, ?, ?, ?)', '小宝', '男', '2025-01-15', parentId);
  const baby2Id = insert('INSERT INTO babies (name, gender, birthday, parent_id) VALUES (?, ?, ?, ?)', '朵朵', '女', '2025-03-20', parent2Id);

  const classAId = insert('INSERT INTO classes (name, description) VALUES (?, ?)', '睡眠A班（0-6月）', '新生儿睡眠观察');
  const classBId = insert('INSERT INTO classes (name, description) VALUES (?, ?)', '睡眠B班（6-12月）', '较大婴儿睡眠训练');
  insert('INSERT INTO classes (name, description) VALUES (?, ?)', '试听体验班', '试听课程');

  const bc1 = insert('INSERT INTO baby_classes (baby_id, class_id, status) VALUES (?, ?, ?)', baby1Id, classAId, 'active');
  insert('INSERT INTO baby_classes (baby_id, class_id, status) VALUES (?, ?, ?)', baby2Id, classBId, 'active');

  const record1Id = insert(
    `INSERT INTO records (baby_id, baby_class_id, consultant_id, title, sleep_quality, sleep_duration, environment, materials, current_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    baby1Id, bc1, consultantId,
    '小宝第1次睡眠观察',
    '良好',
    '每日14小时',
    '安静环境',
    '已上传观察记录表.pdf',
    'draft'
  );

  function runSql(sql, ...params) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  }

  runSql('INSERT INTO timeline_events (record_id, actor_id, action, from_status, to_status, content) VALUES (?, ?, ?, ?, ?, ?)', record1Id, consultantId, 'create', null, 'draft', '顾问创建观察记录，完成初步材料录入');
  runSql('INSERT INTO notes (record_id, author_id, content, is_promise) VALUES (?, ?, ?, ?)', record1Id, consultantId, '家长承诺下周开始调整作息', 1);
  runSql('INSERT INTO notes (record_id, author_id, content, is_promise) VALUES (?, ?, ?, ?)', record1Id, consultantId, '家长临时改口：本周先不调整，观察一周再说', 0);

  save();

  console.log('初始化数据完成');
  console.log('测试账号: consultant1/123456, parent1/123456, supervisor/123456');
}

function rowsToObjects(result) {
  if (!result || !result.length) return [];
  const [first] = result;
  const { columns, values } = first;
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function prepare(sql) {
  return {
    get(...params) {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return Object.keys(row).length ? row : undefined;
        }
        stmt.free();
        return undefined;
      } catch (e) {
        try { stmt.free(); } catch (_) {}
        throw e;
      }
    },
    all(...params) {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        const result = [];
        while (stmt.step()) {
          result.push(stmt.getAsObject());
        }
        stmt.free();
        return result;
      } catch (e) {
        try { stmt.free(); } catch (_) {}
        throw e;
      }
    },
    run(...params) {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params);
        stmt.step();
        stmt.free();
        save();
        return {
          lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0],
          changes: db.getRowsModified()
        };
      } catch (e) {
        try { stmt.free(); } catch (_) {}
        throw e;
      }
    }
  };
}

function exec(sql) {
  const result = db.exec(sql);
  save();
  return result;
}

module.exports = {
  init,
  prepare,
  exec,
  rowsToObjects
};
