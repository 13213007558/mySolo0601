import fs from 'node:fs';
import path from 'node:path';
import type { Baby, AuthRecord } from '../../shared/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');

const BABIES_FILE = path.join(DATA_DIR, 'babies.json');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(file: string, data: T) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadBabies(): Baby[] {
  return readJson<Baby[]>(BABIES_FILE, []);
}

export function saveBabies(babies: Baby[]) {
  writeJson(BABIES_FILE, babies);
}

export function loadRecords(): AuthRecord[] {
  return readJson<AuthRecord[]>(RECORDS_FILE, []);
}

export function saveRecords(records: AuthRecord[]) {
  writeJson(RECORDS_FILE, records);
}

export function isDataInitialized(): boolean {
  return fs.existsSync(BABIES_FILE) && fs.existsSync(RECORDS_FILE) && loadBabies().length > 0;
}
