import { useStoneStore } from '@/store';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  COLOR_GRADE_LABELS,
  COLOR_GRADE_COLORS,
  WALL_STATUS_LABELS,
  WALL_STATUS_COLORS,
  CONFIRM_RESULT_LABELS,
  type WallStatus,
  type ConfirmResult,
} from '@/types';
import { ArrowLeft, Camera, Check, X, Plus, Clock, Upload } from 'lucide-react';

function fmt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CONFIRM_RESULT_COLORS: Record<ConfirmResult, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
};

export default function StoneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentStone = useStoneStore((s) => s.currentStone);
  const loading = useStoneStore((s) => s.loading);
  const operatorName = useStoneStore((s) => s.operatorName);
  const loadStoneDetail = useStoneStore((s) => s.loadStoneDetail);
  const updateStone = useStoneStore((s) => s.updateStone);
  const addPhoto = useStoneStore((s) => s.addPhoto);
  const addReplacement = useStoneStore((s) => s.addReplacement);
  const confirmReplacement = useStoneStore((s) => s.confirmReplacement);

  const [repTarget, setRepTarget] = useState('');
  const [repReason, setRepReason] = useState('');
  const [repSuggestion, setRepSuggestion] = useState('');

  useEffect(() => {
    if (id) loadStoneDetail(id);
  }, [id, loadStoneDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400 text-lg">加载中...</div>
      </div>
    );
  }

  if (!currentStone) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-slate-400 text-lg">未找到记录</div>
      </div>
    );
  }

  const s = currentStone;

  const handleUpload = () => {
    if (!id) return;
    addPhoto(id, {
      stoneId: id,
      photoData: null,
      fileName: '现场照片_' + Date.now() + '.jpg',
      isMissing: false,
      uploadedAt: new Date().toISOString(),
    });
  };

  const handleAddReplacement = () => {
    if (!id || !repTarget.trim() || !repReason.trim()) return;
    addReplacement(id, {
      stoneId: id,
      targetStoneNo: repTarget.trim(),
      reason: repReason.trim(),
      suggestion: repSuggestion.trim(),
      confirmedBy: '',
      confirmedAt: '',
      confirmResult: 'pending',
    });
    setRepTarget('');
    setRepReason('');
    setRepSuggestion('');
  };

  const handleConfirmStone = (status: WallStatus) => {
    if (!id) return;
    updateStone(id, { wallStatus: status });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">石材详情</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-amber-600 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">{s.stoneNo}</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${WALL_STATUS_COLORS[s.wallStatus]}`}>
              {WALL_STATUS_LABELS[s.wallStatus]}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-400">批次号</span><p className="text-slate-700 font-medium">{s.batchNo}</p></div>
            <div><span className="text-slate-400">立面分区</span><p className="text-slate-700 font-medium">{s.facadeZone}</p></div>
            <div>
              <span className="text-slate-400">色差等级</span>
              <p><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${COLOR_GRADE_COLORS[s.colorGrade]}`}>{COLOR_GRADE_LABELS[s.colorGrade]}</span></p>
            </div>
            <div><span className="text-slate-400">操作人</span><p className="text-slate-700 font-medium">{s.operator}</p></div>
            <div><span className="text-slate-400">创建时间</span><p className="text-slate-700 font-medium">{fmt(s.createdAt)}</p></div>
            <div><span className="text-slate-400">更新时间</span><p className="text-slate-700 font-medium">{fmt(s.updatedAt)}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Camera size={16} />现场照片</h3>
            <button onClick={handleUpload} className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">
              <Upload size={14} />上传
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {s.photos.map((p) =>
              p.isMissing ? (
                <div key={p.id} className="aspect-square border-2 border-dashed border-red-300 rounded-lg flex flex-col items-center justify-center bg-red-50">
                  <Camera size={20} className="text-red-300 mb-1" />
                  <span className="text-red-400 text-xs">照片缺失</span>
                  <span className="text-red-300 text-[10px] mt-1 px-1 text-center truncate w-full">{p.fileName}</span>
                </div>
              ) : (
                <div key={p.id} className="aspect-square bg-slate-100 rounded-lg flex flex-col items-center justify-center overflow-hidden">
                  <Camera size={24} className="text-slate-400 mb-1" />
                  <span className="text-slate-500 text-[10px] px-1 text-center truncate w-full">{p.fileName}</span>
                </div>
              )
            )}
          </div>
          {s.photos.length === 0 && <p className="text-slate-400 text-sm text-center py-6">暂无照片</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3"><Plus size={16} />替换记录</h3>
          {s.replacements.length === 0 && <p className="text-slate-400 text-sm text-center py-4">暂无替换记录</p>}
          <div className="space-y-3">
            {s.replacements.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 text-sm">目标: {r.targetStoneNo}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONFIRM_RESULT_COLORS[r.confirmResult]}`}>
                    {CONFIRM_RESULT_LABELS[r.confirmResult]}
                  </span>
                </div>
                <p className="text-sm text-slate-600">原因: {r.reason}</p>
                <p className="text-sm text-slate-600">建议: {r.suggestion}</p>
                {r.confirmResult === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => confirmReplacement(r.id, 'approved', operatorName || '系统')} className="flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600"><Check size={12} />通过</button>
                    <button onClick={() => confirmReplacement(r.id, 'rejected', operatorName || '系统')} className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"><X size={12} />不通过</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
            <p className="text-sm font-medium text-slate-600">新增替换建议</p>
            <input value={repTarget} onChange={(e) => setRepTarget(e.target.value)} placeholder="目标石材编号" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={repReason} onChange={(e) => setRepReason(e.target.value)} placeholder="替换原因" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <input value={repSuggestion} onChange={(e) => setRepSuggestion(e.target.value)} placeholder="处理建议" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <button onClick={handleAddReplacement} className="w-full py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">提交</button>
          </div>
        </div>

        {s.wallStatus === 'pending' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-slate-800 mb-3">状态确认</h3>
            <div className="flex gap-3">
              <button onClick={() => handleConfirmStone('normal')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"><Check size={16} />通过</button>
              <button onClick={() => handleConfirmStone('conflict')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"><X size={16} />不通过</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3"><Clock size={16} />操作历史</h3>
          {s.histories.length === 0 && <p className="text-slate-400 text-sm text-center py-4">暂无操作记录</p>}
          <div className="relative pl-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
            {s.histories.map((h) => (
              <div key={h.id} className="relative pb-4 last:pb-0">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-amber-600 border-2 border-white shadow-sm" />
                <div className="ml-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700">{h.operator}</span>
                    <span className="text-slate-400">{h.action}</span>
                  </div>
                  {h.oldValue && <p className="text-xs text-slate-400 line-through">{h.oldValue}</p>}
                  <p className="text-xs text-slate-600">{h.newValue}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmt(h.operatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
