import { useState, useEffect } from "preact/hooks";
import { Component, SwabPoint, MoistureReading, User, MOISTURE_THRESHOLD } from "../types/index.ts";
import {
  getLatestReading,
  getReadingsByPoint,
  addMoistureReading,
  canPerformRecheck,
  getCurrentUser,
} from "../utils/storage.ts";
import MoistureModal from "./MoistureModal.tsx";

interface SwabMapProps {
  component: Component;
  onUpdate?: () => void;
}

export default function SwabMap({ component, onUpdate }: SwabMapProps) {
  const [selectedPoint, setSelectedPoint] = useState<SwabPoint | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [readings, setReadings] = useState<Record<string, MoistureReading | undefined>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRecheckMode, setIsRecheckMode] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    const latestReadings: Record<string, MoistureReading | undefined> = {};
    component.swabPoints.forEach((point) => {
      latestReadings[point.id] = getLatestReading(point.id);
    });
    setReadings(latestReadings);
  }, [component.id]);

  const getPointStatus = (point: SwabPoint): "normal" | "warning" | "danger" | "untested" => {
    const reading = readings[point.id];
    if (!reading) return "untested";
    if (reading.value > MOISTURE_THRESHOLD) return "danger";
    if (reading.value > MOISTURE_THRESHOLD - 3) return "warning";
    return "normal";
  };

  const handlePointClick = (point: SwabPoint) => {
    setSelectedPoint(point);
    setShowModal(true);
    setIsRecheckMode(false);
  };

  const handleAddReading = (value: number, notes?: string, microPhoto?: string, isRecheck = false) => {
    if (!selectedPoint || !currentUser) return;

    const recheckCheck = isRecheck ? canPerformRecheck(component.id, selectedPoint.id) : { allowed: true };
    if (isRecheck && !recheckCheck.allowed) {
      alert(recheckCheck.reason);
      return;
    }

    addMoistureReading({
      pointId: selectedPoint.id,
      componentId: component.id,
      value,
      timestamp: new Date().toISOString(),
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      microPhoto,
      notes,
      isRecheck,
    });

    const latest = getLatestReading(selectedPoint.id);
    setReadings((prev) => ({
      ...prev,
      [selectedPoint!.id]: latest,
    }));

    setShowModal(false);
    if (onUpdate) onUpdate();
  };

  const handleRecheck = (point: SwabPoint) => {
    setSelectedPoint(point);
    setIsRecheckMode(true);
    setShowModal(true);
  };

  const pointHistory = selectedPoint ? getReadingsByPoint(selectedPoint.id).slice(0, 5) : [];

  return (
    <div class="grid grid-2 gap-4">
      <div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">拭子点位图</h3>
            <span class="badge badge-info">{component.swabPoints.length} 个测点</span>
          </div>
          <div class="card-body">
            <div class="swab-map-container">
              <div class="swab-map-ship"></div>
              {component.swabPoints.map((point, index) => {
                const status = getPointStatus(point);
                const reading = readings[point.id];
                return (
                  <div
                    key={point.id}
                    class={`swab-point ${status}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    onClick={() => handlePointClick(point)}
                    title={`${point.name} - ${reading ? reading.value.toFixed(1) + "%" : "未检测"}`}
                  >
                    <span>{index + 1}</span>
                    <span class="swab-point-label">
                      {point.name}
                      {reading && (
                        <span class="swab-point-value"> · {reading.value.toFixed(1)}%</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 12px;">
              <span class="badge badge-success">正常 ({Object.values(readings).filter(r => r && r.value <= MOISTURE_THRESHOLD - 3).length})</span>
              <span class="badge badge-warning">偏高 ({Object.values(readings).filter(r => r && r.value > MOISTURE_THRESHOLD - 3 && r.value <= MOISTURE_THRESHOLD).length})</span>
              <span class="badge badge-danger">超标 ({Object.values(readings).filter(r => r && r.value > MOISTURE_THRESHOLD).length})</span>
              <span class="badge badge-muted">未测 ({Object.values(readings).filter(r => !r).length})</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">点位详情</h3>
            {selectedPoint && (
              <span class="badge badge-info">{selectedPoint.name}</span>
            )}
          </div>
          <div class="card-body">
            {selectedPoint ? (
              <div class="point-details">
                <h4 class="point-name">{selectedPoint.name}</h4>
                <p class="point-desc">{selectedPoint.description || "暂无描述"}</p>

                <div class="form-group">
                  <label class="form-label">最新含水率</label>
                  {readings[selectedPoint.id] ? (
                    <div class="moisture-display">
                      <div>
                        <span class="moisture-value" style={{ color: getPointStatus(selectedPoint) === "danger" ? "var(--accent-red)" : getPointStatus(selectedPoint) === "warning" ? "var(--accent-gold)" : "var(--accent-green)" }}>
                          {readings[selectedPoint.id]!.value.toFixed(1)}
                        </span>
                        <span class="moisture-unit">%</span>
                      </div>
                      <div class="moisture-status">
                        {getPointStatus(selectedPoint) === "danger" && (
                          <span class="text-danger">⚠️ 超过 {MOISTURE_THRESHOLD}% 阈值，已禁装</span>
                        )}
                        {getPointStatus(selectedPoint) === "warning" && (
                          <span style="color: var(--accent-gold);">接近阈值，请注意监控</span>
                        )}
                        {getPointStatus(selectedPoint) === "normal" && (
                          <span class="text-success">✓ 符合装船标准</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div class="alert alert-info">该点位尚未采样检测</div>
                  )}
                </div>

                <div class="flex gap-2 mb-4">
                  <button class="btn btn-primary btn-sm" onClick={() => handlePointClick(selectedPoint)}>
                    🧪 采样录入
                  </button>
                  {readings[selectedPoint.id] && readings[selectedPoint.id]!.value > MOISTURE_THRESHOLD && (
                    <button class="btn btn-secondary btn-sm" onClick={() => handleRecheck(selectedPoint)}>
                      🔄 复检
                    </button>
                  )}
                </div>

                <h5 style="font-size: 13px; margin-bottom: 8px; color: var(--text-secondary);">历史记录（最近5条）</h5>
                <div class="history-list">
                  {pointHistory.length > 0 ? (
                    pointHistory.map((reading) => (
                      <div key={reading.id} class="history-item">
                        <div>
                          <div class="history-value" style={{ color: reading.value > MOISTURE_THRESHOLD ? "var(--accent-red)" : "var(--accent-green)" }}>
                            {reading.value.toFixed(1)}%
                            {reading.isRecheck && <span class="badge badge-info" style="margin-left: 8px;">复检</span>}
                          </div>
                          <div class="history-operator">操作员：{reading.operatorName}</div>
                        </div>
                        <div class="history-date">
                          {new Date(reading.timestamp).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p class="text-muted text-sm">暂无历史记录</p>
                  )}
                </div>
              </div>
            ) : (
              <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 12px;">📍</div>
                <p>点击左侧点位查看详情</p>
                <p class="text-sm">或直接点击点位录入含水率</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedPoint && (
        <MoistureModal
          point={selectedPoint}
          component={component}
          isRecheck={isRecheckMode}
          onClose={() => setShowModal(false)}
          onSubmit={handleAddReading}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
