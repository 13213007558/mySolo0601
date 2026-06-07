import db from '../db/database.js';
import type { Baby, DataStatus, BabyDetail, TemperatureRecord, LeavePhoto, RectificationRecord } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import { logOperation } from './auditService.js';

const OPERATOR = '护理主管';

function rowToBaby(row: any): Baby {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    ageMonths: row.age_months,
    roomNumber: row.room_number,
    nurseInCharge: row.nurse_in_charge,
    admissionDate: row.admission_date,
    status: row.status,
    latestTemperature: row.latest_temperature,
    remark: row.remark || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllBabies(status?: DataStatus, search?: string): Baby[] {
  let query = 'SELECT * FROM babies';
  const params: any[] = [];
  const conditions: string[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(name LIKE ? OR room_number LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY updated_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map(rowToBaby);
}

export function getBabyById(id: string): BabyDetail | null {
  const babyRow = db.prepare('SELECT * FROM babies WHERE id = ?').get(id) as any;
  if (!babyRow) return null;

  const tempRows = db.prepare(`
    SELECT * FROM temperature_records WHERE baby_id = ? ORDER BY measure_time DESC
  `).all(id) as any[];

  const photoRows = db.prepare(`
    SELECT * FROM leave_photos WHERE baby_id = ? ORDER BY uploaded_at DESC
  `).all(id) as any[];

  const rectRows = db.prepare(`
    SELECT * FROM rectification_records WHERE baby_id = ? ORDER BY rectified_at DESC
  `).all(id) as any[];

  const temperatures: TemperatureRecord[] = tempRows.map(r => ({
    id: r.id,
    babyId: r.baby_id,
    temperature: r.temperature,
    measureTime: r.measure_time,
    measuredBy: r.measured_by || '',
    deviceId: r.device_id || '',
    isAbnormal: r.is_abnormal === 1,
    source: r.source,
    remark: r.remark || '',
  }));

  const photos: LeavePhoto[] = photoRows.map(r => ({
    id: r.id,
    babyId: r.baby_id,
    fileName: r.file_name,
    filePath: r.file_path,
    fileUrl: r.file_url,
    description: r.description || '',
    uploadedAt: r.uploaded_at,
    uploadedBy: r.uploaded_by,
    isMissingPage: r.is_missing_page === 1,
    missingPageNote: r.missing_page_note || '',
  }));

  const rectifications: RectificationRecord[] = rectRows.map(r => ({
    id: r.id,
    babyId: r.baby_id,
    problemDescription: r.problem_description,
    rectificationMeasure: r.rectification_measure,
    rectifiedBy: r.rectified_by,
    rectifiedAt: r.rectified_at,
    status: r.status,
  }));

  return {
    ...rowToBaby(babyRow),
    temperatures,
    photos,
    rectifications,
  };
}

export function createBaby(data: Omit<Baby, 'id' | 'createdAt' | 'updatedAt'>): Baby {
  const now = new Date().toISOString();
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO babies (id, name, gender, age_months, room_number, nurse_in_charge, admission_date, status, latest_temperature, remark, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    data.name,
    data.gender,
    data.ageMonths,
    data.roomNumber,
    data.nurseInCharge,
    data.admissionDate,
    data.status,
    data.latestTemperature,
    data.remark,
    now,
    now
  );
  logOperation(OPERATOR, 'CREATE', 'Baby', id, null, { ...data, id });
  const baby = getBabyById(id);
  return baby as unknown as Baby;
}

export function updateBaby(id: string, data: Partial<Baby>): Baby | null {
  const existing = db.prepare('SELECT * FROM babies WHERE id = ?').get(id) as any;
  if (!existing) return null;

  const before = rowToBaby(existing);
  const now = new Date().toISOString();
  const updates: string[] = [];
  const params: any[] = [];

  const fieldMap: Record<string, string> = {
    name: 'name',
    gender: 'gender',
    ageMonths: 'age_months',
    roomNumber: 'room_number',
    nurseInCharge: 'nurse_in_charge',
    admissionDate: 'admission_date',
    status: 'status',
    latestTemperature: 'latest_temperature',
    remark: 'remark',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in data && (data as any)[key] !== undefined) {
      updates.push(`${col} = ?`);
      params.push((data as any)[key]);
    }
  }
  updates.push('updated_at = ?');
  params.push(now, id);

  db.prepare(`UPDATE babies SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const after = getBabyById(id) as unknown as Baby;
  logOperation(OPERATOR, 'UPDATE', 'Baby', id, before, after);
  return after;
}

export function addTemperature(babyId: string, data: Omit<TemperatureRecord, 'id' | 'babyId' | 'isAbnormal'> & { isAbnormal?: boolean }): TemperatureRecord | null {
  const baby = db.prepare('SELECT id FROM babies WHERE id = ?').get(babyId);
  if (!baby) return null;

  const id = uuidv4();
  const isAbnormal = data.temperature < 36.0 || data.temperature > 37.3;
  const stmt = db.prepare(`
    INSERT INTO temperature_records (id, baby_id, temperature, measure_time, measured_by, device_id, is_abnormal, source, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    babyId,
    data.temperature,
    data.measureTime,
    data.measuredBy || null,
    data.deviceId || null,
    isAbnormal ? 1 : 0,
    data.source,
    data.remark || null,
    new Date().toISOString()
  );

  db.prepare('UPDATE babies SET latest_temperature = ?, updated_at = ? WHERE id = ?')
    .run(data.temperature, new Date().toISOString(), babyId);

  logOperation(OPERATOR, 'CREATE', 'TemperatureRecord', id, null, { ...data, id, babyId, isAbnormal });

  const row = db.prepare('SELECT * FROM temperature_records WHERE id = ?').get(id) as any;
  return {
    id: row.id,
    babyId: row.baby_id,
    temperature: row.temperature,
    measureTime: row.measure_time,
    measuredBy: row.measured_by || '',
    deviceId: row.device_id || '',
    isAbnormal: row.is_abnormal === 1,
    source: row.source,
    remark: row.remark || '',
  };
}

export function addRectification(babyId: string, data: Omit<RectificationRecord, 'id' | 'babyId'>): RectificationRecord | null {
  const baby = db.prepare('SELECT id FROM babies WHERE id = ?').get(babyId);
  if (!baby) return null;

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO rectification_records (id, baby_id, problem_description, rectification_measure, rectified_by, rectified_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    babyId,
    data.problemDescription,
    data.rectificationMeasure,
    data.rectifiedBy,
    data.rectifiedAt,
    data.status
  );
  logOperation(OPERATOR, 'CREATE', 'RectificationRecord', id, null, { ...data, id, babyId });

  const row = db.prepare('SELECT * FROM rectification_records WHERE id = ?').get(id) as any;
  return {
    id: row.id,
    babyId: row.baby_id,
    problemDescription: row.problem_description,
    rectificationMeasure: row.rectification_measure,
    rectifiedBy: row.rectified_by,
    rectifiedAt: row.rectified_at,
    status: row.status,
  };
}

export function updateRectification(id: string, data: Partial<RectificationRecord>): RectificationRecord | null {
  const existing = db.prepare('SELECT * FROM rectification_records WHERE id = ?').get(id) as any;
  if (!existing) return null;

  const updates: string[] = [];
  const params: any[] = [];
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  if (data.rectificationMeasure !== undefined) {
    updates.push('rectification_measure = ?');
    params.push(data.rectificationMeasure);
  }
  params.push(id);
  if (updates.length > 0) {
    db.prepare(`UPDATE rectification_records SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const row = db.prepare('SELECT * FROM rectification_records WHERE id = ?').get(id) as any;
  logOperation(OPERATOR, 'UPDATE', 'RectificationRecord', id, existing, row);
  return {
    id: row.id,
    babyId: row.baby_id,
    problemDescription: row.problem_description,
    rectificationMeasure: row.rectification_measure,
    rectifiedBy: row.rectified_by,
    rectifiedAt: row.rectified_at,
    status: row.status,
  };
}

export function addPhoto(
  babyId: string,
  fileName: string,
  filePath: string,
  fileUrl: string,
  description: string
): LeavePhoto | null {
  const baby = db.prepare('SELECT id FROM babies WHERE id = ?').get(babyId);
  if (!baby) return null;

  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO leave_photos (id, baby_id, file_name, file_path, file_url, description, uploaded_at, uploaded_by, is_missing_page, missing_page_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '')
  `);
  stmt.run(
    id,
    babyId,
    fileName,
    filePath,
    fileUrl,
    description || '',
    new Date().toISOString(),
    OPERATOR
  );
  logOperation(OPERATOR, 'UPLOAD', 'LeavePhoto', id, null, { id, babyId, fileName, fileUrl });

  const row = db.prepare('SELECT * FROM leave_photos WHERE id = ?').get(id) as any;
  return {
    id: row.id,
    babyId: row.baby_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url,
    description: row.description || '',
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    isMissingPage: row.is_missing_page === 1,
    missingPageNote: row.missing_page_note || '',
  };
}

export function updatePhoto(photoId: string, data: Partial<LeavePhoto>): LeavePhoto | null {
  const existing = db.prepare('SELECT * FROM leave_photos WHERE id = ?').get(photoId) as any;
  if (!existing) return null;

  const updates: string[] = [];
  const params: any[] = [];
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.isMissingPage !== undefined) {
    updates.push('is_missing_page = ?');
    params.push(data.isMissingPage ? 1 : 0);
  }
  if (data.missingPageNote !== undefined) {
    updates.push('missing_page_note = ?');
    params.push(data.missingPageNote);
  }
  params.push(photoId);

  if (updates.length > 0) {
    db.prepare(`UPDATE leave_photos SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const row = db.prepare('SELECT * FROM leave_photos WHERE id = ?').get(photoId) as any;
  logOperation(OPERATOR, 'UPDATE', 'LeavePhoto', photoId, existing, row);
  return {
    id: row.id,
    babyId: row.baby_id,
    fileName: row.file_name,
    filePath: row.file_path,
    fileUrl: row.file_url,
    description: row.description || '',
    uploadedAt: row.uploaded_at,
    uploadedBy: row.uploaded_by,
    isMissingPage: row.is_missing_page === 1,
    missingPageNote: row.missing_page_note || '',
  };
}

export function getBabyStatistics() {
  const rows = db.prepare('SELECT status, COUNT(*) as cnt FROM babies GROUP BY status').all() as any[];
  const total = db.prepare('SELECT COUNT(*) as cnt FROM babies').get() as any;
  const result: Record<string, number> = {
    normal: 0,
    dirty: 0,
    empty: 0,
    missing_material: 0,
    pending_review: 0,
    total: total?.cnt || 0,
  };
  for (const row of rows) {
    result[row.status] = row.cnt;
  }
  return result;
}
