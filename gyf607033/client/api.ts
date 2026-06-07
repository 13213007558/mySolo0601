import {
  DisinfectionRecord, Baby, ScanRecord, AuditLog, UserRole, ApiResponse, RecordStatus
} from '../shared/types.js';

let currentRole: UserRole = 'consultant';
let currentUserId = 'u_consultant_1';
let currentUserName = '李老师';

export function setContext(role: UserRole, userId: string, userName: string) {
  currentRole = role;
  currentUserId = userId;
  currentUserName = userName;
}

export function getContext() {
  return { role: currentRole, userId: currentUserId, userName: currentUserName };
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const res = await fetch('/api' + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
      'X-User-Id': currentUserId,
      'X-User-Name': currentUserName,
      ...(options.headers || {})
    }
  });
  if (res.headers.get('Content-Type')?.includes('application/json')) {
    return await res.json();
  }
  return { success: res.ok, data: (res as any) } as any;
}

export async function fetchRecords(babyId?: string, className?: string, status?: string) {
  const qs = new URLSearchParams();
  if (babyId) qs.set('babyId', babyId);
  if (className) qs.set('className', className);
  if (status) qs.set('status', status);
  return request<{ records: DisinfectionRecord[]; babies: Baby[] }>(
    '/records' + (qs.toString() ? '?' + qs.toString() : '')
  );
}

export async function fetchRecordDetail(id: string) {
  return request<{ record: DisinfectionRecord; baby: Baby | null; scans: ScanRecord[]; audits: AuditLog[] }>(
    '/records/' + id
  );
}

export async function handleRecord(id: string, body: {
  status: RecordStatus; handleResult: string; supplementRemark?: string;
}) {
  return request('/records/' + id + '/handle', { method: 'POST', body: JSON.stringify(body) });
}

export async function revertRecord(id: string, reason?: string) {
  return request('/records/' + id + '/revert', { method: 'POST', body: JSON.stringify({ reason }) });
}

export async function addRemark(id: string, content: string) {
  return request('/records/' + id + '/remarks', { method: 'POST', body: JSON.stringify({ content }) });
}

export async function batchHandle(items: {
  id: string; status: RecordStatus; handleResult: string; supplementRemark?: string;
}[]) {
  return request('/records/batch-handle', { method: 'POST', body: JSON.stringify({ items }) });
}

export async function fetchClassSummary() {
  return request('/classes/summary');
}

export async function fetchBabyDetail(id: string) {
  return request<{ baby: Baby; records: DisinfectionRecord[] }>('/babies/' + id);
}

export async function fetchBabies() {
  return request<Baby[]>('/babies');
}

export async function fetchScans(recordId?: string) {
  const qs = recordId ? '?recordId=' + recordId : '';
  return request<ScanRecord[]>('/scans' + qs);
}

export async function createManualRecord(body: {
  babyId: string; itemType: string; itemName: string;
  expectedReturnTime: number; status?: RecordStatus; originalCommitment?: string;
}) {
  return request('/records/manual', { method: 'POST', body: JSON.stringify(body) });
}

export function downloadExport() {
  const url = '/api/export' + '?role=' + currentRole;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.setRequestHeader('X-User-Role', currentRole);
  xhr.setRequestHeader('X-User-Id', currentUserId);
  xhr.setRequestHeader('X-User-Name', currentUserName);
  xhr.responseType = 'blob';
  xhr.onload = () => {
    const blob = xhr.response;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `消毒提醒清单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };
  xhr.send();
}

export async function fetchAuditLogs() {
  return request<AuditLog[]>('/audit-logs');
}
