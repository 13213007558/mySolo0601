<template>
  <div class="flex items-center gap-2 flex-wrap">
    <button
      @click="handleBatchPass"
      :disabled="loading"
      class="px-3 py-1.5 text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
    >
      <CheckCircle2 class="w-4 h-4" />
      批量复查通过
    </button>

    <span class="text-xs text-gray-400">将作用于当前筛选结果</span>

    <div class="flex-1"></div>

    <button
      @click="handleExportWeekly"
      class="px-3 py-1.5 text-sm text-scaffold-700 bg-scaffold-50 rounded-md border border-scaffold-200 hover:bg-scaffold-100 transition-colors flex items-center gap-1.5"
    >
      <FileBarChart2 class="w-4 h-4" />
      导出周报
    </button>
    <button
      @click="handleExportDetail"
      class="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
    >
      <FileSpreadsheet class="w-4 h-4" />
      导出明细
    </button>

    <div
      v-if="batchResult"
      class="fixed bottom-6 right-6 z-50 max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-4"
    >
      <div class="flex items-start gap-3">
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-800 mb-2">批量处理结果</div>
          <div class="text-xs text-gray-500 mb-2">
            共 {{ batchResult.total }} 条，通过 {{ batchResult.passed }} 条，跳过 {{ batchResult.skipped }} 条
          </div>
          <div v-if="batchResult.reasons.length > 0" class="space-y-1 max-h-40 overflow-y-auto">
            <div
              v-for="(reason, i) in batchResult.reasons.slice(0, 5)"
              :key="i"
              class="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded"
            >
              {{ reason }}
            </div>
            <div v-if="batchResult.reasons.length > 5" class="text-xs text-gray-400">
              还有 {{ batchResult.reasons.length - 5 }} 条...
            </div>
          </div>
        </div>
        <button
          @click="store.clearBatchResult()"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CheckCircle2, FileBarChart2, FileSpreadsheet, X } from 'lucide-vue-next'
import { useInspectionStore } from '@/stores/inspection'
import { storeToRefs } from 'pinia'

const store = useInspectionStore()
const { batchResult } = storeToRefs(store)
const loading = ref(false)

async function handleBatchPass() {
  if (!confirm('确定要批量复查通过当前筛选结果吗？缺照片、逾期、重复问题等异常记录会被自动跳过。')) {
    return
  }
  loading.value = true
  try {
    await store.batchPassRecords()
  } finally {
    loading.value = false
  }
}

function handleExportWeekly() {
  store.exportWeeklyReport()
}

function handleExportDetail() {
  store.exportDetailList()
}
</script>
