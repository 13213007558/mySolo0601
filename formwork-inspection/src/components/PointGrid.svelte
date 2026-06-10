<script lang="ts">
  import { store, selectedPoint, pointsStore, globalFilterStore } from '@/store'
  import { filterPoints, toDisplayValue, validatePoint, detectDuplicatePoints, type WarningInfo } from '@/utils/validators'
  import { STATUS_LABELS, STATUS_BG } from '@/types'
  import { Camera, AlertTriangle, AlertCircle, Ruler, Wrench, AlignStartHorizontal, Scissors, MoveVertical, ArrowUpFromLine, Rows3, Square } from 'lucide-svelte'
  import type { CheckPoint } from '@/types'

  export let area: string | null = null
  export let duplicates: Array<{ key: string; ids: string[] }> = []

  $: points = $pointsStore
  $: filter = $globalFilterStore

  $: filtered = filterPoints(points, {
    area,
    status: filter.status,
    type: filter.type,
    keyword: filter.keyword,
    onlyNoPhoto: filter.onlyNoPhoto,
    onlyOutOfThreshold: filter.onlyOutOfThreshold
  })

  $: duplicateSet = new Set(duplicates.flatMap((d) => d.ids))

  function getPointWarnings(p: CheckPoint): WarningInfo[] {
    return validatePoint(p)
  }

  function isDuplicate(p: CheckPoint): boolean {
    return duplicateSet.has(p.id)
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'pole_spacing':
        return Ruler
      case 'torque':
        return Wrench
      case 'sweep_rod':
        return AlignStartHorizontal
      case 'cross_brace':
        return Scissors
      case 'upright_vertical':
        return MoveVertical
      case 'top_uplift':
        return ArrowUpFromLine
      case 'level_rod':
        return Rows3
      case 'base_plate':
        return Square
      default:
        return Ruler
    }
  }
</script>

<div class="bg-white rounded-lg border border-gray-200 shadow-sm">
  <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
    <div class="font-medium text-gray-700">
      {#if area}
        {area} · 点位列表
      {:else}
        全部点位
      {/if}
      <span class="text-sm text-gray-400 ml-2">共 {filtered.length} 点</span>
    </div>
  </div>

  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4 max-h-[calc(100vh-360px)] overflow-y-auto">
    {#each filtered as point (point.id)}
      {@const warnings = getPointWarnings(point)}
      {@const hasError = warnings.some((w) => w.level === 'error')}
      {@const hasWarning = warnings.some((w) => w.level === 'warning')}
      {@const dup = isDuplicate(point)}
      {@const IconComp = getTypeIcon(point.type)}

      <button
        class="relative text-left p-3 rounded-lg border-2 transition-all hover:shadow-md {point.id === $selectedPoint?.id
          ? 'border-form-500 bg-form-50'
          : hasError
            ? 'border-red-200 bg-red-50/30 hover:border-red-300'
            : hasWarning || dup
              ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
              : 'border-gray-100 hover:border-form-200'}"
        on:click={() => store.selectPoint(point.id)}
      >
        {#if dup}
          <div class="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
            重复
          </div>
        {/if}

        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-1.5">
            <svelte:component this={IconComp} class="w-4 h-4 text-form-600" />
            <span class="text-xs font-mono text-gray-500">{point.code}</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.5 rounded border {STATUS_BG[point.status]}">
            {STATUS_LABELS[point.status]}
          </span>
        </div>

        <div class="text-sm font-medium text-gray-700 truncate mb-1">{point.typeLabel}</div>
        <div class="text-xs text-gray-400 truncate mb-2">{point.subArea}</div>

        <div class="flex items-center justify-between text-xs">
          <div class="text-gray-600">
            {#if point.measuredValue}
              <span class="font-mono">{toDisplayValue(point.measuredNumeric, point.requiredUnit)}</span>
            {:else}
              <span class="text-gray-300">—</span>
            {/if}
          </div>
          <div class="flex items-center gap-1">
            {#if !point.hasPhoto && point.photos.length === 0}
              <Camera class="w-3.5 h-3.5 text-amber-400" />
            {/if}
            {#if hasError}
              <AlertCircle class="w-3.5 h-3.5 text-red-500" />
            {:else if dup}
              <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
            {/if}
          </div>
        </div>

        {#if point.responsible}
          <div class="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-400 truncate">
            责任人：{point.responsible}
          </div>
        {/if}
      </button>
    {/each}

    {#if filtered.length === 0}
      <div class="col-span-full text-center py-12 text-gray-400">
        暂无符合条件的点位
      </div>
    {/if}
  </div>
</div>
