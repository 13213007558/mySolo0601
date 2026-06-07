import { AlertTriangle, Baby, Calendar, ChefHat, Clock, FileWarning, PenLine } from 'lucide-react';
import type { FoodRecord } from '@/types';
import StatusBadge from './StatusBadge';

interface RecordCardProps {
  record: FoodRecord;
  onClick: () => void;
}

export default function RecordCard({ record, onClick }: RecordCardProps) {
  const hasIssues = (record.detectedIssues?.length ?? 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`card p-4 cursor-pointer transition-all duration-200 hover:shadow-card hover:-translate-y-0.5 animate-slide-up group ${
        record.isBadData ? 'opacity-60 border-dashed border-slate-300' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-slate-800 truncate">
              {record.babyName || '（未填写宝宝姓名）'}
            </h3>
            {record.isManualEntry && (
              <span className="chip bg-butter-100 text-amber-700 border-amber-200">
                <PenLine size={11} />
                手工补录
              </span>
            )}
            {record.isBadData && (
              <span className="chip bg-slate-100 text-slate-500 border-slate-200">
                <FileWarning size={11} />
                隔离数据
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Baby size={12} />
              {record.babyAgeMonths > 0 ? `${record.babyAgeMonths} 个月` : '月龄未填'}
            </span>
            {record.allergies.length > 0 && (
              <span className="inline-flex items-center gap-1 text-coral-600">
                <AlertTriangle size={12} />
                {record.allergies.length} 项过敏
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={record.status} />
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <ChefHat size={12} className="text-slate-400" />
          <span className="truncate">{record.trialCourse || '课程未填写'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-slate-400" />
          <span>{record.consultant}</span>
          <span className="text-slate-400">·</span>
          <span>{record.appointmentId || '无预约号'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-slate-400" />
          <span>更新于 {record.updatedAt.slice(5, 16)}</span>
        </div>
      </div>

      {hasIssues && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-coral-600 inline-flex items-center gap-1">
            <AlertTriangle size={12} />
            检测到 {record.detectedIssues?.length} 项禁忌冲突
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-mint-600 font-medium group-hover:text-mint-700 transition-colors">
        查看详情 →
      </div>
    </div>
  );
}
