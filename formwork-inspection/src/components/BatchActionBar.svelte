<script lang="ts">
  import {
    store,
    totalStats,
    selectedAreaStore,
    operatorNameStore,
    globalFilterStore,
    lastBatchSummaryStore,
    pointsStore
  } from '@/store'
  import { downloadCSV, buildExportRows, EXPORT_HEADERS } from '@/utils/validators'
  import { CheckSquare, FileDown, Camera, AlertTriangle } from 'lucide-svelte'

  let showSkipDetail = false

  function handleBatchPass() {
    const area = $selectedAreaStore
    const result = store.batchPass(area, $operatorNameStore)
    if (result.skipped > 0) {
      showSkipDetail = true
      setTimeout(() => (showSkipDetail = false), 8000)
    }
  }

  function handleExport() {
    const rows = buildExportRows($pointsStore)
    downloadCSV('模板支撑验收清单.csv', rows, EXPORT_HEADERS)
  }

  function toggleOnlyNoPhoto() {
    $globalFilterStore = {
      ...$globalFilterStore,
      onlyNoPhoto: !$globalFilterStore.onlyNoPhoto
    }
  }

  function toggleOnlyOutOfThreshold() {
    $globalFilterStore = {
      ...$globalFilterStore,
      onlyOutOfThreshold: !$globalFilterStore.onlyOutOfThreshold
    }
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div class="flex items-center gap-3">
      <button
        on:click={handleBatchPass}
        disabled={$totalStats.total === 0}
        class="flex items-center gap-2 px-4 py-2.5 bg-form-600 text-white rounded-lg text-sm font-medium hover:bg-form-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckSquare class="w-4 h-4" />
        批量复核通过
      </button>

      <div class="text-xs text-gray-500">
        {#if $selectedAreaStore}
          当前区域：<span class="text-gray-700 font-medium">{$selectedAreaStore}</span>
        {:else}
          将作用于<span class="text-gray-700 font-medium">全部点位</span>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        on:click={toggleOnlyNoPhoto}
        class="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors {$globalFilterStore.onlyNoPhoto
          ? 'bg-amber-50 border-amber-300 text-amber-700'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}"
      >
        <Camera class="w-4 h-4" />
        只看缺照片
      </button>

      <button
        on:click={toggleOnlyOutOfThreshold}
        class="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors {$globalFilterStore.onlyOutOfThreshold
          ? 'bg-red-50 border-red-300 text-red-700'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}"
      >
        <AlertTriangle class="w-4 h-4" />
        只看超阈值
      </button>

      <button
        on:click={handleExport}
        class="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        <FileDown class="w-4 h-4" />
        导出 CSV
      </button>
    </div>
  </div>

  {#if showSkipDetail && $lastBatchSummaryStore}
    <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div class="text-sm font-medium text-amber-800">{$lastBatchSummaryStore}</div>
      <div class="text-xs text-amber-600 mt-1">
        缺照片、超阈值、空点位和不合格项会被自动跳过，请逐个处理后再复核
      </div>
    </div>
  {/if}
</div>
