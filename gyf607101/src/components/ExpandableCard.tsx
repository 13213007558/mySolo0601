import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableCardProps {
  title: React.ReactNode;
  summary?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  highlight?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function ExpandableCard({
  title,
  summary,
  children,
  defaultOpen = false,
  className,
  highlight = false,
  onToggle,
}: ExpandableCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, children]);

  const handleToggle = () => {
    const newOpen = !isOpen;
    setIsOpen(newOpen);
    onToggle?.(newOpen);
  };

  return (
    <div
      className={cn(
        'bg-slate-800 border-2 rounded-lg overflow-hidden transition-all duration-300',
        highlight ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-slate-700',
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3">{title}</div>
          {summary && <div className="mt-1 text-sm text-slate-400">{summary}</div>}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ml-4',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        style={{ height: contentHeight }}
        className="transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div ref={contentRef} className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
