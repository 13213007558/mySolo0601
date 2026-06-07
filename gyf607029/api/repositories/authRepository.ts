import { db } from '../data/db.js';
import type { Authorization, PickupPerson, MaterialAttachment, SummaryStats } from '../../shared/types.js';

function rowToAuth(row: any): Authorization {
  return {
    id: row.id,
    babyName: row.baby_name,
    babyBirth: row.baby_birth ?? undefined,
    parentPhone: row.parent_phone,
    parentName: row.parent_name,
    storeName: row.store_name,
    authType: row.auth_type,
    authStatus: row.auth_status,
    pickups: [],
    materials: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastOperator: row.last_operator,
  };
}

function rowToPickup(row: any): PickupPerson {
  return {
    id: row.id,
    authId: row.auth_id,
    name: row.name,
    relation: row.relation,
    phone: row.phone,
    idCard: row.id_card ?? undefined,
    isPhoneAuth: row.is_phone_auth === 1,
    authStart: row.auth_start ?? undefined,
    authEnd: row.auth_end ?? undefined,
    remark: row.remark ?? undefined,
  };
}

function rowToMaterial(row: any): MaterialAttachment {
  return {
    id: row.id,
    authId: row.auth_id,
    name: row.name,
    type: row.type,
    status: row.status,
    uploadedAt: row.uploaded_at,
    uploader: row.uploader,
  };
}

export interface AuthFilter {
  parentPhone?: string;
  authStatus?: string;
  storeName?: string;
  authType?: string;
  page?: number;
  pageSize?: number;
  ids?: string[];
}

export function findAuthorizations(filter: AuthFilter = {}) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter.parentPhone) {
    conditions.push('parent_phone LIKE ?');
    params.push(`%${filter.parentPhone}%`);
  }
  if (filter.authStatus) {
    conditions.push('auth_status = ?');
    params.push(filter.authStatus);
  }
  if (filter.storeName) {
    conditions.push('store_name = ?');
    params.push(filter.storeName);
  }
  if (filter.authType) {
    conditions.push('auth_type = ?');
    params.push(filter.authType);
  }
  if (filter.ids && filter.ids.length > 0) {
    const placeholders = filter.ids.map(() => '?').join(',');
    conditions.push(`id IN (${placeholders})`);
    params.push(...filter.ids);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as c FROM authorizations ${where}`).get(...params) as { c: number };

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const rows = db.prepare(
    `SELECT * FROM authorizations ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset) as any[];

  const auths = rows.map(rowToAuth);
  const authIds = auths.map(a => a.id);

  if (authIds.length > 0) {
    const placeholders = authIds.map(() => '?').join(',');
    const pickupRows = db.prepare(`SELECT * FROM pickup_persons WHERE auth_id IN (${placeholders})`).all(...authIds) as any[];
    const materialRows = db.prepare(`SELECT * FROM materials WHERE auth_id IN (${placeholders})`).all(...authIds) as any[];

    const pickupMap = new Map<string, PickupPerson[]>();
    pickupRows.forEach(r => {
      const arr = pickupMap.get(r.auth_id) ?? [];
      arr.push(rowToPickup(r));
      pickupMap.set(r.auth_id, arr);
    });
    const materialMap = new Map<string, MaterialAttachment[]>();
    materialRows.forEach(r => {
      const arr = materialMap.get(r.auth_id) ?? [];
      arr.push(rowToMaterial(r));
      materialMap.set(r.auth_id, arr);
    });

    auths.forEach(a => {
      a.pickups = pickupMap.get(a.id) ?? [];
      a.materials = materialMap.get(a.id) ?? [];
    });
  }

  return { data: auths, total: countRow.c, page, pageSize };
}

export function findAuthorizationById(id: string): Authorization | null {
  const row = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(id) as any;
  if (!row) return null;
  const auth = rowToAuth(row);
  const pickupRows = db.prepare('SELECT * FROM pickup_persons WHERE auth_id = ?').all(id) as any[];
  const materialRows = db.prepare('SELECT * FROM materials WHERE auth_id = ?').all(id) as any[];
  auth.pickups = pickupRows.map(rowToPickup);
  auth.materials = materialRows.map(rowToMaterial);
  return auth;
}

export function getSummaryStats(): SummaryStats {
  const totalRow = db.prepare('SELECT COUNT(*) as c FROM authorizations').get() as { c: number };
  const activeRow = db.prepare(`SELECT COUNT(*) as c FROM authorizations WHERE auth_status = 'active'`).get() as { c: number };
  const tempRow = db.prepare(`SELECT COUNT(*) as c FROM authorizations WHERE auth_type = 'temporary'`).get() as { c: number };
  const phoneRow = db.prepare(`SELECT COUNT(*) as c FROM authorizations WHERE auth_type = 'phone'`).get() as { c: number };
  const failedRow = db.prepare(`SELECT COUNT(*) as c FROM authorizations WHERE auth_status = 'failed'`).get() as { c: number };
  const pendingRow = db.prepare(`SELECT COUNT(*) as c FROM authorizations WHERE auth_status IN ('pending','failed')`).get() as { c: number };

  return {
    total: totalRow.c,
    active: activeRow.c,
    temporary: tempRow.c,
    phoneAuth: phoneRow.c,
    failed: failedRow.c,
    pendingCorrection: pendingRow.c,
  };
}

export function updateAuthorizationStatus(id: string, status: string, operator: string) {
  const now = new Date().toISOString();
  db.prepare(`UPDATE authorizations SET auth_status = ?, updated_at = ?, last_operator = ? WHERE id = ?`)
    .run(status, now, operator, id);
}

export function findAuthorizationsByIds(ids: string[]): Authorization[] {
  if (ids.length === 0) return [];
  const result = findAuthorizations({ ids, pageSize: ids.length });
  return result.data;
}
