import { useState, useRef } from "preact/hooks";
import { SwabPoint, Component, User, MOISTURE_THRESHOLD, RECHECK_INTERVAL_HOURS } from "../types/index.ts";
import { canPerformRecheck } from "../utils/storage.ts";

interface MoistureModalProps {
  point: SwabPoint;
  component: Component;
  isRecheck: boolean;
  onClose: () => void;
  onSubmit: (value: number, notes?: string, microPhoto?: string, isRecheck?: boolean) => void;
  currentUser: User | null;
}

export default function MoistureModal({
  point,
  component,
  isRecheck,
  onClose,
  onSubmit,
  currentUser,
}: MoistureModalProps) {
  const [value, setValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [microPhoto, setMicroPhoto] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const numValue = parseFloat(value);
  const isValid = !isNaN(numValue) && numValue > 0 && numValue < 100;
  const isOverThreshold = isValid && numValue > MOISTURE_THRESHOLD;

  const recheckValidation = isRecheck ? canPerformRecheck(component.id, point.id) : { allowed: true };

  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMicroPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!isValid) return;
    if (isRecheck && !recheckValidation.allowed) {
      alert(recheckValidation.reason);
      return;
    }
    onSubmit(numValue, notes || undefined, microPhoto || undefined, isRecheck);
  };

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-header">
          <h3 class="modal-title">
            {isRecheck ? "🔄 复检录入" : "🧪 含水率采样录入"}
          </h3>
          <button class="modal-close" onClick={onClose}>×</button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <div class="flex justify-between items-center">
              <div>
                <div style="font-family: var(--font-serif); font-size: 16px; font-weight: 600;">
                  {point.name}
                </div>
                <div class="text-sm text-muted">{component.name}</div>
              </div>
              {currentUser && (
                <div class="text-sm text-muted">
                  操作员：<strong>{currentUser.name}</strong>
                </div>
              )}
            </div>
          </div>

          {isRecheck && !recheckValidation.allowed && (
            <div class="alert alert-danger">
              ⚠️ {recheckValidation.reason}
            </div>
          )}

          <div class="form-group">
            <label class="form-label">含水率数值 (%)</label>
            <input
              type="number"
              class="form-input"
              style={{ fontSize: "20px", fontWeight: "600", textAlign: "center", padding: "14px" }}
              placeholder="请输入含水率"
              value={value}
              onChange={(e) => setValue((e.target as HTMLInputElement).value)}
              autoFocus
            />
          </div>

          {isValid && (
            <div class="moisture-display" style={{ padding: "16px", marginBottom: "16px" }}>
              <div>
                <span class="moisture-value" style={{ fontSize: "36px", color: isOverThreshold ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {numValue.toFixed(1)}
                </span>
                <span class="moisture-unit">%</span>
              </div>
              <div class="moisture-status">
                {isOverThreshold ? (
                  <span class="text-danger">⚠️ 超过阈值 {MOISTURE_THRESHOLD}%，将自动禁装并生成复检工单</span>
                ) : (
                  <span class="text-success">✓ 符合装船标准</span>
                )}
              </div>
            </div>
          )}

          <div class="form-group">
            <label class="form-label">显微照片（可选）</label>
            {microPhoto ? (
              <div style="position: relative;">
                <img src={microPhoto} alt="显微照片" class="photo-preview" />
                <button
                  class="btn btn-sm btn-secondary"
                  style={{ position: "absolute", top: "8px", right: "8px" }}
                  onClick={() => setMicroPhoto("")}
                >
                  移除
                </button>
              </div>
            ) : (
              <div
                class="photo-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <div style="font-size: 32px; margin-bottom: 8px;">📷</div>
                <div class="text-sm text-muted">点击上传显微照片</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style="display: none;"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          <div class="form-group">
            <label class="form-label">备注（可选）</label>
            <textarea
              class="form-textarea"
              placeholder="记录采样环境、木材状态等信息..."
              value={notes}
              onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          {isRecheck && (
            <div class="alert alert-info">
              ℹ️ 同构件两次复检间隔不得少于 {RECHECK_INTERVAL_HOURS} 小时
            </div>
          )}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            class="btn btn-primary"
            onClick={handleSubmit}
            disabled={!isValid || (isRecheck && !recheckValidation.allowed)}
          >
            {isRecheck ? "提交复检" : "确认录入"}
          </button>
        </div>
      </div>
    </div>
  );
}
