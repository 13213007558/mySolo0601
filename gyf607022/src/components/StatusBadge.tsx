import type { RecordStatus } from "@/types";
import { CheckCircle2, AlertTriangle, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<
  RecordStatus,
  { label: string; icon: typeof CheckCircle2; cls: string }
> = {
  normal: {
    label: "正常",
    icon: CheckCircle2,
    cls: "bg-milkgreen-50 text-milkgreen-500 border-milkgreen-200",
  },
  abnormal: {
    label: "异常",
    icon: AlertTriangle,
    cls: "bg-coral-50 text-coral-500 border-coral-300",
  },
  pending_review: {
    label: "待复核",
    icon: Search,
    cls: "bg-cream-100 text-mistblue-500 border-cream-200",
  },
  reviewed: {
    label: "已复核",
    icon: ShieldCheck,
    cls: "bg-mistblue-200/30 text-mistblue-500 border-mistblue-200",
  },
};

export default function StatusBadge({ status, className }: { status: RecordStatus; className?: string }) {
  const cfg = MAP[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("chip", cfg.cls, className)}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}
