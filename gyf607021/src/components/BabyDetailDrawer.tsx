import {
  X,
  Thermometer,
  FileText,
  Calendar,
  Clock,
  User,
  Phone,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Image,
  Sparkles,
  History,
} from 'lucide-react';
import type {
  Baby,
  MorningCheckRecord,
  ThermometerRawRecord,
  LeaveRequest,
  Appointment,
} from '../types';
import { useStore } from '../store';
import { getStatusBadgeColor, getStatusLabel, getQualityBadgeColor, getQualityLabel } from '../utils';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  baby: Baby | null;
  record: MorningCheckRecord | null;
  thermometerRecords: ThermometerRawRecord[];
  leaveRequests: LeaveRequest[];
  appointments: Appointment[];
}

export default function BabyDetailDrawer({
  open,
  onClose,
  baby,
  record,
  thermometerRecords,
  leaveRequests,
  appointments,
}: Props) {
  const { withdrawRecord, confirmRecord, recheckRecord } = useStore();
  const [withdrawReason, setWithdrawReason] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  if (!open || !baby || !record) return null;

  const handleWithdraw = () => {
    if (!withdrawReason.trim()) return;
    withdrawRecord(record.id, withdrawReason.trim());
    setWithdrawReason('');
    setShowWithdraw(false);
  };

  const leaveTypeMap: Record<string, string> = {
    sick: '病假',
    personal: '事假',
    other: '其他',
  };

  const apptTypeMap: Record<string, string> = {
    morning_check: '晨检',
    review: '复核',
    vaccination: '疫苗',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: baby.avatarColor }}
              >
                {baby.name.slice(0, 1)}
              </div>
              {baby.name}（{baby.nickname}）的晨检详情
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {baby.className} · {baby.gender === 'male' ? '男' : '女'} · {baby.ageMonths}月龄
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          <Section title="基本信息" icon={<User size={16} />}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow label="家长姓名" value={baby.parentName} />
              <InfoRow label="联系电话" value={baby.parentPhone} icon={<Phone size={12} />} />
              <InfoRow label="入托日期" value={baby.joinDate} />
              <InfoRow label="过敏史" value={baby.allergies?.join('、') || '无'} highlight={!!baby.allergies?.length} />
            </div>
          </Section>

          <Section
            title="今日晨检记录"
            icon={<FileText size={16} />}
            right={
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${getStatusBadgeColor(record.status)}`}>
                  {getStatusLabel(record.status)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getQualityBadgeColor(record.dataQuality)}`}>
                  {record.dataQuality === 'dirty' && <AlertTriangle size={11} />}
                  {record.dataQuality === 'normal' && <CheckCircle2 size={11} />}
                  {record.dataQuality === 'empty' && <AlertCircle size={11} />}
                  {getQualityLabel(record.dataQuality)}
                </span>
                {record.isManualSupplement && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-indigo-200 bg-indigo-50 text-indigo-700">
                    <Sparkles size={11} /> 手工补录
                  </span>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <InfoRow
                label="体温"
                value={record.temperature !== undefined ? `${record.temperature.toFixed(1)}℃` : '未记录'}
                highlight={!!record.temperature && (record.temperature >= 37.3 || record.temperature > 42 || record.temperature < 35)}
              />
              <InfoRow label="操作人" value={record.operator} />
              <InfoRow label="确认时间" value={record.confirmedAt || '—'} />
              <InfoRow label="复核人" value={record.reviewedBy || '—'} />
            </div>
            {record.quickNote && (
              <div className="mb-2">
                <div className="text-xs text-gray-400 mb-1">快速备注（早高峰备忘）</div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                  {record.quickNote}
                </div>
              </div>
            )}
            {record.remark && (
              <div>
                <div className="text-xs text-gray-400 mb-1">详细说明</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
                  {record.remark}
                </div>
              </div>
            )}
            {record.dirtyReason && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">脏数据提示</div>
                  <div>{record.dirtyReason}</div>
                </div>
              </div>
            )}

            {record.supplementBeforeSnapshot && (
              <div className="mt-3 border border-indigo-200 rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-3 py-2 text-xs text-indigo-700 font-medium flex items-center gap-1.5">
                  <Sparkles size={13} /> 补录前后差异对比
                </div>
                <div className="grid grid-cols-2 divide-x divide-indigo-100 text-xs">
                  <div className="px-3 py-2 bg-gray-50">
                    <div className="text-gray-400 mb-1">补录前</div>
                    <div className="text-gray-700 space-y-0.5">
                      <div>体温：{record.supplementBeforeSnapshot.temperature?.toFixed(1) || '—'}</div>
                      <div>状态：{getStatusLabel(record.supplementBeforeSnapshot.status || '')}</div>
                      <div>备注：{record.supplementBeforeSnapshot.quickNote || '—'}</div>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-emerald-50">
                    <div className="text-emerald-600 mb-1">补录后</div>
                    <div className="text-emerald-800 space-y-0.5">
                      <div>体温：{record.temperature?.toFixed(1) || '—'}</div>
                      <div>状态：{getStatusLabel(record.status)}</div>
                      <div>备注：{record.quickNote || '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {record.status !== 'withdrawn' && record.status !== 'leave' && (
              <div className="mt-4 flex flex-wrap gap-2">
                {record.status !== 'confirmed' && (
                  <button
                    onClick={() => confirmRecord(record.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm transition"
                  >
                    确认通过
                  </button>
                )}
                {record.status !== 'recheck_required' && (
                  <button
                    onClick={() => recheckRecord(record.id, '需家长接回复查')}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm transition"
                  >
                    标记需复核
                  </button>
                )}
                {record.status === 'confirmed' && !showWithdraw && (
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm transition flex items-center gap-1"
                  >
                    <History size={14} /> 撤回已确认记录
                  </button>
                )}
              </div>
            )}
            {showWithdraw && (
              <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-2">
                <div className="text-sm text-rose-700 font-medium">请填写撤回原因（将进入审计日志）</div>
                <input
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="例如：家长申请撤回，宝宝实际未入园"
                  className="w-full px-3 py-2 rounded-lg border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowWithdraw(false); setWithdrawReason(''); }}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-white"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawReason.trim()}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm transition"
                  >
                    确认撤回并记录审计
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section title="体温枪原始记录" icon={<Thermometer size={16} />}>
            {thermometerRecords.length === 0 ? (
              <EmptyState text="暂无体温枪原始记录" />
            ) : (
              <div className="space-y-2">
                {thermometerRecords.map((t) => (
                  <div key={t.id} className="border border-gray-100 rounded-lg p-3 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      t.temperature >= 37.3 || t.temperature > 42 || t.temperature < 35
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <Thermometer size={18} />
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-gray-800">{t.temperature.toFixed(1)}℃</span>
                        <span className="text-xs text-gray-400">{t.deviceName}</span>
                        <span className="text-xs text-gray-400">设备ID：{t.deviceId}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <Clock size={10} /> {t.measuredAt}
                        {t.operatorName && <span>· 操作人：{t.operatorName}</span>}
                      </div>
                      {t.rawRemark && (
                        <div className="text-xs text-gray-600 mt-1.5 bg-gray-50 px-2 py-1 rounded inline-block">
                          原始备注：{t.rawRemark}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="请假条与照片" icon={<Image size={16} />}>
            {leaveRequests.length === 0 ? (
              <EmptyState text="今日无请假申请" />
            ) : (
              <div className="space-y-3">
                {leaveRequests.map((l) => (
                  <div key={l.id} className="border border-sky-100 bg-sky-50/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-sky-100 text-sky-700 border border-sky-200">
                          {leaveTypeMap[l.leaveType] || l.leaveType}
                        </span>
                        <span className="text-xs text-gray-500">{l.startDate} ~ {l.endDate}</span>
                      </div>
                      <span className={`text-xs ${l.approved ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {l.approved ? '已批准' : '待审批'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">{l.reason}</div>
                    <div className="text-xs text-gray-400 mb-2">
                      提交人：{l.submittedBy} · {l.submittedAt}
                    </div>
                    {l.photoUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {l.photoUrls.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="block group">
                            <img
                              src={url}
                              alt={`请假条照片${idx + 1}`}
                              className="w-full aspect-[4/3] object-cover rounded-lg border border-gray-200 group-hover:ring-2 group-hover:ring-brand-400 transition"
                            />
                            <div className="text-[10px] text-gray-400 mt-1 text-center">请假条照片 {idx + 1}</div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="预约记录" icon={<Calendar size={16} />}>
            {appointments.length === 0 ? (
              <EmptyState text="暂无预约" />
            ) : (
              <div className="space-y-2">
                {appointments.map((a) => (
                  <div key={a.id} className={`border rounded-lg p-3 flex items-center gap-3 ${
                    a.status === 'conflicted' ? 'border-orange-200 bg-orange-50' : 'border-gray-100'
                  }`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      a.status === 'conflicted' ? 'bg-orange-100 text-orange-600'
                      : a.status === 'done' ? 'bg-emerald-100 text-emerald-600'
                      : a.status === 'cancelled' ? 'bg-gray-100 text-gray-500'
                      : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Calendar size={16} />
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{apptTypeMap[a.type] || a.type}</span>
                        <span className="text-xs text-gray-400">{a.scheduledAt}</span>
                        {a.status === 'conflicted' && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                            ⚠ 与预约 {a.conflictWith} 冲突（部分成功策略）
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        创建人：{a.createdBy} · {a.createdAt}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      a.status === 'conflicted' ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : a.status === 'done' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : a.status === 'cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {a.status === 'conflicted' ? '冲突' : a.status === 'booked' ? '已预约' : a.status === 'done' ? '已完成' : '已取消'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <span className="text-brand-500">{icon}</span>
          {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className={`text-sm ${highlight ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
      {text}
    </div>
  );
}
