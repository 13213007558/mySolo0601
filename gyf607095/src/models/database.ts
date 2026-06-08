import {
  User, Child, Course, CourseSchedule, Photo, WriteOffRecord,
  AuditLog, BalanceTransaction, ImportBatch, ReceptionStep
} from '../types';

export class Database {
  private static instance: Database;
  public users: Map<string, User> = new Map();
  public children: Map<string, Child> = new Map();
  public courses: Map<string, Course> = new Map();
  public schedules: Map<string, CourseSchedule> = new Map();
  public photos: Map<string, Photo> = new Map();
  public writeOffRecords: Map<string, WriteOffRecord> = new Map();
  public auditLogs: AuditLog[] = [];
  public balanceTransactions: Map<string, BalanceTransaction> = new Map();
  public importBatches: Map<string, ImportBatch> = new Map();
  public receptionSteps: Map<string, ReceptionStep> = new Map();

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public clear(): void {
    this.users.clear();
    this.children.clear();
    this.courses.clear();
    this.schedules.clear();
    this.photos.clear();
    this.writeOffRecords.clear();
    this.auditLogs = [];
    this.balanceTransactions.clear();
    this.importBatches.clear();
    this.receptionSteps.clear();
  }
}

export const db = Database.getInstance();
