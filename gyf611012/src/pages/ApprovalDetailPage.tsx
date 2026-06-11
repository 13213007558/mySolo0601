import { useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  TrendingDown,
  AlertTriangle,
  Clock3,
  ShieldCheck,
  ShieldX,
  User,
  Eraser,
  PenLine,
  X,
  Check,
  Lock,
  FileText,
  History,
  CircleDot,
  Circle,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { dayjs, returnStatusMeta, remainTimeText, formatDateTime, percentOf } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import type { ReturnOrder } from '@/types';

function LockBanner({ order }: { order: ReturnOrder }) {
  const [now, setNow] = useState(dayjs().toISOString());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs().toISOString()), 1000);
    return () => clearInterval(t);
  }, []);
  const { text, expired, urgent } = remainTimeText(order.irrevocableUntil, now);
  if (expired || (order.status !== 'LOCKED' && order.status !== 'FINAL_APPROVED')) return null;
  return (
    <div className="bg-saffron-700/20 border-2 border-saffron-600 p-4 flex items-center gap-4 animate-blink-critical">
      <Lock className="w-8 h-8 text-saffron-400 shrink-0" />
      <div className="flex-1">
        <div className="font-serif text-lg font-bold text-saffron-300">
          退货单锁定中 · 24小时内不可撤销
        </div>
        <div className="text-sm text-ink-300 mt-0.5">
          终审确认后进入锁定冷却期，冷却结束后退货单自动正式生效。
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-wider text-ink-400 mb-1">距正式生效</div>
        <div
          className={cn(
            'led-number text-3xl font-bold tracking-widest text-shadow-red',
            urgent ? 'text-saffron-300' : 'text-saffron-400'
          )}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function Timeline({ order }: { order: ReturnOrder }) {
  const { t } = useTranslation();
  const steps = [
    {
      key: 'apply',
      label: '发起降级申请',
      time: order.createdAt,
      name: order.applicantName,
      done: true,
    },
    {
      key: 'l1',
      label: t('approval.level_one'),
      time: order.firstApprovedAt,
      name: order.approverName,
      done: !!order.firstApprovedAt,
    },
    {
      key: 'l2',
      label: t('approval.level_two'),
      time: order.finalApprovedAt,
      name: order.secondApproverName,
      done: !!order.finalApprovedAt,
    },
    {
      key: 'lock',
      label: '锁定冷却期',
      time: order.finalApprovedAt ? dayjs(order.finalApprovedAt).add(5, 'minute').toISOString() : undefined,
      name: undefined,
      done: order.status === 'LOCKED' || order.status === 'EFFECTIVE',
    },
    {
      key: 'eff',
      label: '退货单生效',
      time: order.effectiveAt,
      name: undefined,
      done: order.status === 'EFFECTIVE',
    },
  ];
  return (
    <ol className="relative border-l-2 border-ink-700 ml-2 space-y-6 py-2">
      {steps.map((s) => (
        <li key={s.key} className="ml-6 relative">
          <span
            className={cn(
              'absolute -left-[34px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2',
              s.done
                ? 'bg-gold-500 border-gold-400'
                : 'bg-ink-800 border-ink-600'
            )}
          >
            {s.done ? (
              <Check className="w-3 h-3 text-ink-900" />
            ) : (
              <Circle className="w-2 h-2 text-ink-500" />
            )}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {s.key === 'lock' && s.done && order.status !== 'EFFECTIVE' && (
              <CircleDot className="w-4 h-4 text-amber-400 animate-breathe-led" />
            )}
            <span
              className={cn(
                'font-mono text-sm font-semibold',
                s.done ? 'text-ink-100' : 'text-ink-500'
              )}
            >
              {s.label}
            </span>
            {s.name && (
              <span className="text-xs text-gold-400 font-mono">{s.name}</span>
            )}
          </div>
          {s.time && (
            <div className="text-[11px] text-ink-500 font-mono mt-0.5">
              {formatDateTime(s.time)}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function StampSeal({ name, role }: { name: string; role: string }) {
  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="stamp-seal w-20 h-20 border-saffron-500 text-saffron-600 bg-white/5 relative overflow-hidden">
        <div
          className="absolute inset-1 rounded-full border-2 border-gold-500 opacity-70"
          style={{ transform: 'rotate(3deg)' }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <div className="text-[10px] tracking-widest opacity-70">{role}</div>
          <div className="text-sm leading-tight mt-0.5 px-1">{name}</div>
        </div>
      </div>
    </div>
  );
}

function SignatureCanvas({
  onConfirm,
  onCancel,
}: {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = cvs.getBoundingClientRect();
    cvs.width = rect.width * dpr;
    cvs.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111827';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const cvs = canvasRef.current!;
    const rect = cvs.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!hasContent) setHasContent(true);
  };
  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const cvs = canvasRef.current;
    const ctx = cvs?.getContext('2d');
    if (!cvs || !ctx) return;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    setHasContent(false);
  };

  const confirm = () => {
    const cvs = canvasRef.current;
    if (!cvs || !hasContent) return;
    onConfirm(cvs.toDataURL('image/png'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-mono text-ink-300 flex items-center gap-2">
          <PenLine className="w-4 h-4 text-gold-500" />
          请在下方签名区域手写签名
        </div>
        <button
          onClick={clear}
          className="btn-hard-ghost !px-3 !py-1.5 !text-xs"
          type="button"
        >
          <Eraser className="w-3.5 h-3.5" />
          清空
        </button>
      </div>
      <div className="bg-white border-2 border-dashed border-ink-600 touch-none cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-40 block"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn-hard-ghost !px-4 !py-2 !text-sm" type="button">
          {onCancel ? '取消' : '关闭'}
        </button>
        <button
          onClick={confirm}
          disabled={!hasContent}
          className={cn(
            'btn-hard-gold !px-4 !py-2 !text-sm',
            !hasContent && 'opacity-40 cursor-not-allowed'
          )}
          type="button"
        >
          <Check className="w-4 h-4" />
          确认签名
        </button>
      </div>
    </div>
  );
}

export default function ApprovalDetailPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { returnId } = useParams();
  const {
    getReturnOrderById,
    currentUser,
    approveReturnOrderLevel,
    rejectReturnOrder,
    getBatchRecords,
    refreshReturnOrderStatuses,
  } = useAppStore();

  const order = returnId ? getReturnOrderById(returnId) : undefined;
  const batchRecords = order ? getBatchRecords(order.batchId).filter((r) => !r.isWithinThreshold) : [];

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [signOpen, setSignOpen] = useState<1 | 2 | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    refreshReturnOrderStatuses();
  }, [refreshReturnOrderStatuses]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!order) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/approvals')}
          className="btn-hard-ghost !px-3 !py-2 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="panel p-16 text-center">
          <X className="w-12 h-12 text-saffron-500 mx-auto mb-3" />
          <p className="text-ink-400 font-mono">退货单不存在</p>
        </div>
      </div>
    );
  }

  const meta = returnStatusMeta(order.status);
  const outRatio = percentOf(order.outOfThresholdCount, order.totalCount, 0);
  const locked = order.status === 'LOCKED' || order.status === 'FINAL_APPROVED';
  const isL1 = currentUser.role === 'SUPERVISOR' && order.status === 'PENDING_APPROVAL';
  const isL2 = currentUser.role === 'MANAGER' && order.status === 'FIRST_APPROVED';
  const canRejectOrder =
    (currentUser.role === 'SUPERVISOR' || currentUser.role === 'MANAGER') &&
    (order.status === 'PENDING_APPROVAL' || order.status === 'FIRST_APPROVED');

  const roleLabel: Record<string, string> = {
    INSPECTOR: '质检员',
    SUPERVISOR: '主管',
    MANAGER: '经理',
  };

  const handleApprove = (level: 1 | 2) => setSignOpen(level);

  const handleSigned = (signData: string) => {
    if (!signOpen) return;
    const res = approveReturnOrderLevel(order.id, signOpen, currentUser, signData);
    setSignOpen(null);
    setToast(res.success ? '审批确认成功' : res.error || '操作失败');
    if (res.success) refreshReturnOrderStatuses();
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setToast('请填写驳回理由');
      return;
    }
    const res = rejectReturnOrder(order.id, currentUser, rejectReason.trim());
    setRejectOpen(false);
    setRejectReason('');
    setToast(res.success ? '已驳回退货单' : res.error || '操作失败');
  };

  return (
    <div className="space-y-5 p-6">
      {toast && (
        <div className="fixed top-20 right-6 z-50 panel px-5 py-3 border-gold-500/50 font-mono text-sm text-gold-400 shadow-gold-glow">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/approvals')}
            className="btn-hard-ghost !px-3 !py-2"
            title={t('common.back')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-2xl font-bold text-ink-100 tracking-wide">
                退货单 {order.returnNo}
              </h1>
              <span className={`data-chip ${meta.color} border-transparent`}>{meta.label}</span>
            </div>
            <p className="text-sm text-ink-400 mt-0.5">
              批次 {order.batchNo} · {order.supplierName}
            </p>
          </div>
        </div>
      </div>

      {locked && <LockBanner order={order} />}

      {order.rejectReason && (
        <div className="bg-ink-700/30 border border-saffron-600/40 p-4">
          <div className="flex items-center gap-2 text-saffron-400 font-mono text-sm font-semibold mb-1">
            <ShieldX className="w-4 h-4" />
            {t('approval.rejected_reason')}
          </div>
          <p className="text-ink-300 text-sm">{order.rejectReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="panel p-5">
            <div className="panel-header -mx-5 -mt-5 mb-4">
              <div className="panel-title flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-saffron-500" />
                等级变化与色差数据
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-ink-900/60 border border-ink-700 p-4 text-center">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-2">原等级</div>
                <div className="data-chip bg-ink-700 border-ink-600 text-ink-100 font-bold text-xl px-4 py-2 mx-auto inline-flex">
                  {order.originalGrade}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center text-ink-500">
                  <TrendingDown className="w-6 h-6 text-saffron-500" />
                  <span className="text-[10px] mt-1">降级</span>
                </div>
              </div>
              <div className="bg-ink-900/60 border border-saffron-600/40 p-4 text-center">
                <div className="text-[10px] uppercase tracking-wider text-saffron-400 mb-2">降级后</div>
                <div className="data-chip bg-saffron-700 border-saffron-600 text-white font-bold text-xl px-4 py-2 mx-auto inline-flex">
                  {order.degradedToGrade}
                </div>
              </div>
              <div className="bg-ink-900/60 border border-ink-700 p-4">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-2">
                  超阈比例
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      'led-number text-2xl font-bold',
                      outRatio > 20 ? 'text-saffron-400 text-shadow-red' : 'text-amber-400'
                    )}
                  >
                    {outRatio}
                  </span>
                  <span className="text-ink-500 text-sm">%</span>
                </div>
                <div className="progress-track mt-2">
                  <div
                    className={cn(
                      'progress-bar',
                      outRatio > 20 ? 'bg-saffron-600' : 'bg-amber-500'
                    )}
                    style={{ width: `${Math.min(outRatio, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="bg-ink-900/40 border border-ink-700 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">平均ΔE</div>
                <div
                  className={cn(
                    'led-number text-xl font-bold',
                    order.avgDeltaE > 4 ? 'text-saffron-400' : 'text-amber-400'
                  )}
                >
                  {order.avgDeltaE.toFixed(2)}
                </div>
              </div>
              <div className="bg-ink-900/40 border border-ink-700 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">最大ΔE</div>
                <div
                  className={cn(
                    'led-number text-xl font-bold',
                    order.maxDeltaE > 6 ? 'text-saffron-500' : 'text-ink-200'
                  )}
                >
                  {order.maxDeltaE.toFixed(2)}
                </div>
              </div>
              <div className="bg-ink-900/40 border border-ink-700 p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">超阈 / 总数</div>
                <div className="led-number text-xl font-bold text-ink-200">
                  {order.outOfThresholdCount}
                  <span className="text-ink-500 text-sm mx-1">/</span>
                  {order.totalCount}
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <div className="panel-header -mx-5 -mt-5 mb-4">
              <div className="panel-title flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-500" />
                {t('approval.reason')}
              </div>
            </div>
            <p className="text-ink-200 leading-relaxed text-sm bg-ink-900/40 border border-ink-700 p-4">
              {order.degradationReason}
            </p>

            {batchRecords.length > 0 && (
              <>
                <div className="mt-5 flex items-center gap-2 text-sm font-mono text-ink-300">
                  <AlertTriangle className="w-4 h-4 text-saffron-500" />
                  超阈明细（前10条）
                </div>
                <div className="mt-2 overflow-x-auto border border-ink-700">
                  <table className="w-full text-xs">
                    <thead className="bg-ink-900 text-ink-400">
                      <tr>
                        <th className="px-3 py-2 text-left font-mono font-medium">序号</th>
                        <th className="px-3 py-2 text-left font-mono font-medium">批号</th>
                        <th className="px-3 py-2 text-left font-mono font-medium">等级</th>
                        <th className="px-3 py-2 text-right font-mono font-medium">ΔE</th>
                        <th className="px-3 py-2 text-left font-mono font-medium">质检员</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchRecords.slice(0, 10).map((r) => (
                        <tr key={r.id} className="border-t border-ink-700/50">
                          <td className="px-3 py-2 font-mono text-ink-400">
                            {String(r.serialNumber).padStart(4, '0')}
                          </td>
                          <td className="px-3 py-2 font-mono text-ink-300">{r.supplierLotNo}</td>
                          <td className="px-3 py-2">
                            <span className="data-chip bg-saffron-700/50 border-saffron-600/40 text-saffron-300 text-[10px]">
                              {r.actualGrade}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right led-number text-saffron-400 font-semibold">
                            {r.deltaE.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-ink-400">{r.inspectorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="panel p-5">
            <div className="panel-header -mx-5 -mt-5 mb-4">
              <div className="panel-title flex items-center gap-2">
                <PenLine className="w-5 h-5 text-gold-500" />
                电子签名
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-ink-900/40 border border-ink-700 p-4 text-center min-h-[160px] flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">
                  申请人（质检员）
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {order.applicantSignDataUrl ? (
                    <img src={order.applicantSignDataUrl} alt="sign" className="max-h-16" />
                  ) : (
                    <StampSeal name={order.applicantName} role="QC" />
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-ink-700/60">
                  <div className="text-sm font-mono text-ink-200 font-semibold">
                    {order.applicantName}
                  </div>
                  <div className="text-[10px] text-ink-500 font-mono mt-0.5">
                    {formatDateTime(order.createdAt)}
                  </div>
                </div>
              </div>

              <div className="bg-ink-900/40 border border-ink-700 p-4 text-center min-h-[160px] flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">
                  一级审批（主管）
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {order.approverSignDataUrl ? (
                    <img src={order.approverSignDataUrl} alt="sign" className="max-h-16" />
                  ) : order.approverName ? (
                    <StampSeal name={order.approverName} role="SUPV" />
                  ) : (
                    <div className="text-ink-600 font-mono text-xs">— 待确认 —</div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-ink-700/60">
                  <div className="text-sm font-mono font-semibold">
                    {order.approverName ? (
                      <span className="text-ink-200">{order.approverName}</span>
                    ) : (
                      <span className="text-ink-600">待定</span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-500 font-mono mt-0.5">
                    {order.firstApprovedAt ? formatDateTime(order.firstApprovedAt) : '—'}
                  </div>
                </div>
              </div>

              <div className="bg-ink-900/40 border border-ink-700 p-4 text-center min-h-[160px] flex flex-col">
                <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1">
                  二级审批（经理）
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {order.secondApproverSignDataUrl ? (
                    <img src={order.secondApproverSignDataUrl} alt="sign" className="max-h-16" />
                  ) : order.secondApproverName ? (
                    <StampSeal name={order.secondApproverName} role="MGR" />
                  ) : (
                    <div className="text-ink-600 font-mono text-xs">— 待确认 —</div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-ink-700/60">
                  <div className="text-sm font-mono font-semibold">
                    {order.secondApproverName ? (
                      <span className="text-ink-200">{order.secondApproverName}</span>
                    ) : (
                      <span className="text-ink-600">待定</span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-500 font-mono mt-0.5">
                    {order.finalApprovedAt ? formatDateTime(order.finalApprovedAt) : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="panel p-5">
            <div className="panel-header -mx-5 -mt-5 mb-4">
              <div className="panel-title flex items-center gap-2">
                <History className="w-5 h-5 text-gold-500" />
                审批进度
              </div>
            </div>
            <Timeline order={order} />
          </div>

          <div className="panel p-5">
            <div className="panel-header -mx-5 -mt-5 mb-4">
              <div className="panel-title flex items-center gap-2">
                <User className="w-5 h-5 text-gold-500" />
                当前登录
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center border-2 border-gold-500 bg-ink-800">
                <User className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <div className="font-mono text-ink-100 font-semibold">{currentUser.name}</div>
                <div className="text-xs text-ink-400 font-mono">
                  {currentUser.employeeNo} · {roleLabel[currentUser.role]}
                </div>
              </div>
            </div>
            {order.status === 'LOCKED' || order.status === 'EFFECTIVE' ? (
              <div className="mt-4 text-xs text-ink-500 font-mono text-center py-3 border border-ink-700 bg-ink-900/40">
                <Clock3 className="w-4 h-4 inline mr-1 text-ink-600" />
                当前状态下无可用操作
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {isL1 && (
                  <button
                    onClick={() => handleApprove(1)}
                    className="btn-hard-gold w-full !py-3"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    确认 · 一级审批通过
                  </button>
                )}
                {isL2 && (
                  <button
                    onClick={() => handleApprove(2)}
                    className="btn-hard-primary w-full !py-3"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    确认 · 二级审批通过
                  </button>
                )}
                {canRejectOrder && (
                  <button
                    onClick={() => setRejectOpen(true)}
                    className="btn-hard w-full !py-3 bg-ink-800 text-saffron-400 border border-saffron-600/40 hover:bg-saffron-700/10"
                  >
                    <ShieldX className="w-4 h-4" />
                    {t('common.reject')}
                  </button>
                )}
                {!isL1 && !isL2 && !canRejectOrder && (
                  <div className="text-xs text-ink-500 font-mono text-center py-3 border border-ink-700 bg-ink-900/40">
                    您的角色无权限操作此退货单
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Transition show={!!signOpen}>
        <Dialog as="div" className="relative z-50" onClose={() => setSignOpen(null)}>
          <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="panel w-full max-w-xl p-6">
                <Dialog.Title className="font-serif text-xl font-bold text-ink-100 flex items-center gap-2 mb-5">
                  <PenLine className="w-5 h-5 text-gold-500" />
                  {signOpen === 1 ? '一级审批 · 电子签名' : '二级审批 · 电子签名'}
                </Dialog.Title>
                <SignatureCanvas
                  onConfirm={handleSigned}
                  onCancel={() => setSignOpen(null)}
                />
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition show={rejectOpen}>
        <Dialog as="div" className="relative z-50" onClose={() => setRejectOpen(false)}>
          <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="panel w-full max-w-lg p-6">
                <Dialog.Title className="font-serif text-xl font-bold text-saffron-400 flex items-center gap-2 mb-4">
                  <ShieldX className="w-5 h-5" />
                  驳回退货单
                </Dialog.Title>
                <p className="text-sm text-ink-300 mb-4">
                  驳回后，申请人需根据反馈意见重新评估。
                </p>
                <label className="block text-xs font-mono uppercase tracking-wider text-ink-400 mb-2">
                  {t('approval.rejected_reason')} <span className="text-saffron-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="请详细说明驳回理由..."
                  className="w-full bg-ink-900 border border-ink-700 px-4 py-3 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-saffron-500 resize-none font-mono"
                />
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setRejectOpen(false)}
                    className="btn-hard-ghost !px-4 !py-2"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleConfirmReject}
                    className="btn-hard-danger !px-4 !py-2"
                  >
                    <ShieldX className="w-4 h-4" />
                    确认驳回
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
