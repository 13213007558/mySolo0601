<script lang="ts">
  import { detectDuplicatePoints, type WarningInfo } from '@/utils/validators'
  import type { CheckPoint } from '@/types'
  import { AlertTriangle, Copy, AlertCircle, X } from 'lucide-svelte'

  export let points: CheckPoint[] = []

  $: duplicates = detectDuplicatePoints(points)
  $: hasDuplicates = duplicates.length > 0

  $: mixedUnitPoints = points.filter((p) => {
    if (!p.measuredValue) return false
    if (p.requiredUnit !== 'mm') return false
    return /[米m]/.test(p.measuredValue) && !/mm/.test(p.measuredValue)
  })
  $: hasMixedUnits = mixedUnitPoints.length > 0

  $: emptyPoints = points.filter((p) => !p.measuredValue && p.threshold.requiredUnit !== 'none')
  $: hasEmptyPoints = emptyPoints.length > 0

  $: showBanner = hasDuplicates || hasMixedUnits || hasEmptyPoints

  let dismissed = false

  $: visible = showBanner && !dismissed
</script>

{#if visible}
  <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
    <div class="flex items-start justify-between">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div class="space-y-2">
          <div class="font-medium text-amber-800 text-sm">检测到以下问题，请确认</div>
          <div class="space-y-1.5 text-sm">
            {#if hasDuplicates}
              <div class="flex items-center gap-2 text-amber-700">
                <Copy class="w-4 h-4" />
                <span>
                  <span class="font-medium">{duplicates.length}</span> 处重复打点
                  （{duplicates.map((d) => `${d.area}/${d.type}`).slice(0, 3).join('、')}{duplicates.length > 3 ? '...' : ''}）
                </span>
              </div>
            {/if}
            {#if hasMixedUnits}
              <div class="flex items-center gap-2 text-amber-700">
                <AlertCircle class="w-4 h-4" />
                <span>
                  <span class="font-medium">{mixedUnitPoints.length}</span> 处单位混用（米/毫米）
                  （{mixedUnitPoints.slice(0, 3).map((p) => p.code).join('、')}{mixedUnitPoints.length > 3 ? '...' : ''}）
                </span>
              </div>
            {/if}
            {#if hasEmptyPoints}
              <div class="flex items-center gap-2 text-amber-700">
                <AlertCircle class="w-4 h-4" />
                <span>
                  <span class="font-medium">{emptyPoints.length}</span> 处空点位（未填写实测值）
                </span>
              </div>
            {/if}
          </div>
        </div>
      </div>
      <button on:click={() => (dismissed = true)} class="p-1 hover:bg-amber-100 rounded">
        <X class="w-4 h-4 text-amber-500" />
      </button>
    </div>
  </div>
{/if}
