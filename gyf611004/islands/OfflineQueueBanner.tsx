import { useState, useEffect } from "preact/hooks";
import { OFFLINE_QUEUE_LIMIT } from "../types/index.ts";
import {
  getOfflineQueue,
  syncOfflineQueue,
  isOfflineQueueFull,
} from "../utils/storage.ts";

export default function OfflineQueueBanner() {
  const [queueSize, setQueueSize] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    updateQueueStatus();
    const interval = setInterval(updateQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateQueueStatus = () => {
    setQueueSize(getOfflineQueue().length);
    setIsFull(isOfflineQueueFull());
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = syncOfflineQueue();
      updateQueueStatus();
      if (result.success > 0) {
        alert(`同步完成：成功 ${result.success} 条，失败 ${result.failed} 条`);
      } else {
        alert("没有需要同步的数据");
      }
    } catch (error) {
      alert("同步失败，请检查网络连接");
    } finally {
      setIsSyncing(false);
    }
  };

  if (queueSize === 0) return null;

  const warningLevel = queueSize >= OFFLINE_QUEUE_LIMIT ? "danger" : queueSize >= 30 ? "warning" : "info";

  return (
    <div
      class="offline-banner"
      style={{
        background: warningLevel === "danger"
          ? "linear-gradient(135deg, #b84a3f 0%, #9c3d33 100%)"
          : warningLevel === "warning"
          ? "linear-gradient(135deg, #c9a962 0%, #b8952e 100%)"
          : "linear-gradient(135deg, #3d5a80 0%, #2d4670 100%)",
      }}
    >
      <span class="offline-icon">📡</span>
      <div class="offline-text">
        <div>
          离线队列：<span class="offline-count">{queueSize}</span>/{OFFLINE_QUEUE_LIMIT} 条
        </div>
        {isFull && (
          <div style="font-size: 12px; margin-top: 2px;">
            ⚠️ 队列已满，请立即同步！
          </div>
        )}
      </div>
      <button
        class="btn btn-sm"
        style={{ background: "rgba(255,255,255,0.2)", color: "#fffaf2" }}
        onClick={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? "同步中..." : "立即同步"}
      </button>
    </div>
  );
}
