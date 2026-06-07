import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, User, Calendar, Phone, Baby,
  Clock, AlertTriangle, RefreshCw,
  Edit3, CheckCircle2, MessageSquarePlus, AlertOctagon,
  ChevronDown, ChevronUp, Pencil,
} from 'lucide-react';
import { useRecordsStore } from '../store/useRecordsStore';
import { StatusPill, SourceChip, ExceptionTag } from '../components/Badges';
import { formatDateTime, roleLabel } from '../utils/format';
import type { ExceptionType } from '../../shared/types';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentRecord, loading, fetchRecord, reviewRecord, addNote, updateRecord } = useRecordsStore();
  const [expandedExceptions, setExpandedExceptions] = useState<Record<string, boolean>>({});
  const [showEdit, setShowEdit] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editForm, setEditForm] = useState<{ newDate: string; latestNote: string; operatorNote: string }>({
    newDate: '', latestNote: '', operatorNote: '' });

  useEffect(() => {
    if (id) fetchRecord(id);
  }, [id, fetchRecord]);

  const rec = currentRecord;

  const toggleExp = (eid: string) => setExpandedExceptions((s) => ({ ...s, [eid]: !s[eid] }));

  const doReview = () => {
    if (!id) return;
    reviewRecord(id, '园长复核通过');
  };

  const doAddNote = async () => {
    if (!id || !noteText.trim()) return;
    await addNote(id, noteText);
    setNoteText('');
    setShowNote(false);
  };

  const openEdit = () => {
    if (rec) setEditForm({ newDate: rec.newDate, latestNote: rec.latestNote, operatorNote: '' });
    setShowEdit(true);
  };

  const doSaveEdit = async () => {
    if (!id) return;
    await updateRecord(
      id,
      { newDate: editForm.newDate, latestNote: editForm.latestNote || undefined } as any,
      { operator: '张护士', operatorRole: 'nurse', note: editForm.operatorNote || '修改记录' },
    );
    setShowEdit(false);
  };

  if (loading && !rec) {
    return <div className="p-10 text-center text-slate2-400">加载中...</div>;
  }

  if (!rec) {
    return (
      <div className="mx-auto max-w-[1440px] px-8 py-8">
        <Link to="/" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />返回对账台
        </Link>
        <div className="mt-8 card p-10 text-center">
          <div className="text-slate2-500">未找到该记录</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-8">
      <div className="mb-5 flex items-center justify-between opacity-0 animate-fadeUp">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-ghost -ml-2">
            <ArrowLeft className="h-4 w-4" />返回对账台
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-teal-700">
                {rec.infantName} · 课程改期详情
              </h1>
              <StatusPill status={rec.status as any} />
              <SourceChip source={rec.dataSource as any} />
            </div>
            <div className="mt-0.5 text-xs text-slate2-500">
              记录编号 {rec.id} · 创建于 {formatDateTime(rec.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={openEdit}>
            <Edit3 className="h-4 w-4" />修改记录
          </button>
          {rec.status !== 'reviewed' && (
            <button className="btn-primary" onClick={doReview}>
              <CheckCircle2 className="h-4 w-4" />复核通过
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-5 opacity-0 animate-fadeUp animate-delay-100">
          <div className="card p-5">
            <h3 className="mb-4 section-title flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-500" />
              变更历史时间线
            </h3>
            <div className="space-y-0">
              {rec.changeHistory.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate2-400">暂无变更记录</div>
              ) : (
                rec.changeHistory.map((h, i) => (
                  <div key={h.id} className="relative pl-7">
                    {i < rec.changeHistory.length - 1 && (
                      <span
                        className="absolute left-[11px] top-5 h-[calc(100%-100%)] w-px bg-gradient-to-b from-teal-500/30 to-teal-500/10 animate-drawLine"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    )}
                    <span
                      className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-teal-400 text-white shadow-sm"
                    >
                      <Pencil className="h-3 w-3" />
                    </span>
                    <div className="rounded-lg border border-teal-500/5 bg-cream-50/50 p-3 transition-all hover:border-teal-500/10 hover:shadow-sm">
                      <div className="mb-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate2-500">{formatDateTime(h.reviewedAt)}</span>
                        <span className="chip">
                          <User className="mr-1 h-3 w-3" />
                          {h.operator} · {roleLabel(h.operatorRole)}
                        </span>
                      </div>
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium text-teal-700">{h.fieldLabel}</span>
                        <span className="text-slate2-400">:</span>
                        <span className="line-through text-slate2-400">{h.oldValue || '-'}</span>
                        <span className="text-slate2-400">→</span>
                        <span className="rounded bg-teal-50 px-1.5 py-0.5 font-medium text-teal-600">
                          {h.newValue}
                        </span>
                      </div>
                      {h.note && (
                        <div className="mt-1 text-xs text-slate2-500">
                          <MessageSquarePlus className="-mt-0.5 mr-1 inline h-3 w-3 text-amber-500" />
                          {h.note}
                        </div>
                      )}
                    </div>
                    <div className="h-3" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-7 space-y-5 opacity-0 animate-fadeUp animate-delay-200">
          <div className="card p-5">
            <h3 className="mb-4 flex items-center gap-2 section-title">
              <Baby className="h-4 w-4 text-teal-500" />
              基础信息
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <InfoRow icon={<Baby className="h-4 w-4 text-teal-400" />} label="婴幼儿姓名" value={rec.infantName} />
              <InfoRow icon={<Calendar className="h-4 w-4 text-teal-400" />} label="月龄" value={`${rec.infantAge} 月龄`} />
              <InfoRow icon={<User className="h-4 w-4 text-teal-400" />} label="监护人" value={rec.guardianName} />
              <InfoRow icon={<Phone className="h-4 w-4 text-teal-400" />} label="联系电话" value={rec.guardianPhone} />
              <InfoRow icon={<FileText className="h-4 w-4 text-teal-400" />} label="课程名称" value={rec.courseName} />
              <InfoRow icon={<Calendar className="h-4 w-4 text-teal-400" />} label="原课程日期" value={rec.originalDate} />
              <InfoRow icon={<Calendar className="h-4 w-4 text-teal-400" />} label="新课程日期" value={rec.newDate} highlight />
              <div>
                <label className="label">来源文件</label>
                <a href={rec.sourceFileUrl || '#'} className="inline-flex items-center gap-1 text-sm text-teal-600 underline-offset-2 hover:text-teal-700 hover:underline">
                  <FileText className="h-4 w-4" />
                  {rec.sourceFile}
                </a>
              </div>
            </div>
            <div className="divider my-5" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="label">处理人</div>
                <div className="flex items-center gap-1.5 text-slate2-700">
                  <User className="h-4 w-4 text-teal-400" />
                  {rec.operator}
                  <span className="ml-1 text-xs text-slate2-400">（{roleLabel(rec.operatorRole)}）</span>
                </div>
              </div>
              <div>
                <div className="label">复核次数</div>
                <div className="font-medium text-slate2-700">{rec.reviewCount} 次</div>
              </div>
              <div>
                <div className="label">最近更新</div>
                <div className="text-slate2-700">{formatDateTime(rec.updatedAt)}</div>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-amber-400/60 bg-amber-50/30 p-5">
            <h3 className="mb-2 flex items-center gap-2 font-serif text-base font-semibold text-amber-700">
              <MessageSquarePlus className="h-4 w-4" />
              最近一次人工说明
            </h3>
            <p className="text-sm leading-relaxed text-slate2-600">
              {rec.latestNote || <span className="italic text-slate2-400">暂无说明</span>}
            </p>
            <div className="mt-3 flex justify-end">
              <button className="btn-ghost text-amber-600 hover:bg-amber-100/60" onClick={() => setShowNote(!showNote)}>
                <MessageSquarePlus className="h-4 w-4" />补充说明
              </button>
            </div>
            {showNote && (
              <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-white p-3">
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="请输入说明内容..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setShowNote(false)}>取消</button>
                  <button className="btn-warning" onClick={doAddNote}>保存说明</button>
                </div>
              </div>
            )}
          </div>

          {rec.exceptions.length > 0 && (
            <div className="card border border-rose-100 p-5">
              <h3 className="mb-3 flex items-center gap-2 section-title text-rose-700">
                <AlertOctagon className="h-4 w-4" />
                异常事件记录
                <span className="ml-auto text-sm font-normal text-rose-500">
                  {rec.exceptions.length} 条
                </span>
              </h3>
              <div className="divider mb-3" />
              <div className="space-y-3">
                {rec.exceptions.map((e) => {
                  const expanded = expandedExceptions[e.id] ?? true;
                  return (
                    <div
                      key={e.id}
                      className="rounded-lg border border-amber-200/80 bg-amber-50/60 transition-all"
                    >
                      <button
                        onClick={() => toggleExp(e.id)}
                        className="flex w-full items-center gap-3 p-3 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ExceptionTag type={e.type as ExceptionType} />
                          <span className="text-sm font-medium text-amber-900">{e.title}</span>
                        </div>
                        <span className="ml-auto text-xs text-slate2-500">{formatDateTime(e.createdAt)}</span>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-slate2-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate2-500" />
                        )}
                      </button>
                      {expanded && (
                        <div className="border-t border-amber-200/60 px-4 pb-4 pt-3 text-sm leading-relaxed">
                          <div className="mb-2">
                            <AlertTriangle className="-mt-0.5 mr-1 inline h-3.5 w-3.5 text-amber-500" />
                            <span className="font-medium text-amber-800">原因：</span>
                            <span className="text-slate2-700">{e.reason}</span>
                          </div>
                          {e.recoveryNote && (
                            <div className="rounded-md bg-white/70 p-2.5">
                              <RefreshCw className="-mt-0.5 mr-1 inline h-3.5 w-3.5 text-teal-500" />
                              <span className="font-medium text-teal-700">恢复说明：</span>
                              <span className="text-slate2-600">{e.recoveryNote}</span>
                            </div>
                          )}
                          {e.operator && (
                            <div className="mt-2 text-xs text-slate2-500">
                              处理人：{e.operator}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-teal-900/40 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-5 animate-fadeUp">
            <h3 className="mb-4 section-title">修改记录</h3>
            <div className="space-y-3">
              <div>
                <label className="label">新课程日期</label>
                <input type="date" className="input-field" value={editForm.newDate}
                  onChange={(e) => setEditForm({ ...editForm, newDate: e.target.value })} />
              </div>
              <div>
                <label className="label">人工说明</label>
                <textarea className="input-field min-h-[80px]" value={editForm.latestNote}
                  onChange={(e) => setEditForm({ ...editForm, latestNote: e.target.value })}
                  placeholder="可选，将覆盖最新说明" />
              </div>
              <div>
                <label className="label">变更说明（将写入历史记录</label>
                <input className="input-field" value={editForm.operatorNote}
                  onChange={(e) => setEditForm({ ...editForm, operatorNote: e.target.value })}
                  placeholder="例如：家长来电调整，课程改至下旬"/>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setShowEdit(false)}>取消</button>
              <button className="btn-primary" onClick={doSaveEdit}>保存修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={`flex items-center gap-1.5 ${highlight ? 'font-medium text-teal-600' : 'text-slate2-700'}`}>
        {icon}
        {value}
      </div>
    </div>
  );
}
