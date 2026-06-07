import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  UserCircle,
  MessageSquare,
  Camera,
  AlertTriangle,
  Wrench,
  Shield,
  CheckCircle2,
  Send,
  ZoomIn,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  CorruptedBadge,
  SourceBadge,
  StatusBadge,
} from '@/components/Badges';
import { StatusTimeline } from '@/components/StatusTimeline';
import { formatDateTime } from '@/utils/helpers';
import type { RecordStatus } from '@/types';
import { STATUS_LABEL } from '@/types';

const NEXT_STATUS: Record<RecordStatus, RecordStatus[]> = {
  pending: ['processing', 'rejected', 'cancelled'],
  processing: ['completed', 'rejected', 'cancelled', 'pending'],
  completed: ['pending', 'cancelled'],
  rejected: ['pending'],
  cancelled: ['pending'],
};

export default function HandoverDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const record = useAppStore((s) => s.records.find((r) => r.id === id));
  const updateStatus = useAppStore((s) => s.updateRecordStatus);
  const addNote = useAppStore((s) => s.addNote);
  const addRectification = useAppStore((s) => s.addRectification);
  const reviewRectification = useAppStore((s) => s.reviewRectification);
  const repairCorrupted = useAppStore((s) => s.repairCorrupted);

  const [nextStatus, setNextStatus] = useState<RecordStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');
  const [noteText, setNoteText] = useState('');
  const [rectProblem, setRectProblem] = useState('');
  const [rectMeasure, setRectMeasure] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const availableNext = useMemo(
    () => (record ? NEXT_STATUS[record.currentStatus] : []),
    [record]
  );

  if (!record) {
    return (
      <div className="card text-center text-gray-400 py-16">
        记录不存在或已被删除
        <div className="mt-4">
          <button className="btn-ghost" onClick={() => nav('/handover')}>
            <ArrowLeft size={14} /> 返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <button className="btn-ghost !py-2" onClick={() => nav('/handover')}>
          <ArrowLeft size={14} /> 返回列表
        </button>
        <h2 className="font-display text-xl text-secondary flex items-center gap-2">
          {record.babyName} · {record.courseName}
          <StatusBadge status={record.currentStatus} />
          {record.isCorrupted && <CorruptedBadge />}
          <SourceBadge type={record.sourceType} />
        </h2>
      </div>

      {record.isCorrupted && record.corruptionReason && (
        <div className="rounded-xl2 bg-red-50 border border-red-200 px-5 py-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-700">
              该记录被标记为异常
            </div>
            <div className="text-xs text-red-600 mt-0.5">
              {record.corruptionReason}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="btn-secondary text-xs !py-1.5 !px-3"
                onClick={() => {
                  repairCorrupted(record.id, '护理主管');
                }}
              >
                <Shield size={12} /> 确认无误，解除异常
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h3 className="font-display text-lg text-secondary mb-3">
              基本信息
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <InfoItem label="宝宝姓名" value={record.babyName} />
              <InfoItem label="课程名称" value={record.courseName} />
              <InfoItem
                label="原上课时间"
                value={formatDateTime(record.originalTime)}
              />
              <InfoItem
                label="期望改期时间"
                value={formatDateTime(record.expectedTime)}
              />
              <InfoItem label="提交人" value={record.submitter} />
              <InfoItem label="处理人" value={record.handler || '未分配'} />
              <InfoItem
                label="提交时间"
                value={formatDateTime(record.createdAt)}
              />
              <InfoItem
                label="最近更新"
                value={formatDateTime(record.updatedAt)}
              />
              <div className="col-span-2">
                <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                  <FileText size={12} /> 来源文件
                </div>
                <div className="text-sm text-secondary">
                  {record.sourceFile || '—'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">改期原因</div>
                <div className="text-sm leading-relaxed bg-cream rounded-xl p-3">
                  {record.reason}
                </div>
              </div>
              {record.latestNote && (
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <MessageSquare size={12} /> 最近一次人工说明
                  </div>
                  <div className="text-sm leading-relaxed bg-primary/10 rounded-xl p-3 text-secondary-dark">
                    {record.latestNote}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg text-secondary mb-3">
              <UserCircle size={16} className="inline mr-1" /> 状态时间线
            </h3>
            <StatusTimeline logs={record.statusLogs} />
          </div>

          {record.photos.length > 0 && (
            <div className="card">
              <h3 className="font-display text-lg text-secondary mb-3">
                <Camera size={16} className="inline mr-1" /> 照片说明
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {record.photos.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl overflow-hidden border border-muted"
                  >
                    <div
                      className="relative h-36 bg-cream cursor-pointer"
                      onClick={() => setPreviewPhoto(p.dataUrl)}
                    >
                      <img
                        src={p.dataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-all">
                        <ZoomIn
                          size={20}
                          className="text-white opacity-0 hover:opacity-100"
                        />
                      </div>
                    </div>
                    <div className="px-3 py-2 text-xs text-gray-600 bg-white">
                      {p.description || '（未填写说明）'}
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {formatDateTime(p.uploadedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.rectifications.length > 0 && (
            <div className="card">
              <h3 className="font-display text-lg text-secondary mb-3">
                <Wrench size={16} className="inline mr-1" /> 整改记录
              </h3>
              <div className="space-y-3">
                {record.rectifications.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-muted p-4 bg-cream/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500 text-xs">问题：</span>
                          {r.problem}
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">整改措施：</span>
                          {r.measure}
                        </div>
                        <div className="text-xs text-gray-400">
                          操作人：{r.operator} · {formatDateTime(r.createdAt)}
                        </div>
                      </div>
                      {r.reviewer ? (
                        <span className="badge bg-secondary/20 text-secondary-dark">
                          <CheckCircle2 size={12} />
                          {r.reviewer} 已复核 · {formatDateTime(r.reviewedAt)}
                        </span>
                      ) : (
                        <button
                          className="btn-ghost !py-1.5 !px-3 text-xs"
                          onClick={() =>
                            reviewRectification(record.id, r.id, '护理主管')
                          }
                        >
                          标记已复核
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {record.corruptionLogs.length > 0 && (
            <div className="card">
              <h3 className="font-display text-lg text-secondary mb-3">
                <AlertTriangle size={16} className="inline mr-1 text-red-500" />{' '}
                异常 / 修复日志
              </h3>
              <div className="space-y-2">
                {record.corruptionLogs.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      c.detectedBy === 'manual'
                        ? 'bg-secondary/5 border-secondary/20'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge bg-white border border-muted text-xs">
                        {c.type === 'duplicate_submit'
                          ? '重复提交'
                          : c.type === 'status_rollback'
                            ? '状态回退'
                            : '数据完整性'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {c.detectedBy === 'system' ? '系统检测' : '人工标记'}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1.5 text-gray-700">{c.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card">
            <h3 className="font-display text-lg text-secondary mb-3">
              更新状态
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label-base">下一状态</label>
                <select
                  className="input-base"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as RecordStatus)}
                >
                  <option value="">请选择状态</option>
                  {availableNext.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                  <optgroup label="强制回退（会被标记异常）">
                    {(['pending', 'processing', 'completed'] as const)
                      .filter((s) => !availableNext.includes(s))
                      .map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]} ⚠
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="label-base">变更说明</label>
                <textarea
                  className="input-base min-h-[72px] resize-none"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="请说明变更原因，会记录到时间线和人工说明"
                />
              </div>
              <button
                className="btn-primary w-full"
                disabled={!nextStatus}
                onClick={() => {
                  if (!nextStatus) return;
                  updateStatus(
                    record.id,
                    nextStatus,
                    statusReason || '状态变更',
                    '护理主管'
                  );
                  setNextStatus('');
                  setStatusReason('');
                }}
              >
                <Send size={14} /> 提交状态变更
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-lg text-secondary mb-3">
              添加人工说明
            </h3>
            <textarea
              className="input-base min-h-[80px] resize-none"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="补充处理情况、联系结果等"
            />
            <button
              className="btn-ghost w-full mt-3"
              disabled={!noteText.trim()}
              onClick={() => {
                addNote(record.id, noteText.trim(), '护理主管');
                setNoteText('');
              }}
            >
              <MessageSquare size={14} /> 保存说明
            </button>
          </div>

          <div className="card">
            <h3 className="font-display text-lg text-secondary mb-3">
              新增整改记录
            </h3>
            <div className="space-y-3">
              <input
                className="input-base"
                value={rectProblem}
                onChange={(e) => setRectProblem(e.target.value)}
                placeholder="问题描述"
              />
              <textarea
                className="input-base min-h-[72px] resize-none"
                value={rectMeasure}
                onChange={(e) => setRectMeasure(e.target.value)}
                placeholder="整改措施"
              />
              <button
                className="btn-secondary w-full"
                disabled={!rectProblem.trim() || !rectMeasure.trim()}
                onClick={() => {
                  addRectification(
                    record.id,
                    rectProblem.trim(),
                    rectMeasure.trim(),
                    '护理主管'
                  );
                  setRectProblem('');
                  setRectMeasure('');
                }}
              >
                <Wrench size={14} /> 保存整改记录
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setPreviewPhoto(null)}
        >
          <img
            src={previewPhoto}
            alt=""
            className="max-w-full max-h-full rounded-xl2"
          />
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-secondary mt-0.5">{value}</div>
    </div>
  );
}
