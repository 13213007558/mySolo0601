import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Baby, User, Phone, Store, Clock, FileText,
  UserCheck, AlertCircle, History, Shield, FileWarning, Edit3,
} from 'lucide-react';
import { authApi } from '../lib/api.js';
import type { Authorization, AuditLog } from 'shared/types.js';
import { AuthStatusBadge, AuthTypeBadge, MaterialStatusBadge } from '../components/badges.js';
import { cn } from '../lib/utils.js';

export function AuthDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<(Authorization & { audits: AuditLog[] }) | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctForm, setCorrectForm] = useState({ field: '', before: '', after: '', reason: '' });
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    authApi.detail(id).then(setData);
  }, [id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!data) {
    return <div className="p-10 text-slate-400">加载中...</div>;
  }

  const handleSubmitCorrect = async () => {
    if (!correctForm.field || !correctForm.after || !correctForm.reason) {
      setToast({ type: 'error', msg: '请填写完整更正信息' });
      return;
    }
    try {
      await authApi.correct(data.id, {
        beforeData: { [correctForm.field]: correctForm.before },
        afterData: { [correctForm.field]: correctForm.after },
        reason: correctForm.reason,
        operator: '财务主管',
      });
      setToast({ type: 'success', msg: '更正已提交，等待审核' });
      setShowCorrect(false);
      setCorrectForm({ field: '', before: '', after: '', reason: '' });
      const fresh = await authApi.detail(data.id);
      setData(fresh);
    } catch (e: any) {
      setToast({ type: 'error', msg: '提交失败：' + (e?.message ?? '') });
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-sm flex items-center gap-2 animate-count-up ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <Shield size={16} /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button className="btn-secondary !px-2.5 !py-1.5" onClick={() => nav(-1)}>
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 className="text-xl font-serif font-bold text-slate-800 flex items-center gap-2">
            <Baby size={20} className="text-brand-500" />
            {data.babyName}
            <AuthStatusBadge status={data.authStatus} />
            <AuthTypeBadge type={data.authType} />
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">授权编号：{data.id} · 创建于 {new Date(data.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        <div className="flex-1" />
        <button className="btn-primary" onClick={() => setShowCorrect(true)}>
          <Edit3 size={14} />
          人工更正
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="section-title"><User size={16} className="text-brand-500" />基础信息</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <InfoItem icon={Baby} label="婴幼儿姓名" value={data.babyName} />
              <InfoItem icon={User} label="家长姓名" value={data.parentName} />
              <InfoItem icon={Phone} label="家长手机号" value={data.parentPhone} mono />
              <InfoItem icon={Store} label="所属门店" value={data.storeName} />
              <InfoItem icon={Clock} label="出生日期" value={data.babyBirth ?? '未录入'} />
              <InfoItem icon={UserCheck} label="最后操作人" value={data.lastOperator} />
              <InfoItem icon={Clock} label="最后更新" value={new Date(data.updatedAt).toLocaleString('zh-CN')} span />
            </div>
          </div>

          <div className="card p-5">
            <div className="section-title"><UserCheck size={16} className="text-brand-500" />接送人信息</div>
            <div className="space-y-2">
              {data.pickups.map((p, idx) => (
                <div key={p.id} className="border border-slate-200 rounded-lg p-4 hover:border-brand-200 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        {p.name}
                        <span className="text-xs text-slate-500">· {p.relation}</span>
                        {p.isPhoneAuth && (
                          <span className="badge bg-amber-50 text-amber-700 border border-amber-200">电话授权</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{p.phone}</div>
                      {(p.authStart || p.authEnd) && (
                        <div className="text-xs text-slate-400 mt-1">
                          授权有效期：{p.authStart ?? '-'} 至 {p.authEnd ?? '-'}
                        </div>
                      )}
                      {p.remark && (
                        <div className="text-xs text-slate-600 mt-2 bg-slate-50 rounded px-2 py-1.5 border border-slate-100">
                          <FileText size={11} className="inline -mt-0.5 mr-1 text-slate-400" />
                          {p.remark}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">#{idx + 1}</div>
                  </div>
                </div>
              ))}
              {data.pickups.length === 0 && <div className="text-sm text-slate-400">暂无接送人信息</div>}
            </div>
          </div>

          <div className="card p-5">
            <div className="section-title"><FileText size={16} className="text-brand-500" />材料附件</div>
            {data.materials.some(m => m.status === 'missing') && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <FileWarning size={14} />
                存在材料缺页，导出时将标记为部分成功。
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.materials.map(m => (
                <div key={m.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800 truncate">{m.name}</div>
                      <div className="text-xs text-slate-400">
                        {m.uploader} · {new Date(m.uploadedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <MaterialStatusBadge status={m.status} />
                </div>
              ))}
              {data.materials.length === 0 && <div className="text-sm text-slate-400 col-span-2">暂无材料</div>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="section-title"><History size={16} className="text-brand-500" />变更审计链</div>
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />
              {data.audits.map((a, idx) => (
                <div key={a.id} className={cn('relative mb-5 last:mb-0', idx < 2 && 'animate-count-up')}>
                  <div className="timeline-dot absolute -left-[15px] top-1 w-3 h-3 rounded-full bg-brand-500" />
                  <div className="text-xs text-slate-500 font-mono">
                    {new Date(a.timestamp).toLocaleString('zh-CN')}
                  </div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5 flex items-center gap-2">
                    <span>{a.operator}</span>
                    <span className="badge bg-slate-100 text-slate-600 border border-slate-200">{actionLabel(a.action)}</span>
                  </div>
                  {a.field && (
                    <div className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1.5 border border-slate-100">
                      <span className="text-slate-500">字段：</span>
                      <span className="font-mono">{a.field}</span>
                      {a.oldValue && (
                        <>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="text-red-600 line-through">{a.oldValue || '(空)'}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="text-emerald-600">{a.newValue || '(空)'}</span>
                        </>
                      )}
                    </div>
                  )}
                  {a.reason && <div className="text-xs text-slate-500 mt-1">原因：{a.reason}</div>}
                </div>
              ))}
              {data.audits.length === 0 && <div className="text-sm text-slate-400">暂无变更记录</div>}
            </div>
          </div>
        </div>
      </div>

      {showCorrect && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-count-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-serif font-semibold text-slate-800 flex items-center gap-2">
                <Edit3 size={16} className="text-brand-500" />
                人工更正（留痕操作）
              </h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowCorrect(false)}>✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">更正字段</label>
                <select className="input" value={correctForm.field} onChange={(e) => setCorrectForm({ ...correctForm, field: e.target.value })}>
                  <option value="">请选择字段</option>
                  <option value="parentName">家长姓名</option>
                  <option value="parentPhone">家长手机号</option>
                  <option value="babyName">婴幼儿姓名</option>
                  <option value="authStatus">授权状态</option>
                  <option value="pickupName">接送人姓名</option>
                  <option value="pickupPhone">接送人手机号</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">更正前的值</label>
                  <input className="input bg-slate-50" value={correctForm.before} onChange={(e) => setCorrectForm({ ...correctForm, before: e.target.value })} placeholder="留空表示原值为空" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">更正后的值</label>
                  <input className="input" value={correctForm.after} onChange={(e) => setCorrectForm({ ...correctForm, after: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">更正原因 <span className="text-red-500">*</span></label>
                <textarea
                  className="input min-h-[80px]"
                  value={correctForm.reason}
                  onChange={(e) => setCorrectForm({ ...correctForm, reason: e.target.value })}
                  placeholder="请说明更正原因，供财务复盘"
                />
              </div>
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                更正操作将永久留痕，写入审计链，供主管与财务复查。
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowCorrect(false)}>取消</button>
              <button className="btn-primary" onClick={handleSubmitCorrect}>提交更正</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono, span }: { icon: any; label: string; value: string; mono?: boolean; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <Icon size={12} className="text-slate-400" />
        {label}
      </div>
      <div className={cn('text-slate-800 mt-1', mono && 'font-mono text-sm')}>{value || '-'}</div>
    </div>
  );
}

function actionLabel(a: string): string {
  return {
    create: '创建',
    update: '更新',
    revoke: '撤销',
    correct: '人工更正',
    export: '导出',
    phone_auth: '电话授权',
  }[a] ?? a;
}
