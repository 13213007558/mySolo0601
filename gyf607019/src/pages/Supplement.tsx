import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  Baby,
  UserCircle,
  Phone,
  IdCard,
  CalendarDays,
  ShieldAlert,
  ArrowLeftRight,
  Save,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { validatePhone, computeFieldDiffs, desensitizeField, nowDateTime } from '@/utils';
import { RELATIONSHIP_OPTIONS } from '@/data/mockData';
import { FIELD_LABELS, type AuthorizationStatus, type AuthorizationRecord } from '@/types';

export default function Supplement() {
  const navigate = useNavigate();
  const addRecord = useAppStore((s) => s.addRecord);
  const currentUser = useAppStore((s) => s.currentUser);

  const emptyForm = {
    nickname: '',
    babyName: '',
    babyIdCard: '',
    babyBirthDate: '',
    authorizerName: '',
    authorizerIdCard: '',
    authorizerPhone: '',
    relationship: '',
    status: 'pending' as AuthorizationStatus,
    emergencyContact: '',
    remark: '',
    supplementSource: '',
  };

  const [form, setForm] = useState(emptyForm);
  const [showDiff, setShowDiff] = useState(false);
  const [saved, setSaved] = useState<null | { id: string }>(null);

  const phoneValidation = useMemo(() => validatePhone(form.authorizerPhone), [form.authorizerPhone]);

  const originalTemplate = useMemo((): Partial<AuthorizationRecord> => ({
    nickname: '（空）',
    babyName: '（空）',
    babyIdCard: '（空）',
    babyBirthDate: '（空）',
    authorizerName: '（空）',
    authorizerIdCard: '（空）',
    authorizerPhone: '（空）',
    relationship: '（空）',
    status: 'pending',
    emergencyContact: '（空）',
    handledBy: currentUser.id,
    handledByName: currentUser.name,
    isSupplemented: false,
    createdAt: nowDateTime(),
    updatedAt: nowDateTime(),
  }), [currentUser]);

  const diffs = useMemo(() => {
    const filled = {
      ...originalTemplate,
      ...form,
      isSupplemented: true,
    };
    return computeFieldDiffs(originalTemplate, filled);
  }, [form, originalTemplate]);

  const handleSubmit = () => {
    const newRec = addRecord(
      {
        nickname: form.nickname || '（未填写）',
        babyName: form.babyName || '（未填写）',
        babyIdCard: form.babyIdCard,
        babyBirthDate: form.babyBirthDate,
        authorizerName: form.authorizerName || '（未填写）',
        authorizerIdCard: form.authorizerIdCard,
        authorizerPhone: form.authorizerPhone,
        relationship: form.relationship || '（未填写）',
        status: form.status,
        emergencyContact: form.emergencyContact,
        handledBy: currentUser.id,
        handledByName: currentUser.name,
        isSupplemented: true,
        supplementSource: form.supplementSource || '手工补录',
        remark: form.remark,
      },
      true,
    );
    setSaved({ id: newRec.id });
    setTimeout(() => setSaved(null), 4000);
  };

  const getInputClass = (fieldName: string) => {
    if (fieldName === 'authorizerPhone') {
      if (!phoneValidation.valid && form.authorizerPhone) return 'border-danger-400 focus:ring-danger-500/30 bg-danger-50/30';
      if (phoneValidation.partialSuccess) return 'border-warning-400 focus:ring-warning-500/30 bg-warning-50/30';
    }
    return 'border-slate-200 focus:ring-medical-500/30 focus:border-medical-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-sc text-2xl font-semibold text-slate-800">手工补录</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-violet-50 text-violet-600 border border-violet-200">
              <Sparkles className="w-3 h-3" />
              人工更正路径
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            离线纸质登记表数据录入，系统自动对比补录前后差异并记录审计
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiff((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showDiff
                ? 'bg-violet-50 border-violet-300 text-violet-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            {showDiff ? '隐藏差异对比' : '查看补录前后差异'}
          </button>
          <button
            onClick={handleSubmit}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-all ${
              saved
                ? 'bg-safety-500 text-white animate-bounce-in'
                : 'bg-medical-600 hover:bg-medical-700 text-white'
            }`}
          >
            {saved ? <CheckCircle2 className="w-4 h-4" /> : <FilePlus2 className="w-4 h-4" />}
            {saved ? '补录成功 ✓' : '提交补录'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="mb-5 bg-safety-50 border border-safety-200 rounded-xl p-4 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-safety-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-safety-700 mb-1">补录成功！</p>
              <p className="text-sm text-safety-600/80">
                已记录为手工补录，补录来源和字段差异均已写入历史记录。
                <button
                  onClick={() => navigate(`/record/${saved.id}`)}
                  className="ml-2 underline hover:no-underline"
                >
                  查看详情 →
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-600" />
              补录来源信息
            </h2>
            <div className="space-y-3">
              <FormField label="补录来源说明" icon={FileText} required full>
                <input
                  type="text"
                  value={form.supplementSource}
                  onChange={(e) => setForm({ ...form, supplementSource: e.target.value })}
                  placeholder="如：6月7日上午纸质登记表、家长电话口述等"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass('supplementSource')}`}
                />
              </FormField>
              <FormField label="复核备注" icon={FileText} full>
                <textarea
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                  rows={2}
                  placeholder="补录特殊情况说明"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all resize-none ${getInputClass('remark')}`}
                />
              </FormField>
            </div>
          </div>

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
                  placeholder="如：安安、乐乐、淼淼"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass('nickname')}`}
                />
              </FormField>
              <FormField label="婴幼儿姓名" icon={UserCircle} required>
                <input
                  type="text"
                  value={form.babyName}
                  onChange={(e) => setForm({ ...form, babyName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass('babyName')}`}
                />
              </FormField>
              <FormField label="身份证号" icon={IdCard} sensitive>
                <input
                  type="text"
                  value={form.babyIdCard}
                  onChange={(e) => setForm({ ...form, babyIdCard: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none transition-all ${getInputClass('babyIdCard')}`}
                />
              </FormField>
              <FormField label="出生日期" icon={CalendarDays}>
                <input
                  type="date"
                  value={form.babyBirthDate}
                  onChange={(e) => setForm({ ...form, babyBirthDate: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass('babyBirthDate')}`}
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
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass('authorizerName')}`}
                />
              </FormField>
              <FormField label="与婴幼儿关系" icon={UserCircle}>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none transition-all ${getInputClass('relationship')}`}
                >
                  <option value="">请选择</option>
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="身份证号" icon={IdCard} sensitive>
                <input
                  type="text"
                  value={form.authorizerIdCard}
                  onChange={(e) => setForm({ ...form, authorizerIdCard: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none transition-all ${getInputClass('authorizerIdCard')}`}
                />
              </FormField>
              <FormField
                label="联系手机号"
                icon={Phone}
                sensitive
                hint={
                  form.authorizerPhone
                    ? phoneValidation.valid
                      ? phoneValidation.partialSuccess
                        ? { type: 'warning', text: '格式已自动校正（部分成功）' }
                        : { type: 'success', text: '格式正确' }
                      : { type: 'error', text: '格式无效' }
                    : undefined
                }
              >
                <input
                  type="text"
                  value={form.authorizerPhone}
                  onChange={(e) => setForm({ ...form, authorizerPhone: e.target.value })}
                  placeholder="允许格式混乱，系统自动校正"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none transition-all ${getInputClass('authorizerPhone')}`}
                />
              </FormField>
              <FormField label="紧急联系人" icon={ShieldAlert} sensitive full>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="姓名 + 手机号"
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-all ${getInputClass('emergencyContact')}`}
                />
              </FormField>
            </div>
            {phoneValidation.issues.length > 0 && form.authorizerPhone && (
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
        </div>

        <div className="space-y-5">
          <div className={`rounded-xl border-2 p-5 transition-all ${
            showDiff
              ? 'bg-violet-50/50 border-violet-300 shadow-card-hover'
              : 'bg-slate-50 border-slate-200 shadow-card'
          }`}>
            <h2 className="font-serif-sc text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-violet-600" />
              补录前后差异对比
              {showDiff && diffs.length > 0 && (
                <span className="text-xs font-normal text-violet-600 bg-white px-2 py-0.5 rounded-full border border-violet-200">
                  检测到 {diffs.length} 处变更
                </span>
              )}
            </h2>

            {!showDiff ? (
              <div className="text-center py-12 text-slate-400">
                <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">点击上方「查看补录前后差异」对比字段变更</p>
              </div>
            ) : diffs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">尚未填写内容，暂无可对比的差异</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[600px] overflow-auto pr-1">
                <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-500 font-medium px-2 pb-1 border-b border-violet-200">
                  <div className="col-span-3">字段</div>
                  <div className="col-span-4">补录前（空模板）</div>
                  <div className="col-span-4">补录后（新值）</div>
                  <div className="col-span-1 text-center">变更</div>
                </div>
                {diffs.map((d) => (
                  <div key={d.fieldName} className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg bg-white border border-violet-100 text-xs animate-fade-in-up">
                    <div className="col-span-3 font-medium text-slate-700 flex items-center gap-1">
                      {FIELD_LABELS[d.fieldName] || d.fieldName}
                    </div>
                    <div className="col-span-4 font-mono text-slate-400 line-through decoration-danger-300 decoration-1 break-all">
                      {desensitizeField(d.fieldName, d.oldValue) || '（空）'}
                    </div>
                    <div className="col-span-4 font-mono text-safety-700 bg-safety-50 px-2 py-0.5 rounded break-all">
                      {desensitizeField(d.fieldName, d.newValue) || '（空）'}
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="inline-block w-5 h-5 rounded-full bg-safety-500 text-white text-[10px] leading-5">✓</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-medical-50 border border-violet-200 rounded-xl p-4">
            <h3 className="font-serif-sc text-sm font-semibold text-violet-700 mb-2">📌 样例参考</h3>
            <p className="text-xs text-violet-600/80 mb-3">
              系统已内置「淼淼」手工补录样例（ID: rec005），可返回首页查看补录前后的历史记录对比。
            </p>
            <div className="bg-white/70 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">补录来源</span>
                <span className="font-medium text-slate-700">纸质登记表手工补录</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">手机号格式</span>
                <span className="font-medium text-warning-600">+86 136 0013 6003（混乱格式）</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">自动规范化</span>
                <span className="font-medium text-safety-600 font-mono">13600136003</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">处理结果</span>
                <span className="font-medium text-medical-600">部分通过 + 历史留痕</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-serif-sc text-sm font-semibold text-slate-700 mb-2">🔍 店长复盘指引</h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>1. 查看「补录前后差异」确认字段变更正确</li>
              <li>2. 确认手机号等格式混乱字段是否正确规范化</li>
              <li>3. 提交后在详情页检查历史变更记录是否完整</li>
              <li>4. 在审计日志页确认补录操作已被完整记录</li>
            </ul>
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
