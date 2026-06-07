import { db } from '../db/init';
import type {
  MilkRecord,
  ListFilters,
  ReviewPayload,
  ReviewLog,
  RecordStatus,
} from '../../shared/types';
import { formatDate, uuid, detectDataIssues } from '../utils/validation';

interface DbRecord {
  id: string;
  baby_name: string;
  baby_birthday: string;
  parent_name: string;
  parent_phone: string;
  parent_id_card: string;
  milk_quantity: number;
  milk_unit: 'ml' | 'bottle';
  authorization_no: string;
  status: RecordStatus;
  review_reason: string;
  handler_name: string;
  created_at: string;
  updated_at: string;
  reviewed_at: string;
  is_bad_data: number;
  data_issues_json: string;
}

function mapRow(row: DbRecord): MilkRecord {
  return {
    id: row.id,
    babyName: row.baby_name,
    babyBirthday: row.baby_birthday,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    parentIdCard: row.parent_id_card || undefined,
    milkQuantity: row.milk_quantity,
    milkUnit: row.milk_unit,
    authorizationNo: row.authorization_no,
    status: row.status,
    reviewReason: row.review_reason || undefined,
    handlerName: row.handler_name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at || undefined,
    isBadData: !!row.is_bad_data,
    dataIssues: JSON.parse(row.data_issues_json || '[]'),
  };
}

export const recordRepo = {
  list(filters: ListFilters = {}) {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filters.phone) {
      conditions.push('parent_phone LIKE @phone');
      params.phone = `%${filters.phone}%`;
    }
    if (filters.status) {
      conditions.push('status = @status');
      params.status = filters.status;
    }
    if (!filters.includeBadData) {
      conditions.push('is_bad_data = 0');
    } else {
    }
    if (filters.startDate) {
      conditions.push('created_at >= @startDate');
      params.startDate = filters.startDate;
    }
    if (filters.endDate) {
      conditions.push('created_at <= @endDate');
      params.endDate = filters.endDate + ' 23:59:59';
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM records ${where} ORDER BY created_at DESC`)
      .all(params) as DbRecord[];

    return rows.map(mapRow);
  },

  getById(id: string): MilkRecord | null {
    const row = db
      .prepare('SELECT * FROM records WHERE id = ?')
      .get(id) as DbRecord | undefined;
    return row ? mapRow(row) : null;
  },

  create(input: Omit<MilkRecord, 'id' | 'createdAt' | 'updatedAt' | 'dataIssues'>) {
    const id = uuid();
    const now = new Date().toISOString();
    const issues = detectDataIssues({
      parentPhone: input.parentPhone,
      parentIdCard: input.parentIdCard,
    });

    db.prepare(
      `INSERT INTO records (
        id, baby_name, baby_birthday, parent_name, parent_phone, parent_id_card,
        milk_quantity, milk_unit, authorization_no, status, review_reason,
        handler_name, created_at, updated_at, reviewed_at, is_bad_data, data_issues_json
      ) VALUES (
        @id, @babyName, @babyBirthday, @parentName, @parentPhone, @parentIdCard,
        @milkQuantity, @milkUnit, @authorizationNo, @status, @reviewReason,
        @handlerName, @createdAt, @updatedAt, @reviewedAt, @isBadData, @dataIssuesJson
      )`
    ).run({
      id,
      babyName: input.babyName,
      babyBirthday: input.babyBirthday || null,
      parentName: input.parentName,
      parentPhone: input.parentPhone,
      parentIdCard: input.parentIdCard || null,
      milkQuantity: input.milkQuantity,
      milkUnit: input.milkUnit,
      authorizationNo: input.authorizationNo,
      status: input.status,
      reviewReason: input.reviewReason || null,
      handlerName: input.handlerName || null,
      createdAt: now,
      updatedAt: now,
      reviewedAt: input.reviewedAt || null,
      isBadData: input.isBadData ? 1 : 0,
      dataIssuesJson: JSON.stringify(issues),
    });

    return this.getById(id)!;
  },

  update(id: string, payload: Partial<MilkRecord>) {
    const existing = this.getById(id);
    if (!existing) return null;

    const merged: MilkRecord = { ...existing, ...payload, updatedAt: new Date().toISOString() };
    if (payload.parentPhone || payload.parentIdCard) {
      merged.dataIssues = detectDataIssues({
        parentPhone: merged.parentPhone,
        parentIdCard: merged.parentIdCard,
      });
    }

    db.prepare(
      `UPDATE records SET
        baby_name = @babyName,
        baby_birthday = @babyBirthday,
        parent_name = @parentName,
        parent_phone = @parentPhone,
        parent_id_card = @parentIdCard,
        milk_quantity = @milkQuantity,
        milk_unit = @milkUnit,
        authorization_no = @authorizationNo,
        status = @status,
        review_reason = @reviewReason,
        handler_name = @handlerName,
        updated_at = @updatedAt,
        reviewed_at = @reviewedAt,
        is_bad_data = @isBadData,
        data_issues_json = @dataIssuesJson
      WHERE id = @id`
    ).run({
      id,
      babyName: merged.babyName,
      babyBirthday: merged.babyBirthday || null,
      parentName: merged.parentName,
      parentPhone: merged.parentPhone,
      parentIdCard: merged.parentIdCard || null,
      milkQuantity: merged.milkQuantity,
      milkUnit: merged.milkUnit,
      authorizationNo: merged.authorizationNo,
      status: merged.status,
      reviewReason: merged.reviewReason || null,
      handlerName: merged.handlerName || null,
      updatedAt: merged.updatedAt,
      reviewedAt: merged.reviewedAt || null,
      isBadData: merged.isBadData ? 1 : 0,
      dataIssuesJson: JSON.stringify(merged.dataIssues),
    });

    return this.getById(id);
  },

  review(id: string, payload: ReviewPayload) {
    const existing = this.getById(id);
    if (!existing) return null;
    const fromStatus = existing.status;
    const now = new Date().toISOString();
    const updated = this.update(id, {
      status: payload.status,
      reviewReason: payload.reviewReason,
      handlerName: payload.handlerName,
      reviewedAt: now,
    });
    if (updated) {
      reviewLogRepo.create({
        recordId: id,
        fromStatus,
        toStatus: payload.status,
        reason: payload.reviewReason,
        handlerName: payload.handlerName,
      });
    }
    return updated;
  },

  markBad(id: string, reason: string, handlerName: string) {
    const existing = this.getById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updated = this.update(id, {
      isBadData: true,
      status: 'bad_data',
      reviewReason: reason,
      handlerName,
      reviewedAt: now,
    });
    if (updated) {
      db.prepare(
        `INSERT INTO bad_records (id, original_record_id, baby_name, parent_phone, reason, marked_by, marked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(uuid(), id, existing.babyName, existing.parentPhone, reason, handlerName, now);
    }
    return updated;
  },

  restore(id: string, handlerName: string) {
    const existing = this.getById(id);
    if (!existing) return null;
    const now = new Date().toISOString();
    const updated = this.update(id, {
      isBadData: false,
      status: 'pending',
      reviewReason: `由 ${handlerName} 于 ${formatDate(now)} 从坏数据区恢复`,
      handlerName,
      reviewedAt: now,
    });
    if (updated) {
      db.prepare('DELETE FROM bad_records WHERE original_record_id = ?').run(id);
    }
    return updated;
  },

  stats(filters: ListFilters = {}) {
    const all = this.list(filters);
    return {
      total: all.length,
      normalCount: all.filter((r) => !r.isBadData).length,
      badCount: all.filter((r) => r.isBadData).length,
    };
  },
};

export const reviewLogRepo = {
  listByRecord(recordId: string): ReviewLog[] {
    const rows = db
      .prepare('SELECT * FROM review_logs WHERE record_id = ? ORDER BY created_at DESC')
      .all(recordId) as any[];
    return rows.map((r) => ({
      id: r.id,
      recordId: r.record_id,
      fromStatus: r.from_status,
      toStatus: r.to_status,
      reason: r.reason || '',
      handlerName: r.handler_name,
      createdAt: r.created_at,
    }));
  },

  create(input: Omit<ReviewLog, 'id' | 'createdAt'>) {
    db.prepare(
      `INSERT INTO review_logs (id, record_id, from_status, to_status, reason, handler_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuid(),
      input.recordId,
      input.fromStatus,
      input.toStatus,
      input.reason || null,
      input.handlerName,
      new Date().toISOString()
    );
  },
};
