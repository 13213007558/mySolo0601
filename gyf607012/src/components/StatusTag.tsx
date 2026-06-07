import type { RecordStatus } from "@/types";
import { statusLabel, getStatusTagClass } from "@/utils/format";
import { CheckCircle2, AlertTriangle, Edit3, FileEdit } from "lucide-react";

interface Props {
  status: RecordStatus;
  isManual?: boolean;
  className?: string;
}

const iconMap: Record<RecordStatus, typeof CheckCircle2> = {
  normal: CheckCircle2,
  abnormal: AlertTriangle,
  revised: Edit3,
  manual: FileEdit,
};

export default function StatusTag({ status, isManual, className = "" }: Props) {
  const displayStatus = isManual ? "manual" : status;
  const displayLabel = isManual ? "手工补录" : statusLabel[status];
  const Icon = iconMap[displayStatus];
  const cls = getStatusTagClass(displayStatus);

  return (
    <span className={`${cls} ${className}`}>
      <Icon size={12} />
      {displayLabel}
    </span>
  );
}
