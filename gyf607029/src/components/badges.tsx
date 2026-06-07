import type { AuthStatus, AuthType, MaterialStatus, ExportStatus } from 'shared/types.js';

export function AuthStatusBadge({ status }: { status: AuthStatus }) {
  const map: Record<AuthStatus, { text: string; cls: string }> = {
    active: { text: '有效', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    revoked: { text: '已撤销', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
    expired: { text: '已过期', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
    pending: { text: '待审核', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    failed: { text: '授权失败', cls: 'bg-red-50 text-red-700 border border-red-200' },
    corrected: { text: '已人工更正', cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
  };
  const { text, cls } = map[status];
  return <span className={`badge ${cls}`}>{text}</span>;
}

export function AuthTypeBadge({ type }: { type: AuthType }) {
  const map: Record<AuthType, { text: string; cls: string }> = {
    primary: { text: '常规授权', cls: 'bg-brand-50 text-brand-700 border border-brand-200' },
    temporary: { text: '临时授权', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
    phone: { text: '电话授权', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  };
  const { text, cls } = map[type];
  return <span className={`badge ${cls}`}>{text}</span>;
}

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const map: Record<MaterialStatus, { text: string; cls: string }> = {
    ok: { text: '完整', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    missing: { text: '缺页', cls: 'bg-red-50 text-red-700 border border-red-200 animate-pulse-soft' },
    damaged: { text: '损坏', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  };
  const { text, cls } = map[status];
  return <span className={`badge ${cls}`}>{text}</span>;
}

export function ExportStatusBadge({ status }: { status: ExportStatus }) {
  const map: Record<ExportStatus, { text: string; cls: string }> = {
    success: { text: '成功', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    partial: { text: '部分成功', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    failed: { text: '失败', cls: 'bg-red-50 text-red-700 border border-red-200' },
    rejected: { text: '拒绝导出', cls: 'bg-red-50 text-red-700 border border-red-200' },
  };
  const { text, cls } = map[status];
  return <span className={`badge ${cls}`}>{text}</span>;
}
