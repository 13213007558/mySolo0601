import { useState, useEffect, useRef } from "preact/hooks";
import { Component as ComponentType, User, Batch, MOISTURE_THRESHOLD } from "../types/index.ts";
import {
  getComponentById,
  getComponentByRfid,
  unlockShipment,
  hasPermission,
  getCurrentUser,
  getBatches,
  getReadingsByComponent,
  seedInitialData,
} from "../utils/storage.ts";
import SwabMap from "./SwabMap.tsx";

interface ComponentDetailProps {
  componentId: string;
}

export default function ComponentDetail({ componentId }: ComponentDetailProps) {
  const [component, setComponent] = useState<ComponentType | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rfidInput, setRfidInput] = useState("");
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    seedInitialData();
    loadData();
  }, [componentId]);

  const loadData = () => {
    const comp = getComponentById(componentId);
    setComponent(comp || null);
    setCurrentUser(getCurrentUser());
    setBatches(getBatches());
  };

  const handleRfidSearch = () => {
    if (!rfidInput.trim()) return;
    const comp = getComponentByRfid(rfidInput.trim());
    if (comp) {
      window.location.href = `/component/${comp.id}`;
    } else {
      alert("未找到对应RFID标签的构件");
    }
  };

  const handleUnlock = () => {
    if (!component || !currentUser) return;

    if (!hasPermission(currentUser, "curator")) {
      alert("只有馆长角色可以解除禁装状态");
      return;
    }

    if (!hasSignature) {
      alert("请先签署解锁确认");
      return;
    }

    const success = unlockShipment(component.id, currentUser.id);
    if (success) {
      alert("禁装状态已解除");
      setShowUnlockModal(false);
      loadData();
    }
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e
      ? e.touches[0].clientX - rect.left
      : (e as MouseEvent).clientX - rect.left;
    const y = "touches" in e
      ? e.touches[0].clientY - rect.top
      : (e as MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e
      ? e.touches[0].clientX - rect.left
      : (e as MouseEvent).clientX - rect.left;
    const y = "touches" in e
      ? e.touches[0].clientY - rect.top
      : (e as MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#3d2e1f";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  if (!component) {
    return (
      <div class="card">
        <div class="card-body" style="text-align: center; padding: 60px;">
          <div style="font-size: 48px; margin-bottom: 16px;">❓</div>
          <p>未找到该构件</p>
          <a href="/" class="btn btn-primary" style="margin-top: 16px;">
            返回构件列表
          </a>
        </div>
      </div>
    );
  }

  const readings = getReadingsByComponent(component.id);
  const latestReadings: Record<string, number> = {};
  readings.forEach((r) => {
    if (!latestReadings[r.pointId]) {
      latestReadings[r.pointId] = r.value;
    }
  });
  const maxMoisture = Object.values(latestReadings).length > 0
    ? Math.max(...Object.values(latestReadings))
    : null;
  const overThresholdCount = Object.values(latestReadings).filter(v => v > MOISTURE_THRESHOLD).length;

  const componentBatch = component.batchId
    ? batches.find((b) => b.id === component.batchId)
    : null;

  return (
    <div>
      <div style="margin-bottom: 16px;">
        <a href="/" class="text-sm text-muted" style="text-decoration: none;">
          ← 返回构件列表
        </a>
      </div>

      {component.isShipmentLocked && (
        <div class="lock-banner">
          <span class="lock-icon">🔒</span>
          <div class="lock-text">
            <div class="lock-title">禁装船状态</div>
            <div class="lock-reason">
              含水率超标（{maxMoisture?.toFixed(1)}% {'>'} {MOISTURE_THRESHOLD}%），
              {overThresholdCount} 个点位超标
              {component.lockedAt && ` · 锁定于 ${new Date(component.lockedAt).toLocaleString("zh-CN")}`}
            </div>
          </div>
          {hasPermission(currentUser, "curator") && (
            <button
              class="btn btn-sm"
              style="background: rgba(255,255,255,0.2); color: #fffaf2;"
              onClick={() => setShowUnlockModal(true)}
            >
              馆长解锁
            </button>
          )}
          {!hasPermission(currentUser, "curator") && (
            <span class="text-sm" style="opacity: 0.8;">
              仅馆长可解除
            </span>
          )}
        </div>
      )}

      <div class="card mb-4">
        <div class="card-header">
          <div>
            <h2 class="card-title">{component.name}</h2>
          </div>
          <div class="flex gap-2 items-center">
            <span class={`badge ${component.isShipmentLocked ? "badge-danger" : "badge-success"}`}>
              {component.isShipmentLocked ? "🔒 禁装船" : "✓ 可装船"}
            </span>
          </div>
        </div>
        <div class="card-body">
          <div class="grid grid-4 gap-4 mb-4">
            <div>
              <div class="stat-label text-sm text-muted">RFID标签</div>
              <div style="font-family: monospace; font-size: 14px; font-weight: 600;">
                {component.rfidTag}
              </div>
            </div>
            <div>
              <div class="stat-label text-sm text-muted">构件类型</div>
              <div style="font-weight: 600;">{component.type}</div>
            </div>
            <div>
              <div class="stat-label text-sm text-muted">所在位置</div>
              <div style="font-weight: 600;">{component.position}</div>
            </div>
            <div>
              <div class="stat-label text-sm text-muted">所属批次</div>
              <div style="font-weight: 600;">
                {componentBatch ? componentBatch.name : "未分配"}
              </div>
            </div>
          </div>

          <div class="rfid-scanner">
            <input
              type="text"
              class="rfid-input"
              placeholder="输入/扫描 RFID 标签快速跳转构件..."
              value={rfidInput}
              onChange={(e) => setRfidInput((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => (e as KeyboardEvent).key === "Enter" && handleRfidSearch()}
            />
            <button class="btn btn-secondary btn-sm" onClick={handleRfidSearch}>
              🔍 查找
            </button>
          </div>
        </div>
      </div>

      <SwabMap component={component} onUpdate={loadData} />

      {showUnlockModal && (
        <div class="modal-overlay" onClick={() => setShowUnlockModal(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">🔓 馆长解锁确认</h3>
              <button class="modal-close" onClick={() => setShowUnlockModal(false)}>×</button>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning">
                ⚠️ 解除禁装状态需要馆长授权，请确认构件已达到装船标准。
              </div>

              <div class="form-group">
                <label class="form-label">构件名称</label>
                <div style="font-weight: 600;">{component.name}</div>
              </div>

              <div class="form-group">
                <label class="form-label">操作用户</label>
                <div style="font-weight: 600;">
                  {currentUser?.name}
                  <span class={`role-badge role-${currentUser?.role}`} style="margin-left: 8px;">
                    {currentUser?.role === "curator" ? "馆长" : currentUser?.role === "admin" ? "管理员" : "操作员"}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">解锁原因</label>
                <textarea
                  class="form-textarea"
                  placeholder="请输入解锁原因..."
                  value={unlockReason}
                  onChange={(e) => setUnlockReason((e.target as HTMLTextAreaElement).value)}
                />
              </div>

              <div class="form-group">
                <label class="form-label">馆长签字确认</label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={120}
                  class="signature-canvas"
                  style={{ width: "100%", height: "120px" }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <button
                  class="btn btn-secondary btn-sm"
                  style="margin-top: 8px;"
                  onClick={clearSignature}
                >
                  清除签字
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setShowUnlockModal(false)}>
                取消
              </button>
              <button
                class="btn btn-danger"
                onClick={handleUnlock}
                disabled={!hasSignature}
              >
                确认解锁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
