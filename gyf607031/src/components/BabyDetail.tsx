import { useEffect, useState } from 'react';
import { ArrowLeft, User, Phone, MapPin, FileText, AlertCircle, Download } from 'lucide-react';
import type { Baby } from '../../shared/types';
import TemperatureList from './TemperatureList';
import LeavePhotos from './LeavePhotos';
import NoteTimeline from './NoteTimeline';
import { useAppStore } from '../store/appStore';

interface Props {
  babyId: string;
  onBack: () => void;
}

export default function BabyDetail({ babyId, onBack }: Props) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(false);
  const addNote = useAppStore(s => s.addNote);
  const fetchBabyDetail = useAppStore(s => s.fetchBabyDetail);
  const logExport = useAppStore(s => s.logExport);

  useEffect(() => {
    setLoading(true);
    fetchBabyDetail(babyId).then(b => {
      setBaby(b);
      setLoading(false);
    });
  }, [babyId, fetchBabyDetail]);

  if (loading || !baby) {
    return (
      <div className="paper-card p-12 text-center">
        <div className="text-sm text-ink-500">加载中…</div>
      </div>
    );
  }

  const handleAddNote = async (content: string) => {
    const ok = await addNote(babyId, content, '赵顾问');
    if (ok) {
      const refreshed = await fetchBabyDetail(babyId);
      setBaby(refreshed);
    }
    return ok;
  };

  const handleExport = () => {
    logExport('赵顾问');
    alert('已模拟导出：该操作已记录到审计日志，包含手机号隐私字段');
  };

  const statusCfg = {
    pending: { label: '待复核', cls: 'bg-clay-100 text-clay-700 border-clay-200' },
    reviewed: { label: '已复核', cls: 'bg-sage-100 text-sage-700 border-sage-200' },
    confirmed: { label: '已确认', cls: 'bg-ink-200 text-ink-700 border-ink-300' },
  }[baby.checkStatus];

  const phoneColorClass = baby.phoneValid ? 'text-ink-700' : 'text-clay-600';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </button>
        <div className="flex-1" />
        <button className="btn-secondary" onClick={handleExport}>
          <Download className="w-4 h-4" />
          导出（留痕）
        </button>
      </div>

      <div className="paper-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center">
              <User className="w-7 h-7 text-sage-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="h-display text-2xl">{baby.name}</h2>
                {baby.isManual && (
                  <span className="chip bg-clay-50 text-clay-600 border border-clay-200">
                    <FileText className="w-3 h-3" />
                    手工补录
                  </span>
                )}
              </div>
              <div className="text-sm text-ink-500 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {baby.room}
                </span>
                <span className="divider-dot" />
                <span>{baby.className}</span>
                <span className="divider-dot" />
                <span>编号 {baby.id}</span>
              </div>
            </div>
          </div>
          <span className={"chip border text-sm px-3 py-1.5 " + statusCfg.cls}>
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink-100">
          <div className="p-3 rounded-xl bg-paper-100">
            <div className="label">家长联系电话</div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-ink-500" />
              <span className={"font-medium " + phoneColorClass}>
                {baby.phone || '—'}
              </span>
              {!baby.phoneValid && baby.phone && (
                <span className="chip bg-clay-50 text-clay-600 border border-clay-200 ml-auto">
                  <AlertCircle className="w-3 h-3" />
                  格式不规范
                </span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-paper-100">
            <div className="label">最近更新</div>
            <div className="text-sm text-ink-700 font-medium">{baby.updatedAt}</div>
          </div>
        </div>
      </div>

      <TemperatureList records={baby.temperatures} />
      <LeavePhotos records={baby.leaves} />
      <NoteTimeline notes={baby.notes} babyId={baby.id} onAdd={handleAddNote} />
    </div>
  );
}
