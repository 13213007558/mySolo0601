import { useGradingStore } from "@/store/gradingStore";
import { Layers, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils";

export function StandardSamplePanel() {
  const standardSamples = useGradingStore((s) => s.standardSamples);
  const toggleSample = useGradingStore((s) => s.toggleSample);
  const setSampleOpacity = useGradingStore((s) => s.setSampleOpacity);
  const activeSampleId = useGradingStore((s) => s.activeSampleId);

  return (
    <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-jade-100 shadow-md">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Layers size={13} className="text-jade-600" />
        <div className="text-xs font-semibold text-jade-700">标准样对照</div>
      </div>
      <div className="space-y-2">
        {standardSamples.map((sample) => {
          const isActive = sample.visible;
          const isSelected = activeSampleId === sample.id;
          return (
            <div
              key={sample.id}
              className={cn(
                "rounded-xl border-2 overflow-hidden transition-all duration-300",
                isActive
                  ? "border-jade-400 shadow-md shadow-jade-100"
                  : "border-gray-100 hover:border-jade-200"
              )}
            >
              <div
                className="relative h-20 cursor-pointer bg-gray-50"
                onClick={() => toggleSample(sample.id)}
              >
                <img
                  src={sample.imageUrl}
                  alt={sample.name}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    isActive ? "opacity-90" : "opacity-60"
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-white font-semibold">
                      {sample.name}
                    </div>
                    <div
                      className={cn(
                        "text-[9px] inline-block px-1.5 py-0.5 rounded mt-0.5 font-medium",
                        sample.grade === "A+"
                          ? "bg-emerald-500/80 text-white"
                          : sample.grade === "A"
                          ? "bg-jade-500/80 text-white"
                          : "bg-amber-500/80 text-white"
                      )}
                    >
                      {sample.grade} 级
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isActive
                        ? "bg-jade-500 text-white"
                        : "bg-white/80 text-gray-500"
                    )}
                  >
                    {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                  </div>
                </div>
                {isSelected && isActive && (
                  <div className="absolute top-1.5 right-1.5">
                    <div className="w-4 h-4 rounded-full bg-jade-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                )}
              </div>
              {isActive && (
                <div className="p-2.5 bg-white/80 space-y-1.5 animate-[fadeIn_0.2s_ease]">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>叠加透明度</span>
                    <span className="font-medium text-jade-700">
                      {Math.round(sample.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={sample.opacity * 100}
                    onChange={(e) =>
                      setSampleOpacity(
                        sample.id,
                        Number(e.target.value) / 100
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-1 rounded-full bg-gray-200 appearance-none cursor-pointer accent-jade-600"
                  />
                  <div className="text-[9px] text-gray-400 text-center pt-0.5">
                    混合模式：正片叠底
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 text-[9px] text-gray-400 px-1 leading-relaxed">
        提示：点击标准样即可半透明叠加在当前切片上，便于直观对比质地和纯净度
      </div>
    </div>
  );
}
