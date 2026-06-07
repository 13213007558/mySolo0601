import { useMemo, useState } from 'react';
import { X, Phone, UserCheck, AlertTriangle, RotateCcw, History, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { usePickupStore, useSupervisor } from '@/store/pickupStore';
import { StatusBadge, TypeBadge } from '@/components/Badges';
import { ACTION_LABEL, ROLE_LABEL, type AuditAction, type PickupRecord } from '@/types';
import { formatTime, shortId } from '@/utils/report';
import { cn } from '@/lib/utils';

const ACTION_ICON: Record<AuditAction, typeof CheckCircle2> = {
  create: CheckCircle2,
  update: CheckCircle2,
  withdraw: XCircle,
  correct: ShieldCheck,
  partial_success: AlertTriangle,
  batch_pick: CheckCircle2,
};

const ACTION_COLOR: Record<AuditAction, string> = {
  create: 'text-night-200',
  update: 'text-pickup-normal',
  withdraw: 'text-pickup-withdrawn',
  correct: 'text-pickup-aunt',
  partial_success: 'text-pickup-exception',
  batch_pick: 'text-pickup-phone',
};

export function DetailDrawer() {
  const selectedId = usePickupStore((s) => s.selectedRecordId);
  const records = usePickupStore((s) => s.records);
  const allAuditLogs = usePickupStore((s) => s.auditLogs);
  const allCorrections = usePickupStore((s) => s.corrections);
  const selectRecord = usePickupStore((s) => s.selectRecord);
  const withdraw = usePickupStore((s) => s.withdrawRecord);
  const supervisor = useSupervisor();

  const record = useMemo(() => records.find((r) => r.id === selectedId), [records, selectedId]);
  const auditLogs = useMemo(
    () => allAuditLogs.filter((a) => a.recordId === selectedId),
    [allAuditLogs, selectedId]
  );
  const corrections = useMemo(
    () => allCorrections.filter((c) => c.recordId === selectedId),
    [allCorrections, selectedId]
  );
  const close = useMemo(() => () => selectRecord(null), [selectRecord]);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');

  if (!record) return null;

  const canWithdraw = record.status === 'picked' || record.status === 'exception';

  const doWithdraw = () => {
    if (!withdrawReason.trim()) return;
    withdraw(record.id, withdrawReason.trim());
    setWithdrawOpen(false);
    setWithdrawReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="relative w-[520px] max-w-full h-full bg-night-800 border-l border-night-600 flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-5 border-b border-night-600">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-semibold text-night-50">{record.babyName}</span>
              <StatusBadge status={record.status} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-night-300 font-mono">{record.className}</span>
              <TypeBadge type={record.pickupType} />
              {record.isBadRow && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border bg-pickup-withdrawn/15 text-pickup-withdrawn border-pickup-withdrawn/40">
                  <AlertTriangle size={10} /> 坏行（已隔离）
                </span>
              )}
            </div>
            <div className="mt-1 text-[10px] text-night-400 font-mono">记录ID: {record.id}</div>
          </div>
          <button onClick={close} className="p-1.5 rounded text-night-300 hover:text-night-50 hover:bg-night-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <section className="p-5 border-b border-night-600/60 space-y-3">
            <div className="text-xs text-night-300 font-mono tracking-wider uppercase">基本信息</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="授权人" value={record.authorizedBy || '—'} />
              <InfoRow label="接走人" value={record.pickupPerson || '—'} />
              <InfoRow label="创建时间" value={formatTime(record.createdAt)} />
              <InfoRow label="更新时间" value={formatTime(record.updatedAt)} />
              {record.pickedAt && <InfoRow label="接走时间" value={formatTime(record.pickedAt)} />}
            </div>
            {record.exceptionReason && (
              <div className="mt-3 p-3 rounded-md bg-pickup-exception/10 border border-pickup-exception/30">
                <div className="text-xs text-pickup-exception font-medium flex items-center gap-1">
                  <AlertTriangle size={12} /> 异常原因
                </div>
                <div className="mt-1 text-sm text-night-100">{record.exceptionReason}</div>
                {record.conflictNote && <div className="mt-1 text-xs text-night-300">冲突：{record.conflictNote}</div>}
              </div>
            )}
            {record.withdrawnReason && (
              <div className="mt-3 p-3 rounded-md bg-pickup-withdrawn/10 border border-pickup-withdrawn/30">
                <div className="text-xs text-pickup-withdrawn font-medium flex items-center gap-1">
                  <XCircle size={12} /> 已撤回
                </div>
                <div className="mt-1 text-sm text-night-100">{record.withdrawnReason}</div>
                <div className="mt-1 text-xs text-night-300">操作人：{record.withdrawnBy} @ {formatTime(record.withdrawnAt!)}</div>
              </div>
            )}
          </section>

          {record.phoneAuth && (
            <section className="p-5 border-b border-night-600/60 space-y-3">
              <div className="text-xs text-pickup-phone font-mono tracking-wider uppercase flex items-center gap-1">
                <Phone size={12} /> 电话授权凭证
              </div>
              <div className="p-3 rounded-md bg-pickup-phone/10 border border-pickup-phone/30 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="来电人" value={record.phoneAuth.callerName} />
                  <InfoRow label="来电号码" value={record.phoneAuth.callerPhone} mono />
                  <InfoRow label="通话时间" value={formatTime(record.phoneAuth.authTime)} />
                  <InfoRow
                    label="身份核验"
                    value={record.phoneAuth.identityVerified ? '通过' : '未通过'}
                    accent={record.phoneAuth.identityVerified ? 'green' : 'red'}
                  />
                </div>
                <div className="pt-2 border-t border-night-600/50">
                  <div className="text-[10px] text-night-300 mb-1">授权内容</div>
                  <div className="text-sm text-night-100">{record.phoneAuth.authContent}</div>
                </div>
              </div>
            </section>
          )}

          {record.tempAunt && (
            <section className="p-5 border-b border-night-600/60 space-y-3">
              <div className="text-xs text-pickup-aunt font-mono tracking-wider uppercase flex items-center gap-1">
                <UserCheck size={12} /> 临时阿姨核验
              </div>
              <div className="p-3 rounded-md bg-pickup-aunt/10 border border-pickup-aunt/30 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="阿姨姓名" value={record.tempAunt.auntName} />
                  <InfoRow label="工号" value={record.tempAunt.auntId} mono />
                  <InfoRow label="核验时间" value={formatTime(record.tempAunt.verifiedAt)} />
                </div>
                <div className="pt-2 border-t border-night-600/50">
                  <div className="text-[10px] text-night-300 mb-1">关系备注</div>
                  <div className="text-sm text-night-100">{record.tempAunt.relationNote}</div>
                </div>
              </div>
            </section>
          )}

          {corrections.length > 0 && (
            <section className="p-5 border-b border-night-600/60 space-y-3">
              <div className="text-xs text-pickup-aunt font-mono tracking-wider uppercase flex items-center gap-1">
                <ShieldCheck size={12} /> 人工更正记录（双轨）
              </div>
              {corrections.map((c) => (
                <div key={c.id} className="p-3 rounded-md bg-pickup-aunt/10 border border-pickup-aunt/30 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-night-300 font-mono">{shortId(c.id)}</span>
                    <span className={c.isReviewed ? 'text-pickup-normal' : 'text-pickup-exception'}>
                      {c.isReviewed ? '主管已复查' : '待主管复查'}
                    </span>
                  </div>
                  <div className="text-sm text-night-100">原因：{c.correctionReason}</div>
                  <div className="text-xs text-night-300">更正人：{c.correctedBy} @ {formatTime(c.correctedAt)}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-night-600/50 text-xs">
                    <div>
                      <div className="text-night-400 mb-1">原记录状态</div>
                      <div className="text-night-100">{c.originalSnapshot.status} / {c.originalSnapshot.pickupPerson || '—'}</div>
                    </div>
                    <div>
                      <div className="text-night-400 mb-1">更正后状态</div>
                      <div className="text-night-100">{c.correctedSnapshot.status} / {c.correctedSnapshot.pickupPerson || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="p-5 space-y-3">
            <div className="text-xs text-night-300 font-mono tracking-wider uppercase flex items-center gap-1">
              <History size={12} /> 授权变更时间线
            </div>
            <ol className="relative border-l border-night-600 ml-2 space-y-4">
              {auditLogs.length === 0 && (
                <li className="text-xs text-night-400 ml-4">暂无变更日志</li>
              )}
              {auditLogs.map((log, idx) => {
                const Icon = ACTION_ICON[log.action];
                return (
                  <li key={log.id} className="ml-4 group">
                    <span
                      className={cn(
                        'absolute -left-[9px] w-4 h-4 rounded-full bg-night-800 border-2 flex items-center justify-center transition-transform group-hover:scale-125',
                        ACTION_COLOR[log.action]
                      )}
                      style={{ borderColor: 'currentColor' }}
                    >
                      <Icon size={10} />
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={cn('text-xs font-medium', ACTION_COLOR[log.action])}>
                        {ACTION_LABEL[log.action]}
                      </span>
                      <span className="text-[10px] text-night-400 font-mono">{formatTime(log.timestamp)}</span>
                    </div>
                    <div className="text-xs text-night-200 mt-0.5">
                      {log.operator}
                      <span className="text-night-400">（{ROLE_LABEL[log.operatorRole]}）</span>
                    </div>
                    {log.fieldChanged && (
                      <div className="text-[11px] text-night-300 mt-0.5 font-mono">
                        {log.fieldChanged}: <span className="text-pickup-withdrawn">{log.oldValue ?? '—'}</span>
                        <span className="text-night-400"> → </span>
                        <span className="text-pickup-normal">{log.newValue ?? '—'}</span>
                      </div>
                    )}
                    {log.reason && (
                      <div className="text-[11px] text-night-300 mt-0.5 italic">"{log.reason}"</div>
                    )}
                    <span className="hidden">{idx}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <div className="p-4 border-t border-night-600 bg-night-800 flex gap-2">
          {canWithdraw && (
            <button
              onClick={() => setWithdrawOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-md border border-pickup-withdrawn/40 text-pickup-withdrawn hover:bg-pickup-withdrawn/10 btn-glow"
            >
              <RotateCcw size={14} /> 撤回本记录（{supervisor.name.slice(0, 4)}）
            </button>
          )}
          <button
            onClick={close}
            className="px-4 py-2 text-sm rounded-md border border-night-500 text-night-200 hover:bg-night-700"
          >
            关闭
          </button>
        </div>

        {withdrawOpen && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-night-700 border border-night-500 rounded-lg p-5 animate-shake">
              <div className="flex items-center gap-2 text-pickup-withdrawn">
                <AlertTriangle size={18} />
                <span className="font-display text-base font-semibold">撤回接送记录</span>
              </div>
              <p className="text-xs text-night-300 mt-2">
                撤回操作不会删除记录，仅将状态标记为"已撤回"。所有操作痕迹将完整保留，供主管复查。
              </p>
              <div className="mt-4">
                <label className="text-xs text-night-300 mb-1 block">
                  撤回原因 <span className="text-pickup-withdrawn">*</span>
                </label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  rows={3}
                  placeholder="请务必填写详细原因，例如：接走人信息有误、家长亲自到场、身份核验发现问题……"
                  className="w-full bg-night-800 border border-night-500 rounded-md px-3 py-2 text-sm text-night-50 placeholder-night-400 focus:outline-none focus:border-pickup-withdrawn/60"
                />
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => { setWithdrawOpen(false); setWithdrawReason(''); }}
                  className="px-3 py-1.5 text-sm rounded-md border border-night-500 text-night-200 hover:bg-night-600"
                >
                  取消
                </button>
                <button
                  disabled={!withdrawReason.trim()}
                  onClick={doWithdraw}
                  className="px-3 py-1.5 text-sm rounded-md bg-pickup-withdrawn text-white hover:bg-pickup-withdrawn/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  确认撤回（保留审计）
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: 'green' | 'red';
}) {
  return (
    <div>
      <div className="text-[10px] text-night-400 font-mono tracking-wide uppercase">{label}</div>
      <div
        className={cn(
          'mt-0.5',
          mono && 'font-mono text-xs',
          accent === 'green' && 'text-pickup-normal',
          accent === 'red' && 'text-pickup-withdrawn',
          !accent && 'text-night-50'
        )}
      >
        {value}
      </div>
    </div>
  );
}

export type { PickupRecord };
