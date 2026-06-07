import type { FilterKey } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  value: FilterKey;
  onChange: (v: FilterKey) => void;
  counts: {
    all: number;
    normal: number;
    abnormal: number;
    manual_overridden: number;
    pending: number;
  };
}

const items: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'abnormal', label: '异常' },
  { key: 'manual_overridden', label: '人工改判' },
  { key: 'pending', label: '待审核' },
];

export default function FilterBar({ value, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((it) => {
        const active = value === it.key;
        const count = counts[it.key];
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200',
              active
                ? 'border-sage-400 bg-sage-400 text-white shadow-soft'
                : 'border-warm-200 bg-white text-warm-700 hover:border-sage-300 hover:text-sage-500'
            )}
          >
            <span>{it.label}</span>
            <span
              className={cn(
                'inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs',
                active ? 'bg-white/20 text-white' : 'bg-warm-100 text-warm-500'
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
