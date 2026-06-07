import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function StatsCard({
  label,
  value,
  icon,
  gradient,
  className,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  gradient: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card p-5 relative overflow-hidden transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <div className={cn("absolute inset-0 opacity-60", gradient)} />
      <div className="relative flex items-center justify-between">
        <div>
          <div className="text-sm text-mistblue-500 font-medium">{label}</div>
          <div className="mt-1 text-3xl font-serif font-semibold text-gray-800">{value}</div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/70 backdrop-blur flex items-center justify-center text-mistblue-500">
          {icon}
        </div>
      </div>
    </div>
  );
}
