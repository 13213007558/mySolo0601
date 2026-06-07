import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Baby,
  UserCircle,
  Phone,
  IdCard,
  CalendarDays,
  ShieldAlert,
  FileText,
  RefreshCw,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { useAppStore } from '@/store/useAppStore';
import { validatePhone, computeFieldDiffs, desensitizeField } from '@/utils';
import type { AuthorizationStatus } from '@/types';
import { RELATIONSHIP_OPTIONS } from '@/data/mockData';
import { FIELD_LABELS, STATUS_LABEL } from '@/types';

export default function RecordEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const record = useAppStore((s) => s.getRecordById(id || ''));
  const updateRecord = useAppStore((s) => s.updateRecord);
  const currentUser = useAppStore((s) => s.currentUser);

  const [form, setForm] = useState({
    nickname: record?.nickname || '',
    babyName: record?.babyName || '',
    babyIdCard: record?.babyIdCard || '',
    babyBirthDate: record?.babyBirthDate || '',
    authorizerName: record?.authorizerName || '',
    authorizerIdCard: record?.authorizerIdCard || '',
    authorizerPhone: record?.authorizerPhone || '',
    relationship: record?.relationship || '',
    status: (record?.status || 'pending') as AuthorizationStatus,
    emergencyContact: record?.emergencyContact || '',
    remark: record?.remark || '',
  });
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);
  const [phoneIssues, setPhoneIssues] = useState<string[]>([]);

  const phoneValidation = useMemo(() => validatePhone(form.authorizerPhone), [form.authorizerPhone]);

  const diffs = useMemo(() => {
    if (!record) return [];
    return computeFieldDiffs(record, { ...record, ...form });
  }, [record, form]);

  if (!record) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-16 text-center">
          <div className="text-5xl mb-3">😕</div>
          <p className="text-slate-500 mb-4">未找到该授权记录</p>
          <Link to="/" className="inline-flex items-center gap-2 text-medical-600 hover:text-medical-700">
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    const result = updateRecord(record.id, form, reason || `复核编辑：${currentUser.name}`);
    setPhoneIssues(result.phoneIssues);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  const handleRefreshAndView = () => {
    navigate(`/record/${record.id}`);
  };

  const getInputBorderClass = (fieldName: string) => {
    if (fieldName === 'authorizerPhone') {
      if (!phoneValidation.valid) return 'border-danger-400 focus:ring-danger-500/30 focus:border-danger-500 bg-danger-50/30';
      if (phoneValidation.partialSuccess) return 'border-warning-400 focus:ring-warning-500/30 focus:border-warning-500 bg-warning-50/30';
    }
    return 'border-slate-200 focus:ring-medical-500/30 focus:border-medical-500';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/record/${record.id}`)}
            className="p-2 rounded-lg hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-serif-sc text-2xl font-semibold text-slate-800">复核编辑</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {form.nickname} · {form.babyName} · 当前状态：
            </p>
          </div>
          <StatusBadge status={record.status} size="md" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAndView}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            保存后查看历史
          </button>
          <button
            onClick={handleSubmit}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-lg shadow-sm transition-all ${
              saved
                ? 'bg-safety-500 text-white animate-bounce-in'
                : 'bg-medical-600 hover:bg-medical-700 text-white'
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '已保存 ✓' : '保存复核结果'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-5 bg-safety-50 border border-safety-200 rounded-xl p-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-safety-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-safety-700 mb-1">保存成功！</p>
              <p className="text-sm text-safety-600/80">
                变更已写入历史记录。点击上方「保存后查看历史」可返回详情页查看旧值、处理人和复核时间。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Baby className="w-4 h-4 text-medical-600" />
              婴幼儿信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="昵称" icon={Baby} required>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputBorderClass('nickname')}`}
                  placeholder="如：安安、乐乐"
                />
              </FormField>
              <FormField label="婴幼儿姓名" icon={UserCircle} required>
                <input
                  type="text"
                  value={form.babyName}
                  onChange={(e) => setForm({ ...form, babyName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputBorderClass('babyName')}`}
                />
              </FormField>
              <FormField label="身份证号" icon={IdCard} required sensitive>
                <input
                  type="text"
                  value={form.babyIdCard}
                  onChange={(e) => setForm({ ...form, babyIdCard: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none transition-all ${getInputBorderClass('babyIdCard')}`}
                />
              </FormField>
              <FormField label="出生日期" icon={CalendarDays} required>
                <input
                  type="date"
                  value={form.babyBirthDate}
                  onChange={(e) => setForm({ ...form, babyBirthDate: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputBorderClass('babyBirthDate')}`}
                />
              </FormField>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-medical-600" />
              授权人信息
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="授权人姓名" icon={UserCircle} required>
                <input
                  type="text"
                  value={form.authorizerName}
                  onChange={(e) => setForm({ ...form, authorizerName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputBorderClass('authorizerName')}`}
                />
              </FormField>
              <FormField label="与婴幼儿关系" icon={UserCircle} required>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none transition-all ${getInputBorderClass('relationship')}`}
                >
                  <option value="">请选择关系</option>
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="身份证号" icon={IdCard} required sensitive>
                <input
                  type="text"
                  value={form.authorizerIdCard}
                  onChange={(e) => setForm({ ...form, authorizerIdCard: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none transition-all ${getInputBorderClass('authorizerIdCard')}`}
                />
              </FormField>
              <FormField
                label="联系手机号"
                icon={Phone}
                required
                sensitive
                hint={
                  phoneValidation.valid
                    ? phoneValidation.partialSuccess
                      ? { type: 'warning', text: '格式已自动校正（部分成功）' }
                      : { type: 'success', text: '格式正确' }
                    : { type: 'error', text: '格式无效，请检查' }
                }
              >
                <input
                  type="text"
                  value={form.authorizerPhone}
                  onChange={(e) => setForm({ ...form, authorizerPhone: e.target.value })}
                  placeholder="支持 13800138000 / 138-0013-8000 / +86 138 0013 8000"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none transition-all ${getInputBorderClass('authorizerPhone')}`}
                />
              </FormField>
              <FormField label="紧急联系人" icon={ShieldAlert} sensitive full>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="姓名 + 手机号"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputBorderClass('emergencyContact')}`}
                />
              </FormField>
            </div>
            {phoneValidation.issues.length > 0 && (
              <div className={`mt-4 rounded-lg p-3 border ${
                phoneValidation.valid ? 'bg-warning-50 border-warning-200' : 'bg-danger-50 border-danger-200'
              }`}>
                <p className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${
                  phoneValidation.valid ? 'text-warning-700' : 'text-danger-700'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {phoneValidation.valid ? '手机号格式提示（允许部分成功）' : '手机号格式错误'}
                </p>
                <ul className={`text-xs space-y-0.5 pl-5 list-disc ${
                  phoneValidation.valid ? 'text-warning-600' : 'text-danger-600'
                }`}>
                  {phoneValidation.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-600" />
              复核决策
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <FormField label="授权状态" icon={FileText} required full>
                <div className="flex items-center gap-3">
                  {(['pending', 'approved', 'rejected', 'partial'] as AuthorizationStatus[]).map((s) => (
                    <label
                      key={s}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        form.status === s
                          ? s === 'approved'
                            ? 'bg-safety-50 border-safety-400 text-safety-700 ring-2 ring-safety-500/30'
                            : s === 'rejected'
                            ? 'bg-danger-50 border-danger-400 text-danger-700 ring-2 ring-danger-500/30'
                            : s === 'partial'
                            ? 'bg-medical-50 border-medical-400 text-medical-700 ring-2 ring-medical-500/30'
                            : 'bg-warning-50 border-warning-400 text-warning-700 ring-2 ring-warning-500/30'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        checked={form.status === s}
                        onChange={() => setForm({ ...form, status: s })}
                        className="sr-only"
                      />
                      {s === 'approved' && <CheckCircle2 className="w-4 h-4" />}
                      {s === 'rejected' && <XCircle className="w-4 h-4" />}
                      {s === 'pending' && <AlertTriangle className="w-4 h-4" />}
                      {s === 'partial' && <AlertTriangle className="w-4 h-4" />}
                      <span className="text-sm font-medium">{STATUS_LABEL[s]}</span>
                    </label>
                  ))}
                </div>
              </FormField>
            </div>
            <FormField label="变更说明 / 复核备注" icon={FileText} full>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="请简要描述变更原因（将写入历史记录和审计日志）"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all resize-none ${getInputBorderClass('remark')}`}
              />
            </FormField>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-3">即将变更的字段</h2>
            {diffs.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">暂未检测到变更</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-auto">
                {diffs.map((d) => (
                  <div key={d.fieldName} className="border border-slate-100 rounded-lg p-2.5 text-xs">
                    <p className="font-medium text-slate-700 mb-1.5">{FIELD_LABELS[d.fieldName] || d.fieldName}</p>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5">
                        <span className="text-danger-500 shrink-0">旧:</span>
                        <span className="font-mono text-slate-500 line-through">
                          {desensitizeField(d.fieldName, d.oldValue) || '（空）'}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-safety-600 shrink-0">新:</span>
                        <span className="font-mono text-slate-700">
                          {desensitizeField(d.fieldName, d.newValue) || '（空）'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p>✍️ 处理人：<span className="font-medium text-slate-700">{currentUser.name}</span></p>
              <p>🕐 复核时间：保存后自动记录</p>
              <p>📝 变更记录将永久保存，不可删除</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-danger-50 to-warning-50 border border-warning-200 rounded-xl p-4">
            <h3 className="font-serif-sc text-sm font-semibold text-warning-700 mb-2">📋 演示路径说明</h3>
            <div className="space-y-2.5 text-xs">
              <div className="bg-white/70 rounded-lg p-2.5 border border-danger-200">
                <p className="font-medium text-danger-700 mb-0.5">❌ 失败路径演示</p>
                <p className="text-danger-600/80">输入错误手机号（如"13500135"仅8位），选择"已驳回"，填写"材料缺失"备注后保存</p>
              </div>
              <div className="bg-white/70 rounded-lg p-2.5 border border-medical-200">
                <p className="font-medium text-medical-700 mb-0.5">🔧 人工更正路径演示</p>
                <p className="text-medical-600/80">输入格式混乱手机号（如"+86 138-0013 8000"），选择"部分通过"保存，系统自动规范化</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon: Icon, children, required, sensitive, full, hint }: {
  label: string;
  icon: any;
  children: React.ReactNode;
  required?: boolean;
  sensitive?: boolean;
  full?: boolean;
  hint?: { type: 'success' | 'warning' | 'error'; text: string };
}) {
  return (
    <div className={`${full ? 'col-span-2' : ''}`}>
      <label className="flex items-center gap-1.5 text-slate-600 mb-1.5 text-sm">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span>{label}</span>
        {required && <span className="text-danger-500">*</span>}
        {sensitive && <span className="text-[10px] text-danger-500 bg-danger-50 px-1 py-px rounded">🔒隐私</span>}
      </label>
      {children}
      {hint && (
        <p className={`mt-1 text-xs flex items-center gap-1 ${
          hint.type === 'success' ? 'text-safety-600' : hint.type === 'warning' ? 'text-warning-600' : 'text-danger-600'
        }`}>
          {hint.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
          {hint.type !== 'success' && <AlertTriangle className="w-3 h-3" />}
          {hint.text}
        </p>
      )}
    </div>
  );
}
