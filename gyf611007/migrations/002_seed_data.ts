import bcrypt from "bcryptjs";
import { db } from "../api/db.js";

const hashPassword = (pw: string) => bcrypt.hashSync(pw, 10);

const users = [
  {
    username: "chief1",
    password: "chief123",
    role: "chief",
    display_name: "主评师 · 陈韵",
  },
  {
    username: "assistant1",
    password: "assist123",
    role: "assistant",
    display_name: "辅评师 · 林香",
  },
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    display_name: "系统管理员",
  },
];

const insert = db.prepare(
  "INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)"
);

for (const u of users) {
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(u.username);
  if (!existing) {
    insert.run(u.username, hashPassword(u.password), u.role, u.display_name);
    console.log(`Created user: ${u.username} / ${u.password}`);
  } else {
    console.log(`User exists: ${u.username}`);
  }
}

const insertBatch = db.prepare(
  "INSERT INTO batches (batch_code, tea_name, origin, status, created_by) VALUES (?, ?, ?, ?, ?)"
);
const insertSample = db.prepare(
  "INSERT INTO samples (batch_id, sample_code, order_index) VALUES (?, ?, ?)"
);

const batch1 = insertBatch.run(
  "T2026-001",
  "武夷大红袍",
  "福建武夷山",
  "pending",
  1
);
for (let i = 1; i <= 3; i++) {
  insertSample.run(batch1.lastInsertRowid, `T2026-001-${i}`, i);
}

const batch2 = insertBatch.run(
  "T2026-002",
  "西湖龙井",
  "浙江杭州",
  "in_progress",
  1
);
for (let i = 1; i <= 3; i++) {
  insertSample.run(batch2.lastInsertRowid, `T2026-002-${i}`, i);
}

console.log("Seed data inserted.");
