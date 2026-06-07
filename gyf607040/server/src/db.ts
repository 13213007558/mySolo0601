import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'milk-checkin.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS babies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      room_no TEXT NOT NULL,
      bed_no TEXT NOT NULL,
      mother_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS milk_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      record_date TEXT NOT NULL,
      record_time TEXT NOT NULL,
      shift TEXT NOT NULL,
      milk_amount REAL NOT NULL,
      milk_type TEXT NOT NULL DEFAULT '母乳',
      photo_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      abnormal_reason TEXT,
      handler TEXT,
      reviewer TEXT,
      review_note TEXT,
      review_time TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      is_dirty INTEGER NOT NULL DEFAULT 0,
      dirty_reason TEXT,
      FOREIGN KEY (baby_id) REFERENCES babies(id)
    );

    CREATE INDEX IF NOT EXISTS idx_milk_records_date ON milk_records(record_date);
    CREATE INDEX IF NOT EXISTS idx_milk_records_baby ON milk_records(baby_id);
    CREATE INDEX IF NOT EXISTS idx_milk_records_status ON milk_records(status);
  `);

  const babyCount = db.prepare('SELECT COUNT(*) as cnt FROM babies').get() as { cnt: number };
  if (babyCount.cnt === 0) {
    const insertBaby = db.prepare(`
      INSERT INTO babies (name, room_no, bed_no, mother_name)
      VALUES (?, ?, ?, ?)
    `);
    const babies = [
      ['小宝', '301', 'A', '张女士'],
      ['豆豆', '301', 'B', '李女士'],
      ['乐乐', '302', 'A', '王女士'],
      ['安安', '302', 'B', '刘女士'],
      ['一一', '303', 'A', '陈女士'],
    ];
    babies.forEach(b => insertBaby.run(...b));

    const insertRecord = db.prepare(`
      INSERT INTO milk_records (baby_id, record_date, record_time, shift, milk_amount, milk_type, status, handler)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const shifts = ['白班', '小夜', '大夜'];
    const times = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00', '00:00', '03:00'];
    const handlers = ['护理员王姐', '护理员李姐', '护理员张姐'];
    const today = new Date();
    for (let day = 0; day < 3; day++) {
      const d = new Date(today);
      d.setDate(d.getDate() - day);
      const dateStr = d.toISOString().slice(0, 10);
      for (let babyId = 1; babyId <= 5; babyId++) {
        for (let i = 0; i < times.length; i++) {
          const shift = i < 4 ? '白班' : i < 6 ? '小夜' : '大夜';
          const amount = 60 + Math.random() * 60;
          const isAbnormal = Math.random() < 0.15;
          insertRecord.run(
            babyId,
            dateStr,
            times[i],
            shift,
            Math.round(amount * 10) / 10,
            '母乳',
            isAbnormal ? 'abnormal' : 'normal',
            handlers[Math.floor(Math.random() * handlers.length)]
          );
        }
      }
    }
  }
}
