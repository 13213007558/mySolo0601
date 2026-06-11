import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Lock, MapPin, Signature, UserCog, Waves } from "lucide-react";
import type { DecompressionStep, User } from "~/data/types";
import { useCountdown, formatMMSS } from "~/hooks/useCountdown";
import SignaturePad, { type SignaturePadApi } from "./SignaturePad";
import { formatDepth, formatDurationMM, formatGps, formatTime, stepStatusLabel } from "~/utils/format";

interface Props {
  step: DecompressionStep;
  currentUser: User;
  users: User[];
  isEmergency: boolean;
  isSupport: boolean;
  onCheckin: (stepId: string) => void;
  onDiverSign: (stepId: string, signature: string) => void;
  onInstructorSign: (stepId: string, signature: string) => void;
}

export default function LadderCard({
  step,
  currentUser,
  users,
  isEmergency,
  isSupport,
  onCheckin,
  onDiverSign,
  onInstructorSign,
}: Props) {
  const assignedDiver = users.find(u => u.id === step.assignedDiverId);
  const locked = step.status === "locked" || isSupport;
  const diverPadRef = useRef<SignaturePadApi | null>(null);
  const instrPadRef = useRef<SignaturePadApi | null>(null);
  const [diverApi, setDiverApi] = useState<SignaturePadApi | null>(null);
  const [instrApi, setInstrApi] = useState<SignaturePadApi | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);

  useEffect(() => {
    if (step.status === "unlocked") {
      setJustUnlocked(true);
      const id = setTimeout(() => setJustUnlocked(false), 500);
      return () => clearTimeout(id);
    }
  }, [step.status]);

  const canCheckin =
    !locked &&
    step.status === "unlocked" &&
    currentUser.role === "diver" &&
    currentUser.id === step.assignedDiverId;

  const { status: cdStatus, remaining, progressPct, deviation } = useCountdown(
    step.plannedDuration,
    step.status === "counting" || step.status === "diverSigned",
    step.startedAt
  );

  const statusLed = (() => {
    switch (step.status) {
      case "locked": return "led-gray";
      case "unlocked": return "led-cyan animate-pulse";
      case "arrived": return "led-cyan";
      case "counting":
        return cdStatus === "alert" ? "led-red animate-pulse"
          : cdStatus === "overtime" ? "led-amber animate-pulse"
          : cdStatus === "warning" ? "led-amber"
          : "led-cyan animate-pulse";
      case "diverSigned": return "led-amber animate-pulse";
      case "completed": return "led-green";
      case "skipped": return "led-red";
      default: return "led-gray";
    }
  })();

  const statusTextColor = (() => {
    switch (step.status) {
      case "locked": return "text-slate-600";
      case "unlocked": return "text-indicator-cyan";
      case "arrived": return "text-indicator-cyan";
      case "counting":
        return cdStatus === "alert" ? "text-indicator-red"
          : cdStatus === "overtime" || cdStatus === "warning" ? "text-indicator-amber"
          : "text-indicator-cyan";
      case "diverSigned": return "text-indicator-amber";
      case "completed": return "text-indicator-green";
      case "skipped": return "text-indicator-red";
      default: return "text-slate-400";
    }
  })();

  const countdownTextColor =
    cdStatus === "alert" ? "text-indicator-red"
    : cdStatus === "overtime" ? "text-indicator-red/80"
    : cdStatus === "warning" ? "text-indicator-amber"
    : "text-indicator-cyan";

  const borderColor = (() => {
    if (isEmergency || step.status === "skipped") return "border-indicator-red/60";
    if (step.status === "completed") return "border-indicator-green/50";
    if (step.status === "locked") return "border-slate-700/50";
    if (step.hasAlert || cdStatus === "alert") return "border-indicator-red/60 shadow-led-red";
    return "border-indicator-cyan/50 shadow-led-cyan/40";
  })();

  const countdownBarColor =
    cdStatus === "alert" ? "bg-indicator-red"
    : cdStatus === "overtime" ? "bg-indicator-red/80"
    : cdStatus === "warning" ? "bg-indicator-amber"
    : "bg-indicator-cyan";

  const showDiverSignBtn =
    !locked &&
    (step.status === "counting" || step.status === "arrived") &&
    currentUser.role === "diver" &&
    currentUser.id === step.assignedDiverId;

  const showInstrSignBtn =
    !locked &&
    step.status === "diverSigned" &&
    currentUser.role === "instructor";

  return (
    <div
      className={`console-card p-4 md:p-5 border-2 ${borderColor} transition-all relative
        ${locked ? "opacity-70 grayscale" : ""}
        ${justUnlocked ? "animate-unlock-slide" : ""}
        ${step.status === "skipped" ? "bg-indicator-red/5" : ""}
        ${step.status === "completed" ? "bg-indicator-green/5" : ""}
      `}
    >
      {step.status === "locked" && (
        <div className="absolute inset-0 bg-nautical-900/30 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none rounded-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Lock className="w-5 h-5" />
            <span className="reading-mono text-xs uppercase tracking-[0.3em]">locked · 上级未完成</span>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
        {/* 左侧：深度/状态 */}
        <div className="lg:w-44 flex-shrink-0 flex lg:flex-col items-center lg:items-stretch gap-3 pr-0 lg:pr-4 border-b-2 lg:border-b-0 lg:border-r-2 border-nautical-700/50 pb-3 lg:pb-0">
          <div className="flex items-center gap-2 lg:mb-auto">
            <span className={`${statusLed} w-3 h-3`} />
            <span className={`text-[11px] uppercase tracking-wider font-bold ${statusTextColor} reading-mono`}>
              {stepStatusLabel(step.status)}
              {step.hasAlert && <AlertCircle className="inline w-3 h-3 ml-1 text-indicator-red" />}
            </span>
          </div>
          <div className="text-center lg:text-left flex-1">
            <div className="flex items-center gap-1 justify-center lg:justify-start mb-0.5">
              <Waves className="w-3.5 h-3.5 text-indicator-cyan/70" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500">深度</span>
            </div>
            <div className="reading-mono text-3xl font-bold text-slate-100 tabular-nums">{formatDepth(step.plannedDepth)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              停留 <span className="reading-mono text-indicator-amber font-semibold">{formatDurationMM(step.plannedDuration)}</span>
            </div>
          </div>
          <div className="text-center lg:text-right text-[10px] reading-mono text-slate-600 uppercase tracking-widest">
            阶梯 #{String(step.index + 1).padStart(2, "0")}
          </div>
        </div>

        {/* 中间：到达确认 + 倒计时 + GPS */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => canCheckin && onCheckin(step.id)}
              disabled={!canCheckin}
              className={`flex items-center gap-2 px-4 py-3 rounded-sm border-2 font-semibold text-sm transition-all min-w-[180px]
                ${canCheckin
                  ? "border-indicator-cyan bg-indicator-cyan/10 text-indicator-cyan hover:bg-indicator-cyan/20 hover:shadow-led-cyan"
                  : "border-slate-700 bg-nautical-800/50 text-slate-500 cursor-not-allowed"}`}
            >
              <Clock className="w-4 h-4" />
              {step.actualArrivalTime ? (
                <>
                  <span className="text-xs text-slate-400 mr-1">到达时刻</span>
                  <span className="reading-mono text-lg tabular-nums">{formatTime(step.actualArrivalTime)}</span>
                </>
              ) : (
                <span>{canCheckin ? "点击确认已到达" : "等待到达确认"}</span>
              )}
            </button>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-indicator-cyan/60" />
              <span className="reading-mono text-slate-300">
                {step.gpsLat ? formatGps(step.gpsLat, step.gpsLng) : "未打点"}
              </span>
            </div>
          </div>

          {/* 倒计时大面板 */}
          <div className="relative bg-nautical-900/90 rounded-sm border border-nautical-700/60 p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold">减压倒计时</span>
              {cdStatus !== "idle" && deviation > 0 && (
                <span className={`reading-mono text-xs ${deviation > 180 ? "text-indicator-red" : deviation > 30 ? "text-indicator-amber" : "text-indicator-green"}`}>
                  Δ{deviation > 0 ? "+" : ""}{deviation}s
                </span>
              )}
            </div>
            <div className="h-2 rounded-full bg-nautical-700 overflow-hidden mb-3">
              <div
                className={`h-full ${countdownBarColor} transition-all duration-300`}
                style={{ width: `${Math.min(100, progressPct * 100)}%` }}
              />
            </div>
            <div className={`countdown-flip reading-mono text-4xl md:text-5xl font-bold tabular-nums ${countdownTextColor} text-center`}>
              {formatMMSS(remaining)}
              {deviation > 0 && (
                <span className="text-xl md:text-2xl ml-3 opacity-80 text-indicator-red reading-mono">
                  +{formatMMSS(deviation)}
                </span>
              )}
            </div>
            {(step.status === "counting" || step.status === "diverSigned") && (
              <div className="text-center text-[10px] uppercase tracking-widest text-slate-500 mt-1 reading-mono">
                {cdStatus === "alert" && "⚠ 偏离超3分钟 触发告警"}
                {cdStatus === "overtime" && "⚠ 已超时 请尽快减压上浮"}
                {cdStatus === "warning" && "即将结束 准备前往下一深度"}
                {cdStatus === "running" && "减压进行中"}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <UserCog className="w-3 h-3" />
              <span>潜水员：</span>
              <span className={`font-semibold ${assignedDiver?.id === currentUser.id ? "text-indicator-cyan" : "text-slate-300"}`}>
                {assignedDiver?.name ?? "未分配"}
              </span>
              <span className="text-slate-600 reading-mono ml-1">[{assignedDiver?.employeeId}]</span>
            </div>
          </div>
        </div>

        {/* 右侧：双签名区 */}
        <div className="lg:w-[280px] flex-shrink-0 flex flex-col gap-3">
          {/* 潜水员签名 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Signature className="w-3.5 h-3.5 text-indicator-cyan" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-indicator-cyan">潜水员签名</span>
              </div>
              {step.diverSignTime && (
                <span className="text-[10px] reading-mono text-slate-500">{formatTime(step.diverSignTime)}</span>
              )}
            </div>
            {step.diverSignature ? (
              <SignaturePad readOnlyPreview={step.diverSignature} height={80} accentColor="cyan" />
            ) : (
              <div>
                <SignaturePad
                  accentColor="cyan"
                  height={80}
                  placeholder={showDiverSignBtn ? "✍ 请潜水员在此签名" : "等待潜水员签名"}
                  onReady={(api) => { setDiverApi(api); diverPadRef.current = api; }}
                />
                <button
                  disabled={!showDiverSignBtn || !!step.diverSignature || !diverApi || diverApi.isEmpty()}
                  onClick={() => {
                    if (diverApi && !diverApi.isEmpty()) {
                      onDiverSign(step.id, diverApi.toDataURL());
                    }
                  }}
                  className={`mt-2 w-full h-9 rounded-sm border-2 font-semibold text-xs uppercase tracking-wider transition-all
                    ${showDiverSignBtn && diverApi && !diverApi.isEmpty()
                      ? "border-indicator-cyan bg-indicator-cyan/10 text-indicator-cyan hover:bg-indicator-cyan/20"
                      : "border-slate-700/50 bg-nautical-800/30 text-slate-600 cursor-not-allowed"}`}
                >
                  <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />
                  确认潜水员签名
                </button>
              </div>
            )}
          </div>

          {/* 教练签名 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indicator-green" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-indicator-green">教练副签</span>
              </div>
              {step.instructorSignTime && (
                <span className="text-[10px] reading-mono text-slate-500">{formatTime(step.instructorSignTime)}</span>
              )}
            </div>
            {step.instructorSignature ? (
              <SignaturePad readOnlyPreview={step.instructorSignature} height={80} accentColor="green" />
            ) : step.status === "diverSigned" || step.status === "completed" ? (
              <div>
                <SignaturePad
                  accentColor="green"
                  height={80}
                  placeholder={showInstrSignBtn ? "✍ 请教练在此副签" : "等待潜水员先签"}
                  onReady={(api) => { setInstrApi(api); instrPadRef.current = api; }}
                />
                <button
                  disabled={!showInstrSignBtn || !!step.instructorSignature || !instrApi || instrApi.isEmpty()}
                  onClick={() => {
                    if (instrApi && !instrApi.isEmpty()) {
                      onInstructorSign(step.id, instrApi.toDataURL());
                    }
                  }}
                  className={`mt-2 w-full h-9 rounded-sm border-2 font-semibold text-xs uppercase tracking-wider transition-all
                    ${showInstrSignBtn && instrApi && !instrApi.isEmpty()
                      ? "border-indicator-green bg-indicator-green/10 text-indicator-green hover:bg-indicator-green/20"
                      : "border-slate-700/50 bg-nautical-800/30 text-slate-600 cursor-not-allowed"}`}
                >
                  <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />
                  确认教练副签 · 解锁下一阶
                </button>
              </div>
            ) : (
              <div className="h-20 rounded-sm border-2 border-dashed border-slate-700/50 bg-nautical-900/40 flex items-center justify-center text-slate-600 text-xs italic">
                当前阶段未到教练签署时机
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
