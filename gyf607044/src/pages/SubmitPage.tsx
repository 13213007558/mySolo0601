import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Send,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { PhotoUploader, type PhotoInput } from '@/components/PhotoUploader';

const COURSES = [
  '婴幼儿抚触课',
  '亲子游泳启蒙',
  '感官启蒙课',
  '辅食添加指导',
  '早教音乐课',
  '亲子瑜伽课',
];

export default function SubmitPage() {
  const nav = useNavigate();
  const draft = useAppStore((s) => s.draft);
  const saveDraft = useAppStore((s) => s.saveDraft);
  const clearDraft = useAppStore((s) => s.clearDraft);
  const submit = useAppStore((s) => s.submitRecord);

  const [babyName, setBabyName] = useState(draft.babyName || '');
  const [courseName, setCourseName] = useState(draft.courseName || COURSES[0]);
  const [originalTime, setOriginalTime] = useState(draft.originalTime || '');
  const [expectedTime, setExpectedTime] = useState(draft.expectedTime || '');
  const [reason, setReason] = useState(draft.reason || '');
  const [photos, setPhotos] = useState<PhotoInput[]>(draft.photos || []);
  const [submitter, setSubmitter] = useState('家长（模拟）');
  const [sourceFile, setSourceFile] = useState('改期排期表-6月.xlsx');
  const [toast, setToast] = useState<{ type: 'ok' | 'warn'; msg: string } | null>(
    null
  );
  const [isManualEntry, setIsManualEntry] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      if (babyName || reason || photos.length) {
        saveDraft({ babyName, courseName, originalTime, expectedTime, reason, photos });
      }
    }, 30000);
    return () => clearInterval(t);
  }, [babyName, courseName, originalTime, expectedTime, reason, photos, saveDraft]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleSubmit = () => {
    if (submitting.current) return;
    if (!babyName.trim()) {
      setToast({ type: 'warn', msg: '请填写宝宝姓名' });
      return;
    }
    if (!originalTime || !expectedTime) {
      setToast({ type: 'warn', msg: '请选择原上课时间和期望改期时间' });
      return;
    }
    if (!reason.trim()) {
      setToast({ type: 'warn', msg: '请填写改期原因' });
      return;
    }
    submitting.current = true;
    const res = submit({
      babyName: babyName.trim(),
      courseName,
      originalTime,
      expectedTime,
      reason: reason.trim(),
      sourceFile: sourceFile || undefined,
      submitter: isManualEntry ? `${submitter}（手工补录）` : submitter,
      photos,
      sourceType: isManualEntry ? 'manual_entry' : 'parent_submit',
    });
    submitting.current = false;
    clearDraft();
    setBabyName('');
    setCourseName(COURSES[0]);
    setOriginalTime('');
    setExpectedTime('');
    setReason('');
    setPhotos([]);
    if (res.duplicated) {
      setToast({
        type: 'warn',
        msg: '提交成功！但系统检测到可能是重复提交，已标记为异常记录，详情可在交接本异常Tab查看。',
      });
    } else {
      setToast({ type: 'ok', msg: `提交成功！受理编号：${res.id.slice(0, 10)}` });
      setTimeout(() => nav(`/handover/${res.id}`), 1200);
    }
  };

  const hasDraft =
    !!draft.savedAt && (draft.babyName || draft.reason || draft.photos?.length);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in-up">
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 rounded-xl2 shadow-card px-5 py-3 flex items-center gap-2 ${
            toast.type === 'ok' ? 'bg-secondary text-white' : 'bg-warn/90 text-amber-900'
          }`}
        >
          {toast.type === 'ok' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl text-secondary">
              {isManualEntry ? '手工补录 · 改期记录' : '家长录入 · 课程改期申请'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isManualEntry
                ? '补录的记录会打上「手工补录」来源标签，方便对比查看'
                : '填写后系统自动生成交接记录，可在「交接本列表」查看进度'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasDraft && (
              <button
                className="btn-ghost text-xs"
                onClick={() => {
                  setBabyName(draft.babyName || '');
                  setCourseName(draft.courseName || COURSES[0]);
                  setOriginalTime(draft.originalTime || '');
                  setExpectedTime(draft.expectedTime || '');
                  setReason(draft.reason || '');
                  setPhotos(draft.photos || []);
                  setToast({ type: 'ok', msg: '已恢复上次未完成的草稿' });
                }}
              >
                <RotateCcw size={14} />
                恢复草稿
              </button>
            )}
            <button
              className={`btn-ghost text-xs ${isManualEntry ? 'ring-2 ring-primary bg-primary/10' : ''}`}
              onClick={() => setIsManualEntry((v) => !v)}
            >
              <FileText size={14} />
              {isManualEntry ? '切回家长录入' : '切换手工补录'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">宝宝姓名</label>
            <input
              className="input-base"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="如：小米粒"
            />
          </div>
          <div>
            <label className="label-base">课程名称</label>
            <select
              className="input-base"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
            >
              {COURSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">原上课时间</label>
            <input
              type="datetime-local"
              className="input-base"
              value={originalTime}
              onChange={(e) => setOriginalTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">期望改期时间</label>
            <input
              type="datetime-local"
              className="input-base"
              value={expectedTime}
              onChange={(e) => setExpectedTime(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">提交人 / 来源</label>
            <input
              className="input-base"
              value={submitter}
              onChange={(e) => setSubmitter(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">来源文件</label>
            <input
              className="input-base"
              value={sourceFile}
              onChange={(e) => setSourceFile(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label-base">改期原因</label>
            <textarea
              className="input-base min-h-[88px] resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请描述改期原因，护理人员处理时会参考此说明"
            />
          </div>
          <div className="col-span-2">
            <label className="label-base">照片说明（最多3张，可选）</label>
            <PhotoUploader value={photos} onChange={setPhotos} max={3} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Save size={12} /> 每 30 秒自动保存草稿到本地
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => clearDraft()}>
              <RotateCcw size={14} /> 清空
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              <Send size={14} />
              {isManualEntry ? '补录提交' : '提交改期申请'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
