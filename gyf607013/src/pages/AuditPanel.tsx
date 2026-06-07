import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  Filter,
  AlertTriangle,
  ShieldAlert,
  User,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import AuditDiff from '@/components/AuditDiff';
import { useAuditStore } from '@/store/auditStore';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import type { AuditLog, DisinfectionRecord, UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';

const FIELD_LABELS: Record<string, string> = {
  status: '状态',
  temperature: '温度',
  duration: '时长',
  actualTime: '实际时间',
  operatorId: '操作人',
  handlerId: '处理人',
  reviewedById: '审核人',
  reviewedAt: '审核时间',
  exceptionNote: '异常说明',
  itemName: '物品名称',
  scheduledTime: '计划时间',
  source: '数据来源',
  boundaryReason: '边界原因',
};

const STATUS_FIELDS = ['status'];
const NUMERIC_FIELDS = ['temperature', 'duration'];

type ChangeType = 'status' | 'numeric' | 'manual';

function getChangeType(log: AuditLog): ChangeType {
  if (log.fieldName === 'source' && log.newValue === 'manual') return 'manual';
  if (STATUS_FIELDS.includes(log.fieldName)) return 'status';
  if (NUMERIC_FIELDS.includes(log.fieldName)) return 'numeric';
  return 'numeric';
}

const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; className: string }> = {
  status: { label: '状态变更', className: 'bg-medical-50 text-medical-700 border-medical-200' },
  numeric: { label: '数值变更', className: 'bg-mint-50 text-mint-700 border-mint-200' },
  manual: { label: '补录', className: 'bg-warm-50 text-warm-700 border-warm-200' },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  className?: string;
}

function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-200 bg-white p-4 shadow-card transition hover:shadow-card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-500">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

interface LogCardProps {
  log: AuditLog;
  record?: DisinfectionRecord;
}

function LogCard({ log, record }: LogCardProps) {
  const fieldLabel = FIELD_LABELS[log.fieldName] ?? log.fieldName;
  const changeType = getChangeType(log);
  const changeCfg = CHANGE_TYPE_CONFIG[changeType];
  const isBoundary = log.isBoundaryAudit;

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-card transition hover:shadow-card-hover',
        isBoundary
          ? 'border-warm-300 bg-warm-50/60 ring-1 ring-warm-200'
          : 'border-ink-200 bg-white'
      )}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-700">
          {fieldLabel}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium',
            changeCfg.className
          )}
        >
          {changeCfg.label}
        </span>
        {isBoundary && (
          <span className="inline-flex items-center gap-1 rounded-md bg-warm-100 px-2.5 py-0.5 text-xs font-medium text-warm-700">
            <AlertTriangle className="h-3 w-3" />
            边界值审计
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-500">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(log.operatedAt, true)}
        </span>
      </div>

      <AuditDiff log={log} className="mb-4" />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          <span>操作人：</span>
          <span className="font-medium text-ink-700">{log.operatorName}</span>
        </div>
        {record?.handlerName && (
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>处理人：</span>
            <span className="font-medium text-ink-700">{record.handlerName}</span>
          </div>
        )}
        {record?.reviewedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>复核时间：</span>
            <span className="font-medium text-ink-700">{formatDate(record.reviewedAt, true)}</span>
          </div>
        )}
        {record?.reviewedByName && (
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>复核人：</span>
            <span className="font-medium text-ink-700">{record.reviewedByName}</span>
          </div>
        )}
      </div>

      {isBoundary && record?.boundaryReason && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-warm-200 bg-warm-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warm-600" />
          <div>
            <p className="text-xs font-medium text-warm-700">边界值原因</p>
            <p className="text-xs text-warm-600">{record.boundaryReason}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditPanel() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { logs, loading, error, fetchLogs } = useAuditStore();
  const { records, fetchAll } = useScheduleStore();

  const [recordIdQuery, setRecordIdQuery] = useState('');
  const [boundaryOnly, setBoundaryOnly] = useState(false);
  const [operatorFilter, setOperatorFilter] = useState('');

  const role: UserRole | null = currentUser?.role ?? null;

  useEffect(() => {
    if (!role || role === 'staff') {
      navigate('/', { replace: true });
      return;
    }
    if (!currentUser) {
      navigate('/', { replace: true });
      return;
    }
    fetchLogs();
    fetchAll();
  }, [role, currentUser, navigate, fetchLogs, fetchAll]);

  const operators = useMemo(() => {
    const set = new Map<string, string>();
    logs.forEach((l) => set.set(l.operatorId, l.operatorName));
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (role === 'nurse') {
      result = result.filter((l) => l.operatorId === currentUser?.id);
    }
    if (recordIdQuery.trim()) {
      const q = recordIdQuery.trim().toLowerCase();
      result = result.filter((l) => l.recordId.toLowerCase().includes(q));
    }
    if (boundaryOnly) {
      result = result.filter((l) => l.isBoundaryAudit);
    }
    if (operatorFilter) {
      result = result.filter((l) => l.operatorId === operatorFilter);
    }
    return result;
  }, [logs, role, currentUser, recordIdQuery, boundaryOnly, operatorFilter]);

  const stats = useMemo(() => {
    const baseLogs = role === 'nurse' ? logs.filter((l) => l.operatorId === currentUser?.id) : logs;
    const totalChanges = baseLogs.length;
    const boundaryCount = baseLogs.filter((l) => l.isBoundaryAudit).length;
    const exceptionCount = baseLogs.filter(
      (l) => l.fieldName === 'status' && (l.newValue === 'exception' || l.oldValue === 'exception')
    ).length;
    const pendingReview = records.filter((r) => !r.reviewedAt && (r.status === 'completed' || r.status === 'exception' || r.isBoundaryAudit)).length;
    return { totalChanges, boundaryCount, exceptionCount, pendingReview };
  }, [logs, records, role, currentUser]);

  const recordMap = useMemo(() => {
    const m = new Map<string, DisinfectionRecord>();
    records.forEach((r) => m.set(r.id, r));
    return m;
  }, [records]);

  if (!role || role === 'staff' || !currentUser) {
    return null;
  }

  return (
      <div className="space-y-6 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-medical-600" />
            <h1 className="page-title text-2xl font-semibold text-ink-900">历史审计面板</h1>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            追踪所有消毒记录的变更历史，验证操作可追溯性（R-006），边界值变更自动标记并高亮。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="总变更数" value={stats.totalChanges} icon={ClipboardCheck} />
          <StatCard
            label="边界值审计数"
            value={stats.boundaryCount}
            icon={AlertTriangle}
            className="border-warm-200"
          />
          <StatCard
            label="异常处理数"
            value={stats.exceptionCount}
            icon={AlertCircle}
            className="border-danger-200"
          />
          <StatCard
            label="待复核数"
            value={stats.pendingReview}
            icon={ShieldAlert}
            className="border-medical-200"
          />
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-ink-500" />
            <span className="text-sm font-medium text-ink-700">筛选条件</span>
            <button
              type="button"
              onClick={() => fetchLogs()}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition hover:bg-ink-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              刷新
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="按记录ID搜索..."
                value={recordIdQuery}
                onChange={(e) => setRecordIdQuery(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={boundaryOnly}
                onChange={(e) => setBoundaryOnly(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-warm-500 focus:ring-warm-200"
              />
              <span className="text-ink-700">仅显示边界值审计</span>
            </label>

            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 outline-none transition focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
            >
              <option value="">全部操作人</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              加载审计日志中...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white py-16 text-center">
              <ClipboardCheck className="mx-auto mb-2 h-10 w-10 text-ink-300" />
              <p className="text-sm text-ink-500">暂无审计记录</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <LogCard key={log.id} log={log} record={recordMap.get(log.recordId)} />
            ))
          )}
        </div>
      </div>
  );
}
