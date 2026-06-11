import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { ColorCard, SaffronGrade } from '@/types';

export interface ColorCardStripProps {
  activeGrade?: SaffronGrade | null;
  onSelect?: (card: ColorCard) => void;
  className?: string;
}

export default function ColorCardStrip({
  activeGrade,
  onSelect,
  className,
}: ColorCardStripProps) {
  const { t } = useTranslation();
  const colorCards = useAppStore((s) => s.colorCards);

  const handleSelect = useCallback(
    (card: ColorCard) => {
      onSelect?.(card);
    },
    [onSelect]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement;
        if (target?.dataset?.grade) {
          const card = colorCards.find((c) => c.grade === target.dataset.grade);
          if (card) {
            e.preventDefault();
            handleSelect(card);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [colorCards, handleSelect]);

  return (
    <div className={cn('flex w-full items-stretch gap-3', className)}>
      {colorCards.map((card) => {
        const isActive = activeGrade === card.grade;
        return (
          <div
            key={card.id}
            data-grade={card.grade}
            role="button"
            tabIndex={0}
            aria-label={`${card.gradeLabel} - ΔE ≤ ${card.maxDeltaE}`}
            aria-pressed={isActive}
            onClick={() => handleSelect(card)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelect(card);
              }
            }}
            className={cn(
              'color-card-strip focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
              isActive && 'active',
              'h-full min-h-[260px]'
            )}
            style={{ backgroundColor: card.hexColor }}
          >
              <div className="absolute left-0 right-0 top-0 flex justify-center pt-2">
                <div
                  className={cn(
                    'px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider font-bold',
                    isActive
                      ? 'bg-ink-900 text-gold-500 border border-gold-500'
                      : 'bg-ink-900/70 text-ink-100'
                  )}
                >
                  {card.gradeLabel}
                </div>
              </div>

              <div className="absolute inset-x-0 top-8 bottom-14 flex items-center justify-center">
                <div className="text-center px-2">
                  <div
                    className={cn(
                      'font-serif font-bold leading-tight',
                      isActive ? 'text-white text-shadow-gold' : 'text-white/90'
                    )}
                    style={{
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {card.description}
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 px-2">
                <div
                  className={cn(
                    'font-mono text-xs font-bold tabular-nums',
                    isActive ? 'text-gold-300' : 'text-ink-900'
                  )}
                >
                  ΔE ≤ {card.maxDeltaE}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-ink-900/80">
                  {t('inspection.delta_threshold')}
                </div>
              </div>

              {isActive && (
                <>
                  <div className="target-corner left-1 top-1 border-l-2 border-t-2" />
                  <div className="target-corner right-1 top-1 border-r-2 border-t-2" />
                  <div className="target-corner left-1 bottom-1 border-l-2 border-b-2" />
                  <div className="target-corner right-1 bottom-1 border-r-2 border-b-2" />
                </>
              )}
          </div>
        );
      })}
    </div>
  );
}
