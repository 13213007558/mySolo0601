<script lang="ts">
  import { store, areaStatsMap, areas, selectedAreaStore } from '@/store'
  import { MapPin, CheckCircle, XCircle, Clock } from 'lucide-svelte'

  $: selectedArea = $selectedAreaStore
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
  <div class="flex items-center gap-2 text-gray-700 font-medium mb-3">
    <MapPin class="w-4 h-4 text-form-600" />
    <span>区域列表</span>
    <span class="text-xs text-gray-400 ml-1">（{$areas.length} 个区域）</span>
  </div>

  <div class="space-y-1.5 max-h-96 overflow-y-auto">
    <button
      class="w-full text-left px-3 py-2.5 rounded-md transition-colors {selectedArea === null
        ? 'bg-form-50 border border-form-200 text-form-700'
        : 'hover:bg-gray-50 border border-transparent'}"
      on:click={() => $selectedAreaStore = null}
    >
      <div class="flex items-center justify-between">
        <span class="font-medium text-sm">全部区域</span>
        <span class="text-xs text-gray-400">点击查看全部</span>
      </div>
    </button>

    {#each $areas as area}
      {@const stats = $areaStatsMap[area]}
      <button
        class="w-full text-left px-3 py-2.5 rounded-md transition-colors {selectedArea === area
          ? 'bg-form-50 border border-form-200 text-form-700'
          : 'hover:bg-gray-50 border border-transparent'}"
        on:click={() => $selectedAreaStore = selectedArea === area ? null : area}
      >
        <div class="font-medium text-sm truncate">{area}</div>
        <div class="flex items-center gap-3 mt-1 text-xs">
          <span class="text-gray-500">共 {stats?.total || 0} 点</span>
          <span class="text-emerald-600 flex items-center gap-0.5">
            <CheckCircle class="w-3 h-3" />
            {stats?.passed || 0}
          </span>
          <span class="text-red-500 flex items-center gap-0.5">
            <XCircle class="w-3 h-3" />
            {stats?.failed || 0}
          </span>
          <span class="text-gray-400 flex items-center gap-0.5">
            <Clock class="w-3 h-3" />
            {stats?.pending || 0}
          </span>
        </div>
      </button>
    {/each}

    {#if $areas.length === 0}
      <div class="text-center py-8 text-gray-400 text-sm">
        暂无区域，点击「加载样例」
      </div>
    {/if}
  </div>
</div>
