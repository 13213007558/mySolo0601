import { User, Child, Course, CourseSchedule, Photo, WriteOffRecord, AuditLog, BalanceTransaction, ImportBatch, ReceptionStep } from '../types';
export declare class Database {
    private static instance;
    users: Map<string, User>;
    children: Map<string, Child>;
    courses: Map<string, Course>;
    schedules: Map<string, CourseSchedule>;
    photos: Map<string, Photo>;
    writeOffRecords: Map<string, WriteOffRecord>;
    auditLogs: AuditLog[];
    balanceTransactions: Map<string, BalanceTransaction>;
    importBatches: Map<string, ImportBatch>;
    receptionSteps: Map<string, ReceptionStep>;
    private constructor();
    static getInstance(): Database;
    clear(): void;
}
export declare const db: Database;
