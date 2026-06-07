import { useState } from 'react';
import { ClipboardList, Clock, CheckCircle2, Circle, User, Plus, X } from 'lucide-react';
import type { RectificationRecord, RectificationStatus } from '@shared/types';
import { api } from '../lib/api';

const statusConfig: Record<RectificationStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  pending: { label: '待处理', icon: <Circle className="w-3.5 h-3.5" />, cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  in_progress: { label: '整改中', icon: <Clock className="w-3.5 h-3.5" />, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: '已完成', icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

interface Props {
  babyId: string;
  records: RectificationRecord[];
  onUpdate: () => void;
}

export default function RectificationList({ babyId, records, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [problem, setProblem] = useState('');
  const [measure, setMeasure] = useState('');

  const add = async () => {
    if (!problem.trim() || !measure.trim()) return;
    try {
      await api.addRectification(babyId, {
        problemDescription: problem,
        rectificationMeasure: measure,
        rectifiedBy: '护理主管',
        rectifiedAt: new Date().toISOString(),
        status: 'pending',
      });
      setProblem(''); setMeasure(''); setShowForm(false);
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const changeStatus = async (id: string, status: RectificationStatus) => {
    try {
      await api.updateRectification(babyId, id, { status });
      onUpdate();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <ClipboardList className="w-4 h-4 text-medical-500" />
          <span className="text-sm font-medium">整改记录</span>
          <span className="text-xs text-slate-400">({records.length})</span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-medical-50 text-medical-700 hover:bg-medical-100 transition-colors border border-medical-100"
        >
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? '取消' : '新增整改'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-medical-100 bg-medical-50/40 p-4 space-y-3 animate-slideIn">
          <input
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="问题描述（如：请假条缺第2页、体温记录异常偏高）"
            className="w-full text-sm px-3 py-2 rounded-lg border border-medical-100 bg-white focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
          />
          <textarea
            value={measure}
            onChange={(e) => setMeasure(e.target.value)}
            placeholder="整改措施..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-medical-100 bg-white focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100 resize-none"
          />
          <button
            onClick={add}
            className="text-sm px-4 py-2 rounded-lg bg-medical-600 text-white hover:bg-medical-700 transition-colors font-medium"
          >
            提交整改记录
          </button>
        </div>
      )}

      {records.length === 0 && !showForm && (
        <div className="py-8 text-center text-sm text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl">
          暂无整改记录
        </div>
      )}

      <div className="space-y-3">
        {records.map((r, i) => {
          const cfg = statusConfig[r.status];
          return (
            <div key={r.id} className="rounded-xl border border-slate-100 bg-white p-4 animate-slideIn" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">{r.problemDescription}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${cfg.cls}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-slate-600 leading-relaxed">{r.rectificationMeasure}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {r.rectifiedBy}</span>
                  <span>{r.rectifiedAt?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="flex items-center gap-1">
                  {(Object.keys(statusConfig) as RectificationStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => changeStatus(r.id, s)}
                      className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                        r.status === s
                          ? 'bg-medical-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
