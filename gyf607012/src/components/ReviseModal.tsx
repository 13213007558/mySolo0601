import { useState } from "react";
import Modal from "./Modal";
import type { RecordStatus } from "@/types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (newStatus: RecordStatus, reason: string, operator: string) => void;
  currentStatus: RecordStatus;
}

export default function ReviseModal({ open, onClose, onSubmit, currentStatus }: Props) {
  const [targetStatus, setTargetStatus] = useState<RecordStatus>(
    currentStatus === "abnormal" ? "normal" : "abnormal"
  );
  const [reason, setReason] = useState("");
  const [operator, setOperator] = useState("");

  const canSubmit = reason.trim().length >= 5 && operator.trim().length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(targetStatus, reason.trim(), operator.trim());
    setReason("");
    setOperator("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="人工改判">
      <div className="space-y-4">
        <div>
          <label className="label">改判为</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTargetStatus("normal")}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                targetStatus === "normal"
                  ? "border-status-normal bg-green-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}>
              <div className="flex items-center gap-2 font-medium text-gray-800">
                <CheckCircle2 size={16} className="text-status-normal" />
                正常
              </div>
              <p className="mt-1 text-xs text-gray-500">确认食材无风险</p>
            </button>
            <button
              onClick={() => setTargetStatus("abnormal")}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                targetStatus === "abnormal"
                  ? "border-status-abnormal bg-orange-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}>
              <div className="flex items-center gap-2 font-medium text-gray-800">
                <AlertCircle size={16} className="text-status-abnormal" />
                异常
              </div>
              <p className="mt-1 text-xs text-gray-500">标记存在风险需干预</p>
            </button>
          </div>
        </div>

        <div>
          <label className="label">
            改判理由 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="请说明改判原因，例如家长确认食材已耐受、系统初判误报等（至少 5 个字）"
            className="textarea"
            rows={3}
          />
        </div>

        <div>
          <label className="label">
            复核护士姓名 <span className="text-red-500">*</span>
          </label>
          <input
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="如：张护士"
            className="input"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            确认改判
          </button>
        </div>
      </div>
    </Modal>
  );
}
