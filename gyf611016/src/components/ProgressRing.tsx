import { useGradingStore } from "@/store/gradingStore";

export function ProgressRing() {
  const calculateProgress = useGradingStore((s) => s.calculateProgress);
  const isProgressComplete = useGradingStore((s) => s.isProgressComplete);
  const annotations = useGradingStore((s) => s.annotations);
  const required = useGradingStore((s) => s.currentSlice.requiredAnnotations);

  const progress = calculateProgress();
  const complete = isProgressComplete();

  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const cracks = annotations.filter((a) => a.type === "crack").length;
  const impurities = annotations.filter((a) => a.type === "impurity").length;
  const inclusions = annotations.filter((a) => a.type === "inclusion").length;

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-jade-100 shadow-lg">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={complete ? "#10b981" : progress >= 70 ? "#0d9488" : progress >= 40 ? "#d97706" : "#dc2626"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease",
              filter: complete
                ? "drop-shadow(0 0 6px rgba(16, 185, 129, 0.5))"
                : "none",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-3xl font-bold transition-colors duration-300 ${
              complete
                ? "text-emerald-600"
                : progress >= 70
                ? "text-jade-700"
                : progress >= 40
                ? "text-gold-primary"
                : "text-crack-red"
            }`}
          >
            {progress}%
          </span>
          <span className="text-xs text-gray-500 mt-0.5">
            {complete ? "完成" : "标注完成度"}
          </span>
        </div>
      </div>

      <div className="w-full space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-crack-red"></span>
            <span className="text-gray-600">裂隙</span>
          </div>
          <span
            className={`font-medium ${
              required.includes("crack") && cracks > 0
                ? "text-emerald-600"
                : required.includes("crack")
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            {cracks}
            {required.includes("crack") ? " ✓" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-impurity-amber"></span>
            <span className="text-gray-600">杂质</span>
          </div>
          <span
            className={`font-medium ${
              required.includes("impurity") && impurities > 0
                ? "text-emerald-600"
                : required.includes("impurity")
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            {impurities}
            {required.includes("impurity") ? " ✓" : ""}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-inclusion-blue"></span>
            <span className="text-gray-600">包裹体</span>
          </div>
          <span
            className={`font-medium ${
              required.includes("inclusion") && inclusions > 0
                ? "text-emerald-600"
                : required.includes("inclusion")
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            {inclusions}
            {required.includes("inclusion") ? " ✓" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
