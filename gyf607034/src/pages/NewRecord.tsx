import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PlusCircle,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
  CalendarCheck,
  User,
  UserCircle,
  Phone,
} from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';
import { StatusPill } from '../components/StatusPill';
import type { RecordStatus } from '../types';
import { STATUS_LABEL } from '../utils/format';

export function NewRecord() {
  const navigate = useNavigate();
  const { createManualRecord, currentOperator } = useRecordStore();

  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [originalPromiseDate, setOriginalPromiseDate] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [sourceFile, setSourceFile] = useState('');
  const [hasAdditional, setHasAdditional] = useState(true);
  const [additionalNote, setAdditionalNote] = useState('');
  const [newStatusAfterNote, setNewStatusAfterNote] = useState<RecordStatus>(
    'rescheduled',
  );

  const [showSuccess, setShowSuccess] = useState<null | { id: string }>(null);

  const canSubmit =
    childName.trim() &&
    parentName.trim() &&
    parentPhone.trim() &&
    originalPromiseDate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const rec = createManualRecord({
      childName,
      parentName,
      parentPhone,
      originalPromiseDate,
      initialNote: initialNote.trim(),
      sourceFile: sourceFile.trim() || undefined,
      additionalNote: hasAdditional ? additionalNote.trim() : undefined,
      newStatusAfterNote: hasAdditional ? newStatusAfterNote : undefined,
    });
    setShowSuccess({ id: rec.id });
  };

  if (showSuccess) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-5">
          <ArrowLeft className="w-4 h-4" />
          返回追踪台
        </Link>
        <div className="card p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-ink-800 mb-1">
            手工补录完成
          </h3>
          <p className="text-sm text-ink-500 mb-6">
            已为【{childName}】创建完整承诺轨迹，原始承诺与改口备注均已写入时间线。
          </p>
          <div className="bg-paper-100 border border-paper-200 rounded-sm p-4 text-left text-sm space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">录入方式</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 text-[11px] border border-purple-200 font-semibold">
                <Sparkles className="w-3 h-3" />
                手工补录
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">处理人</span>
              <span className="text-ink-700">{currentOperator}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">变更条数</span>
              <span className="text-ink-700">
                {hasAdditional ? 2  : 1} 条（含原始承诺）
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">当前状态</span>
              <StatusPill
                status={hasAdditional ? newStatusAfterNote : 'promised'}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Link to={`/record/${showSuccess.id}`} className="btn btn-primary">
              查看详情
            </Link>
            <Link to="/" className="btn">
              回到追踪台
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-2">
            <ArrowLeft className="w-4 h-4" />
            返回追踪台
          </Link>
          <h2 className="font-serif text-2xl font-semibold text-ink-800 tracking-wide flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-500" />
            手工补录改期记录
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            用于补录未及时录入系统的家长承诺与改口说明。提交后将形成完整可复核的时间线。
          </p>
        </div>
      </div>

      <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-sm flex items-start gap-2 text-sm">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-amber-800 leading-relaxed">
          <strong>示例：</strong>家长昨晚微信临时改口，原定 6 月 7 日的乐高课改到 6 月 14 日。
          先在下方填入原始承诺（系统将自动标记为"原始承诺"不可编辑），再勾选"同步追加改口备注"写入家长的最新说明，
          这样就能看到<strong>补录前后的完整差异</strong>。
        </div>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-6">
        <div>
          <h4 className="font-serif text-sm font-semibold text-ink-700 mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4" />
            家庭成员信息
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                儿童姓名 <span className="text-rust-500">*</span>
              </label>
              <input
                className="input"
                placeholder="例如：林星瑶"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">
                家长姓名 <span className="text-rust-500">*</span>
              </label>
              <div className="relative">
                <UserCircle className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  className="input pl-9"
                  placeholder="例如：林女士"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">
                联系电话 <span className="text-rust-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  className="input pl-9"
                  placeholder="例如：13400006666"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-paper-200">
          <h4 className="font-serif text-sm font-semibold text-ink-700 mb-3 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" />
            原始承诺（将标记为不可编辑）
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                原承诺试听日期 <span className="text-rust-500">*</span>
              </label>
              <input
                type="date"
                className="input"
                value={originalPromiseDate}
                onChange={(e) => setOriginalPromiseDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">来源文件/渠道（可选）</label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  className="input pl-9"
                  placeholder="留空将自动生成为：手工补录（顾问名）"
                  value={sourceFile}
                  onChange={(e) => setSourceFile(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">原始承诺详情（建议填写，便于日后复核）</label>
            <textarea
              rows={3}
              className="textarea"
              placeholder="例如：家长 5 月 30 日口头确认 6 月 7 日上午 10:00 试听乐高搭建课，当时漏录入系统。"
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
            />
            <p className="text-[11px] text-ink-400 mt-1">
              留空时将默认生成"原始承诺试听日期：YYYY-MM-DD"
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-paper-200">
          <label className="inline-flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAdditional}
              onChange={(e) => setHasAdditional(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-amber-500"
            />
            <div>
              <span className="text-sm font-medium text-ink-700">
                同步追加家长改口备注（用于展示补录前后差异）
              </span>
              <p className="text-[11px] text-ink-500 mt-0.5">
                勾选后将在时间线中再追加一条变更记录，完整呈现从原始承诺到最新改口的过程。
              </p>
            </div>
          </label>

          {hasAdditional && (
            <div className="mt-4 pl-6 border-l-2 border-amber-200 space-y-4">
              <div>
                <label className="label">改口后状态</label>
                <select
                  className="input"
                  value={newStatusAfterNote}
                  onChange={(e) =>
                    setNewStatusAfterNote(e.target.value as RecordStatus)
                  }
                >
                  {(['rescheduled', 'completed', 'cancelled', 'promised', 'pending'] as RecordStatus[]).map(
                    (s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="label">
                  改口说明（必填）<span className="text-ink-400 font-normal"> · 记录家长最新沟通内容</span>
                </label>
                <textarea
                  rows={4}
                  className="textarea"
                  placeholder="例如：家长昨日晚间微信临时改口：原定 6 月 7 日的乐高课改至 6 月 14 日上午 10 点。因当时系统未录入，由顾问今早手工补录完整轨迹。"
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-paper-200 flex items-center justify-between">
          <div className="text-[11px] text-ink-400">
            提交后将生成 {hasAdditional ? 2 : 1} 条变更记录（含 1 条不可编辑的原始承诺）
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => navigate('/')}>
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit || (hasAdditional && !additionalNote.trim())}
              className="btn btn-primary"
            >
              <Sparkles className="w-4 h-4" />
              提交手工补录
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
