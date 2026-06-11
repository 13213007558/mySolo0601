import { runMigrations, db } from "../api/db.js";
import bcrypt from "bcryptjs";

runMigrations();

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

const insertUser = db.prepare(
  "INSERT OR IGNORE INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)"
);

for (const u of users) {
  const result = insertUser.run(
    u.username,
    hashPassword(u.password),
    u.role,
    u.display_name
  );
  if (result.changes > 0) {
    console.log(`Created user: ${u.username} / ${u.password}`);
  } else {
    console.log(`User exists: ${u.username}`);
  }
}

const batchCount = (db.prepare("SELECT COUNT(*) as count FROM batches").get() as {
  count: number;
}).count;

if (batchCount === 0) {
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
  console.log("Created batch: T2026-001 (武夷大红袍)");

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
  console.log("Created batch: T2026-002 (西湖龙井)");

  console.log("Seed data inserted successfully.");
} else {
  console.log("Batches already exist, skipping seed data.");
}

console.log("\n✅ Migration and seed complete.");
