import Dexie, { Table } from 'dexie';
import {
  User,
  RescheduleRecord,
  AuditLog,
  AccessDeniedLog,
} from '@/types';

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  reschedule_records!: Table<RescheduleRecord, string>;
  audit_logs!: Table<AuditLog, string>;
  access_denied_logs!: Table<AccessDeniedLog, string>;

  constructor() {
    super('baby_schedule_db');

    this.version(1).stores({
      users: 'id, name, role, shift',
      reschedule_records:
        'id, status, babyId, handlerId, isIsolated, createdAt, [targetDate+targetShift]',
      audit_logs: 'id, recordId, operatorId, createdAt',
      access_denied_logs: 'id, userId, targetRecordId',
    });
  }
}

export const db = new AppDatabase();
