import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  User,
  Clock,
  Calendar,
  Phone,
  Hash,
  Baby,
  FileEdit,
  Download,
  UserCheck,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { IssueCard } from '@/components/IssueCard';
import { ExportModal } from '@/components/ExportModal';
import type { AuditLog, InfantRecord } from '@shared/types';

export function RecordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fetchRecord = useAppStore((s) => s.fetchRecord);
  const fetchRecordAuditLogs = useAppStore((s) => s.fetchRecordAuditLogs);
  const reviewRecord = useAppStore((s) => s.reviewRecord);
  const records = useAppStore((s) => s.records);
  const loading = useAppStore((s) => s.loading);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  const record: InfantRecord | undefined = records.find((r) => r.id === id);

  useEffect(() => {
    if (id) {
      fetchRecord(id);
      fetchRecordAuditLogs(id).then(setAuditLogs);
    }
  }, [id, fetchRecord, fetchRecordAuditLogs]);

  const handleReview = async () => {
    if (id) {
      await reviewRecord(id);
    }
  };

  const getActionLabel = (action: AuditLog['action']) => {
    switch (action) {
      case 'create':
        return { label: '创建记录', icon: <FileEdit size={11} />, color: 'text-sky-400 bg-sky-950/50 border-sky-800/50' };
      case 'update':
        return { label: '修改记录', icon: <Pencil size={11} />, color: 'text-amber-400 bg-amber-950/50 border-amber-800/50' };
      case 'review':
        return { label: '复核', icon: <UserCheck size={11} />, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50' };
      case 'export':
        return { label: '导出', icon: <Download size={11} />, color: 'text-purple-400 bg-purple-950/50 border-purple-800/50' };
    }
  };

  if (!record) {
    return (
      <div className="h-full flex items-center justify-center text-night-muted text-xs">
        加载中...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-night-surface/50 border-b border-night-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-1.5 rounded text-night-muted hover:text-night-text hover:bg-night-border/50">
            <ArrowLeft size={14} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold">{record.babyName || '（未命名）'}</h1>
              <StatusBadge status={record.status} />
              {record.source === 'supplement' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/50 text-purple-400 border border-purple-800/50">
                  临时补充
                </span>
              )}
            </div>
            <p className="text-[11px] text-night-muted mt-0.5 font-mono">
              {record.batchNo || '无批次号'} · ID: {record.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="px-3 py-1.5 text-xs rounded border border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50 flex items-center gap-1.5"
          >
            <Download size={12} />
            导出
          </button>
          <button
            onClick={handleReview}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded border border-night-border text-night-muted hover:text-night-text hover:bg-night-border/50 flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 size={12} />
            复核
          </button>
          <button
            onClick={() => navigate(`/records/${id}/edit`)}
            className="px-3 py-1.5 text-xs rounded bg-accent-amber/90 hover:bg-accent-amber text-night-bg font-medium flex items-center gap-1.5"
          >
            <Pencil size={12} />
            编辑
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <section className="bg-night-surface/50 border border-night-border rounded-md">
              <div className="px-4 py-2.5 border-b border-night-border flex items-center gap-1.5">
                <Baby size={13} className="text-accent-amber" />
                <h2 className="text-xs font-semibold">基础信息</h2>
              </div>
              <div className="p-4 grid grid-cols-3 gap-x-6 gap-y-3 text-xs">
                <InfoItem icon={<Hash size={12} />} label="批次号" value={record.batchNo || '—'} mono />
                <InfoItem icon={<User size={12} />} label="宝宝姓名" value={record.babyName || '—'} />
                <InfoItem icon={<User size={12} />} label="性别" value={record.gender === 'male' ? '男' : record.gender === 'female' ? '女' : '—'} />
                <InfoItem icon={<Calendar size={12} />} label="出生日期" value={record.birthDate || '—'} mono />
                <InfoItem icon={<Phone size={12} />} label="家长手机号" value={record.parentPhone || '—'} mono />
                <InfoItem
                  icon={<FileEdit size={12} />}
                  label="数据来源"
                  value={record.source === 'batch' ? '批次记录' : '临时补充'}
                />
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <section className="bg-night-surface/50 border-2 border-emerald-800/40 rounded-md">
                <div className="px-4 py-2.5 border-b border-emerald-800/30 flex items-center gap-1.5">
                  <Eye size={13} className="text-emerald-400" />
                  <h2 className="text-xs font-semibold text-emerald-400">家长可见内容</h2>
                  <span className="ml-auto text-[10px] text-emerald-500/70">导出给家长时可见</span>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <VisibleField label="喂养记录" value={record.parentVisible.feeding} />
                  <VisibleField label="体温" value={record.parentVisible.temperature} />
                  <VisibleField label="睡眠情况" value={record.parentVisible.sleep} />
                </div>
              </section>

              <section className="bg-night-surface/50 border-2 border-slate-700/50 rounded-md">
                <div className="px-4 py-2.5 border-b border-night-border flex items-center gap-1.5">
                  <EyeOff size={13} className="text-slate-400" />
                  <h2 className="text-xs font-semibold text-slate-300">内部备注</h2>
                  <span className="ml-auto text-[10px] text-slate-500">仅机构内部可见</span>
                </div>
                <div className="p-4 text-xs">
                  <VisibleField label="交接备注" value={record.internalNotes} />
                </div>
              </section>
            </div>

            {record.issues.length > 0 && (
              <section className="bg-night-surface/50 border border-status-abnormal/50 rounded-md">
                <div className="px-4 py-2.5 border-b border-status-abnormal/30 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-status-abnormal" />
                  <h2 className="text-xs font-semibold text-status-abnormal">
                    数据质量问题（{record.issues.length} 项）
                  </h2>
                  <span className="ml-auto text-[10px] text-night-muted">
                    以下问题导致该记录被标记为{record.status === 'abnormal' ? '异常' : '待复核'}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {record.issues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="col-span-4 space-y-4">
            <section className="bg-night-surface/50 border border-night-border rounded-md">
              <div className="px-4 py-2.5 border-b border-night-border flex items-center gap-1.5">
                <Clock size={13} className="text-accent-amber" />
                <h2 className="text-xs font-semibold">元信息</h2>
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <MetaRow label="创建人" value={record.createdBy} />
                <MetaRow label="创建时间" value={record.createdAt} mono />
                <MetaRow label="最后修改人" value={record.updatedBy} />
                <MetaRow label="最后修改时间" value={record.updatedAt} mono />
              </div>
            </section>

            <section className="bg-night-surface/50 border border-night-border rounded-md">
              <div className="px-4 py-2.5 border-b border-night-border flex items-center gap-1.5">
                <FileEdit size={13} className="text-accent-amber" />
                <h2 className="text-xs font-semibold">修改历史时间线</h2>
              </div>
              <div className="p-4">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-4 text-night-muted text-[11px]">暂无操作记录</div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[11px] top-1 bottom-1 w-px bg-night-border" />
                    <div className="space-y-4">
                      {auditLogs.map((log) => {
                        const action = getActionLabel(log.action);
                        return (
                          <div key={log.id} className="relative pl-7">
                            <div
                              className={`absolute left-0 top-0.5 w-[22px] h-[22px] rounded-full border flex items-center justify-center ${action.color}`}
                            >
                              {action.icon}
                            </div>
                            <div className="bg-night-bg border border-night-border rounded p-2.5">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${action.color}`}>
                                  {action.label}
                                </span>
                                <span className="text-[10px] text-night-muted font-mono">{log.timestamp}</span>
                              </div>
                              <div className="text-[11px] text-night-text">{log.operator}</div>
                              {log.fieldChanges.length > 0 && (
                                <div className="mt-2 space-y-1 border-t border-night-border/60 pt-2">
                                  {log.fieldChanges.map((fc, i) => (
                                    <div key={i} className="text-[10px]">
                                      <span className="text-night-muted">{fc.field}：</span>
                                      {fc.oldValue ? (
                                        <>
                                          <span className="text-status-abnormal line-through">
                                            {fc.oldValue.slice(0, 30)}
                                          </span>
                                          <span className="text-night-muted mx-1">→</span>
                                        </>
                                      ) : null}
                                      <span className="text-status-normal">{fc.newValue.slice(0, 30) || '(空)'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} recordIds={id ? [id] : []} />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] text-night-muted mb-0.5 flex items-center gap-1">
        <span className="text-night-muted/60">{icon}</span>
        {label}
      </div>
      <div className={`text-night-text ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function VisibleField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-night-muted/70 mb-1">{label}</div>
      <div className="text-night-text leading-relaxed whitespace-pre-wrap min-h-[20px]">
        {value || <span className="text-night-muted/40">—</span>}
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-night-muted">{label}</span>
      <span className={`text-night-text ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
