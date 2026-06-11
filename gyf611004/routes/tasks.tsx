import RecheckTaskList from "../islands/RecheckTaskList.tsx";
import OfflineQueueBanner from "../islands/OfflineQueueBanner.tsx";

export default function TasksPage() {
  return (
    <div>
      <div class="mb-4">
        <h1 class="card-title" style={{ fontFamily: "var(--font-serif)", fontSize: "26px" }}>
          复检任务管理
        </h1>
        <p class="text-muted text-sm" style="margin-top: 4px;">
          含水率超阈值的构件将自动生成复检任务，同构件两次复检间隔不得少于 4 小时
        </p>
      </div>
      <RecheckTaskList />
      <OfflineQueueBanner />
    </div>
  );
}
