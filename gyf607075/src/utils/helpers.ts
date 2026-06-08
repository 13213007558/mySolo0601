export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '';
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export interface PhoneValidationResult {
  valid: string[];
  invalid: string[];
  partialSuccess: boolean;
  allValid: boolean;
  allInvalid: boolean;
}

export function validatePhones(rawInput: string): PhoneValidationResult {
  const cleaned = rawInput
    .split(/[,，\s\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const phoneRegex = /^1[3-9]\d{9}$/;
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const p of cleaned) {
    if (phoneRegex.test(p)) {
      valid.push(p);
    } else {
      invalid.push(p);
    }
  }

  return {
    valid,
    invalid,
    partialSuccess: valid.length > 0 && invalid.length > 0,
    allValid: invalid.length === 0 && valid.length > 0,
    allInvalid: valid.length === 0 && cleaned.length > 0,
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, '');
}

export interface DedupResult {
  added: number;
  skipped: number;
  duplicates: number;
  addedIds: string[];
}

export function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function escapeCSV(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
