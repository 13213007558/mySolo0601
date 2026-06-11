import BatchManager from "../islands/BatchManager.tsx";
import OfflineQueueBanner from "../islands/OfflineQueueBanner.tsx";

export default function BatchesPage() {
  return (
    <div>
      <div class="mb-4">
        <h1 class="card-title" style={{ fontFamily: "var(--font-serif)", fontSize: "26px" }}>
          批次管理与馆长签字
        </h1>
        <p class="text-muted text-sm" style="margin-top: 4px;">
          按批次汇总含水率检测数据，馆长电子签字确认后方可装船发运
        </p>
      </div>
      <BatchManager />
      <OfflineQueueBanner />
    </div>
  );
}
