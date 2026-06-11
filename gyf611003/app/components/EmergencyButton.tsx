import { useState } from "react";
import { AlertOctagon, ShieldAlert, X } from "lucide-react";

interface Props {
  disabled: boolean;
  onConfirm: (reason: string) => void;
}

export default function EmergencyButton({ disabled, onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <>
      <div className="fixed bottom-24 right-4 md:right-6 z-40 group">
        <div
          className={`relative transition-transform duration-300 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* 护盖 */}
          <div
            className={`absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-10 rounded-t-lg bg-gradient-to-b from-slate-500 to-slate-700 border-2 border-slate-600 transition-all origin-bottom z-20 cursor-pointer
              ${hovering ? "-translate-y-full -rotate-[25deg] opacity-70" : "translate-y-0 rotate-0"}
            `}
            style={{
              boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <div className="text-center text-[9px] uppercase tracking-[0.25em] text-slate-400 font-bold pt-3">
              PROTECT
            </div>
          </div>

          {/* 按钮本体 */}
          <button
            onClick={() => !disabled && setOpen(true)}
            className="relative w-20 h-20 md:w-24 md:h-24 rounded-full
              bg-gradient-to-br from-indicator-red via-red-600 to-red-800
              border-4 border-red-900
              flex items-center justify-center
              shadow-led-red
              hover:brightness-110 active:brightness-90 active:scale-95 transition-all"
            style={{
              boxShadow:
                "0 0 20px 6px rgba(255,59,48,0.4), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -6px 0 rgba(0,0,0,0.35)",
            }}
            disabled={disabled}
          >
            <div className="flex flex-col items-center text-white">
              <AlertOctagon className="w-7 h-7 md:w-8 md:h-8 drop-shadow-lg" strokeWidth={2.4} />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 drop-shadow">
                紧急
              </span>
              <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] opacity-90">
                ASCENT
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 二次确认弹窗 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nautical-900/85 backdrop-blur-sm">
          <div className="console-card max-w-md w-full p-6 border-4 border-indicator-red shadow-led-red bg-indicator-red/5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indicator-red/20 border-2 border-indicator-red flex items-center justify-center flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-indicator-red" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-indicator-red">启动紧急上升程序</h3>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                  此操作将<strong className="text-indicator-red">跳过所有未完成的减压阶梯</strong>，
                  强制生成紧急出水令牌。所有操作均会被海事审计系统永久留痕。
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-sm border border-slate-600 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="console-divider mb-4" />

            <label className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
              紧急原因（必填）
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="例：潜水员出现减压病早期症状 / 设备故障 / 海况突变…"
              className="w-full bg-nautical-900 border-2 border-indicator-red/60 rounded-sm p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indicator-red focus:shadow-led-red"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="btn-industrial-muted flex-1 !py-3"
              >
                取消
              </button>
              <button
                disabled={reason.trim().length < 6}
                onClick={() => {
                  onConfirm(reason.trim());
                  setOpen(false);
                  setReason("");
                }}
                className="btn-industrial-danger flex-1 !py-3 !text-sm
                  disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                确认紧急上升
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
