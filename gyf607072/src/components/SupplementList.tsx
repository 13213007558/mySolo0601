import { useState } from "react";
import { FileText, Plus, AlertCircle } from "lucide-react";
import type { Supplement } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/utils/uiHelpers";

interface Props {
  recordId: string;
  supplements: Supplement[];
  isClosed: boolean;
}

export default function SupplementList({ recordId, supplements, isClosed }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const addSupplement = useStore((s) => s.addSupplement);
  const currentRole = useStore((s) => s.currentRole);

  const canAdd = currentRole === "parent" || currentRole === "nanny";
  const addedAfterCloseExists = supplements.some((s) => s.addedAfterClose);

  const handleSubmit = () => {
    if (!content.trim()) return;
    addSupplement(recordId, content.trim(), currentRole === "parent" ? "沐沐妈妈" : "王阿姨");
    setContent("");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-semibold text-ink-800 flex items-center gap-2">
          <FileText size={16} className="text-sage-500" />
          观察记录 & 追加材料
          {supplements.length > 0 && (
            <span className="chip bg-cream-200 text-ink-700">{supplements.length}</span>
          )}
        </h4>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-sage-500 hover:text-sage-700 flex items-center gap-1"
          >
            <Plus size={14} />
            追加记录
          </button>
        )}
      </div>

      {isClosed && (
        <div className="flex items-start gap-2 bg-sunset-100/60 text-sunset-500 px-3 py-2 rounded-xl text-xs">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            本记录已关闭。追加的材料仅供后续参考，<strong>不会改变原始结论</strong>，将在详情页中单独标注。
          </span>
        </div>
      )}

      {addedAfterCloseExists && (
        <div className="flex items-start gap-2 bg-baby-100/60 text-baby-500 px-3 py-2 rounded-xl text-xs">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            ⚠ 含结案后追加材料。阅读时请注意：以下带【补】标记的内容为记录关闭后补充，不参与当时的对账结论。
          </span>
        </div>
      )}

      {showForm && (
        <div className="bg-cream-50 border border-cream-200 rounded-xl2 p-3 space-y-2 animate-slide-up">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请输入观察记录或补充材料..."
            className="w-full min-h-[80px] bg-white border border-cream-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sage-300 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm py-1.5 px-3">
              取消
            </button>
            <button onClick={handleSubmit} className="btn-primary text-sm py-1.5 px-3">
              提交
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {supplements.length === 0 ? (
          <p className="text-sm text-ink-700/50 italic px-2">暂无补充材料</p>
        ) : (
          supplements.map((s) => (
            <div
              key={s.id}
              className={cn(
                "p-3 rounded-xl2 border",
                s.addedAfterClose
                  ? "bg-sunset-50/50 border-sunset-100"
                  : "bg-white border-cream-200"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-ink-800">{s.addedBy}</span>
                <span className="text-xs text-ink-700/50">{s.addedAt}</span>
                {s.addedAfterClose && (
                  <span className="chip bg-sunset-100 text-sunset-500 text-[10px]">
                    【补】结案后追加
                  </span>
                )}
              </div>
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{s.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
