<template>
  <div
    v-if="badRows.length > 0"
    class="bg-purple-50 border border-purple-200 rounded-lg p-4"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-5 h-5 text-purple-600" />
        <h3 class="font-semibold text-purple-900">
          坏行警告（{{ badRows.length }} 条）
        </h3>
      </div>
      <button
        @click="expanded = !expanded"
        class="text-xs text-purple-600 hover:text-purple-800"
      >
        {{ expanded ? '收起' : '展开' }}
      </button>
    </div>
    <p class="text-sm text-purple-700 mb-2">
      以下行因格式问题无法识别，已单独列出，不影响正常统计。
    </p>
    <div v-if="expanded" class="space-y-2 max-h-48 overflow-y-auto">
      <div
        v-for="row in badRows"
        :key="row.id"
        class="bg-white rounded p-3 text-sm border border-purple-200"
      >
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs text-purple-600 font-medium">第 {{ row.lineNumber }} 行</span>
            <span class="mx-2 text-purple-300">·</span>
            <span class="text-xs text-purple-500">{{ row.type === 'plan' ? '下料单' : '实收表' }}</span>
          </div>
        </div>
        <div class="text-red-600 text-xs mt-1">{{ row.reason }}</div>
        <div class="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded truncate">
          {{ row.rawData }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import type { BadRow } from '@/types'

defineProps<{
  badRows: BadRow[]
}>()

const expanded = ref(false)
</script>
