import { useState, useMemo } from 'react';
import { useScheduleStore, statusLabel, identityLabel, materialLabel, photoLabel } from '@/store/useScheduleStore';
import type { Schedule, ScheduleStatus } from '../../shared/types';
import {
  UserRound, Package, ImageIcon, Shield, Calendar, Clock, Puzzle, Wrench,
  AlertTriangle, ScrollText, FileText, Link2, History, CircleCheck, CircleX,
  MessageSquarePlus, PenTool, RotateCcw, Plus, ClipboardCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import NoteEditor from './NoteEditor';
import ManualCorrection from './ManualCorrection';
import StatusChanger from './StatusChanger';

export default function ScheduleDetail() {
  const schedules = useScheduleStore((st) => st.schedules);
  const selectedScheduleId = useScheduleStore((st) => st.selectedScheduleId);
  const s: Schedule | null = useMemo(
    () => schedules.find((x) => x.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId]
  );
  const markPartialSuccess = useScheduleStore((st) => st.markPartialSuccess);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [partialReason, setPartialReason] = useState('');
  const [expandAudit, setExpandAudit] = useState(true);
  const [expandNotes, setExpandNotes] = useState(true);

  if (!s) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-white/40">
        <div className="text-center">
          <ScrollText className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="text-sm">请在左侧选择一条排程</p>
        </div>
      </div>
    );
  }

  const bindStatus =
    s.identityStatus === 'verified' && s.materialStatus === 'complete' && s.photoStatus === 'present'
      ? 'ok'
      : s.identityStatus === 'missing' || s.materialStatus === 'missing'
      ? 'bad'
      : 'warn';

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#151926] to-[#0f1220] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]">
      <div className="border-b border-white/5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] tracking-wide text-white/60">
                {s.id}
              </span>
              {s.isPartialSuccess && (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-300">
                  <Puzzle className="h-3 w-3" /> 部分成功
                </span>
              )}
              {s.status === 'manually_corrected' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] text-teal-300">
                  <Wrench className="h-3 w-3" /> 已人工更正
                </span>
              )}
            </div>
            <h2 className="mt-1.5 text-lg font-semibold text-white">
              {s.childName}
              <span className="ml-1.5 text-sm font-normal text-white/50">（{s.childNickname}）</span>
            </h2>
            <p className="mt-0.5 text-xs text-white/50">{s.trialCourseName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShowStatus(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/70 transition hover:border-white/20 hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 变更状态
            </button>
            <button
              onClick={() => {
                if (partialReason.trim()) {
                  markPartialSuccess(s.id, partialReason.trim());
                  setPartialReason('');
                }
              }}
              disabled={s.isPartialSuccess}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                s.isPartialSuccess
                  ? 'cursor-not-allowed border-orange-500/20 bg-orange-500/5 text-orange-300/60'
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20'
              }`}
              title={s.isPartialSuccess ? '已标记为部分成功' : '将此排程标记为部分成功（如照片缺失等）'}
            >
              <Puzzle className="h-3.5 w-3.5" /> 标记部分成功
            </button>
            <button
              onClick={() => setShowCorrection(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1.5 text-[11px] text-teal-300 transition hover:bg-teal-500/20"
            >
              <Wrench className="h-3.5 w-3.5" /> 人工更正
            </button>
            <button
              onClick={() => setShowNoteEditor(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300 transition hover:bg-amber-500/20"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> 追加备注
            </button>
          </div>
        </div>

        {s.isPartialSuccess && s.partialSuccessReason && (
          <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5 text-[11px] text-orange-200">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <span className="font-semibold">部分成功原因：</span>
                {s.partialSuccessReason}
              </div>
            </div>
          </div>
        )}
        {s.status === 'failed' && s.failureReason && (
          <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-[11px] text-rose-200">
            <div className="flex items-start gap-1.5">
              <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <span className="font-semibold">失败原因：</span>
                {s.failureReason}
              </div>
            </div>
          </div>
        )}
        {s.manualCorrection && (
          <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/5 p-2.5 text-[11px] text-teal-200">
            <div className="flex items-start gap-1.5">
              <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <span className="font-semibold">人工更正：</span>
                由 <b>{s.manualCorrection.correctedBy}</b> 于{' '}
                {s.manualCorrection.correctedAt.replace('T', ' ').slice(0, 19)} 执行
                <br />
                <span className="text-teal-300/80">
                  原状态：{statusLabel[s.manualCorrection.originalStatus]} → 更正说明：{s.manualCorrection.correctionNote}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <section className="mb-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5 text-amber-300" />
            <h3 className="text-xs font-semibold tracking-wide text-white/80">
              身份 · 材料 · 状态 绑定
            </h3>
            <span
              className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                bindStatus === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : bindStatus === 'warn'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-rose-500/15 text-rose-300'
              }`}
            >
              {bindStatus === 'ok' ? (
                <><CircleCheck className="h-3 w-3" /> 绑定完整</>
              ) : bindStatus === 'warn' ? (
                <><AlertTriangle className="h-3 w-3" /> 绑定部分缺失</>
              ) : (
                <><CircleX className="h-3 w-3" /> 绑定严重缺失</>
              )}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <BindCard icon={UserRound} label="身份核验" value={identityLabel[s.identityStatus]} status={s.identityStatus} />
            <BindCard icon={Package} label="材料状态" value={materialLabel[s.materialStatus]} status={s.materialStatus} />
            <BindCard icon={ImageIcon} label="照片状态" value={photoLabel[s.photoStatus]} status={s.photoStatus} />
          </div>
        </section>

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-white/50" />
              <h3 className="text-xs font-semibold text-white/80">排程时间</h3>
            </div>
            <div className="space-y-1 text-[12px] text-white/70">
              <div className="flex justify-between"><span className="text-white/40">试听日期</span><span>{s.scheduledDate}</span></div>
              <div className="flex justify-between"><span className="text-white/40">课程时间</span><span>{s.scheduledTime}</span></div>
              <div className="flex justify-between"><span className="text-white/40">接车时间</span><span>{s.pickUpTime}</span></div>
              <div className="flex justify-between"><span className="text-white/40">送达时间</span><span>{s.dropOffTime}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-white/50" />
              <h3 className="text-xs font-semibold text-white/80">负责顾问</h3>
            </div>
            <div className="space-y-1 text-[12px] text-white/70">
              <div className="flex justify-between"><span className="text-white/40">顾问</span><span>{s.consultant}</span></div>
              <div className="flex justify-between"><span className="text-white/40">当前状态</span><span>{statusLabel[s.status]}</span></div>
              <div className="flex justify-between"><span className="text-white/40">备注条数</span><span>{s.notes.length}</span></div>
              <div className="flex justify-between"><span className="text-white/40">审计记录</span><span>{s.auditLogs.length}</span></div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-sky-300" />
            <h3 className="text-xs font-semibold tracking-wide text-white/80">授权接送人（{s.authorizedPersons.length}）</h3>
          </div>
          <ul className="space-y-2">
            {s.authorizedPersons.map((p) => (
              <li key={p.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-violet-500/30 text-white">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm text-white">{p.name}</div>
                      <div className="text-[10px] text-white/40">{p.relation} · {p.phone} · {p.idCard}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                      p.photoStatus === 'present'
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                        : p.photoStatus === 'missing'
                        ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                        : 'border-rose-500/25 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    <ImageIcon className="h-3 w-3" /> 照片·{photoLabel[p.photoStatus]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-5">
          <button
            onClick={() => setExpandNotes((v) => !v)}
            className="mb-2 flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5 text-amber-300" />
              <h3 className="text-xs font-semibold tracking-wide text-white/80">
                备注历史（{s.notes.length}）· 原承诺不可抹除
              </h3>
            </div>
            {expandNotes ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
          </button>
          {expandNotes && (
            <div className="space-y-2">
              {s.notes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] text-white/40">
                  暂无备注
                </div>
              ) : (
                s.notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="text-white/70">{n.author}</span>
                      <span className="text-white/30">{n.timestamp.replace('T', ' ').slice(0, 19)}</span>
                      {n.isRevision && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                          ✏️ 修订备注
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 text-[12px] text-white/80">{n.content}</div>
                    {n.originalPromise && (
                      <div className="mt-1.5 rounded-md border border-amber-500/20 bg-amber-500/[0.07] p-2 text-[11px] text-amber-200">
                        <span className="font-semibold">⛓️ 原承诺（已锁定保留）：</span>
                        {n.originalPromise}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section>
          <button
            onClick={() => setExpandAudit((v) => !v)}
            className="mb-2 flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-violet-300" />
              <h3 className="text-xs font-semibold tracking-wide text-white/80">
                审计日志（{s.auditLogs.length}）· 异常纳入汇总时可追溯
              </h3>
            </div>
            {expandAudit ? <ChevronUp className="h-3.5 w-3.5 text-white/40" /> : <ChevronDown className="h-3.5 w-3.5 text-white/40" />}
          </button>
          {expandAudit && (
            <ol className="relative ml-3 space-y-3 border-l border-white/10 pl-4">
              {s.auditLogs
                .slice()
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                .map((a) => (
                  <li key={a.id} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-[#12151f] ${
                        a.action === 'manual_correction'
                          ? 'bg-teal-400'
                          : a.action === 'status_change' && a.newValue === 'failed'
                          ? 'bg-rose-400'
                          : a.action === 'partial_success'
                          ? 'bg-orange-400'
                          : a.action === 'photo_missing'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    ></span>
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono text-white/50">{a.timestamp.replace('T', ' ').slice(0, 19)}</span>
                        <span className="text-white/80">{a.operator}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
                          {a.action}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-white/80">{a.details}</div>
                      {a.oldValue && a.newValue && (
                        <div className="mt-1 text-[10px] text-white/40">
                          {a.oldValue} <span className="text-white/30">→</span> {a.newValue}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>

      {showNoteEditor && (
        <NoteEditor scheduleId={s.id} onClose={() => setShowNoteEditor(false)} />
      )}
      {showCorrection && (
        <ManualCorrection scheduleId={s.id} onClose={() => setShowCorrection(false)} />
      )}
      {showStatus && (
        <StatusChanger scheduleId={s.id} current={s.status} onClose={() => setShowStatus(false)} />
      )}
    </div>
  );
}

function BindCard({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  status: string;
}) {
  const ok = status === 'verified' || status === 'complete' || status === 'present';
  const warn = status === 'pending' || status === 'partial';
  return (
    <div
      className={`rounded-xl border p-3 transition ${
        ok
          ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
          : warn
          ? 'border-amber-500/20 bg-amber-500/[0.06]'
          : 'border-rose-500/20 bg-rose-500/[0.06]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">{label}</span>
        <Icon
          className={`h-4 w-4 ${
            ok ? 'text-emerald-300' : warn ? 'text-amber-300' : 'text-rose-300'
          }`}
        />
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}
