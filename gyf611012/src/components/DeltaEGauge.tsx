import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { SaffronGrade } from '@/types';

export interface DeltaEGaugeProps {
  value: number;
  threshold: number;
  selectedGrade?: SaffronGrade | null;
  className?: string;
}

const MAX_SCALE = 12;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getFillColor(value: number, threshold: number): string {
  const ratio = value / threshold;
  if (ratio <= 0.5) return 'bg-emerald-500';
  if (ratio <= 0.75) return 'bg-yellow-500';
  if (ratio <= 1.0) return 'bg-orange-500';
  return 'bg-saffron-500';
}

function getTextColor(value: number, threshold: number): string {
  if (value <= threshold) return 'text-emerald-400 text-shadow-gold';
  return 'text-saffron-400 text-shadow-red';
}

export default function DeltaEGauge({
  value,
  threshold,
  selectedGrade,
  className,
}: DeltaEGaugeProps) {
  const { t } = useTranslation();
  const colorCards = useAppStore((s) => s.colorCards);
  const [displayValue, setDisplayValue] = useState(0);
  const [animateShake, setAnimateShake] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 350;
    const t0 = performance.now();

    const step = (now: number) => {
      const p = clamp((now - t0) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayValue(Number((start + (end - start) * eased).toFixed(2)));
      if (p < 1) requestAnimationFrame(step);
      else prevRef.current = end;
    };
    requestAnimationFrame(step);
  }, [value]);

  useEffect(() => {
    if (value > threshold) {
      setAnimateShake(true);
      const t = setTimeout(() => setAnimateShake(false), 420);
      return () => clearTimeout(t);
    }
  }, [value, threshold]);

  const pass = value <= threshold;
  const progressPct = clamp((value / MAX_SCALE) * 100, 0, 100);
  const thresholdPct = clamp((threshold / MAX_SCALE) * 100, 0, 100);

  const selectedCard = selectedGrade
    ? colorCards.find((c) => c.grade === selectedGrade)
    : null;

  return (
    <div
      className={cn(
        'panel flex flex-col gap-4 p-5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-none bg-gold-500" />
          <h3 className="panel-title text-base">{t('inspection.delta_gauge')}</h3>
        </div>
        <div
          className={cn(
            'data-chip font-bold uppercase tracking-widest',
            pass
              ? 'border-emerald-600 bg-emerald-900/40 text-emerald-300'
              : 'border-saffron-600 bg-saffron-900/40 text-saffron-300 animate-blink-critical'
          )}
        >
          {pass ? t('inspection.delta_pass') : t('inspection.delta_fail')}
        </div>
      </div>

      <div className="flex items-end justify-between gap-6">
        <div
          className={cn(
            'flex flex-col items-start',
            animateShake && 'animate-shake'
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            ΔE*ab
          </div>
          <div
            className={cn(
              'led-number text-6xl font-bold leading-none',
              getTextColor(value, threshold)
            )}
          >
            {displayValue.toFixed(2)}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {t('inspection.delta_threshold')}
            </span>
            <span className="led-number text-xl font-bold text-gold-400 tabular-nums">
              {threshold.toFixed(1)}
            </span>
          </div>

          {selectedCard && (
            <div className="flex items-center gap-2 border-t border-ink-700 pt-2 mt-1">
              <div
                className="h-4 w-4 border border-gold-500"
                style={{ backgroundColor: selectedCard.hexColor }}
              />
              <span className="font-mono text-xs font-semibold text-ink-200">
                {selectedCard.gradeLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="gauge-track h-4">
          <div
            className={cn('gauge-fill', getFillColor(value, threshold))}
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute inset-y-0 border-r-2 border-gold-400"
            style={{ left: `${thresholdPct}%` }}
          >
            <div className="absolute -right-1 -top-1 h-1 w-1 rounded-full bg-gold-400 shadow-[0_0_6px_2px_rgba(212,175,55,0.6)]" />
            <div className="absolute -right-1 -bottom-1 h-1 w-1 rounded-full bg-gold-400 shadow-[0_0_6px_2px_rgba(212,175,55,0.6)]" />
          </div>
        </div>

        <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-ink-500">
          <span>0</span>
          <span>2</span>
          <span>4</span>
          <span>6</span>
          <span>8</span>
          <span>10</span>
          <span>12+</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-ink-700 pt-3">
        {[
          { label: '0-50%', cls: 'bg-emerald-500', range: `≤${(threshold * 0.5).toFixed(1)}` },
          { label: '51-75%', cls: 'bg-yellow-500', range: `≤${(threshold * 0.75).toFixed(1)}` },
          { label: '76-100%', cls: 'bg-orange-500', range: `≤${threshold.toFixed(1)}` },
          { label: '>100%', cls: 'bg-saffron-500', range: `>${threshold.toFixed(1)}` },
        ].map((seg) => (
          <div key={seg.label} className="flex flex-col items-center gap-1">
            <div className={cn('h-1.5 w-full', seg.cls)} />
            <span className="font-mono text-[9px] text-ink-400">{seg.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
