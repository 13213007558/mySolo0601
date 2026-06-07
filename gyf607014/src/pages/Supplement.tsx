import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Save, Eye, AlertCircle, CheckCircle2,
  User, Phone, Calendar, FileText, Baby,
} from 'lucide-react';
import { useRecordsStore } from '../store/useRecordsStore';
import { StatusPill } from '../components/Badges';

interface SupplementForm {
  infantName: string;
  infantAge: string;
  guardianName: string;
  guardianPhone: string;
  courseName: string;
  originalDate: string;
  newDate: string;
  sourceFile: string;
  latestNote: string;
}

const emptyForm: SupplementForm = {
  infantName: '', infantAge: '', guardianName: '', guardianPhone: '',
  courseName: '', originalDate: '', newDate: '',
  sourceFile: '手工补录-' + new Date().toISOString().slice(0, 10) + '.xlsx',
  latestNote: '',
};

export default function Supplement() {
  const [form, setForm] = useState<SupplementForm>(emptyForm);
  const { supplementRecord } = useRecordsStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = <K extends keyof SupplementForm>(k: K, v: SupplementForm[K]) =>
    setForm({ ...form, [k]: v });

  const fields = Object.entries(form).filter(([, v]) => v !== '' && v !== null);
  const fieldLabels: Record<string, string> = {
    infantName: '婴幼儿姓名', infantAge: '月龄', guardianName: '监护人',
    guardianPhone: '联系电话', courseName: '课程名称',
    originalDate: '原课程日期', newDate: '新课程日期',
    sourceFile: '来源文件', latestNote: '补录原因说明',
  };

  const canSubmit = useMemo(
    () => !!form.infantName && !!form.courseName && !!form.originalDate && !!form.newDate,
    [form],
  );

  const doSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const rec = await supplementRecord({
      infantName: form.infantName,
      infantAge: Number(form.infantAge) || 0,
      guardianName: form.guardianName,
      guardianPhone: form.guardianPhone,
      courseName: form.courseName,
      originalDate: form.originalDate,
      newDate: form.newDate,
      sourceFile: form.sourceFile,
      latestNote: form.latestNote || '手工补录',
      operator: '张护士',
      operatorRole: 'nurse',
    } as any);
    setSubmitting(false);
    if (rec) {
      setSuccess(true);
      setTimeout(() => navigate(`/records/${rec.id}`), 1200);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-8 py-8">
      <div className="mb-6 flex items-center justify-between opacity-0 animate-fadeUp">
        <div>
          <Link to="/" className="btn-ghost -ml-2">
            <ArrowLeft className="h-4 w-4" />返回对账台
          </Link>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-teal-700">手工补录</h1>
          <p className="mt-1 text-sm text-slate2-500">
            用于补录未走系统流程的改期申请，补录记录将被永久标记来源并纳入对账统计。
          </p>
        </div>
        {success && (
          <div className="flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700 animate-fadeUp">
            <CheckCircle2 className="h-4 w-4" />
            补录成功，即将跳转到详情页...
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 opacity-0 animate-fadeUp animate-delay-100">
          <div className="card p-6">
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <div className="text-xs leading-relaxed text-amber-800">
                补录数据会标记为 <span className="font-medium">「手工补录」</span>
                ，与正常录入数据区分统计。请确保来源文件和补录原因填写完整，以便后续复核追溯。
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <FormField icon={<Baby className="h-4 w-4" />} label="婴幼儿姓名" required warning>
                <input
                  className="input-field-warning"
                  placeholder="例如：林小明"
                  value={form.infantName}
                  onChange={(e) => set('infantName', e.target.value)}
                />
              </FormField>
              <FormField icon={<Calendar className="h-4 w-4" />} label="月龄">
                <input
                  className="input-field-warning"
                  type="number" min="0" max="72"
                  placeholder="例如：24"
                  value={form.infantAge}
                  onChange={(e) => set('infantAge', e.target.value)}
                />
              </FormField>
              <FormField icon={<User className="h-4 w-4" />} label="监护人姓名" warning>
                <input
                  className="input-field-warning"
                  placeholder="例如：林女士"
                  value={form.guardianName}
                  onChange={(e) => set('guardianName', e.target.value)}
                />
              </FormField>
              <FormField icon={<Phone className="h-4 w-4" />} label="联系电话" warning>
                <input
                  className="input-field-warning"
                  placeholder="例如：138****1234"
                  value={form.guardianPhone}
                  onChange={(e) => set('guardianPhone', e.target.value)}
                />
              </FormField>
              <FormField icon={<FileText className="h-4 w-4" />} label="课程名称" required warning className="col-span-2">
                <input
                  className="input-field-warning"
                  placeholder="例如：婴幼儿感官启智课"
                  value={form.courseName}
                  onChange={(e) => set('courseName', e.target.value)}
                />
              </FormField>
              <FormField icon={<Calendar className="h-4 w-4" />} label="原课程日期" required warning>
                <input
                  type="date"
                  className="input-field-warning"
                  value={form.originalDate}
                  onChange={(e) => set('originalDate', e.target.value)}
                />
              </FormField>
              <FormField icon={<Calendar className="h-4 w-4" />} label="新课程日期" required warning>
                <input
                  type="date"
                  className="input-field-warning"
                  value={form.newDate}
                  onChange={(e) => set('newDate', e.target.value)}
                />
              </FormField>
              <FormField icon={<FileText className="h-4 w-4" />} label="来源文件" className="col-span-2">
                <div className="flex gap-2">
                  <input
                    className="input-field-warning flex-1"
                    value={form.sourceFile}
                    onChange={(e) => set('sourceFile', e.target.value)}
                  />
                  <button className="btn-secondary whitespace-nowrap" disabled>
                    <Upload className="h-4 w-4" />上传附件
                  </button>
                </div>
              </FormField>
              <FormField label="补录原因说明" className="col-span-2">
                <textarea
                  className="input-field min-h-[100px]"
                  placeholder="简要说明补录原因，例如：家长通过微信申请改期，未走系统流程，经园长电话确认后手工补录..."
                  value={form.latestNote}
                  onChange={(e) => set('latestNote', e.target.value)}
                />
              </FormField>
            </div>

            <div className="divider my-6" />

            <div className="flex items-center justify-between">
              <div className="text-xs text-slate2-500">
                {fields.length > 0 ? `已填写 ${fields.length} 项字段` : '尚未填写'}
                {!canSubmit && <span className="ml-2 text-amber-600">请填写必填项</span>}
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setForm(emptyForm)}>
                  清空
                </button>
                <button
                  className="btn-primary"
                  disabled={!canSubmit || submitting}
                  onClick={doSubmit}
                >
                  <Save className="h-4 w-4" />
                  {submitting ? '提交中...' : '提交补录'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-5 space-y-5 opacity-0 animate-fadeUp animate-delay-200">
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 section-title">
              <Eye className="h-4 w-4 text-teal-500" />
              差异预览
            </h3>
            <p className="mb-3 text-xs text-slate2-500">
              右侧为系统根据补录字段自动生成的预览，带高亮边框的字段为补录数据。
            </p>

            <div className="rounded-lg border border-amber-200/70 bg-amber-50/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <StatusPill status="supplemented" />
                <span className="text-xs text-slate2-500">补录后状态</span>
              </div>
              <div className="divider mb-3" />
              <div className="space-y-2.5 text-sm">
                {[
                  ['婴幼儿姓名', form.infantName, true],
                  ['月龄', form.infantAge ? form.infantAge + ' 月龄' : '', true],
                  ['监护人', form.guardianName, true],
                  ['联系电话', form.guardianPhone, true],
                  ['课程名称', form.courseName, true],
                  ['原课程日期', form.originalDate, true],
                  ['新课程日期', form.newDate, true],
                  ['来源文件', form.sourceFile, true],
                  ['补录说明', form.latestNote, false],
                ].map(([label, val, warn]) => (
                  <div key={String(label)} className="flex items-start gap-2">
                    <span className="w-24 flex-shrink-0 text-xs text-slate2-500">{label}</span>
                    <span
                      className={`flex-1 rounded px-2 py-0.5 text-sm ${
                        val
                          ? warn
                            ? 'bg-amber-100/70 text-amber-800 border border-amber-200'
                            : 'bg-teal-50 text-teal-700'
                          : 'bg-cream-200 text-slate2-400 italic'
                      }`}
                    >
                      {val || '（待填写）'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-md border border-teal-500/10 bg-cream-50 p-3 text-xs leading-relaxed text-slate2-500">
              <strong className="text-teal-700">提示：</strong>
              提交补录后，该记录将立即出现在对账台首页，标记为「已补录」并纳入统计。
              园长可在详情页查看补录前后的完整差异与处理人信息。
            </div>
          </div>

          <div className="card p-5">
            <h4 className="mb-3 font-serif text-sm font-semibold text-teal-700">样例参考</h4>
            <div className="text-xs text-slate2-500 leading-relaxed">
              <div className="mb-2">已内置 <strong className="text-amber-600">2 条手工补录样例</strong>：</div>
              <ul className="list-disc space-y-1 pl-4">
                <li>赵一诺 · 儿童手工创意课 — 家长通过微信申请，未走系统流程</li>
                <li>郑子轩 · 儿童烘焙体验课 — 前台漏录，园长从家长群聊天补录</li>
              </ul>
              <div className="mt-3">
                可在对账台首页筛选「数据来源 → 手工补录」查看，或点击进入详情查看补录前后差异。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  icon, label, required, warning, children, className = '',
}: {
  icon?: React.ReactNode;
  label: string;
  required?: boolean;
  warning?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={`label ${warning ? 'text-amber-600' : ''}`}>
        {icon}
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}
