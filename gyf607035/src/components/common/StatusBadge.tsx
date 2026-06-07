import { STATUS_LABELS, STATUS_COLORS } from "@/types";
import type { VerifyStatus } from "@/types";

interface Props {
  status: VerifyStatus;
  size?: "sm" | "md";
}

export const StatusBadge = ({ status, size = "sm" }: Props) => {
  const label = STATUS_LABELS[status];
  const cls = STATUS_COLORS[status];
  const sizeCls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${cls} ${sizeCls}`}
    >
      {label}
    </span>
  );
};
