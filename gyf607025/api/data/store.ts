import type { CourseTransaction, VerificationRecord, AuditLog, Stats, VerifyStatus } from "../../shared/types.js";
import { sampleTransactions, sampleVerifications, sampleAuditLogs } from "../../shared/sampleData.js";

class DataStore {
  transactions: CourseTransaction[] = [];
  verifications: VerificationRecord[] = [];
  auditLogs: AuditLog[] = [];

  constructor() {
    this.initialize();
  }

  initialize(): void {
    this.transactions = [...sampleTransactions];
    this.verifications = [...sampleVerifications];
    this.auditLogs = [...sampleAuditLogs];
  }

  findTransactionByTxId(transactionId: string): CourseTransaction | undefined {
    return this.transactions.find((t) => t.transactionId === transactionId);
  }

  findVerificationsByTxId(transactionId: string): VerificationRecord[] {
    return this.verifications.filter((v) => v.transactionId === transactionId);
  }

  appendAuditLog(log: AuditLog): void {
    this.auditLogs.unshift(log);
  }

  appendTransaction(tx: CourseTransaction): void {
    this.transactions.unshift(tx);
  }

  appendVerification(v: VerificationRecord): void {
    this.verifications.unshift(v);
  }

  getTxStatus(transactionId: string): VerifyStatus {
    const vs = this.verifications.filter((v) => v.transactionId === transactionId);
    if (vs.length === 0) return "pending";
    if (vs.some((v) => v.status === "exception")) return "exception";
    if (vs.some((v) => v.status === "partial_success")) return "partial_success";
    if (vs.every((v) => v.status === "verified")) return "verified";
    return "pending";
  }

  getStats(): Stats {
    let pending = 0;
    let verified = 0;
    let exception = 0;
    for (const tx of this.transactions) {
      const s = this.getTxStatus(tx.transactionId);
      if (s === "verified") verified++;
      else if (s === "exception" || s === "partial_success") exception++;
      else pending++;
    }
    return { pending, verified, exception, total: this.transactions.length };
  }

  findAuditLogsByTargetId(targetId?: string): AuditLog[] {
    if (!targetId) return [...this.auditLogs];
    return this.auditLogs.filter((l) => l.targetId === targetId);
  }

  reset(): void {
    this.initialize();
  }
}

export const store = new DataStore();
export default store;
