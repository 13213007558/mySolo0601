import { useState, useEffect } from "preact/hooks";
import { Component as ComponentType, MOISTURE_THRESHOLD } from "../types/index.ts";
import { getComponents, getReadingsByComponent, seedInitialData } from "../utils/storage.ts";

export default function ComponentList() {
  const [components, setComponents] = useState<ComponentType[]>([]);

  useEffect(() => {
    seedInitialData();
    loadComponents();
  }, []);

  const loadComponents = () => {
    setComponents(getComponents());
  };

  const getComponentStats = (component: ComponentType) => {
    const readings = getReadingsByComponent(component.id);
    const latestByPoint: Record<string, number> = {};

    readings.forEach((r) => {
      if (!latestByPoint[r.pointId] || new Date(r.timestamp) > new Date(readings.find(x => x.pointId === r.pointId)!.timestamp)) {
        latestByPoint[r.pointId] = r.value;
      }
    });

    const values = Object.values(latestByPoint);
    const maxMoisture = values.length > 0 ? Math.max(...values) : null;
    const testedCount = values.length;
    const overThresholdCount = values.filter(v => v > MOISTURE_THRESHOLD).length;

    return { maxMoisture, testedCount, overThresholdCount, totalPoints: component.swabPoints.length };
  };

  return (
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="card-title" style={{ fontFamily: "var(--font-serif)", fontSize: "22px" }}>
          沉船构件总览
        </h2>
        <span class="badge badge-info">
          共 {components.length} 件构件
        </span>
      </div>

      <div class="component-list">
        {components.map((component) => {
          const stats = getComponentStats(component);
          return (
            <a
              key={component.id}
              href={`/component/${component.id}`}
              class={`component-card ${component.isShipmentLocked ? "locked" : ""}`}
            >
              <div class="flex justify-between items-start mb-2">
                <h3 class="component-name">{component.name}</h3>
                {component.isShipmentLocked && (
                  <span class="badge badge-danger">🔒 禁装船</span>
                )}
              </div>

              <div class="component-meta">
                <span class="component-rfid">{component.rfidTag}</span>
                <span>{component.type}</span>
              </div>

              <p class="text-sm text-muted mb-3">
                📍 {component.position}
              </p>

              <div class="component-stats">
                <div class="stat-item">
                  <span class="stat-label">最高含水率</span>
                  <span
                    class="stat-value"
                    style={{
                      color: stats.maxMoisture && stats.maxMoisture > MOISTURE_THRESHOLD
                        ? "var(--accent-red)"
                        : stats.maxMoisture
                        ? "var(--accent-green)"
                        : "var(--text-muted)",
                    }}
                  >
                    {stats.maxMoisture !== null ? `${stats.maxMoisture.toFixed(1)}%` : "--"}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">已测/总测点</span>
                  <span class="stat-value">
                    {stats.testedCount}/{stats.totalPoints}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">超标点位</span>
                  <span
                    class="stat-value"
                    style={{ color: stats.overThresholdCount > 0 ? "var(--accent-red)" : "var(--text-muted)" }}
                  >
                    {stats.overThresholdCount}
                  </span>
                </div>
              </div>

              {component.isShipmentLocked && component.lockedAt && (
                <div style="margin-top: 12px; font-size: 12px; color: var(--accent-red);">
                  ⏰ 锁定于 {new Date(component.lockedAt).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
