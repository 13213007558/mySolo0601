import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Check,
  XCircle,
  FilePlus,
  AlertTriangle,
  UserX,
  Save,
  X,
  History,
  Eye,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/Badges';
import type { InfantRecord, RecordStatus } from '@/utils/types';
import { formatDateTime, getGenderLabel } from '@/utils/helpers';

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getRecordById,
    getHistoriesByRecordId,
    updateRecord,
    reviewRecord,
    appendMaterial,
    currentUser,
  } = useAppStore();
  const recordsState = useAppStore((s) => s.records);
  const historiesState = useAppStore((s) => s.histories);

  const record = getRecordById(id || '');
  const histories = useMemo(
    () => getHistoriesByRecordId(id || ''),
    [getHistoriesByRecordId, id, historiesState, recordsState],
  );
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<InfantRecord>>({});
  const [editReason, setEditReason] = useState('');
  const [appendContent, setAppendContent] = useState('');
  const [showAppend, setShowAppend] = useState(false);

  if (!record) {
    return (
      <div className="card p-10 text-center text-slate-500">
        未找到该记录
        <div className="mt-3">
          <Link to="/" className="text-brand-700 hover:underline text-sm">返回列表</Link>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      infantName: record.infantName,
      batchNo: record.batchNo,
      gender: record.gender,
      birthDate: record.birthDate,
      parentName: record.parentName,
      phone: record.phone,
      parentVisibleContent: record.parentVisibleContent,
      internalNotes: record.internalNotes,
      originalPromise: record.originalPromise,
    });
    setEditReason('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({});
  };

  const saveEdit = () => {
    if (id && Object.keys(form).length > 0) {
      updateRecord(id, form, editReason || undefined);
    }
    setEditing(false);
    setForm({});
    setEditReason('');
  };

  const doReview = (status: RecordStatus, reason?: string) => {
    if (id) reviewRecord(id, status, reason);
  };

  const doAppend = () => {
    if (!appendContent.trim() || !id) return;
    appendMaterial(id, appendContent.trim());
    setAppendContent('');
    setShowAppend(false);
  };

  const field = <K extends keyof InfantRecord>(k: K, v: InfantRecord[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost">
            <ArrowLeft size={16} /> 返回
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-800">{record.infantName}</span>
              <StatusBadge status={record.status} />
              {record.isBadData && (
                <span className="badge bg-red-100 text-red-700">坏数据隔离</span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              批次号 <span className="font-mono">{record.batchNo}</span> · 创建于{' '}
              {formatDateTime(record.createdAt)} · {record.createdBy}
              {record.lastUpdatedBy && (
                <> · 最后更新于 {formatDateTime(record.updatedAt)} · {record.lastUpdatedBy}</>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button onClick={startEdit} className="btn-secondary">
                <Edit3 size={14} /> 修改记录
              </button>
              {record.status === 'pending' && (
                <button onClick={() => doReview('reviewed', '信息核对无误')} className="btn-primary">
                  <Check size={14} /> 复核通过
                </button>
              )}
              {record.status !== 'closed' && record.status !== 'invalid' && (
                <button
                  onClick={() => doReview('closed', '流程结束')}
                  className="btn-secondary"
                >
                  <XCircle size={14} /> 关闭记录
                </button>
              )}
              <button onClick={() => setShowAppend(true)} className="btn-secondary">
                <FilePlus size={14} /> 追加材料
              </button>
            </>
          ) : (
            <>
              <button onClick={cancelEdit} className="btn-ghost">
                <X size={14} /> 取消
              </button>
              <button onClick={saveEdit} className="btn-primary">
                <Save size={14} /> 保存修改
              </button>
            </>
          )}
        </div>
      </div>

      {(record.badDataReason || record.noHandlerReason) && (
        <div className="space-y-2">
          {record.badDataReason && (
            <div className="card border-red-200 bg-red-50/60 px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-700">坏数据原因</div>
                <div className="text-sm text-slate-700 mt-0.5">{record.badDataReason}</div>
              </div>
            </div>
          )}
          {record.noHandlerReason && (
            <div className="card border-warn-200 bg-warn-50/60 px-4 py-3 flex items-start gap-3">
              <UserX size={18} className="text-warn-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-warn-700">无处理人原因</div>
                <div className="text-sm text-slate-700 mt-0.5">{record.noHandlerReason}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <History size={15} className="text-slate-500" /> 基础信息
            </div>
            {!editing ? (
              <div className="grid grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <div>
                  <div className="text-slate-500 text-xs">批次号</div>
                  <div className="font-mono mt-0.5">{record.batchNo}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">婴幼儿姓名</div>
                  <div className="font-medium mt-0.5">{record.infantName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">性别 / 出生日期</div>
                  <div className="mt-0.5">
                    {getGenderLabel(record.gender)} · {record.birthDate}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">家长姓名</div>
                  <div className="mt-0.5">{record.parentName}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">联系电话</div>
                  <div className="mt-0.5">{record.phone}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs">当前状态</div>
                  <div className="mt-0.5"><StatusBadge status={record.status} /></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">批次号</label>
                  <input className="input" value={form.batchNo || ''} onChange={(e) => field('batchNo', e.target.value)} />
                </div>
                <div>
                  <label className="label">婴幼儿姓名</label>
                  <input className="input" value={form.infantName || ''} onChange={(e) => field('infantName', e.target.value)} />
                </div>
                <div>
                  <label className="label">性别</label>
                  <select className="input" value={form.gender || 'male'} onChange={(e) => field('gender', e.target.value as 'male' | 'female')}>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div>
                  <label className="label">出生日期</label>
                  <input type="date" className="input" value={form.birthDate || ''} onChange={(e) => field('birthDate', e.target.value)} />
                </div>
                <div>
                  <label className="label">家长姓名</label>
                  <input className="input" value={form.parentName || ''} onChange={(e) => field('parentName', e.target.value)} />
                </div>
                <div>
                  <label className="label">联系电话</label>
                  <input className="input" value={form.phone || ''} onChange={(e) => field('phone', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="card border-brand-200 p-5">
            <div className="text-sm font-semibold text-brand-800 mb-3 flex items-center gap-2">
              <Eye size={15} /> 家长可见内容
              <span className="text-xs text-brand-600 font-normal">（此区域内容可对家长展示）</span>
            </div>
            {!editing ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-brand-50/50 rounded p-3 min-h-[60px]">
                {record.parentVisibleContent || <span className="text-slate-400">暂无内容</span>}
              </div>
            ) : (
              <textarea
                rows={3}
                className="input"
                value={form.parentVisibleContent || ''}
                onChange={(e) => field('parentVisibleContent', e.target.value)}
              />
            )}

            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-700 mb-2">原始承诺</div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-amber-50/60 border border-amber-100 rounded p-3 min-h-[50px]">
                {record.originalPromise || <span className="text-slate-400">无</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                首次登记时的承诺内容，不受后续状态变更影响，始终保留。
              </div>
            </div>
          </div>

          <div className="card border-slate-300 p-5">
            <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Shield size={15} className="text-slate-500" /> 内部备注
              <span className="text-xs text-slate-500 font-normal">（仅内部可见，不对家长展示）</span>
            </div>
            {!editing ? (
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded p-3 min-h-[80px]">
                {record.internalNotes || <span className="text-slate-400">暂无备注</span>}
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  className="input"
                  value={form.internalNotes || ''}
                  onChange={(e) => field('internalNotes', e.target.value)}
                  placeholder="家长临时改口、顾问内部沟通等信息都记录在这里"
                />
                <div>
                  <label className="label">修改原因（写入审计日志）</label>
                  <input
                    className="input"
                    placeholder="例如：家长临时改口周末有冲突"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    当前操作人：{currentUser.name} · {currentUser.role === 'principal' ? '园长' : '课程顾问'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {record.appendedMaterials && record.appendedMaterials.length > 0 && (
            <div className="card p-5">
              <div className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FilePlus size={15} className="text-slate-500" /> 追加材料
                {record.status === 'closed' && (
                  <span className="text-xs text-slate-500 font-normal">（已关闭后追加）</span>
                )}
              </div>
              <div className="space-y-3">
                {record.appendedMaterials.map((m) => (
                  <div key={m.id} className="border border-slate-200 rounded p-3">
                    <div className="text-xs text-slate-500 mb-1">
                      {m.operator} 追加于 {formatDateTime(m.appendedAt)}
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <History size={15} className="text-slate-500" /> 变更历史
            </div>
            {histories.length === 0 && (
              <div className="text-sm text-slate-400 text-center py-6">暂无变更记录</div>
            )}
            <ol className="relative border-l border-slate-200 ml-1.5 space-y-5">
              {histories.map((h) => (
                <li key={h.id} className="ml-4">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-brand-600 border-2 border-white ring-2 ring-brand-100" />
                  <div className="text-xs text-slate-500">
                    {h.operator} · {formatDateTime(h.changedAt)}
                  </div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">
                    修改 {h.fieldLabel}
                  </div>
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <div className="text-slate-500">
                      原值：<span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{h.oldValue || '（空）'}</span>
                    </div>
                    <div className="text-slate-500">
                      新值：<span className="text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded">{h.newValue || '（空）'}</span>
                    </div>
                    {h.changeReason && (
                      <div className="text-slate-500 mt-1">原因：{h.changeReason}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {showAppend && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="text-base font-semibold text-slate-800">追加材料</div>
              <button onClick={() => setShowAppend(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <label className="label">材料内容</label>
              <textarea
                rows={4}
                className="input"
                value={appendContent}
                onChange={(e) => setAppendContent(e.target.value)}
                placeholder="记录需要追加的材料内容..."
              />
              <div className="text-xs text-slate-500 mt-2">
                操作人：{currentUser.name} · 追加记录会写入审计日志
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setShowAppend(false)} className="btn-secondary">取消</button>
              <button onClick={doAppend} disabled={!appendContent.trim()} className="btn-primary">确认追加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
