<script lang="ts">
  import { getStore } from '$lib/store.svelte';
  import { formatDateTime, exportCSV, downloadCSV, getRecordStatusLabel, getMissingStatusLabel } from '$lib/utils';
  import { Download, Eye, ChevronRight, ChevronDown } from '@lucide/svelte';

  const store = getStore();

  let lastExportTime = $state('');
  let expandedBuildings = $state<Set<string>>(new Set());
  let expandedUnits = $state<Set<string>>(new Set());

  const grouped = $derived(() => {
    const map = new Map<string, Map<string, typeof store.records>>();
    for (const r of store.records) {
      if (!map.has(r.buildingNo)) map.set(r.buildingNo, new Map());
      const unitMap = map.get(r.buildingNo)!;
      if (!unitMap.has(r.unitNo)) unitMap.set(r.unitNo, []);
      unitMap.get(r.unitNo)!.push(r);
    }
    return map;
  });

  function toggleBuilding(key: string) {
    if (expandedBuildings.has(key)) expandedBuildings.delete(key);
    else expandedBuildings.add(key);
  }

  function toggleUnit(key: string) {
    if (expandedUnits.has(key)) expandedUnits.delete(key);
    else expandedUnits.add(key);
  }

  function handleExport() {
    const csv = exportCSV(store.records, store.batches, store.missingParts, store.replenishHistories, store.settings);
    downloadCSV(csv, '门窗移交清单_' + new Date().toISOString().slice(0, 10) + '.csv');
    lastExportTime = new Date().toISOString();
  }

  function getMissingTags(recordId: string) {
    return store.missingParts.filter(m => m.recordId === recordId);
  }

  function getMissingTagStyle(status: string): string {
    const map: Record<string, string> = {
      missing: 'bg-red-light text-red-danger',
      partial: 'bg-amber-light text-amber-warn',
      resolved: 'bg-green-light text-green-ok'
    };
    return map[status] || 'bg-slate-100 text-slate-muted';
  }

  function getStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-light text-amber-warn',
      accepted: 'bg-green-light text-green-ok',
      rejected: 'bg-red-light text-red-danger'
    };
    return map[status] || 'bg-slate-100 text-slate-muted';
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-text">导出中心</h1>
    <p class="text-slate-muted mt-1">按楼栋户号分组预览，一键导出移交清单</p>
  </div>

  <div class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
      <Download size={20} class="text-steel" />
      移交清单导出
    </h2>

    <p class="text-sm text-slate-muted mb-4">
      共 {store.records.length} 条门窗记录，{store.missingParts.length} 条缺件记录
    </p>

    <button
      onclick={handleExport}
      class="bg-steel text-white px-8 py-3 rounded-lg hover:bg-steel-light transition-colors flex items-center gap-2"
    >
      <Download size={18} />
      导出移交清单
    </button>

    {#if lastExportTime}
      <p class="text-xs text-slate-muted mt-3">
        上次导出时间：{formatDateTime(lastExportTime)}
      </p>
    {/if}
  </div>

  <div class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
      <Eye size={20} class="text-steel" />
      清单预览
    </h2>

    {#if store.records.length === 0}
      <p class="text-slate-muted text-sm text-center py-8">暂无记录</p>
    {:else}
      <div class="space-y-2">
        {#each grouped() as [buildingNo, unitMap]}
          {@const buildingKey = buildingNo}
          {@const buildingExpanded = expandedBuildings.has(buildingKey)}
          <div>
            <button
              onclick={() => toggleBuilding(buildingKey)}
              class="w-full bg-slate-50 font-semibold text-slate-text px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-slate-100 transition-colors text-left"
            >
              {#if buildingExpanded}
                <ChevronDown size={18} class="text-slate-muted" />
              {:else}
                <ChevronRight size={18} class="text-slate-muted" />
              {/if}
              {buildingNo}号楼
              <span class="text-xs text-slate-muted font-normal ml-auto">
                {Array.from(unitMap.values()).reduce((s, arr) => s + arr.length, 0)} 条记录
              </span>
            </button>

            {#if buildingExpanded}
              <div class="ml-4 mt-1 space-y-1">
                {#each unitMap as [unitNo, records]}
                  {@const unitKey = `${buildingKey}_${unitNo}`}
                  {@const unitExpanded = expandedUnits.has(unitKey)}
                  <div>
                    <button
                      onclick={() => toggleUnit(unitKey)}
                      class="w-full bg-slate-50/50 font-semibold text-slate-text px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-slate-100 transition-colors text-left text-sm"
                    >
                      {#if unitExpanded}
                        <ChevronDown size={16} class="text-slate-muted" />
                      {:else}
                        <ChevronRight size={16} class="text-slate-muted" />
                      {/if}
                      {unitNo}单元
                      <span class="text-xs text-slate-muted font-normal ml-auto">
                        {records.length} 条
                      </span>
                    </button>

                    {#if unitExpanded}
                      <div class="ml-4 mt-1 overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead>
                            <tr class="border-b border-slate-border text-slate-muted text-left text-xs">
                              <th class="pb-2 pr-3 font-medium">洞口编码</th>
                              <th class="pb-2 pr-3 font-medium">规格</th>
                              <th class="pb-2 pr-3 font-medium">玻璃</th>
                              <th class="pb-2 pr-3 font-medium">状态</th>
                              <th class="pb-2 font-medium">缺件</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each records as record}
                              <tr class="border-b border-slate-border/50 hover:bg-slate-50">
                                <td class="py-2 pr-3 font-mono text-xs">{record.openingCode}</td>
                                <td class="py-2 pr-3 max-w-[120px] truncate">{record.spec}</td>
                                <td class="py-2 pr-3 max-w-[100px] truncate">{record.glassType}</td>
                                <td class="py-2 pr-3">
                                  <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {getStatusColor(record.status)}">
                                    {getRecordStatusLabel(record.status)}
                                  </span>
                                </td>
                                <td class="py-2">
                                  {#each getMissingTags(record.id) as part}
                                    <span class="inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1 mb-0.5 {getMissingTagStyle(part.status)}">
                                      {part.partName}({getMissingStatusLabel(part.status)})
                                    </span>
                                  {/each}
                                  {#if getMissingTags(record.id).length === 0}
                                    <span class="text-xs text-slate-muted">-</span>
                                  {/if}
                                </td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
