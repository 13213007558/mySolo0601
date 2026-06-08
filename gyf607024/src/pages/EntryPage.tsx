import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Sparkles, AlertTriangle, XCircle, Info, Lightbulb } from 'lucide-react';
import { useRecordStore } from '@/store/useRecordStore';
import { validateRecord, validatePhone } from '@/utils/validation';
import { manualSampleData } from '@/data/mockData';
import type { RecordFormData, DataQualityIssue } from '@/types';

const initialForm: RecordFormData = {
  babyName: '',
  phone: '',
  originalCourse: '',
  targetCourse: '',
  reason: '',
  unit: '次',
  hours: '',
  latestNote: '',
  handler: '',
  sourceFile: '手工补录'
};

export default function EntryPage() {
  const navigate = useNavigate();
  const { addRecord, records } = useRecordStore();
  const [form, setForm] = useState<RecordFormData>(initialForm);
  const [isManual, setIsManual] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const issues = useMemo<DataQualityIssue[]>(() => {
    return validateRecord(form, records);
  }, [form, records]);

  const getFieldIssue = (field: string): DataQualityIssue | undefined => {
    return issues.find(i => i.field === field);
  };

  const handleChange = (field: keyof RecordFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const fillSample = () => {
    setForm({ ...manualSampleData });
    setIsManual(true);
    setTouched({
      babyName: true, phone: true, originalCourse: true, targetCourse: true,
      reason: true, unit: true, hours: true, latestNote: true, handler: true, sourceFile: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(form).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);

    const hasError = issues.some(i => i.severity === 'error');
    if (hasError) return;

    addRecord(form, isManual);
    navigate('/');
  };

  const inputClass = (field: string) => {
    const issue = getFieldIssue(field);
    const showError = touched[field] && issue;
    return `input-field ${showError ? 'input-field-error' : ''}`;
  };

  const renderFieldHint = (field: string) => {
    const issue = getFieldIssue(field);
    if (!touched[field] || !issue) return null;
    const Icon = issue.severity === 'error' ? XCircle : AlertTriangle;
    const colorClass = issue.severity === 'error' ? 'text-danger-red' : 'text-warning-orange';
    return (
      <div className={`flex items-start gap-1 mt-1.5 text-xs ${colorClass}`}>
        <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>{issue.reason}</span>
      </div>
    );
  };

  const hasAnyError = issues.some(i => i.severity === 'error');

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-ink">录入改期</h1>
        <p className="text-sm text-slate-muted mt-1">新建课程改期记录，系统将自动校验数据质量</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-amber-900">提供手工补录样例，可一键填入对比查看补录前后差异</div>
          <div className="text-xs text-amber-700 mt-0.5">点击右侧按钮将填入一份标准的手工补录示例数据</div>
        </div>
        <button
          type="button"
          className="btn-secondary bg-white"
          onClick={fillSample}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          填入手工补录样例
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              宝宝姓名 <span className="text-danger-red">*</span>
            </label>
            <input
              type="text"
              className={inputClass('babyName')}
              placeholder="请输入宝宝姓名"
              value={form.babyName}
              onChange={(e) => handleChange('babyName', e.target.value)}
              onBlur={() => handleBlur('babyName')}
            />
            {renderFieldHint('babyName')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              手机号 <span className="text-danger-red">*</span>
            </label>
            <input
              type="text"
              className={inputClass('phone')}
              placeholder="请输入11位手机号"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              maxLength={11}
            />
            {renderFieldHint('phone')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              原课程 <span className="text-danger-red">*</span>
            </label>
            <input
              type="text"
              className={inputClass('originalCourse')}
              placeholder="如：婴儿游泳启蒙班（周六10:00）"
              value={form.originalCourse}
              onChange={(e) => handleChange('originalCourse', e.target.value)}
              onBlur={() => handleBlur('originalCourse')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              改期课程 <span className="text-danger-red">*</span>
            </label>
            <input
              type="text"
              className={inputClass('targetCourse')}
              placeholder="如：婴儿游泳启蒙班（周日15:00）"
              value={form.targetCourse}
              onChange={(e) => handleChange('targetCourse', e.target.value)}
              onBlur={() => handleBlur('targetCourse')}
            />
            {renderFieldHint('targetCourse')}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-ink mb-1.5">改期原因</label>
            <input
              type="text"
              className="input-field"
              placeholder="请简要说明改期原因"
              value={form.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              课时单位 <span className="text-danger-red">*</span>
            </label>
            <select
              className={inputClass('unit')}
              value={form.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              onBlur={() => handleBlur('unit')}
            >
              <option value="次">次</option>
              <option value="小时">小时</option>
              <option value="节">节</option>
              <option value="课时">课时</option>
            </select>
            {renderFieldHint('unit')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              课时数量 <span className="text-danger-red">*</span>
            </label>
            <input
              type="number"
              className={inputClass('hours')}
              placeholder="请输入课时数量"
              min={0}
              value={form.hours}
              onChange={(e) => handleChange('hours', e.target.value === '' ? '' : Number(e.target.value))}
              onBlur={() => handleBlur('hours')}
            />
            {renderFieldHint('hours')}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">
              处理人 <span className="text-danger-red">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="如：李教练"
              value={form.handler}
              onChange={(e) => handleChange('handler', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-ink mb-1.5">来源文件</label>
            <input
              type="text"
              className="input-field"
              placeholder="如：2024-06-08-海豚改期表.xlsx"
              value={form.sourceFile}
              onChange={(e) => handleChange('sourceFile', e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-ink mb-1.5">最近人工说明</label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="请输入人工备注说明..."
              value={form.latestNote}
              onChange={(e) => handleChange('latestNote', e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-line text-deep-ocean focus:ring-deep-ocean/20"
                checked={isManual}
                onChange={(e) => setIsManual(e.target.checked)}
              />
              <span className="text-sm text-slate-ink">标记为手工补录</span>
            </label>
          </div>
        </div>

        {issues.length > 0 && (
          <div className="bg-slate-paper rounded-lg p-4 border border-slate-line">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-deep-ocean" />
              <span className="text-sm font-medium text-slate-ink">数据质量检测</span>
              <span className="text-xs text-slate-muted">（系统实时检测，提交前需处理所有错误）</span>
            </div>
            <div className="space-y-2">
              {issues.map((issue) => {
                const Icon = issue.severity === 'error' ? XCircle : AlertTriangle;
                const colorClass = issue.severity === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700';
                const label = issue.severity === 'error' ? '错误' : '警告';
                return (
                  <div key={issue.id} className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-sm ${colorClass}`}>
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">[{label}] </span>
                      <span>{issue.reason}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-line">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/')}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={hasAnyError}
          >
            <Save className="w-4 h-4" />
            提交录入
          </button>
        </div>
      </form>
    </div>
  );
}
