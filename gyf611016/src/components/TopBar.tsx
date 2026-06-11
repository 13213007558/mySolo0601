import { useGradingStore } from "@/store/gradingStore";
import {
  Gem,
  Search,
  Bell,
  HelpCircle,
  MonitorPlay,
  Settings,
  User,
  Shield,
} from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { useState } from "react";
import { cn } from "@/utils";

export function TopBar() {
  const currentSlice = useGradingStore((s) => s.currentSlice);
  const graders = useGradingStore((s) => s.graders);
  const annotations = useGradingStore((s) => s.annotations);
  const isCustomerScreen = useGradingStore((s) => s.isCustomerScreen);
  const setCustomerScreenMode = useGradingStore((s) => s.setCustomerScreenMode);
  const viewMode = useGradingStore((s) => s.viewMode);

  const [showProgress, setShowProgress] = useState(false);

  if (isCustomerScreen) return null;
  if (viewMode !== "edit") return null;

  return (
    <>
      <div className="h-16 px-6 flex items-center justify-between border-b border-jade-100 bg-white/85 backdrop-blur-md shrink-0 relative z-40">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-jade-500 to-jade-700 flex items-center justify-center shadow-lg shadow-jade-500/30">
                <Gem size={20} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold-primary border-2 border-white flex items-center justify-center">
                <Shield size={8} className="text-white" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-gray-800 leading-tight tracking-wide">
                玉石透射分级台
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                Transmitted-Light Jade Grading Station · v2.5
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1" />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-jade-50/60 border border-jade-100">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-jade-100 shrink-0">
              <img
                src={currentSlice.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {currentSlice.name}
              </div>
              <div className="text-[10px] text-gray-500 font-mono leading-tight">
                {currentSlice.code} · {currentSlice.origin}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-80 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center px-3 gap-2 focus-within:border-jade-300 focus-within:bg-white transition-all">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="搜索切片编号、证书号、批次..."
                className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder:text-gray-400"
              />
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-mono">
                /
              </kbd>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          <div className="relative">
            <button
              onClick={() => setShowProgress(!showProgress)}
              className={cn(
                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                showProgress
                  ? "bg-jade-600 text-white shadow-md shadow-jade-600/30"
                  : "bg-gray-100 text-gray-700 hover:bg-jade-100 hover:text-jade-700"
              )}
            >
              <svg width="20" height="20" viewBox="0 0 36 36" className="-rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={showProgress ? "rgba(255,255,255,0.2)" : "#e5e7eb"}
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke={showProgress ? "white" : "#0d9488"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="97.4"
                  strokeDashoffset={
                    97.4 - (annotations.length / 6 > 1 ? 1 : annotations.length / 6) * 97.4
                  }
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <span className="absolute bottom-0 right-0 text-[8px] bg-white border border-gray-200 rounded-full w-4 h-4 flex items-center justify-center font-bold text-jade-700">
                {annotations.length}
              </span>
            </button>
            {showProgress && (
              <div className="absolute top-14 right-0 z-50 animate-[fadeIn_0.15s_ease]">
                <ProgressRing />
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setCustomerScreenMode(true);
              window.open(
                window.location.href + "#customer-preview",
                "customer_preview",
                "width=1200,height=800"
              );
              setTimeout(() => setCustomerScreenMode(false), 500);
            }}
            className="relative w-10 h-10 rounded-xl bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-gold-dark transition-all flex items-center justify-center"
            title="客户副屏预览"
          >
            <MonitorPlay size={16} />
          </button>

          <button
            className="relative w-10 h-10 rounded-xl bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all flex items-center justify-center"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <button
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all flex items-center justify-center"
          >
            <HelpCircle size={16} />
          </button>

          <button
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-jade-100 text-gray-700 hover:text-jade-700 transition-all flex items-center justify-center"
          >
            <Settings size={16} />
          </button>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          <div className="flex items-center gap-2 pl-1">
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-800 leading-tight">
                {graders.primary.name}
              </div>
              <div className="text-[10px] text-jade-600 leading-tight">
                主分级师 · G-001
              </div>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-jade-400 to-jade-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                <User size={16} />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
