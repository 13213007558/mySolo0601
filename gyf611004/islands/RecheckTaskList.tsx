import { useState, useEffect } from "preact/hooks";
import { RecheckTask, Component } from "../types/index.ts";
import {
  getPendingRecheckTasks,
  getComponentById,
  getRecheckTasks,
  seedInitialData,
} from "../utils/storage.ts";

export default function RecheckTaskList() {
  const [tasks, setTasks] = useState<RecheckTask[]>([]);
  const [components, setComponents] = useState<Record<string, Component | undefined>>({});
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    seedInitialData();
    loadTasks();
  }, [activeTab]);

  const loadTasks = () => {
    const taskList = activeTab === "pending"
      ? getPendingRecheckTasks()
      : getRecheckTasks();
    setTasks(taskList);

    const compMap: Record<string, Component | undefined> = {};
    taskList.forEach((task) => {
      if (!compMap[task.componentId]) {
        compMap[task.componentId] = getComponentById(task.componentId);
      }
    });
    setComponents(compMap);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">复检任务待办</h2>
        <span class="badge badge-danger">
          {getPendingRecheckTasks().length} 项待处理
        </span>
      </div>
      <div class="card-body">
        <div class="tabs">
          <div
            class={`tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            待处理 ({getPendingRecheckTasks().length})
          </div>
          <div
            class={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            全部任务
          </div>
        </div>

        {tasks.length === 0 ? (
          <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
            <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
            <p>暂无待处理的复检任务</p>
          </div>
        ) : (
          <div class="reading-list">
            {tasks.map((task) => {
              const component = components[task.componentId];
              const point = component?.swabPoints.find((p) => p.id === task.pointId);
              return (
                <div
                  key={task.id}
                  class={`task-item ${task.status === "completed" ? "completed" : ""}`}
                >
                  <div class="task-title">
                    {component?.name || "未知构件"} - {point?.name || "未知点位"}
                  </div>
                  <div class="task-meta">
                    <span>📋 {task.reason}</span>
                    <span>⏰ 创建于 {formatTime(task.createdAt)}</span>
                  </div>
                  <div style="margin-top: 8px;">
                    <a
                      href={`/component/${task.componentId}`}
                      class="btn btn-sm btn-primary"
                    >
                      前往复检 →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
