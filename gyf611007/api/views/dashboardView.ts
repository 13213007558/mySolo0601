import type { Batch, SessionUser } from "../types.js";

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "待审评", color: "text-amber-300", bg: "bg-amber-400/10" },
  in_progress: {
    label: "审评中",
    color: "text-tea-300",
    bg: "bg-tea-400/10",
  },
  locked: { label: "已锁定", color: "text-charcoal-200", bg: "bg-charcoal-400/30" },
  downgraded: {
    label: "已降级",
    color: "text-copper-300",
    bg: "bg-copper-400/10",
  },
};

export function renderDashboard(batches: Batch[], user: SessionUser): string {
  const batchCards = batches
    .map((b) => renderBatchCard(b))
    .join("");

  const canCreate = user.role === "chief" || user.role === "admin";

  return `
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h2 class="font-serif text-2xl font-bold text-amber-200">批次管理</h2>
        <p class="text-charcoal-200 text-sm mt-1">共 ${batches.length} 个批次</p>
      </div>
      ${canCreate ? `
        <button
          hx-get="/batches/new"
          hx-target="#batch-form-modal"
          hx-swap="innerHTML"
          class="btn-primary flex items-center gap-2"
          _="on click add .block to #batch-form-modal then remove .hidden from #batch-form-modal"
        >
          <span class="text-lg">+</span>
          新建批次
        </button>
      ` : ""}
    </div>

    <div id="batch-form-modal" class="hidden fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto"></div>
    </div>

    <div
      id="batch-list"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      hx-get="/api/batches"
      hx-trigger="batch-updated from:body"
      hx-swap="innerHTML"
    >
      ${batchCards}
    </div>
  `;
}

export function renderBatchCard(batch: Batch): string {
  const meta = STATUS_META[batch.status] || STATUS_META.pending;

  return `
    <div class="batch-card group"
         hx-get="/cupping/${batch.id}"
         hx-target="body"
         hx-push-url="true">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h3 class="font-serif text-lg font-bold text-amber-200 batch-title group-hover:text-amber-300 transition-colors">
            ${batch.batch_code}
          </h3>
          <p class="text-amber-100 text-sm">${batch.tea_name}</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-medium ${meta.bg} ${meta.color}">
          ${meta.label}
        </span>
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-charcoal-200">产地</span>
          <span class="text-amber-100">${batch.origin || "—"}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-charcoal-200">重评次数</span>
          <span class="text-amber-100">${batch.re_eval_count}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-charcoal-200">创建时间</span>
          <span class="text-amber-100 text-xs">${new Date(
            batch.created_at
          ).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-charcoal-400">
        <p class="text-xs text-amber-300/80">
          点击进入审评室 →
        </p>
      </div>
    </div>
  `;
}

export function renderNewBatchForm(): string {
  return `
    <div class="flex items-center justify-between mb-6">
      <h3 class="font-serif text-xl font-bold text-amber-200">新建批次</h3>
      <button
        _="on click add .hidden to #batch-form-modal then call #batch-form-modal.querySelector('div').classList.add('opacity-0')"
        class="text-charcoal-200 hover:text-amber-200 text-2xl leading-none"
      >
        ×
      </button>
    </div>
    <form
      hx-post="/batches"
      hx-target="body"
      hx-push-url="true"
      hx-headers='{"Content-Type": "application/x-www-form-urlencoded"}'
      class="space-y-4"
    >
      <div>
        <label class="block text-sm text-amber-100 mb-2">批次编号</label>
        <input
          type="text"
          name="batch_code"
          required
          class="input-field"
          placeholder="如：T2026-003"
        />
      </div>
      <div>
        <label class="block text-sm text-amber-100 mb-2">茶叶名称</label>
        <input
          type="text"
          name="tea_name"
          required
          class="input-field"
          placeholder="如：武夷大红袍"
        />
      </div>
      <div>
        <label class="block text-sm text-amber-100 mb-2">产地</label>
        <input
          type="text"
          name="origin"
          class="input-field"
          placeholder="如：福建武夷山"
        />
      </div>
      <div>
        <label class="block text-sm text-amber-100 mb-2">样本数量</label>
        <input
          type="number"
          name="sample_count"
          min="1"
          max="10"
          value="3"
          class="input-field"
        />
      </div>
      <div class="flex gap-3 pt-4">
        <button
          type="button"
          _="on click add .hidden to #batch-form-modal"
          class="btn-secondary flex-1"
        >
          取消
        </button>
        <button type="submit" class="btn-primary flex-1">
          创建批次
        </button>
      </div>
    </form>
  `;
}
