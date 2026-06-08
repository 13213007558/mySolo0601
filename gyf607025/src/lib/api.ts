import type {
  CourseTransaction,
  VerificationRecord,
  AuditLog,
  Stats,
  TransactionFilter,
  TransactionListResponse,
  TransactionDetailResponse,
  ImportResult,
  ManualEntryPayload,
} from "../../shared/types";

const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, any>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export function fetchTransactions(filter: TransactionFilter = {}) {
  return request<TransactionListResponse>(
    `/transactions${buildQuery(filter)}`
  );
}

export function fetchTransactionDetail(id: string) {
  return request<TransactionDetailResponse>(`/transactions/${id}`);
}

export function fetchStats() {
  return request<Stats>("/stats");
}

export function fetchAuditLogs(targetId?: string) {
  return request<AuditLog[]>(`/audit${targetId ? buildQuery({ targetId }) : ""}`);
}

export function postManualEntry(payload: ManualEntryPayload) {
  return request<{ success: boolean; transactionId?: string }>("/manual-entry", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function postImportSample() {
  return request<ImportResult>("/import-sample", { method: "POST" });
}

export async function exportCSV(filter: TransactionFilter = {}): Promise<void> {
  const res = await fetch(`${API_BASE}/export${buildQuery(filter)}`);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type {
  CourseTransaction,
  VerificationRecord,
  AuditLog,
  Stats,
  TransactionFilter,
  ImportResult,
  ManualEntryPayload,
};
