import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, Eye, EyeOff, Phone, User, Calendar, Hash } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { IssueCard } from '@/components/IssueCard';
import { StatusBadge } from '@/components/StatusBadge';
import type { InfantRecord, DataIssue } from '@shared/types';
import { validateAll, computeStatus } from '@shared/validation';

const emptyForm: Omit<InfantRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'issues'> = {
  batchNo: '',
  babyName: '',
  gender: '',
  birthDate: '',
  parentPhone: '',
  source: 'supplement',
  parentVisible: {
    feeding: '',
    temperature: '',
    sleep: '',
  },
  internalNotes: '',
};

export function RecordFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const fetchRecord = useAppStore((s) => s.fetchRecord);
  const createRecord = useAppStore((s) => s.createRecord);
  const updateRecord = useAppStore((s) => s.updateRecord);
  const records = useAppStore((s) => s.records);
  const loading = useAppStore((s) => s.loading);

  const existing = useMemo(() => records.find((r) => r.id === id), [records, id]);

  const [form, setForm] = useState(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isEdit && !existing) {
      fetchRecord(id!);
    }
  }, [isEdit, existing, id, fetchRecord]);

  useEffect(() => {
    if (existing) {
      setForm({
        batchNo: existing.batchNo,
        babyName: existing.babyName,
        gender: existing.gender,
        birthDate: existing.birthDate,
        parentPhone: existing.parentPhone,
        source: existing.source,
        parentVisible: { ...existing.parentVisible },
        internalNotes: existing.internalNotes,
      });
    }
  }, [existing]);

  const issues: DataIssue[] = useMemo(() => validateAll(form as Partial<InfantRecord>), [form]);
  const previewStatus = computeStatus(issues);

  const updateField = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateParentVisible = (field: keyof typeof emptyForm.parentVisible, value: string) => {
    setForm((prev) => ({
      ...prev,
      parentVisible: { ...prev.parentVisible, [field]: value },
    }));
  };

  const handleSave = async () => {
    if (isEdit) {
      await updateRecord(id!, form as Partial<InfantRecord>);
    } else {
      const created = await createRecord(form as Partial<InfantRecord>);
      navigate(`/records/${created.id}`);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-night-surface/50 border-b border-night-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded text-night-muted hover:text-night-text hover:bg-night-border/50"
          >
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">{isEdit ? '编辑记录' : '新增临时补充记录'}</h1>
            <p className="text-[11px] text-night-muted mt-0.5">
              所有字段将经过实时数据质量校验，异常不会混入正常记录
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-night-muted">实时校验状态：</span>
            <StatusBadge status={previewStatus} />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-1.5 text-xs rounded bg-accent-amber/90 hover:bg-accent-amber text-night-bg font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={13} />
            {saved ? '已保存' : isEdit ? '保存修改' : '创建记录'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-4 p-6">
          <div className="col-span-8 space-y-4">
            <section className="bg-night-surface/50 border border-night-border rounded-md p-4">
              <h2 className="text-xs font-semibold mb-3 text-night-text flex items-center gap-1.5">
                <Hash size={13} className="text-accent-amber" />
                基础信息
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="批次号" hint="如 BATCH-20260605-A，临时补充可留空">
                  <input
                    value={form.batchNo}
                    onChange={(e) => updateField('batchNo', e.target.value)}
                    className="form-input"
                    placeholder="BATCH-YYYYMMDD-X"
                  />
                </FormField>
                <FormField label="宝宝姓名" required>
                  <div className="relative">
                    <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-night-muted" />
                    <input
                      value={form.babyName}
                      onChange={(e) => updateField('babyName', e.target.value)}
                      className="form-input pl-8"
                      placeholder="请输入宝宝姓名"
                    />
                  </div>
                </FormField>
                <FormField label="性别">
                  <select
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value as InfantRecord['gender'])}
                    className="form-input"
                  >
                    <option value="">请选择</option>
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </FormField>
                <FormField label="出生日期">
                  <div className="relative">
                    <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-night-muted" />
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => updateField('birthDate', e.target.value)}
                      className="form-input pl-8"
                    />
                  </div>
                </FormField>
                <FormField label="家长手机号" required hint="将用于紧急联系，请确保格式正确">
                  <div className="relative">
                    <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-night-muted" />
                    <input
                      value={form.parentPhone}
                      onChange={(e) => updateField('parentPhone', e.target.value)}
                      className="form-input pl-8 font-mono"
                      placeholder="11 位手机号"
                    />
                  </div>
                </FormField>
                <FormField label="数据来源">
                  <select
                    value={form.source}
                    onChange={(e) => updateField('source', e.target.value as InfantRecord['source'])}
                    className="form-input"
                  >
                    <option value="batch">批次记录（正常录入）</option>
                    <option value="supplement">临时补充（夜班补录）</option>
                  </select>
                </FormField>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <section className="bg-night-surface/50 border-2 border-emerald-800/40 rounded-md p-4">
                <h2 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-emerald-400">
                  <Eye size={13} />
                  家长可见内容
                  <span className="ml-1 text-[10px] font-normal text-emerald-500/70">导出给家长时可见</span>
                </h2>
                <div className="space-y-3">
                  <FormField label="喂养记录" area>
                    <textarea
                      rows={3}
                      value={form.parentVisible.feeding}
                      onChange={(e) => updateParentVisible('feeding', e.target.value)}
                      className="form-textarea"
                      placeholder="如：上午 180ml 配方奶，中午半碗小米粥"
                    />
                  </FormField>
                  <FormField label="体温记录" area>
                    <textarea
                      rows={2}
                      value={form.parentVisible.temperature}
                      onChange={(e) => updateParentVisible('temperature', e.target.value)}
                      className="form-textarea"
                      placeholder="入园 / 午检 / 离园体温"
                    />
                  </FormField>
                  <FormField label="睡眠情况" area>
                    <textarea
                      rows={2}
                      value={form.parentVisible.sleep}
                      onChange={(e) => updateParentVisible('sleep', e.target.value)}
                      className="form-textarea"
                      placeholder="午睡时长、是否安稳"
                    />
                  </FormField>
                </div>
              </section>

              <section className="bg-night-surface/50 border-2 border-slate-700/50 rounded-md p-4">
                <h2 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-slate-300">
                  <EyeOff size={13} />
                  内部备注（仅机构可见）
                  <span className="ml-1 text-[10px] font-normal text-slate-500">不会导出给家长</span>
                </h2>
                <div className="space-y-3">
                  <FormField label="特殊情况说明、交接注意事项" area>
                    <textarea
                      rows={11}
                      value={form.internalNotes}
                      onChange={(e) => updateField('internalNotes', e.target.value)}
                      className="form-textarea"
                      placeholder="过敏史、用药情况、特殊护理要求、与家长沟通要点等&#10;&#10;注意：即使是内部备注，也建议避免明文记录身份证号、银行卡号等敏感信息"
                    />
                  </FormField>
                </div>
              </section>
            </div>
          </div>

          <div className="col-span-4">
            <div className="sticky top-4 space-y-4">
              <div className="bg-night-surface/50 border border-night-border rounded-md p-4">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-accent-amber" />
                  实时数据质量报告
                </h3>
                <p className="text-[11px] text-night-muted mb-3">
                  系统对当前表单内容进行实时校验，以下问题会将该条记录标记为异常，不会混入正常统计。
                </p>
                {issues.length === 0 ? (
                  <div className="text-center py-6 text-status-normal text-xs">
                    ✓ 所有字段校验通过
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
                    {issues.map((issue) => (
                      <IssueCard key={issue.id} issue={issue} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  hint,
  required,
  area,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  area?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] text-night-muted mb-1">
        {label}
        {required && <span className="text-status-abnormal ml-0.5">*</span>}
      </label>
      {children}
      {hint && !area && <div className="mt-1 text-[10px] text-night-muted/60">{hint}</div>}
    </div>
  );
}
