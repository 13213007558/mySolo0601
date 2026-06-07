import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertCircle, Layers } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BabySummary } from '@shared/types';
import { SOURCE_LABEL, sourceColor, formatDateTime } from '@/utils/format';

export default function BabyTable({ summaries }: { summaries: BabySummary[] }) {
  const navigate = useNavigate();

  return (
    <div className="fade-in-up overflow-hidden rounded-xl border border-night-500/60 bg-night-600/60 backdrop-blur" style={{ animationDelay: '240ms' }}>
      <div className="grid grid-cols-12 gap-2 border-b border-night-500/60 bg-night-700/60 px-5 py-3 text-xs font-medium uppercase tracking-wider text-night-200">
        <div className="col-span-3">宝宝姓名</div>
        <div className="col-span-2">班级</div>
        <div className="col-span-2">最新授权状态</div>
        <div className="col-span-2">版本数</div>
        <div className="col-span-2">最近更新</div>
        <div className="col-span-1 text-right">操作</div>
      </div>
      <ul>
        {summaries.map((s, idx) => {
          const latest = s.latestRecord;
          return (
            <li
              key={s.baby.id}
              className={`grid grid-cols-12 items-center gap-2 border-b border-night-500/30 px-5 py-3 transition-colors hover:bg-night-500/30 ${idx % 2 ? 'bg-night-700/20' : ''}`}
            >
              <div className="col-span-3 flex items-center gap-2">
                <span className="font-display text-base font-medium text-night-50">{s.baby.name}</span>
                {s.hasAnomaly && (
                  <span className="inline-flex items-center gap-1 text-xs text-danger">
                    <AlertCircle size={14} />
                    异常
                  </span>
                )}
              </div>
              <div className="col-span-2 text-sm text-night-200">{s.baby.className}</div>
              <div className="col-span-2">
                {latest ? (
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={latest.status} />
                    {latest && (
                      <span className={`text-[11px] ${sourceColor(latest.source)}`}>
                        {SOURCE_LABEL[latest.source]}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-night-300">暂无记录</span>
                )}
              </div>
              <div className="col-span-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                  <Layers size={12} />
                  {s.versionCount} 个版本
                </span>
              </div>
              <div className="col-span-2 text-xs text-night-200">
                {latest ? formatDateTime(latest.createdAt) : '—'}
              </div>
              <div className="col-span-1 text-right">
                <button
                  onClick={() => navigate(`/baby/${s.baby.id}`)}
                  className="inline-flex items-center gap-1 rounded-md border border-night-400/60 bg-night-500/60 px-3 py-1.5 text-xs font-medium text-night-100 transition hover:border-amber-500/60 hover:text-amber-300"
                >
                  详情
                  <ChevronRight size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
