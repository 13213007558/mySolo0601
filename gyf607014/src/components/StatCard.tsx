import { useEffect, useState } from 'react';

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setVal(Math.round(target * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

interface StatCardProps {
  label: string;
  value: number;
  gradient: string;
  icon: React.ReactNode;
  delay?: number;
}

export default function StatCard({ label, value, gradient, icon, delay = 0 }: StatCardProps) {
  const n = useCountUp(value, 600 + delay * 150);
  return (
    <div
      className={`card card-hover relative overflow-hidden p-5 opacity-0 animate-fadeUp`}
      style={{ animationDelay: `${delay * 80}ms` }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${gradient}`} />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium tracking-wider text-slate2-500">{label}</div>
          <div
            className="mt-1 font-serif text-3xl font-semibold text-teal-700 tabular-nums opacity-0 animate-countUp"
            style={{ animationDelay: `${delay * 100 + 120}ms` }}
          >
            {n}
          </div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${gradient} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-cream-200">
        <div
          className={`h-full rounded-full ${gradient}`}
          style={{ width: `${Math.min(100, value * 8)}%`, transition: 'width 0.8s ease-out', transitionDelay: `${delay * 80}ms` }}
        />
      </div>
    </div>
  );
}
