import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/init';
import type {
  PhotoAuthorization,
  PhotoAuthVersion,
  RemarkHistory,
  SystemEvent,
  AuditLog,
  PhotoMaterial,
  StatsSummary,
  ListFilters,
  SupplementPayload,
  StatusChangePayload,
  ManualEntryPayload,
  RemarkSource,
  AuthStatus,
} from '@shared/types';

function rowToAuth(row: any): PhotoAuthorization {
  return {
    id: row.id,
    babyName: row.baby_name,
    babyBirthday: row.baby_birthday || undefined,
    className: row.class_name,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    authType: row.auth_type,
    photoScope: row.photo_scope,
    status: row.status,
    validStart: row.valid_start || undefined,
    validEnd: row.valid_end || undefined,
    originalCommitment: row.original_commitment,
    isManualEntry: !!row.is_manual_entry,
    isBadData: !!row.is_bad_data,
    badDataReason: row.bad_data_reason || undefined,
    handlerName: row.handler_name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToRemark(row: any): RemarkHistory {
  return {
    id: row.id,
    authId: row.auth_id,
    timestamp: row.timestamp,
    operatorId: row.operator_id || undefined,
    operatorName: row.operator_name,
    content: row.content,
    source: row.source,
  };
}

function rowToVersion(row: any): PhotoAuthVersion {
  return {
    id: row.id,
    authId: row.auth_id,
    version: row.version,
    snapshot: row.snapshot,
    operatorName: row.operator_name,
    changeReason: row.change_reason,
    createdAt: row.created_at,
  };
}

function rowToEvent(row: any): SystemEvent {
  return {
    id: row.id,
    authId: row.auth_id || undefined,
    eventType: row.event_type,
    title: row.title,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

function rowToAudit(row: any): AuditLog {
  return {
    id: row.id,
    authId: row.auth_id,
    action: row.action,
    operatorId: row.operator_id || undefined,
    operatorName: row.operator_name,
    operatorRole: row.operator_role,
    field: row.field || undefined,
    oldValue: row.old_value || undefined,
    newValue: row.new_value || undefined,
    reason: row.reason || undefined,
    timestamp: row.timestamp,
    ip: row.ip || undefined,
  };
}

function rowToMaterial(row: any): PhotoMaterial {
  return {
    id: row.id,
    authId: row.auth_id,
    name: row.name,
    url: row.url || undefined,
    uploadTime: row.upload_time,
    uploader: row.uploader,
    note: row.note || undefined,
  };
}

function snapshotOf(record: PhotoAuthorization): string {
  return JSON.stringify(record);
}

function nextVersion(authId: string): number {
  const row = db
    .prepare('SELECT COALESCE(MAX(version), 0) as v FROM photo_auth_versions WHERE auth_id = ?')
    .get(authId) as { v: number };
  return row.v + 1;
}

function saveVersion(
  authId: string,
  record: PhotoAuthorization,
  operatorName: string,
  changeReason: string,
) {
  const version = nextVersion(authId);
  db.prepare(
    `INSERT INTO photo_auth_versions (id, auth_id, version, snapshot, operator_name, change_reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'v_' + uuidv4().slice(0, 10),
    authId,
    version,
    snapshotOf(record),
    operatorName,
    changeReason,
    new Date().toISOString(),
  );
}

function addAudit(
  authId: string,
  action: AuditLog['action'],
  operatorName: string,
  operatorRole = 'consultant',
  opts: { field?: string; oldValue?: string; newValue?: string; reason?: string; ip?: string; operatorId?: string } = {},
) {
  db.prepare(
    `INSERT INTO audit_logs (id, auth_id, action, operator_id, operator_name, operator_role, field, old_value, new_value, reason, timestamp, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'a_' + uuidv4().slice(0, 10),
    authId,
    action,
    opts.operatorId || null,
    operatorName,
    operatorRole,
    opts.field || null,
    opts.oldValue || null,
    opts.newValue || null,
    opts.reason || null,
    new Date().toISOString(),
    opts.ip || null,
  );
}

export function addSystemEvent(
  eventType: SystemEvent['eventType'],
  title: string,
  detail: string,
  authId?: string,
) {
  db.prepare(
    `INSERT INTO system_events (id, auth_id, event_type, title, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    'e_' + uuidv4().slice(0, 10),
    authId || null,
    eventType,
    title,
    detail,
    new Date().toISOString(),
  );
}

export const authRepo = {
  list(filters: ListFilters = {}): PhotoAuthorization[] {
    const clauses: string[] = [];
    const args: any[] = [];

    if (!filters.includeBadData) {
      clauses.push('is_bad_data = 0');
    }
    if (filters.status) {
      clauses.push('status = ?');
      args.push(filters.status);
    }
    if (filters.className) {
      clauses.push('class_name = ?');
      args.push(filters.className);
    }
    if (filters.babyName) {
      clauses.push('baby_name LIKE ?');
      args.push(`%${filters.babyName}%`);
    }
    if (filters.parentPhone) {
      clauses.push('parent_phone LIKE ?');
      args.push(`%${filters.parentPhone}%`);
    }

    const where = clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
    const rows = db
      .prepare(`SELECT * FROM photo_authorizations ${where} ORDER BY created_at DESC`)
      .all(...args);
    return rows.map(rowToAuth);
  },

  stats(filters: ListFilters = {}): StatsSummary {
    const all = this.list(filters);
    const base: StatsSummary = {
      total: 0,
      pending: 0,
      authorized: 0,
      partial: 0,
      revoked: 0,
      expired: 0,
      badData: 0,
      manualEntry: 0,
    };
    for (const r of all) {
      base.total++;
      if (r.status === 'pending') base.pending++;
      if (r.status === 'authorized') base.authorized++;
      if (r.status === 'partial') base.partial++;
      if (r.status === 'revoked') base.revoked++;
      if (r.status === 'expired') base.expired++;
      if (r.status === 'bad_data') base.badData++;
      if (r.isManualEntry) base.manualEntry++;
    }
    return base;
  },

  getById(id: string): PhotoAuthorization | null {
    const row = db.prepare('SELECT * FROM photo_authorizations WHERE id = ?').get(id);
    return row ? rowToAuth(row) : null;
  },

  getRemarks(authId: string): RemarkHistory[] {
    const rows = db
      .prepare('SELECT * FROM remark_histories WHERE auth_id = ? ORDER BY timestamp ASC')
      .all(authId);
    return rows.map(rowToRemark);
  },

  getVersions(authId: string): PhotoAuthVersion[] {
    const rows = db
      .prepare('SELECT * FROM photo_auth_versions WHERE auth_id = ? ORDER BY version ASC')
      .all(authId);
    return rows.map(rowToVersion);
  },

  getAudits(authId: string): AuditLog[] {
    const rows = db
      .prepare('SELECT * FROM audit_logs WHERE auth_id = ? ORDER BY timestamp DESC')
      .all(authId);
    return rows.map(rowToAudit);
  },

  getRelatedEvents(authId: string): SystemEvent[] {
    const rows = db
      .prepare(
        `SELECT * FROM system_events WHERE auth_id = ? OR auth_id IS NULL ORDER BY created_at DESC LIMIT 30`,
      )
      .all(authId);
    return rows.map(rowToEvent);
  },

  getMaterials(authId: string): PhotoMaterial[] {
    const rows = db
      .prepare('SELECT * FROM photo_materials WHERE auth_id = ? ORDER BY upload_time ASC')
      .all(authId);
    return rows.map(rowToMaterial);
  },

  create(
    data: Omit<PhotoAuthorization, 'id' | 'createdAt' | 'updatedAt'> & { operatorName: string; operatorId?: string },
  ): PhotoAuthorization {
    const now = new Date().toISOString();
    const id = 'pa_' + uuidv4().slice(0, 10);
    const record: PhotoAuthorization = {
      id,
      babyName: data.babyName,
      babyBirthday: data.babyBirthday,
      className: data.className,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      authType: data.authType,
      photoScope: data.photoScope,
      status: data.status,
      validStart: data.validStart,
      validEnd: data.validEnd,
      originalCommitment: data.originalCommitment,
      isManualEntry: data.isManualEntry,
      isBadData: data.isBadData,
      badDataReason: data.badDataReason,
      handlerName: data.handlerName,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(
      `INSERT INTO photo_authorizations
       (id, baby_name, baby_birthday, class_name, parent_name, parent_phone, auth_type, photo_scope, status, valid_start, valid_end, original_commitment, is_manual_entry, is_bad_data, bad_data_reason, handler_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.id,
      record.babyName,
      record.babyBirthday || null,
      record.className,
      record.parentName,
      record.parentPhone,
      record.authType,
      record.photoScope,
      record.status,
      record.validStart || null,
      record.validEnd || null,
      record.originalCommitment,
      record.isManualEntry ? 1 : 0,
      record.isBadData ? 1 : 0,
      record.badDataReason || null,
      record.handlerName || null,
      record.createdAt,
      record.updatedAt,
    );

    if (data.originalCommitment) {
      const remarkId = 'rm_' + uuidv4().slice(0, 10);
      db.prepare(
        `INSERT INTO remark_histories (id, auth_id, timestamp, operator_id, operator_name, content, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        remarkId,
        id,
        now,
        data.operatorId || null,
        data.operatorName,
        data.originalCommitment,
        'original_commitment',
      );
    }

    saveVersion(id, record, data.operatorName, data.isManualEntry ? '手工补录创建' : '创建记录');
    addAudit(id, data.isManualEntry ? 'manual_entry' : 'create', data.operatorName, 'consultant', {
      operatorId: data.operatorId,
      reason: data.isManualEntry ? '顾问手工补录' : '首次录入',
    });

    return record;
  },

  createManual(payload: ManualEntryPayload): PhotoAuthorization {
    return this.create({
      babyName: payload.babyName,
      babyBirthday: payload.babyBirthday,
      className: payload.className,
      parentName: payload.parentName,
      parentPhone: payload.parentPhone,
      authType: payload.authType,
      photoScope: payload.photoScope,
      status: 'pending',
      validStart: payload.validStart,
      validEnd: payload.validEnd,
      originalCommitment: payload.originalCommitment,
      isManualEntry: true,
      isBadData: false,
      handlerName: payload.operatorName,
      operatorName: payload.operatorName,
      operatorId: payload.operatorId,
    });
  },

  addRemark(authId: string, payload: SupplementPayload): RemarkHistory | null {
    const record = this.getById(authId);
    if (!record) return null;

    const now = new Date().toISOString();
    const id = 'rm_' + uuidv4().slice(0, 10);
    const source: RemarkSource = payload.source || 'supplement';

    db.prepare(
      `INSERT INTO remark_histories (id, auth_id, timestamp, operator_id, operator_name, content, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      authId,
      now,
      payload.operatorId || null,
      payload.operatorName,
      payload.content,
      source,
    );

    db.prepare('UPDATE photo_authorizations SET updated_at = ? WHERE id = ?').run(now, authId);

    addAudit(authId, 'supplement_remark', payload.operatorName, 'consultant', {
      operatorId: payload.operatorId,
      field: 'remark',
      newValue: payload.content,
      reason: REMARK_SOURCE_REASON[source] || '补充备注',
    });

    return {
      id,
      authId,
      timestamp: now,
      operatorId: payload.operatorId,
      operatorName: payload.operatorName,
      content: payload.content,
      source,
    };
  },

  changeStatus(authId: string, payload: StatusChangePayload): PhotoAuthorization | null {
    const record = this.getById(authId);
    if (!record) return null;

    const oldStatus = record.status;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE photo_authorizations
       SET status = ?, handler_name = ?, updated_at = ?
       WHERE id = ?`,
    ).run(payload.status, payload.operatorName, now, authId);

    const remarkId = 'rm_' + uuidv4().slice(0, 10);
    db.prepare(
      `INSERT INTO remark_histories (id, auth_id, timestamp, operator_id, operator_name, content, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      remarkId,
      authId,
      now,
      payload.operatorId || null,
      payload.operatorName,
      `状态变更：${STATUS_CN[oldStatus]} → ${STATUS_CN[payload.status]}${payload.reason ? '；' + payload.reason : ''}`,
      'status_change',
    );

    if (payload.supplementRemark) {
      const supId = 'rm_' + uuidv4().slice(0, 10);
      db.prepare(
        `INSERT INTO remark_histories (id, auth_id, timestamp, operator_id, operator_name, content, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        supId,
        authId,
        now,
        payload.operatorId || null,
        payload.operatorName,
        payload.supplementRemark,
        'supplement',
      );
    }

    const updated = { ...record, status: payload.status, handlerName: payload.operatorName, updatedAt: now };
    saveVersion(authId, updated, payload.operatorName, payload.reason || `状态变更 ${oldStatus}→${payload.status}`);

    addAudit(authId, 'status_change', payload.operatorName, 'consultant', {
      operatorId: payload.operatorId,
      field: 'status',
      oldValue: oldStatus,
      newValue: payload.status,
      reason: payload.reason,
    });

    return updated;
  },

  markBad(authId: string, reason: string, operatorName: string, operatorId?: string): PhotoAuthorization | null {
    const record = this.getById(authId);
    if (!record) return null;

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE photo_authorizations SET is_bad_data = 1, bad_data_reason = ?, status = 'bad_data', updated_at = ?, handler_name = ? WHERE id = ?`,
    ).run(reason, now, operatorName, authId);

    addSystemEvent('bad_data_isolated', '坏数据已隔离', `记录 ${authId} 因「${reason}」被 ${operatorName} 标记隔离，不再参与正常统计`, authId);

    const updated = { ...record, isBadData: true, badDataReason: reason, status: 'bad_data' as AuthStatus, handlerName: operatorName, updatedAt: now };
    saveVersion(authId, updated, operatorName, `坏数据隔离：${reason}`);
    addAudit(authId, 'mark_bad', operatorName, 'consultant', { operatorId, reason });

    return updated;
  },

  restore(authId: string, operatorName: string, operatorId?: string): PhotoAuthorization | null {
    const record = this.getById(authId);
    if (!record || !record.isBadData) return null;

    const now = new Date().toISOString();
    const restoreStatus: AuthStatus = 'pending';
    db.prepare(
      `UPDATE photo_authorizations SET is_bad_data = 0, bad_data_reason = NULL, status = ?, updated_at = ?, handler_name = ? WHERE id = ?`,
    ).run(restoreStatus, now, operatorName, authId);

    const updated = { ...record, isBadData: false, badDataReason: undefined, status: restoreStatus, handlerName: operatorName, updatedAt: now };
    saveVersion(authId, updated, operatorName, '从坏数据隔离区恢复');
    addAudit(authId, 'restore', operatorName, 'consultant', { operatorId, reason: '坏数据恢复为待确认' });

    return updated;
  },

  classes(): string[] {
    const rows = db.prepare('SELECT DISTINCT class_name FROM photo_authorizations ORDER BY class_name ASC').all() as { class_name: string }[];
    return rows.map(r => r.class_name);
  },
};

const STATUS_CN: Record<AuthStatus, string> = {
  pending: '待确认',
  authorized: '已授权',
  partial: '部分授权',
  revoked: '已撤销',
  expired: '已过期',
  bad_data: '已隔离',
};

const REMARK_SOURCE_REASON: Record<RemarkSource, string> = {
  original_commitment: '原始家长承诺',
  supplement: '顾问补充备注',
  status_change: '状态变更记录',
  parent_revision: '家长临时改口',
};

export const systemEventRepo = {
  listAll(limit = 50): SystemEvent[] {
    const rows = db
      .prepare('SELECT * FROM system_events ORDER BY created_at DESC LIMIT ?')
      .all(limit);
    return rows.map(rowToEvent);
  },

  byAuth(authId: string): SystemEvent[] {
    const rows = db
      .prepare('SELECT * FROM system_events WHERE auth_id = ? ORDER BY created_at DESC')
      .all(authId);
    return rows.map(rowToEvent);
  },
};
