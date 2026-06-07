import { useState } from 'react';
import { FileWarning, Pencil, X, Check, ImageIcon } from 'lucide-react';
import type { LeavePhoto } from '@shared/types';
import { api } from '../lib/api';

export default function PhotoGallery({ babyId, photos, onUpdate }: { babyId: string; photos: LeavePhoto[]; onUpdate: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [missing, setMissing] = useState(false);

  const save = async (id: string) => {
    try {
      await api.updatePhoto(babyId, id, { isMissingPage: missing, missingPageNote: note });
      onUpdate();
      setEditing(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        尚未上传请假条照片
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((p, i) => (
        <div key={p.id} className="group relative rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
            <img src={p.fileUrl} alt={p.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            {p.isMissingPage && (
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/70 to-rose-500/30 flex flex-col items-center justify-center text-white">
                <FileWarning className="w-10 h-10 mb-1" />
                <span className="text-sm font-semibold">材料缺页</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <p className="text-xs font-medium text-slate-700 truncate flex-1">{p.fileName}</p>
              <button
                onClick={() => { setEditing(p.id); setNote(p.missingPageNote); setMissing(p.isMissingPage); }}
                className="text-slate-300 hover:text-medical-500 transition-colors"
                title="编辑材料标记"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">{p.uploadedAt?.slice(0, 16).replace('T', ' ')} · {p.uploadedBy}</p>
            {p.description && <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">{p.description}</p>}
            {p.isMissingPage && p.missingPageNote && (
              <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 px-2 py-1.5 rounded-md leading-relaxed">缺页说明：{p.missingPageNote}</p>
            )}

            {editing === p.id && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 animate-slideIn">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={missing} onChange={(e) => setMissing(e.target.checked)} className="rounded text-medical-600" />
                  标记为材料缺页
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="请输入缺页说明..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                />
                <div className="flex gap-2">
                  <button onClick={() => save(p.id)} className="flex-1 text-xs bg-medical-600 text-white py-1.5 rounded-lg hover:bg-medical-700 transition-colors inline-flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> 保存
                  </button>
                  <button onClick={() => setEditing(null)} className="flex-1 text-xs bg-slate-100 text-slate-600 py-1.5 rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center justify-center gap-1">
                    <X className="w-3 h-3" /> 取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
