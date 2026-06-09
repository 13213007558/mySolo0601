import type { StringTemperature } from '../types';
import { formatDate, getStatusText, getTemperatureDiffClass } from '../utils';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiffCompareProps {
  originalData: StringTemperature;
  currentData: StringTemperature;
  className?: string;
  highlight?: boolean;
}

export function DiffCompare({ originalData, currentData, className, highlight = false }: DiffCompareProps) {
  const tempDiffClass = getTemperatureDiffClass(originalData.temperature, currentData.temperature);
  const hasRemarkDiff = originalData.remark !== currentData.remark;
  const hasTempDiff = originalData.temperature !== currentData.temperature;

  return (
    <div
      className={cn(
        'bg-slate-800 border rounded-lg p-4',
        highlight ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-slate-700',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-mono text-slate-400">组串 #{currentData.stringNo}</span>
        {currentData.source === 'manual' && (
          <span className="px-2 py-0.5 text-xs rounded bg-amber-500/20 text-amber-400 border border-amber-500/50">
            {getStatusText(currentData.source)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">原始值</div>
          
          <div className="space-y-2">
            <div>
              <span className="text-slate-400 text-sm">温度：</span>
              <span className={cn(
                'font-mono text-slate-300',
                hasTempDiff && 'line-through text-slate-500'
              )}>
                {originalData.temperature}℃
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-sm">备注：</span>
              <span className={cn(
                'text-slate-300',
                hasRemarkDiff && 'line-through text-slate-500'
              )}>
                {originalData.remark}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              记录人：{originalData.recorder} · {formatDate(originalData.recordTime)}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="md:pl-8">
            <div className="text-xs text-emerald-500 uppercase tracking-wider mb-2">当前值</div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400 text-sm">温度：</span>
                <span className={cn('font-mono text-emerald-400', tempDiffClass)}>
                  {currentData.temperature}℃
                </span>
                {hasTempDiff && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({currentData.temperature > originalData.temperature ? '↓' : '↑'}
                    {Math.abs(currentData.temperature - originalData.temperature).toFixed(1)}℃)
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 text-sm">备注：</span>
                <span className="text-emerald-400">{currentData.remark}</span>
              </div>
              <div className="text-xs text-slate-500">
                记录人：{currentData.recorder} · {formatDate(currentData.recordTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
