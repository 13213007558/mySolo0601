import { useGradingStore } from "@/store/gradingStore";
import { Gem, MapPin, Scale } from "lucide-react";
import { cn } from "@/utils";

export function SliceSelector() {
  const slices = useGradingStore((s) => s.slices);
  const currentSlice = useGradingStore((s) => s.currentSlice);
  const setSlice = useGradingStore((s) => s.setSlice);

  return (
    <div className="p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-jade-100 shadow-md">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Gem size={13} className="text-jade-600" />
        <div className="text-xs font-semibold text-jade-700">切片管理</div>
      </div>
      <div className="space-y-2">
        {slices.map((slice) => {
          const isActive = currentSlice.id === slice.id;
          return (
            <button
              key={slice.id}
              onClick={() => setSlice(slice.id)}
              className={cn(
                "w-full text-left p-2.5 rounded-xl border-2 transition-all duration-200",
                isActive
                  ? "border-jade-500 bg-jade-50/80 shadow-md shadow-jade-100"
                  : "border-gray-100 bg-white/60 hover:border-jade-200 hover:bg-jade-50/40"
              )}
            >
              <div className="flex gap-2.5">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img
                    src={slice.imageUrl}
                    alt={slice.name}
                    className="w-full h-full object-cover"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-jade-600/20 border-2 border-jade-500 rounded-lg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-xs font-semibold truncate mb-0.5",
                      isActive ? "text-jade-800" : "text-gray-800"
                    )}
                  >
                    {slice.name}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mb-1.5">
                    {slice.code}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <MapPin size={9} className="text-gray-400" />
                      <span className="truncate">{slice.origin}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span>
                        {slice.width}×{slice.height}×{slice.thickness}mm
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Scale size={9} className="text-gray-400" />
                        {slice.weight}ct
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
