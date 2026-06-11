<script lang="ts">
  import { getStore } from '$lib/store.svelte';
  import { formatDateTime, getMissingStatusLabel } from '$lib/utils';
  import { UserCircle, Clock } from '@lucide/svelte';

  const store = getStore();

  let newResponsible = $state('');
  let confirmMessage = $state('');

  const sortedHistories = $derived(
    [...store.replenishHistories].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  const responsibleStats = $derived(() => {
    const map = new Map<string, { count: number; lastActive: string }>();
    for (const h of store.replenishHistories) {
      const existing = map.get(h.responsible);
      if (existing) {
        existing.count++;
        if (h.createdAt > existing.lastActive) existing.lastActive = h.createdAt;
      } else {
        map.set(h.responsible, { count: 1, lastActive: h.createdAt });
      }
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
  });

  const totalCount = $derived(store.replenishHistories.length);

  const statusTransitions = $derived(() => {
    const parts = store.missingParts;
    const missing = parts.filter(p => p.status === 'missing').length;
    const partial = parts.filter(p => p.status === 'partial').length;
    const resolved = parts.filter(p => p.status === 'resolved').length;
    return { missing, partial, resolved };
  });

  function handleChangeResponsible() {
    const name = newResponsible.trim();
    if (!name) return;
    store.changeResponsible(name);
    newResponsible = '';
    confirmMessage = `责任人已交接为「${name}」`;
    setTimeout(() => { confirmMessage = ''; }, 3000);
  }

  function getPartInfo(missingId: string) {
    const part = store.missingParts.find(m => m.id === missingId);
    if (!part) return { partName: '-', quantity: 0, openingCode: '-' };
    const record = store.records.find(r => r.id === part.recordId);
    return {
      partName: part.partName,
      quantity: part.quantity,
      openingCode: record?.openingCode ?? '-'
    };
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-text">补货记录</h1>
    <p class="text-slate-muted mt-1">查看补货时间线，管理责任人交接</p>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
          <UserCircle size={20} class="text-steel" />
          责任人管理
        </h2>

        <div class="space-y-4">
          <div class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
            <div>
              <p class="text-sm text-slate-muted">当前责任人</p>
              <p class="text-lg font-semibold text-slate-text">
                {store.settings.currentResponsible || '未设置'}
              </p>
              {#if store.settings.lastUpdated}
                <p class="text-xs text-slate-muted mt-0.5">
                  更新于 {formatDateTime(store.settings.lastUpdated)}
                </p>
              {/if}
            </div>
            <div class="w-12 h-12 rounded-full bg-steel/10 flex items-center justify-center text-steel font-bold text-lg">
              {store.settings.currentResponsible ? store.settings.currentResponsible[0] : '?'}
            </div>
          </div>

          {#if confirmMessage}
            <div class="bg-green-light text-green-ok rounded-lg px-4 py-2.5 text-sm">
              {confirmMessage}
            </div>
          {/if}

          <form onsubmit={(e) => { e.preventDefault(); handleChangeResponsible(); }} class="flex items-center gap-3">
            <input
              type="text"
              bind:value={newResponsible}
              placeholder="输入新责任人姓名"
              class="flex-1 border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30"
            />
            <button
              type="submit"
              class="bg-steel text-white px-5 py-2 rounded-lg hover:bg-steel-light transition-colors text-sm whitespace-nowrap"
            >
              交接
            </button>
          </form>
        </div>

        <div class="mt-6 pt-5 border-t border-slate-border/50">
          <h3 class="text-sm font-semibold text-slate-text mb-3">补货经办人统计</h3>
          {#if responsibleStats().length === 0}
            <p class="text-sm text-slate-muted">暂无经办人记录</p>
          {:else}
            <div class="space-y-2">
              {#each responsibleStats() as [name, stat]}
                <div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-steel/10 flex items-center justify-center text-steel font-semibold text-sm">
                      {name[0]}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-text">{name}</p>
                      <p class="text-xs text-slate-muted">最近活跃 {formatDateTime(stat.lastActive)}</p>
                    </div>
                  </div>
                  <span class="text-sm font-semibold text-steel">{stat.count} 次</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
          <Clock size={20} class="text-steel" />
          补货时间线
        </h2>

        {#if sortedHistories.length === 0}
          <p class="text-slate-muted text-sm text-center py-8">暂无补货记录</p>
        {:else}
          <div class="relative">
            <div class="absolute left-[5px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
            <div class="space-y-4">
              {#each sortedHistories as entry}
                {@const info = getPartInfo(entry.missingId)}
                <div class="relative pl-8">
                  <div class="absolute left-0 top-2 w-3 h-3 rounded-full bg-steel border-2 border-white shadow-sm"></div>
                  <div class="ml-4 bg-slate-50 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                      <div class="w-9 h-9 rounded-full bg-steel/10 flex items-center justify-center text-steel font-semibold text-sm shrink-0">
                        {entry.responsible ? entry.responsible[0] : '?'}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <p class="text-sm font-semibold text-slate-text">{entry.responsible || '未知'}</p>
                          <p class="text-xs text-slate-muted">{formatDateTime(entry.createdAt)}</p>
                        </div>
                        <div class="mt-1.5 space-y-1">
                          <p class="text-sm text-slate-text">
                            <span class="font-medium">缺件:</span>
                            {info.partName}
                            <span class="text-slate-muted ml-1">×{info.quantity}</span>
                            <span class="text-steel ml-1">→ 补 {entry.replenishedQty} 件</span>
                          </p>
                          <p class="text-xs text-slate-muted">
                            洞口编码: {info.openingCode}
                          </p>
                          {#if entry.note}
                            <p class="text-xs text-slate-muted mt-1 bg-white rounded px-2 py-1">
                              {entry.note}
                            </p>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="col-span-1 space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-text mb-4">补货汇总</h2>
        <div class="space-y-4">
          <div class="text-center py-3 bg-slate-50 rounded-lg">
            <p class="text-3xl font-bold text-steel">{totalCount}</p>
            <p class="text-xs text-slate-muted mt-1">总补货次数</p>
          </div>

          <div>
            <h3 class="text-sm font-medium text-slate-text mb-2">缺件状态分布</h3>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-red-danger">缺件</span>
                <span class="font-semibold text-slate-text">{statusTransitions().missing}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-amber-warn">部分补货</span>
                <span class="font-semibold text-slate-text">{statusTransitions().partial}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-green-ok">已补齐</span>
                <span class="font-semibold text-slate-text">{statusTransitions().resolved}</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-border/50">
            <h3 class="text-sm font-medium text-slate-text mb-2">经办人补货量</h3>
            {#if responsibleStats().length === 0}
              <p class="text-xs text-slate-muted">暂无数据</p>
            {:else}
              <div class="space-y-2">
                {#each responsibleStats() as [name, stat]}
                  {@const pct = totalCount > 0 ? (stat.count / totalCount * 100) : 0}
                  <div>
                    <div class="flex items-center justify-between text-sm mb-1">
                      <span class="text-slate-text">{name}</span>
                      <span class="text-slate-muted text-xs">{stat.count} 次 ({pct.toFixed(0)}%)</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                      <div class="bg-steel h-1.5 rounded-full transition-all" style="width: {pct}%"></div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
