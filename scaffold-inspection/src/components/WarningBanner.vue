<template>
  <div
    v-if="warnings.length > 0"
    class="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm"
  >
    <div class="flex items-start gap-3">
      <AlertTriangle class="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div class="flex-1">
        <div class="text-sm font-medium text-amber-800 mb-2">检测到以下问题，请重点关注</div>
        <ul class="space-y-1">
          <li
            v-for="(w, i) in warnings"
            :key="i"
            class="text-xs text-amber-700 flex items-start gap-1.5"
          >
            <span class="text-amber-400 mt-0.5">●</span>
            <span>{{ w }}</span>
          </li>
        </ul>
      </div>
      <button
        @click="dismissed = true"
        class="text-amber-400 hover:text-amber-600 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'
import { useInspectionStore } from '@/stores/inspection'
import { storeToRefs } from 'pinia'
import { detectRepeatProblems } from '@/utils/helpers'

const store = useInspectionStore()
const { records, allStats } = storeToRefs(store)

const dismissed = ref(false)

const warnings = computed(() => {
  if (dismissed.value) return []
  const result: string[] = []

  if (allStats.value.overdue > 0) {
    result.push(`${allStats.value.overdue} 条记录已超过整改期限`)
  }

  const repeats = detectRepeatProblems(records.value)
  if (repeats.length > 0) {
    result.push(`${repeats.length} 处重复问题（${repeats.map((r) => r.key.split('|')[0] + '-' + r.key.split('|')[1]).slice(0, 3).join('、')}${repeats.length > 3 ? '...' : ''}）`)
  }

  if (allStats.value.noPhoto > 0) {
    result.push(`${allStats.value.noPhoto} 条记录缺少整改照片`)
  }

  if (allStats.value.returned > 0) {
    result.push(`${allStats.value.returned} 条记录被退回重改`)
  }

  return result
})
</script>
