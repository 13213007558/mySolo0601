import React from 'react';
import { useStoneStore } from '@/store/useStoneStore';
import { CheckCircle2, AlertTriangle, Lock, Sparkles } from 'lucide-react';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 160,
  strokeWidth = 14,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className={`transform -rotate-90 ${isComplete ? 'progress-ring-complete' : ''}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? 'url(#goldGradient)' : 'url(#progressGradient)'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-fill"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl font-bold font-display ${isComplete ? 'text-gold-gradient animate-sparkle' : 'text-diamond-cream'}`}>
            {progress}%
          </div>
          <div className="mt-1 text-xs text-slate-400 font-medium">完成度</div>
          {isComplete && (
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400 font-medium animate-pulse">
              <CheckCircle2 size={12} />
              <span>满格达标</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ProgressIndicatorProps {
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ className = '' }) => {
  const { getCurrentStone } = useStoneStore();
  const stone = getCurrentStone();

  if (!stone) return null;

  const progress = stone.progress;
  const required = stone.requiredInclusionCount;
  const current = stone.inclusions.length;
  const isComplete = progress >= 100;
  const isSubmitted = stone.status === 'submitted';
  const confirmedFields = stone.fieldMappings.filter(f => f.confirmed).length;
  const totalFields = stone.fieldMappings.length;

  return (
    <div className={`bs-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold text-diamond-cream">
          完成度监控
        </h3>
        {isSubmitted ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <Lock size={10} />
            已锁定
          </span>
        ) : isComplete ? (
          <span className="flex items-center gap-1 text-xs text-diamond-gold bg-diamond-gold/10 px-2.5 py-1 rounded-full border border-diamond-gold/30 animate-pulse-slow">
            <Sparkles size={10} />
            可提交
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
            <AlertTriangle size={10} />
            进行中
          </span>
        )}
      </div>

      <div className="flex justify-center mb-5">
        <ProgressRing progress={progress} size={150} strokeWidth={12} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">内含物标记</span>
          <span className="font-medium text-diamond-cream">
            <span className={`${current >= required ? 'text-emerald-400' : 'text-diamond-gold'}`}>{current}</span>
            <span className="text-slate-600"> / </span>
            <span className="text-slate-400">{required}</span>
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${current >= required ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-diamond-gold to-yellow-400'}`}
            style={{ width: `${Math.min(100, (current / Math.max(1, required)) * 100)}%` }}
          />
        </div>

        <div className="pt-3 mt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">报告字段对照</span>
            <span className="font-medium text-diamond-cream">
              <span className={confirmedFields >= totalFields ? 'text-emerald-400' : 'text-diamond-gold'}>{confirmedFields}</span>
              <span className="text-slate-600"> / </span>
              <span className="text-slate-400">{totalFields}</span>
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-400"
              style={{ width: `${(confirmedFields / Math.max(1, totalFields)) * 100}%` }}
            />
          </div>
        </div>

        {isComplete && confirmedFields < totalFields && !isSubmitted && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>绘图已完成，请前往「报告对照」页完成字段映射后方可提交。</span>
            </div>
          </div>
        )}

        {isComplete && confirmedFields >= totalFields && !isSubmitted && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              <span>所有要求已达标，请点击「提交对标报告」完成操作。</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
