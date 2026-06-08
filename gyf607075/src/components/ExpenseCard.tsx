import type { ExpenseRecord, UserRole } from '../../shared/types';
import {
  STATUS_LABEL,
  STATUS_COLOR,
  CATEGORY_EMOJI,
} from '../../shared/types';
import { formatCurrency, formatDate, daysUntil, maskPhone } from '../utils/helpers';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface Props {
  record: ExpenseRecord;
  index?: number;
}

const VISIBLE_FIELDS: Record<UserRole, (keyof ExpenseRecord)[]> = {
  elder: ['category', 'amount', 'status', 'dueDate'],
  parent: ['category', 'amount', 'merchant', 'dueDate', 'status', 'phone', 'isSupplement'],
  nanny: ['category', 'amount', 'merchant', 'dueDate', 'status'],
  admin: [
    'category',
    'amount',
    'merchant',
    'dueDate',
    'status',
    'phone',
    'isSupplement',
    'importBatchId',
    'createdAt',
  ],
};

export default function ExpenseCard({ record, index = 0 }: Props) {
  const navigate = useNavigate();
  const { currentRole, updateRecordStatus, currentUserName } = useAppStore();
  const role = currentRole || 'parent';

  const days = daysUntil(record.dueDate);
  const isOverdue = record.status === 'pending' && days < 0;
  const isUrgent = record.status === 'pending' && days >= 0 && days <= 2;

  const handleVerify = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateRecordStatus(record.id, 'verified', currentUserName);
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateRecordStatus(record.id, 'rejected', currentUserName);
  };

  const handleProcess = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/process/${record.id}`);
  };

  const getDisplayAmount = () => {
    if (role === 'elder') return `¥${Math.round(record.amount)}`;
    return formatCurrency(record.amount);
  };

  const getDisplayPhone = () => {
    if (!record.phone) return '';
    if (role === 'admin') return record.phone;
    if (role === 'parent') return maskPhone(record.phone);
    return '';
  };

  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={
        role === 'nanny' && record.status === 'pending'
          ? handleProcess
          : undefined
      }
      className={`
        card card-hover animate-fade-in-up relative overflow-hidden
        ${role === 'nanny' && record.status === 'pending' ? 'cursor-pointer' : ''}
        ${isOverdue ? 'ring-2 ring-warm-rose/40' : ''}
      `}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${STATUS_COLOR[record.status]}`}
      />

      <div className="flex items-start gap-4 pl-2">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center">
          <span className="text-2xl">{CATEGORY_EMOJI[record.category]}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg text-gray-800">
                  {record.category}
                </h3>
                {record.isSupplement && (
                  <span className="badge bg-violet-100 text-violet-700 border border-violet-200">
                    <Sparkles className="w-3 h-3" />
                    手工补录
                  </span>
                )}
                {isOverdue && (
                  <span className="badge bg-warm-rose/10 text-warm-rose border border-warm-rose/20 animate-pulse-soft">
                    <AlertTriangle className="w-3 h-3" />
                    已逾期 {Math.abs(days)} 天
                  </span>
                )}
                {isUrgent && !isOverdue && (
                  <span className="badge bg-amber-100 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3" />
                    {days === 0 ? '今天到期' : `${days} 天后到期`}
                  </span>
                )}
              </div>
              {VISIBLE_FIELDS[role].includes('merchant') && (
                <p className="text-sm text-gray-500 mt-0.5">{record.merchant}</p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-display text-2xl text-warm-orange">
                {getDisplayAmount()}
              </div>
              <span
                className={`badge mt-1 ${
                  record.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : record.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : record.status === 'rejected'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-violet-100 text-violet-700 border border-violet-200'
                }`}
              >
                {STATUS_LABEL[record.status]}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {VISIBLE_FIELDS[role].includes('dueDate') && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(record.dueDate)}
                </span>
              )}
              {getDisplayPhone() && (
                <span className="inline-flex items-center gap-1 font-mono text-xs">
                  📱 {getDisplayPhone()}
                </span>
              )}
              {VISIBLE_FIELDS[role].includes('importBatchId') &&
                record.importBatchId && (
                  <span className="tag bg-sky-50 text-sky-600 border border-sky-100">
                    批次 {record.importBatchId.slice(-6)}
                  </span>
                )}
              {record.isSupplement &&
                VISIBLE_FIELDS[role].includes('isSupplement') &&
                record.supplementRemark && (
                  <span className="text-xs text-violet-600">
                    备注：{record.supplementRemark}
                  </span>
                )}
            </div>

            <div className="flex items-center gap-2">
              {role === 'nanny' && record.status === 'pending' && (
                <button
                  onClick={handleProcess}
                  className="btn-primary !py-1.5 !px-3 text-sm"
                >
                  按步骤处理
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {(role === 'parent' || role === 'admin') &&
                record.status === 'pending' && (
                  <>
                    <button
                      onClick={handleVerify}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      核销
                    </button>
                    <button
                      onClick={handleReject}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>

      {record.isSupplement &&
        record.beforeSnapshot &&
        (role === 'parent' || role === 'admin') && (
          <div className="mt-4 pt-3 border-t border-dashed border-violet-200 bg-violet-50/30 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
            <div className="text-xs text-violet-600 mb-1.5 font-medium">
              📝 补录前原记录快照
            </div>
            <div className="flex items-center gap-3 text-xs text-violet-500 flex-wrap">
              <span>{record.beforeSnapshot.category}</span>
              <span>¥{record.beforeSnapshot.amount?.toFixed(2)}</span>
              <span>{record.beforeSnapshot.merchant}</span>
              <span>原到期日 {record.beforeSnapshot.dueDate}</span>
            </div>
          </div>
        )}
    </div>
  );
}
