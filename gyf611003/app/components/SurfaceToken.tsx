import { AlertTriangle, Award, CheckCircle2, Lock, Waves, XCircle } from "lucide-react";
import type { DecompressionStep, DiveMode } from "~/data/types";
import type { User } from "~/data/types";
import { formatDepth, roleLabel } from "~/utils/format";

interface Props {
  steps: DecompressionStep[];
  mode: DiveMode;
  tokenId?: string;
  emergencyReason?: string;
  surfacedAt?: number;
  currentUser: User;
  users: User[];
  onConfirmSurface: () => void;
}

export default function SurfaceToken({
  steps,
  mode,
  tokenId,
  emergencyReason,
  surfacedAt,
  currentUser,
  users,
  onConfirmSurface,
}: Props) {
  const incomplete = steps.filter(
    s => s.status !== "completed" && s.status !== "skipped"
  );
  const skipped = steps.filter(s => s.status === "skipped");
  const allDone = incomplete.length === 0;
  const isEmergency = mode === "emergency";
  const canSurface = allDone || isEmergency;
  const canConfirm = canSurface && (currentUser.role === "instructor" || currentUser.role === "admin");
  const isDone = mode === "completed";

  const barClass = isDone
    ? "border-indicator-green bg-indicator-green/10 shadow-led-green/40"
    : isEmergency
    ? "border-indicator-red bg-indicator-red/15 shadow-led-red animate-pulse"
    : canSurface
    ? "border-indicator-green bg-indicator-green/10 shadow-led-green/40 animate-pulse"
    : "border-indicator-red/50 bg-nautical-800/95";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-7xl mx-auto p-3 md:p-4">
        <div
          className={`rounded-md border-4 ${barClass} backdrop-blur-md p-4 md:p-5 transition-all`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* 状态徽章 */}
            <div className="flex-shrink-0 flex items-center gap-3 pr-4 lg:border-r border-current/20">
              {isDone ? (
                <div className="w-14 h-14 rounded-md bg-indicator-green/20 border-2 border-indicator-green flex items-center justify-center shadow-led-green">
                  <Award className="w-7 h-7 text-indicator-green" />
                </div>
              ) : isEmergency ? (
                <div className="w-14 h-14 rounded-md bg-indicator-red/20 border-2 border-indicator-red flex items-center justify-center shadow-led-red animate-pulse">
                  <AlertTriangle className="w-7 h-7 text-indicator-red" />
                </div>
              ) : canSurface ? (
                <div className="w-14 h-14 rounded-md bg-indicator-green/20 border-2 border-indicator-green flex items-center justify-center shadow-led-green animate-pulse">
                  <CheckCircle2 className="w-7 h-7 text-indicator-green" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-md bg-nautical-700/60 border-2 border-slate-600 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-slate-500" />
                </div>
              )}
              <div>
                <div className={`text-xs uppercase tracking-[0.25em] font-bold reading-mono
                  ${isDone ? "text-indicator-green" : isEmergency ? "text-indicator-red" : canSurface ? "text-indicator-green" : "text-slate-500"}`}
                >
                  {isDone ? "已出水 SURFACED" : isEmergency ? "紧急出水令牌" : canSurface ? "准许出水 TOKEN ISSUED" : "出水令牌 未激活"}
                </div>
                {tokenId && (
                  <div className="reading-mono text-lg font-bold tabular-nums text-slate-100 mt-0.5">
                    #{tokenId}
                  </div>
                )}
              </div>
            </div>

            {/* 详情 */}
            <div className="flex-1 min-w-0 w-full">
              {isDone && surfacedAt && (
                <div className="text-sm text-slate-200">
                  出水时间：
                  <span className="reading-mono font-bold text-indicator-green ml-1">
                    {new Date(surfacedAt).toLocaleString("zh-CN", { hour12: false })}
                  </span>
                </div>
              )}

              {isEmergency && emergencyReason && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-indicator-red mt-0.5 flex-shrink-0" />
                  <span className="text-indicator-red/90">
                    <strong>紧急原因：</strong>{emergencyReason}
                    {skipped.length > 0 && (
                      <span className="ml-2 text-indicator-amber">
                        · 共跳过 {skipped.length} 个减压阶梯
                      </span>
                    )}
                  </span>
                </div>
              )}

              {!canSurface && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-indicator-red font-semibold">
                    <XCircle className="w-4 h-4" />
                    <span>尚有 {incomplete.length} 个减压阶梯未完成，禁止出水：</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {incomplete.map(s => {
                      const diver = users.find(u => u.id === s.assignedDiverId);
                      return (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-indicator-red/10 border border-indicator-red/40 text-[11px] reading-mono text-slate-200"
                        >
                          <Waves className="w-3 h-3 text-indicator-red/80" />
                          阶#{s.index + 1} {formatDepth(s.plannedDepth)}
                          <span className="text-slate-500 mx-0.5">·</span>
                          <span className="text-indicator-amber/80">{roleLabel("diver")}:{diver?.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {canSurface && !isDone && (
                <div className="text-sm text-slate-300 leading-relaxed">
                  {isEmergency
                    ? (
                      <>
                        <span className="text-indicator-red font-bold">⚠ 紧急模式：</span>
                        已签发紧急出水令牌。所有潜水人员立即出水，<strong>事后需补充海事报告</strong>。
                      </>
                    )
                    : (
                      <>
                        <CheckCircle2 className="inline w-4 h-4 text-indicator-green mr-1 align-[-2px]" />
                        <span className="text-indicator-green font-semibold">全部减压阶梯已合规完成：</span>
                        <span className="ml-1">
                          共 {steps.length} 阶停留，
                          {steps.some(s => s.hasAlert) ? (
                            <span className="text-indicator-amber">
                              有 {steps.filter(s => s.hasAlert).length} 次偏离告警记录
                            </span>
                          ) : (
                            <span className="text-indicator-green">无偏离告警</span>
                          )}
                        </span>
                      </>
                    )}
                </div>
              )}
            </div>

            {/* 按钮 */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              {isDone ? (
                <div className="h-14 px-6 rounded-sm border-2 border-indicator-green/60 flex items-center gap-2 bg-indicator-green/10 text-indicator-green font-bold text-sm uppercase tracking-wider">
                  <Award className="w-5 h-5" />
                  流程已归档 ✓
                </div>
              ) : (
                <button
                  disabled={!canConfirm}
                  onClick={onConfirmSurface}
                  className={`w-full lg:w-auto h-14 px-6 md:px-8 rounded-sm border-2 font-bold tracking-wider uppercase transition-all text-base
                    ${canConfirm
                      ? isEmergency
                        ? "btn-industrial-danger !h-14 !px-8 !text-base"
                        : "btn-industrial-success !h-14 !px-8 !text-base shadow-led-green"
                      : "border-slate-700/60 bg-nautical-800/60 text-slate-600 cursor-not-allowed"
                    }`}
                >
                  <Waves className="inline w-5 h-5 mr-2 align-[-3px]" />
                  {canConfirm
                    ? isEmergency ? "确认紧急出水" : "确认准许出水"
                    : currentUser.role !== "instructor" && currentUser.role !== "admin"
                    ? "仅教练可签发"
                    : "令牌未激活"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
