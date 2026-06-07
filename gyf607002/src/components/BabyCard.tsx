import { useNavigate } from 'react-router-dom';
import { Baby, Calendar, FileText, AlertTriangle } from 'lucide-react';
import type { BabyRecord } from '@/types';
import { StatusBadge } from './StatusBadge';
import { mealTypeLabelMap } from '@/types';

interface BabyCardProps {
  record: BabyRecord;
  index?: number;
}

export function BabyCard({ record, index = 0 }: BabyCardProps) {
  const navigate = useNavigate();
  const abnormalCount = record.validations.filter(
    (v) => v.status === 'fail' || v.status === 'boundary_triggered' || v.status === 'unit_mismatch'
  ).length;
  const summary = record.validations.slice(0, 2);

  return (
    <div
      onClick={() => navigate(`/record/${record.id}`)}
      className="info-card cursor-pointer hover:shadow-soft transition-all duration-300 hover:-translate-y-0.5 animate-fade-in group"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-ink/10 flex items-center justify-center text-ink">
            <Baby size={20} />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-ink-dark text-base leading-tight">
              {record.name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Calendar size={11} />
              {record.ageMonths} 月龄
              {record.isSupplemented && (
                <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-status-supplemented/10 text-status-supplemented text-[10px] font-medium">
                  <FileText size={9} />
                  补录
                </span>
              )}
            </p>
          </div>
        </div>
        <StatusBadge status={record.status} size="md" />
      </div>

      <p className="text-sm text-gray-600 line-clamp-1 mb-3">
        {record.allergyHistory}
      </p>

      <div className="border-t border-cream-dark pt-3">
        {abnormalCount > 0 ? (
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-status-abnormal mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="text-status-abnormal font-medium">
                发现 {abnormalCount} 项需关注
              </p>
              {summary.map((v) => (
                <p key={v.id} className="text-gray-500 line-clamp-1">
                  · {v.ingredientName}
                  {v.mealType ? `（${mealTypeLabelMap[v.mealType]}）` : ''}：{v.reason}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-status-normal flex items-center gap-1">
            <FileText size={12} />
            今日食材匹配 {record.validations.length} 项，全部正常
          </p>
        )}
      </div>

      {record.override && (
        <div className="mt-3 pt-3 border-t border-cream-dark text-xs text-gray-500">
          <span className="text-status-pending font-medium">已人工改判：</span>
          {record.override.reason}
        </div>
      )}
    </div>
  );
}
