import ComponentList from "../islands/ComponentList.tsx";
import RecheckTaskList from "../islands/RecheckTaskList.tsx";
import OfflineQueueBanner from "../islands/OfflineQueueBanner.tsx";

export default function Home() {
  return (
    <div>
      <div class="grid grid-3 gap-4 mb-4">
        <div class="card" style="background: linear-gradient(135deg, #4a7c59 0%, #3d6b4a 100%); color: #fffaf2;">
          <div class="card-body">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">构件总数</div>
            <div style="font-family: var(--font-serif); font-size: 36px; font-weight: 700;">4</div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">明代沉船木构件</div>
          </div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, #b84a3f 0%, #9c3d33 100%); color: #fffaf2;">
          <div class="card-body">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">禁装构件</div>
            <div style="font-family: var(--font-serif); font-size: 36px; font-weight: 700;">0</div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">含水率超18%阈值</div>
          </div>
        </div>
        <div class="card" style="background: linear-gradient(135deg, #c9a962 0%, #b8952e 100%); color: #fffaf2;">
          <div class="card-body">
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">待复检任务</div>
            <div style="font-family: var(--font-serif); font-size: 36px; font-weight: 700;">0</div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 4px;">复检间隔≥4小时</div>
          </div>
        </div>
      </div>

      <div class="grid grid-3 gap-4">
        <div style="grid-column: span 2;">
          <ComponentList />
        </div>
        <div>
          <RecheckTaskList />
        </div>
      </div>

      <OfflineQueueBanner />
    </div>
  );
}
