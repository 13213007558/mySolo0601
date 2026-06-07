import { useState } from "react";
import { X, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { ReviewTarget } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (target: ReviewTarget, reason: string) => boolean;
}

export default function ReviewModal({ open, onClose, onSubmit }: Props) {
  const [target, setTarget] = useState<ReviewTarget>("normal");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = () => {
    if (!reason.trim()) {
      setErr("请填写改判原因，该说明将写入状态时间线");
      return;
    }
    const ok = onSubmit(target, reason);
    if (ok) {
      setReason("");
      setErr("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in-up">
      <div className="card w-full max-w-md p-6 shadow-pop">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-serif text-xl font-semibold text-gray-800">人工改判</h3>
            <p className="text-sm text-mistblue-400 mt-1">改判原因将永久记录在状态时间线中</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream-100 text-mistblue-400">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4">
          <div className="label-text">改判方向</div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTarget("normal")}
              className={
                target === "normal"
                  ? "p-4 rounded-xl border-2 border-milkgreen-400 bg-milkgreen-50 text-left transition"
                  : "p-4 rounded-xl border border-cream-200 bg-cream-50 text-left hover:border-milkgreen-200 transition"
              }
            >
              <CheckCircle2
                size={22}
                className={target === "normal" ? "text-milkgreen-500" : "text-mistblue-300"}
              />
              <div className={target === "normal" ? "text-milkgreen-600 font-medium mt-2" : "text-mistblue-500 mt-2"}>
                判为正常
              </div>
              <div className="text-xs text-mistblue-400 mt-0.5">确认无风险</div>
            </button>
            <button
              onClick={() => setTarget("abnormal")}
              className={
                target === "abnormal"
                  ? "p-4 rounded-xl border-2 border-coral-400 bg-coral-50 text-left transition"
                  : "p-4 rounded-xl border border-cream-200 bg-cream-50 text-left hover:border-coral-200 transition"
              }
            >
              <ShieldAlert size={22} className={target === "abnormal" ? "text-coral-500" : "text-mistblue-300"} />
              <div className={target === "abnormal" ? "text-coral-500 font-medium mt-2" : "text-mistblue-500 mt-2"}>
                维持/判为异常
              </div>
              <div className="text-xs text-mistblue-400 mt-0.5">仍需客服跟进</div>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="label-text">
            改判原因 <span className="text-coral-400">*</span>
          </div>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="例如：家长电话确认宝宝已连续食用芒果一周无过敏反应……"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErr("");
            }}
          />
          {err && <p className="text-xs text-coral-500 mt-1.5">{err}</p>}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={submit} className="btn-primary">
            确认改判
          </button>
        </div>
      </div>
    </div>
  );
}
