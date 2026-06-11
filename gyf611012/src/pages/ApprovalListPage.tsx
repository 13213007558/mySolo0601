import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileCheck2,
  ChevronLeft,
  ArrowRight,
  AlertTriangle,
  Hash,
  Building2,
  TrendingDown,
  Clock3,
  ShieldCheck,
  ShieldX,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { dayjs, returnStatusMeta, remainTimeText, percentOf } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { ReturnOrder, UserRole } from '@/types';

function needsMyApproval(order: ReturnOrder, role: UserRole): boolean {
  if (role === 'SUPERVISOR') return order.status === 'PENDING_APPROVAL';
  if (role === 'MANAGER') return order.status === 'FIRST_APPROVED';
  return false;
}

function canApproveLevel1(order: ReturnOrder, role: UserRole): boolean {
  return role === 'SUPERVISOR' && order.status === 'PENDING_APPROVAL';
}

function canApproveLevel2(order: ReturnOrder, role: UserRole): boolean {
  return role === 'MANAGER' && order.status === 'FIRST_APPROVED';
}

function canReject(order: ReturnOrder, role: UserRole): boolean {
  if (role === 'INSPECTOR') return false;
  return order.status === 'PENDING_APPROVAL' || order.status === 'FIRST_APPROVED';
}

function CountdownTimer({ targetIso }: { targetIso: string }) {
  const [now, setNow] = useState(dayjs().toISOString());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs().toISOString()), 1000);
    return () => clearInterval(t);
  }, []);
  const { text, expired, urgent } = remainTimeText(targetIso, now);
  if (expired) {
    return (
      <span className="led-number text-sm text-emerald-400 font-semibold">
        <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
        已生效
      </span>
    );
  }
  return (
    <span
      className={cn(
        'led-number font-bold tracking-widest text-shadow-red',
        urgent ? 'text-saffron-400 animate-blink-critical' : 'text-saffron-500'
      )}
    >
      {text}
    </span>
  );
}

function ReturnCard({ order }: { order: ReturnOrder }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAppStore();
  const meta = returnStatusMeta(order.status);
  const outRatio = percentOf(order.outOfThresholdCount, order.totalCount, 0);

  const showL1 = canApproveLevel1(order, currentUser.role);
  const showL2 = canApproveLevel2(order, currentUser.role);
  const showRej = canReject(order, currentUser.role);
  const showCountdown = order.status === 'LOCKED' || order.status === 'FINAL_APPROVED';

  const goDetail = () => navigate(`/approvals/${order.id}`);

  return (
    <div
      onClick={goDetail}
      className="panel p-5 cursor-pointer hover:border-gold-500/50 hover:shadow-gold-glow/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-gold-400 font-semibold">
              <Hash className="w-3.5 h-3.5" />
              {order.returnNo}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-ink-400 font-mono">
              {order.batchNo}
            </span>
            <span className={`data-chip ${meta.color} border-transparent`}>{meta.label}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-300">
            <Building2 className="w-3.5 h-3.5 text-ink-500" />
            <span className="truncate">{order.supplierName}</span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-ink-500 group-hover:text-gold-500 transition-colors shrink-0 mt-1" />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-ink-900/60 border border-ink-700 p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">
            {t('batch.expected_grade')}
          </div>
          <div className="flex items-center gap-2">
            <span className="data-chip bg-ink-700 border-ink-600 text-ink-200 font-bold text-sm px-3 py-1">
              {order.originalGrade}
            </span>
            <TrendingDown className="w-4 h-4 text-saffron-500" />
            <span className="data-chip bg-saffron-700 border-saffron-600 text-white font-bold text-sm px-3 py-1">
              {order.degradedToGrade}
            </span>
          </div>
        </div>

        <div className="bg-ink-900/60 border border-ink-700 p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">
            {t('batch.avg_delta')} / 最大ΔE
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'led-number font-semibold',
                order.avgDeltaE > 4 ? 'text-saffron-400 text-shadow-red' : 'text-amber-400'
              )}
            >
              {order.avgDeltaE.toFixed(2)}
            </span>
            <span className="text-ink-600">/</span>
            <span
              className={cn(
                'led-number',
                order.maxDeltaE > 6 ? 'text-saffron-500' : 'text-ink-300'
              )}
            >
              {order.maxDeltaE.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-ink-900/60 border border-ink-700 p-3">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">
            {t('batch.out_threshold')}
          </div>
          <div className="flex items-center gap-2">
            <span className="led-number text-ink-200 font-semibold">
              {order.outOfThresholdCount}
            </span>
            <span className="text-ink-500 text-xs">/ {order.totalCount}</span>
            {outRatio > 20 && (
              <span className="relative group/ratio">
                <AlertTriangle className="w-4 h-4 text-saffron-500" />
              </span>
            )}
            <span className="ml-auto led-number text-xs text-ink-400">{outRatio}%</span>
          </div>
          <div className="progress-track mt-2 h-1.5">
            <div
              className={cn(
                'progress-bar',
                outRatio > 20 ? 'bg-saffron-600' : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(outRatio, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-ink-900/60 border border-ink-700 p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-500 mb-1">
            <Clock3 className="w-3 h-3" />
            {t('approval.remain')}
          </div>
          {showCountdown ? (
            <CountdownTimer targetIso={order.irrevocableUntil} />
          ) : (
            <span className="led-number text-sm text-ink-500">
              {order.status === 'EFFECTIVE' ? '—' : dayjs(order.createdAt).fromNow()}
            </span>
          )}
        </div>
      </div>

      {(showL1 || showL2 || showRej) && (
        <div className="mt-4 pt-4 border-t border-ink-700/60 flex items-center justify-end gap-2">
          {showL1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/approvals/${order.id}`);
              }}
              className="btn-hard-gold !px-4 !py-1.5 !text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('approval.level_one')}
            </button>
          )}
          {showL2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/approvals/${order.id}`);
              }}
              className="btn-hard-primary !px-4 !py-1.5 !text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('approval.level_two')}
            </button>
          )}
          {showRej && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/approvals/${order.id}`);
              }}
              className="btn-hard-ghost !px-4 !py-1.5 !text-xs border-saffron-600/40 text-saffron-400 hover:bg-saffron-700/20"
            >
              <ShieldX className="w-3.5 h-3.5" />
              {t('common.reject')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApprovalListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { returnOrders, currentUser, refreshReturnOrderStatuses } = useAppStore();
  const [activeTab, setActiveTab] = useState<number>(currentUser.role === 'INSPECTOR' ? 1 : 0);

  useEffect(() => {
    refreshReturnOrderStatuses();
  }, [refreshReturnOrderStatuses]);

  const pendingMy = useMemo(
    () =>
      returnOrders
        .filter((o) => needsMyApproval(o, currentUser.role))
        .sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()),
    [returnOrders, currentUser.role]
  );

  const allOrders = useMemo(
    () => [...returnOrders].sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix()),
    [returnOrders]
  );

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="btn-hard-ghost !px-3 !py-2"
            title={t('common.back')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-gold-500" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink-100 tracking-wide">
                {t('approval.title')}
              </h1>
              <p className="text-sm text-ink-400 mt-0.5">
                {currentUser.role === 'INSPECTOR'
                  ? `共 ${allOrders.length} 张退货单`
                  : `待我审批 ${pendingMy.length} 张，共 ${allOrders.length} 张`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex gap-0 border-b border-ink-700 mb-5">
          <button
            onClick={() => setActiveTab(0)}
            className={cn(
              'px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all border-b-2 -mb-px',
              activeTab === 0
                ? 'text-gold-500 border-gold-500'
                : 'text-ink-400 border-transparent hover:text-ink-200 hover:border-ink-500'
            )}
          >
            <span className="inline-flex items-center gap-2">
              <ThumbsUp className="w-4 h-4" />
              {t('approval.pending_me')}
              <span className="data-chip bg-saffron-700 text-white border-transparent !text-[10px] !py-0.5">
                {pendingMy.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={cn(
              'px-6 py-3 font-mono text-sm uppercase tracking-wider transition-all border-b-2 -mb-px',
              activeTab === 1
                ? 'text-gold-500 border-gold-500'
                : 'text-ink-400 border-transparent hover:text-ink-200 hover:border-ink-500'
            )}
          >
            <span className="inline-flex items-center gap-2">
              <FileCheck2 className="w-4 h-4" />
              {t('approval.all')}
              <span className="data-chip bg-ink-700 text-ink-200 border-ink-600 !text-[10px] !py-0.5">
                {allOrders.length}
              </span>
            </span>
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === 0 && (
            pendingMy.length === 0 ? (
              <div className="panel p-16 text-center">
                <ThumbsDown className="w-12 h-12 text-ink-600 mx-auto mb-3" />
                <p className="text-ink-400 font-mono text-sm">暂无待您审批的退货单</p>
              </div>
            ) : (
              pendingMy.map((o) => <ReturnCard key={o.id} order={o} />)
            )
          )}
          {activeTab === 1 && (
            allOrders.length === 0 ? (
              <div className="panel p-16 text-center">
                <FileCheck2 className="w-12 h-12 text-ink-600 mx-auto mb-3" />
                <p className="text-ink-400 font-mono text-sm">暂无退货单记录</p>
              </div>
            ) : (
              allOrders.map((o) => <ReturnCard key={o.id} order={o} />)
            )
          )}
        </div>
      </div>
    </div>
  );
}
