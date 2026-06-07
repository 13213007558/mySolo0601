import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt === 0) {
    seedData(db);
  }

  dbInstance = db;
  return db;
}

export function rowToCamelCase<T>(row: Record<string, unknown> | null | undefined): T | null {
  if (!row) return null;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = row[key];
  }
  if (typeof (result as { beforeData?: string }).beforeData === 'string') {
    try {
      (result as { beforeData: unknown }).beforeData = JSON.parse((result as { beforeData: string }).beforeData);
    } catch { /* ignore */ }
  }
  if (typeof (result as { afterData?: string }).afterData === 'string') {
    try {
      (result as { afterData: unknown }).afterData = JSON.parse((result as { afterData: string }).afterData);
    } catch { /* ignore */ }
  }
  if (typeof (result as { isManual?: number }).isManual === 'number') {
    (result as { isManual: boolean }).isManual = (result as { isManual: number }).isManual === 1;
  }
  return result as T;
}

export function rowsToCamelCase<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => rowToCamelCase<T>(r)!).filter(Boolean);
}

export function dbJson(val: unknown): string {
  return val === null || val === undefined ? '' : JSON.stringify(val);
}

export function genId(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
