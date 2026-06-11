import { useGradingStore } from "@/store/gradingStore";
import type { ToolMode } from "@/types";
import {
  Move,
  MousePointer2,
  Ruler,
  Sparkles,
  Circle,
  Diamond,
  Minus,
  Plus,
  RotateCcw,
  Grid3x3,
  Ruler as RulerIcon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils";

export function Toolbar() {
  const toolMode = useGradingStore((s) => s.toolMode);
  const setToolMode = useGradingStore((s) => s.setToolMode);
  const transform = useGradingStore((s) => s.transform);
  const setTransform = useGradingStore((s) => s.setTransform);
  const resetTransform = useGradingStore((s) => s.resetTransform);
  const showGrid = useGradingStore((s) => s.showGrid);
  const setShowGrid = useGradingStore((s) => s.setShowGrid);
  const showMeasurements = useGradingStore((s) => s.showMeasurements);
  const setShowMeasurements = useGradingStore((s) => s.setShowMeasurements);
  const lightIntensity = useGradingStore((s) => s.lightIntensity);
  const setLightIntensity = useGradingStore((s) => s.setLightIntensity);

  const tools: Array<{
    mode: ToolMode;
    label: string;
    icon: LucideIcon;
    color?: string;
  }> = [
    { mode: "pan", label: "平移/拖动", icon: Move },
    { mode: "select", label: "选择编辑", icon: MousePointer2 },
    { mode: "annotate_crack", label: "标注裂隙", icon: Sparkles, color: "text-crack-red" },
    { mode: "annotate_impurity", label: "标注杂质", icon: Circle, color: "text-impurity-amber" },
    { mode: "annotate_inclusion", label: "标注包裹体", icon: Diamond, color: "text-inclusion-blue" },
    { mode: "measure", label: "测量", icon: Ruler },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-jade-100 shadow-md">
        <div className="text-xs font-semibold text-jade-700 mb-2 px-1">标注工具</div>
        <div className="grid grid-cols-2 gap-1.5">
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = toolMode === t.mode;
            return (
              <button
                key={t.mode}
                onClick={() => setToolMode(t.mode)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-jade-600 text-white shadow-md shadow-jade-600/30 scale-[0.98]"
                    : "bg-gray-50 text-gray-700 hover:bg-jade-50 hover:text-jade-700"
                )}
                title={t.label}
              >
                <Icon size={14} className={t.color && isActive ? "text-white" : t.color} />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-jade-100 shadow-md">
        <div className="text-xs font-semibold text-jade-700 mb-2 px-1">视图控制</div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setTransform({ scale: Math.max(0.2, transform.scale - 0.1) })
              }
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all"
            >
              <Minus size={14} />
            </button>
            <div className="flex-1 text-center text-xs font-medium text-gray-700 bg-gray-50 rounded-lg py-1.5">
              {Math.round(transform.scale * 100)}%
            </div>
            <button
              onClick={() =>
                setTransform({ scale: Math.min(5, transform.scale + 0.1) })
              }
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={resetTransform}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gold-light/50 text-gray-700 hover:text-gold-dark transition-all"
              title="重置视图"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                showGrid
                  ? "bg-jade-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-jade-50"
              )}
            >
              <Grid3x3 size={13} />
              <span>网格</span>
            </button>
            <button
              onClick={() => setShowMeasurements(!showMeasurements)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                showMeasurements
                  ? "bg-jade-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-jade-50"
              )}
            >
              <RulerIcon size={13} />
              <span>标尺</span>
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Sun size={12} />
              <span>透射光强度</span>
              <span className="ml-auto font-medium text-jade-700">
                {Math.round(lightIntensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={lightIntensity * 100}
              onChange={(e) => setLightIntensity(Number(e.target.value) / 100)}
              className="w-full h-1.5 rounded-full bg-gray-200 appearance-none cursor-pointer accent-jade-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
