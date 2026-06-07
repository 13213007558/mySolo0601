import { useMemo, useState } from 'react';
import {
  Wrench,
  AlertOctagon,
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { usePickupStore, useSupervisor } from '@/store/pickupStore';
import { StatusBadge, TypeBadge } from '@/components/Badges';
import type { PickupRecord, PickupStatus, PickupType } from '@/types';
import { formatTime } from '@/utils/report';
import { cn } from '@/lib/utils';

const FAILURE_PATH_STEPS = [
  { title: '识别异常/坏行', desc: '系统自动标记异常或门岗手动标记异常记录；补录材料导入失败会自动进入坏行分组。' },
  { title: '独立隔离不扩散', desc: '异常记录与坏行不会拖垮正常宝宝的统计，也不会进入批量确认。' },
  { title: '负责人介入', desc: '门岗负责人进入本页面，选择目标记录，按"人工更正"开始双轨更正。' },
  { title: '双轨留存 + 主管复查', desc: '原记录完整保留，更正记录带独立编号并进入主管复查队列。' },
];

const CORRECTION_FIELDS: { key: keyof PickupRecord; label: string; type: 'text' | 'select-status' | 'select-type' }[] = [
  { key: 'status', label: '状态', type: 'select-status' },
  { key: 'pickupType', label: '接送类型', type: 'select-type' },
  { key: 'authorizedBy', label: '授权人', type: 'text' },
  { key: 'pickupPerson', label: '接走人', type: 'text' },
  { key: 'babyName', label: '宝宝姓名', type: 'text' },
  { key: 'className', label: '班级', type: 'text' },
  { key: 'exceptionReason', label: '异常原因', type: 'text' },
];

export function CorrectionPage() {
  const records = usePickupStore((s) => s.records);
  const corrections = usePickupStore((s) => s.corrections);
  const createCorrection = usePickupStore((s) => s.createCorrection);
  const markReviewed = usePickupStore((s) => s.markCorrectionReviewed);
  const supervisor = useSupervisor();

  const problemRecords = useMemo(
    () => records.filter((r) => r.status === 'exception' || r.status === 'withdrawn' || r.isBadRow),
    [records]
  );

  const [selectedId, setSelectedId] = useState<string | null>(problemRecords[0]?.id ?? null);
  const selected = problemRecords.find((r) => r.id === selectedId) ?? null;

  const [patch, setPatch] = useState<Partial<PickupRecord>>({});
  const [reason, setReason] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const setField = (k: keyof PickupRecord, v: unknown) => {
    setPatch((p) => ({ ...p, [k]: v as never }));
  };

  const submit = () => {
    if (!selected) return;
    if (Object.keys(patch).length === 0) return;
    if (!reason.trim()) return;
    createCorrection(selected.id, patch, reason.trim());
    setPatch({});
    setReason('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-night-600 bg-night-800/60">
        <div>
          <h1 className="font-display text-xl font-semibold text-night-50 flex items-center gap-2">
            <Wrench size={20} className="text-pickup-aunt" />
            人工更正中心
          </h1>
          <p className="text-xs text-night-300 mt-0.5">
            门岗负责人专用 — 每条更正保留原记录 + 更正记录双轨，进入主管复查流程
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-5">
        <section className="col-span-12 xl:col-span-4 space-y-5">
          <div className="bg-night-700/50 border border-night-600 rounded-lg p-4">
            <h2 className="text-sm font-medium text-night-50 flex items-center gap-2 mb-3">
              <AlertOctagon size={16} className="text-pickup-withdrawn" />
              失败路径复盘（4 步）
            </h2>
            <ol className="space-y-3">
              {FAILURE_PATH_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <button
                    onClick={() => setActiveStep(i)}
                    className={cn(
                      'shrink-0 w-7 h-7 rounded-full border text-xs font-mono flex items-center justify-center transition-colors',
                      activeStep === i
                        ? 'bg-pickup-aunt/20 border-pickup-aunt text-pickup-aunt glow-blue'
                        : 'bg-night-800 border-night-500 text-night-300 hover:border-night-400'
                    )}
                  >
                    {i + 1}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-sm font-medium', activeStep === i ? 'text-night-50' : 'text-night-200')}>
                      {step.title}
                    </div>
                    <div className="text-xs text-night-400 mt-0.5 leading-relaxed">{step.desc}</div>
                  </div>
                  <ChevronRight size={14} className="text-night-500 self-center" />
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-night-700/50 border border-night-600 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-night-600 flex items-center justify-between">
              <h2 className="text-sm font-medium text-night-50 flex items-center gap-2">
                <AlertTriangle size={16} className="text-pickup-exception" />
                异常 / 撤回 / 坏行记录
              </h2>
              <span className="text-xs text-night-300 font-mono">{problemRecords.length} 条</span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {problemRecords.length === 0 ? (
                <div className="p-8 text-center text-night-400 text-sm">暂无需要人工更正的记录</div>
              ) : (
                <ul className="divide-y divide-night-600/50">
                  {problemRecords.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => { setSelectedId(r.id); setPatch({}); setReason(''); }}
                        className={cn(
                          'w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-night-700/50 transition-colors',
                          selectedId === r.id && 'bg-night-600/50'
                        )}
                      >
                        <div className="w-1 self-stretch rounded-full bg-pickup-exception/40" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-night-50">{r.babyName}</span>
                            <StatusBadge status={r.status} />
                            <TypeBadge type={r.pickupType} />
                            {r.isBadRow && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border bg-pickup-withdrawn/15 text-pickup-withdrawn border-pickup-withdrawn/40">
                                <AlertOctagon size={9} /> 坏行
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-[10px] text-night-400 font-mono">{r.id} · {r.className}</div>
                          <div className="mt-1 text-xs text-night-300 line-clamp-1">
                            {r.exceptionReason || r.withdrawnReason || '无备注'}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-8 space-y-5">
          {selected ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-night-700/50 border border-night-600 rounded-lg p-4">
                  <h3 className="text-xs text-night-300 font-mono tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <ClipboardCheck size={12} /> 原记录快照
                  </h3>
                  <div className="space-y-2 text-sm">
                    <Field label="宝宝姓名" value={selected.babyName} />
                    <Field label="班级" value={selected.className} />
                    <div className="flex gap-2"><Field label="状态" value={<StatusBadge status={selected.status} />} /></div>
                    <div className="flex gap-2"><Field label="接送类型" value={<TypeBadge type={selected.pickupType} />} /></div>
                    <Field label="授权人" value={selected.authorizedBy || '—'} />
                    <Field label="接走人" value={selected.pickupPerson || '—'} />
                    {selected.exceptionReason && <Field label="异常原因" value={selected.exceptionReason} accent="amber" />}
                    {selected.withdrawnReason && <Field label="撤回原因" value={selected.withdrawnReason} accent="red" />}
                    {selected.isBadRow && <Field label="坏行" value="是（已隔离）" accent="red" />}
                    <Field label="更新时间" value={formatTime(selected.updatedAt)} mono />
                  </div>
                </div>

                <div className="bg-pickup-aunt/10 border border-pickup-aunt/30 rounded-lg p-4">
                  <h3 className="text-xs text-pickup-aunt font-mono tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Wrench size={12} /> 更正内容（负责人：{supervisor.name}）
                  </h3>
                  <div className="space-y-2.5">
                    {CORRECTION_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="text-[10px] text-night-300 font-mono tracking-wide block mb-1">{f.label}</label>
                        {f.type === 'text' ? (
                          <input
                            value={(patch[f.key] as string) ?? ''}
                            onChange={(e) => setField(f.key, e.target.value)}
                            placeholder={`留空则不修改，原值：${(selected[f.key] as string) || '—'}`}
                            className="w-full bg-night-800 border border-night-500 rounded px-2.5 py-1.5 text-xs text-night-50 placeholder-night-500 focus:outline-none focus:border-pickup-aunt/60"
                          />
                        ) : f.type === 'select-status' ? (
                          <select
                            value={(patch.status as PickupStatus) ?? selected.status}
                            onChange={(e) => setField('status', e.target.value)}
                            className="w-full bg-night-800 border border-night-500 rounded px-2.5 py-1.5 text-xs text-night-50 focus:outline-none focus:border-pickup-aunt/60"
                          >
                            <option value="pending">待接送</option>
                            <option value="picked">已接走</option>
                            <option value="exception">异常</option>
                            <option value="withdrawn">已撤回</option>
                          </select>
                        ) : (
                          <select
                            value={(patch.pickupType as PickupType) ?? selected.pickupType}
                            onChange={(e) => setField('pickupType', e.target.value)}
                            className="w-full bg-night-800 border border-night-500 rounded px-2.5 py-1.5 text-xs text-night-50 focus:outline-none focus:border-pickup-aunt/60"
                          >
                            <option value="normal">正常接送</option>
                            <option value="phone_authorized">电话授权</option>
                            <option value="temp_aunt">临时阿姨</option>
                          </select>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className="text-[10px] text-night-300 font-mono tracking-wide block mb-1">
                        更正原因 <span className="text-pickup-withdrawn">*</span>
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="请详细说明更正原因，将进入主管复查……"
                        className="w-full bg-night-800 border border-night-500 rounded px-2.5 py-1.5 text-xs text-night-50 placeholder-night-500 focus:outline-none focus:border-pickup-aunt/60"
                      />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        onClick={() => { setPatch({}); setReason(''); }}
                        className="px-3 py-1.5 text-xs rounded border border-night-500 text-night-200 hover:bg-night-700"
                      >
                        重置
                      </button>
                      <button
                        onClick={submit}
                        disabled={Object.keys(patch).length === 0 || !reason.trim()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-pickup-aunt text-white hover:bg-pickup-aunt/90 disabled:opacity-40 disabled:cursor-not-allowed btn-glow"
                      >
                        <Save size={12} /> 提交更正（双轨留存）
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {corrections.filter((c) => c.recordId === selected.id).length > 0 && (
                <div className="bg-night-700/50 border border-night-600 rounded-lg p-4">
                  <h3 className="text-xs text-night-300 font-mono tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={12} /> 该记录的历史更正（共 {corrections.filter((c) => c.recordId === selected.id).length} 条）
                  </h3>
                  <div className="space-y-2">
                    {corrections
                      .filter((c) => c.recordId === selected.id)
                      .map((c) => (
                        <div key={c.id} className="bg-night-800/60 border border-night-600 rounded p-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-xs font-mono text-night-300">更正ID：{c.id}</div>
                            <div className="inline-flex items-center gap-1.5">
                              {c.isReviewed ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-pickup-normal/15 text-pickup-normal border border-pickup-normal/40">
                                  <CheckCircle2 size={10} /> 主管已复查
                                </span>
                              ) : (
                                <button
                                  onClick={() => markReviewed(c.id)}
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-pickup-exception/15 text-pickup-exception border border-pickup-exception/40 hover:bg-pickup-exception/25"
                                >
                                  <ShieldCheck size={10} /> 标记主管已复查
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-night-200">
                            <span className="text-night-400">原因：</span>{c.correctionReason}
                          </div>
                          <div className="mt-1 text-[10px] text-night-400 font-mono">
                            {c.correctedBy} @ {formatTime(c.correctedAt)}
                            {c.isReviewed && ` · 复查人 ${c.reviewedBy} @ ${formatTime(c.reviewedAt!)}`}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-night-700/30 border border-dashed border-night-600 rounded-lg p-12 text-center text-night-400 text-sm">
              请从左侧选择一条异常 / 坏行 / 已撤回记录进行人工更正
            </div>
          )}

          {corrections.length > 0 && (
            <div className="bg-night-700/50 border border-night-600 rounded-lg p-4">
              <h3 className="text-xs text-night-300 font-mono tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <ShieldCheck size={12} /> 全量更正记录（{corrections.length}）
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-night-300 border-b border-night-600">
                    <th className="py-2 px-2 font-mono">更正ID</th>
                    <th className="py-2 px-2 font-mono">关联记录</th>
                    <th className="py-2 px-2 font-mono">原因</th>
                    <th className="py-2 px-2 font-mono">更正人</th>
                    <th className="py-2 px-2 font-mono">复查</th>
                  </tr>
                </thead>
                <tbody>
                  {corrections.map((c) => (
                    <tr key={c.id} className="border-b border-night-700/50">
                      <td className="py-2 px-2 font-mono text-night-200">{c.id}</td>
                      <td className="py-2 px-2 font-mono text-night-300">{c.recordId}</td>
                      <td className="py-2 px-2 text-night-200 max-w-sm truncate" title={c.correctionReason}>{c.correctionReason}</td>
                      <td className="py-2 px-2 text-night-200">{c.correctedBy}</td>
                      <td className="py-2 px-2">
                        {c.isReviewed ? (
                          <span className="text-pickup-normal">已复查</span>
                        ) : (
                          <button
                            onClick={() => markReviewed(c.id)}
                            className="text-pickup-exception hover:underline"
                          >待复查</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  accent?: 'amber' | 'red';
}) {
  return (
    <div>
      <div className="text-[10px] text-night-400 font-mono tracking-wide uppercase">{label}</div>
      <div
        className={cn(
          'mt-0.5',
          mono && 'font-mono text-xs',
          accent === 'amber' && 'text-pickup-exception',
          accent === 'red' && 'text-pickup-withdrawn'
        )}
      >
        {value}
      </div>
    </div>
  );
}

export default CorrectionPage;
