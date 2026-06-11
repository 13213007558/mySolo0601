import { ProgressRing } from "./ProgressRing";
import { Toolbar } from "./Toolbar";
import { AnnotationCanvas } from "./AnnotationCanvas";
import { AnnotationPanel } from "./AnnotationPanel";
import { StandardSamplePanel } from "./StandardSamplePanel";
import { SliceSelector } from "./SliceSelector";

export function EditWorkbench() {
  return (
    <div className="flex-1 min-h-0 p-4 bg-gradient-to-br from-jade-50/50 via-white to-amber-50/30 overflow-hidden">
      <div className="h-full flex gap-4">
        <div className="w-64 shrink-0 space-y-3 overflow-y-auto scrollbar-thin pr-1">
          <ProgressRing />
          <Toolbar />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-jade-50 text-jade-700 font-medium border border-jade-100">
                🔬 透射光工作台
              </span>
              <span>·</span>
              <span>左键拖动切片 · 滚轮缩放 · 选择工具后标注</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-500 font-mono">
                Tab
              </kbd>
              <span>切换工具</span>
              <span className="mx-0.5">·</span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-500 font-mono">
                Esc
              </kbd>
              <span>取消标注</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-4 rounded-3xl lightbox-frame">
            <AnnotationCanvas />
          </div>
        </div>

        <div className="w-72 shrink-0 space-y-3 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin pr-1 space-y-3">
            <SliceSelector />
            <AnnotationPanel />
          </div>
          <StandardSamplePanel />
        </div>
      </div>
    </div>
  );
}
