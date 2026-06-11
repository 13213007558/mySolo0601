import { useState, useEffect, useRef } from "preact/hooks";
import { Batch, Component, User, MOISTURE_THRESHOLD } from "../types/index.ts";
import {
  getBatches,
  getComponents,
  createBatch,
  signBatch,
  hasPermission,
  getCurrentUser,
  getReadingsByComponent,
  seedInitialData,
} from "../utils/storage.ts";

export default function BatchManager() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    seedInitialData();
    loadData();
  }, []);

  const loadData = () => {
    setBatches(getBatches());
    setComponents(getComponents());
    setCurrentUser(getCurrentUser());
  };

  const handleCreateBatch = () => {
    if (!newBatchName.trim()) {
      alert("请输入批次名称");
      return;
    }
    if (selectedComponents.length === 0) {
      alert("请至少选择一个构件");
      return;
    }

    const newBatch = createBatch({
      name: newBatchName.trim(),
      componentIds: [...selectedComponents],
    });

    setNewBatchName("");
    setSelectedComponents([]);
    setShowCreateModal(false);
    loadData();
  };

  const handleSignBatch = () => {
    if (!selectedBatch || !currentUser) return;

    if (!hasPermission(currentUser, "curator")) {
      alert("只有馆长可以签署批次");
      return;
    }

    if (!hasSignature) {
      alert("请先签署姓名");
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas?.toDataURL() || "";

    const result = signBatch(selectedBatch.id, currentUser.id, signatureData);
    if (result) {
      alert("批次签署成功");
      setShowSignModal(false);
      clearSignature();
      loadData();
    }
  };

  const toggleComponent = (compId: string) => {
    setSelectedComponents((prev) =>
      prev.includes(compId)
        ? prev.filter((id) => id !== compId)
        : [...prev, compId]
    );
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

  const getBatchStats = (batch: Batch) => {
    const batchComponents = components.filter((c) =>
      batch.componentIds.includes(c.id)
    );
    const lockedCount = batchComponents.filter((c) => c.isShipmentLocked).length;

    let totalReadings = 0;
    let overThresholdCount = 0;
    batchComponents.forEach((c) => {
      const readings = getReadingsByComponent(c.id);
      const latestByPoint: Record<string, number> = {};
      readings.forEach((r) => {
        if (!latestByPoint[r.pointId]) {
          latestByPoint[r.pointId] = r.value;
        }
      });
      totalReadings += Object.keys(latestByPoint).length;
      overThresholdCount += Object.values(latestByPoint).filter(
        (v) => v > MOISTURE_THRESHOLD
      ).length;
    });

    return {
      componentCount: batchComponents.length,
      lockedCount,
      totalReadings,
      overThresholdCount,
    };
  };

  const canSignBatch = (batch: Batch) => {
    const stats = getBatchStats(batch);
    return stats.lockedCount === 0 && stats.componentCount > 0;
  };

  return (
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title" style={{ fontFamily: "var(--font-serif)", fontSize: "22px" }}>
          批次管理
        </h2>
        <button class="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + 新建批次
        </button>
      </div>

      {batches.length === 0 ? (
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 60px;">
            <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
            <p>暂无批次，点击上方按钮创建</p>
          </div>
        </div>
      ) : (
        <div class="grid grid-2 gap-4">
          {batches.map((batch) => {
            const stats = getBatchStats(batch);
            return (
              <div key={batch.id} class="card">
                <div class="card-header">
                  <div>
                    <h3 class="card-title">{batch.name}</h3>
                    <div class="text-sm text-muted">
                      创建于 {new Date(batch.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <span
                    class={`badge ${
                      batch.status === "signed"
                        ? "badge-success"
                        : batch.status === "ready"
                        ? "badge-info"
                        : "badge-muted"
                    }`}
                  >
                    {batch.status === "signed"
                      ? "✓ 已签署"
                      : batch.status === "ready"
                      ? "待签署"
                      : "草稿"}
                  </span>
                </div>
                <div class="card-body">
                  <div class="grid grid-3 gap-3 mb-4">
                    <div class="stat-item">
                      <span class="stat-label">构件数量</span>
                      <span class="stat-value">{stats.componentCount}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">已测点位</span>
                      <span class="stat-value">{stats.totalReadings}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">超标点位</span>
                      <span
                        class="stat-value"
                        style={{
                          color:
                            stats.overThresholdCount > 0
                              ? "var(--accent-red)"
                              : "var(--text-muted)",
                        }}
                      >
                        {stats.overThresholdCount}
                      </span>
                    </div>
                  </div>

                  {stats.lockedCount > 0 && (
                    <div class="alert alert-danger mb-4">
                      ⚠️ {stats.lockedCount} 件构件处于禁装状态，无法签署
                    </div>
                  )}

                  {batch.status === "signed" && batch.signedAt && (
                    <div class="alert alert-info mb-4">
                      ✅ 由馆长于 {new Date(batch.signedAt).toLocaleString("zh-CN")} 签署
                    </div>
                  )}

                  <div class="flex gap-2">
                    <button
                      class="btn btn-secondary btn-sm"
                      onClick={() => setSelectedBatch(batch)}
                    >
                      查看详情
                    </button>
                    {batch.status !== "signed" &&
                      hasPermission(currentUser, "curator") && (
                        <button
                          class="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedBatch(batch);
                            setShowSignModal(true);
                          }}
                          disabled={!canSignBatch(batch)}
                        >
                          馆长签署
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div class="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div class="modal" style="max-width: 560px;" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">新建批次</h3>
              <button class="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">批次名称</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="如：第一批发运批次"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName((e.target as HTMLInputElement).value)}
                />
              </div>

              <div class="form-group">
                <label class="form-label">选择构件</label>
                <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                  {components.map((comp) => (
                    <label
                      key={comp.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-color)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedComponents.includes(comp.id)}
                        onChange={() => toggleComponent(comp.id)}
                        style="margin-right: 10px;"
                      />
                      <div style="flex: 1;">
                        <div style={{ fontWeight: 500 }}>{comp.name}</div>
                        <div class="text-sm text-muted">
                          {comp.rfidTag} · {comp.type}
                          {comp.isShipmentLocked && (
                            <span class="badge badge-danger" style="margin-left: 8px;">
                              禁装
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div class="text-sm text-muted" style="margin-top: 6px;">
                  已选择 {selectedComponents.length} 个构件
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button class="btn btn-primary" onClick={handleCreateBatch}>
                创建批次
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignModal && selectedBatch && (
        <div class="modal-overlay" onClick={() => setShowSignModal(false)}>
          <div class="modal" style="max-width: 560px;" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">馆长签字确认</h3>
              <button class="modal-close" onClick={() => setShowSignModal(false)}>×</button>
            </div>
            <div class="modal-body">
              <div class="alert alert-info">
                📋 批次：<strong>{selectedBatch.name}</strong>
              </div>

              <div class="form-group">
                <label class="form-label">签字确认</label>
                <canvas
                  ref={canvasRef}
                  width={480}
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
                  清除重签
                </button>
              </div>

              <div class="form-group">
                <label class="form-label">签署人</label>
                <div style="font-weight: 600;">
                  {currentUser?.name}
                  <span class={`role-badge role-${currentUser?.role}`} style="margin-left: 8px;">
                    馆长
                  </span>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setShowSignModal(false)}>
                取消
              </button>
              <button
                class="btn btn-primary"
                onClick={handleSignBatch}
                disabled={!hasSignature}
              >
                确认签署
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBatch && !showCreateModal && !showSignModal && (
        <div class="modal-overlay" onClick={() => setSelectedBatch(null)}>
          <div class="modal" style="max-width: 720px;" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <h3 class="modal-title">批次详情 - {selectedBatch.name}</h3>
              <button class="modal-close" onClick={() => setSelectedBatch(null)}>×</button>
            </div>
            <div class="modal-body">
              <div class="batch-summary">
                <div class="batch-header">
                  <div class="batch-title">{selectedBatch.name}</div>
                  <div class="batch-subtitle">
                    古船含水拭检台 · 批次汇总报告
                    {selectedBatch.signedAt && ` · 签署于 ${new Date(selectedBatch.signedAt).toLocaleDateString("zh-CN")}`}
                  </div>
                </div>
                <div class="batch-content">
                  <table class="batch-table">
                    <thead>
                      <tr>
                        <th>构件名称</th>
                        <th>RFID标签</th>
                        <th>最高含水率</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components
                        .filter((c) => selectedBatch.componentIds.includes(c.id))
                        .map((comp) => {
                          const readings = getReadingsByComponent(comp.id);
                          const latestByPoint: Record<string, number> = {};
                          readings.forEach((r) => {
                            if (!latestByPoint[r.pointId]) {
                              latestByPoint[r.pointId] = r.value;
                            }
                          });
                          const maxMoisture = Object.values(latestByPoint).length > 0
                            ? Math.max(...Object.values(latestByPoint))
                            : null;
                          return (
                            <tr key={comp.id}>
                              <td>{comp.name}</td>
                              <td style="font-family: monospace;">{comp.rfidTag}</td>
                              <td style={{
                                color: maxMoisture && maxMoisture > MOISTURE_THRESHOLD
                                  ? "var(--accent-red)"
                                  : maxMoisture
                                  ? "var(--accent-green)"
                                  : "var(--text-muted)",
                                fontWeight: 600,
                              }}>
                                {maxMoisture !== null ? `${maxMoisture.toFixed(1)}%` : "未测"}
                              </td>
                              <td>
                                {comp.isShipmentLocked ? (
                                  <span class="badge badge-danger">🔒 禁装</span>
                                ) : (
                                  <span class="badge badge-success">✓ 正常</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  <div class="batch-signature">
                    <div class="signature-block">
                      <div class="signature-line">
                        {selectedBatch.signature && (
                          <img
                            src={selectedBatch.signature}
                            alt="馆长签字"
                            style="max-height: 40px; display: block; margin: 0 auto;"
                          />
                        )}
                      </div>
                      <div class="signature-label">馆长签字</div>
                    </div>
                    <div class="signature-block">
                      <div class="signature-line">
                        {selectedBatch.signedAt
                          ? new Date(selectedBatch.signedAt).toLocaleDateString("zh-CN")
                          : ""}
                      </div>
                      <div class="signature-label">签署日期</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onClick={() => setSelectedBatch(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
