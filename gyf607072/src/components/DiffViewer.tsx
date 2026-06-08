import { Diff, Plus, Minus, Edit3 } from "lucide-react";
import type { ManualEdit } from "@/types";
import { cn } from "@/utils/uiHelpers";

interface Props {
  edit: ManualEdit;
}

export default function DiffViewer({ edit }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-semibold text-ink-800 flex items-center gap-2">
          <Diff size={16} className="text-sunset-500" />
          补录前后差异
        </h4>
        <div className="text-xs text-ink-700/60">
          补录人：<span className="font-medium">{edit.editorName}</span> · {edit.editedAt}
        </div>
      </div>

      <p className="text-sm text-sunset-500 bg-sunset-100/50 px-3 py-2 rounded-xl">
        <Edit3 size={12} className="inline mr-1 -mt-0.5" />
        补录原因：{edit.reason}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-cream-50 border border-cream-200 rounded-xl2 p-3">
          <div className="text-xs font-medium text-ink-700/50 mb-2 flex items-center gap-1">
            <Minus size={12} />
            补录前（原始）
          </div>
          <div className="space-y-2">
            {edit.diffs.map((d, idx) => (
              <div key={idx}>
                <div className="text-xs text-ink-700/50 mb-0.5">{d.label}</div>
                <div className={cn(
                  "text-sm px-2 py-1 rounded",
                  d.type === "remove" ? "bg-baby-100 text-baby-500 line-through" : "bg-white text-ink-700/60"
                )}>
                  {d.original || "（空）"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sage-50/50 border border-sage-100 rounded-xl2 p-3">
          <div className="text-xs font-medium text-sage-700 mb-2 flex items-center gap-1">
            <Plus size={12} />
            补录后（当前）
          </div>
          <div className="space-y-2">
            {edit.diffs.map((d, idx) => (
              <div key={idx}>
                <div className="text-xs text-sage-700/60 mb-0.5">{d.label}</div>
                <div className={cn(
                  "text-sm px-2 py-1 rounded",
                  d.type === "add" ? "bg-sage-100 text-sage-700 font-medium" :
                  d.type === "modify" ? "bg-sunset-100/60 text-sunset-500 font-medium" :
                  "bg-white text-ink-800"
                )}>
                  {d.edited}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
