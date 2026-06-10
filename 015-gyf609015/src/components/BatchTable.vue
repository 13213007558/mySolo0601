<script setup lang="ts">
import { computed } from 'vue'
import type { Sample } from '@/types'
import { Package, Calendar, Hash, FileText, AlertTriangle } from 'lucide-vue-next'
import { isDateBefore } from '@/utils/date'

const props = defineProps<{
  sample: Sample
}>()

const rows = computed(() => {
  return props.sample.batches.map(b => {
    const dateIssue = props.sample.sealDate && b.entryDate && isDateBefore(b.entryDate, props.sample.sealDate)
    const photoIssue = !b.entryPhoto
    return { ...b, dateIssue, photoIssue, hasIssue: dateIssue || photoIssue }
  })
})
</script>

<template>
  <div class="space-y-3">
    <h4 class="font-serif font-bold text-industrial-800 text-sm flex items-center gap-2">
      <Hash :size="16" class="text-industrial-500" />
      批次对照清单
    </h4>

    <div v-if="rows.length === 0" class="text-xs text-cool-gray-500 italic py-6 px-4 rounded bg-cool-gray-50 border border-cool-gray-100 text-center">
      该样板还没有录入厂家批次和进场批次记录
    </div>

    <div v-else class="overflow-x-auto rounded-md border border-cool-gray-200">
      <table class="w-full text-xs">
        <thead class="bg-industrial-50 text-industrial-700">
          <tr>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">
              <div class="flex items-center gap-1"><Hash :size="12" />序号</div>
            </th>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">
              <div class="flex items-center gap-1"><Package :size="12" />厂家批次号</div>
            </th>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">
              <div class="flex items-center gap-1"><Package :size="12" />进场批次号</div>
            </th>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">
              <div class="flex items-center gap-1"><Calendar :size="12" />进场日期</div>
            </th>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">数量</th>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">
              <div class="flex items-center gap-1"><FileText :size="12" />批次说明</div>
            </th>
            <th class="px-3 py-2.5 text-left font-semibold border-b border-cool-gray-200 whitespace-nowrap">校验</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in rows"
            :key="row.id"
            class="border-b border-cool-gray-100 last:border-b-0 hover:bg-industrial-50/30 transition-colors"
            :class="{ 'bg-warn-orange-50/30': row.hasIssue }"
          >
            <td class="px-3 py-2.5 text-cool-gray-500 font-mono">{{ idx + 1 }}</td>
            <td class="px-3 py-2.5 font-mono text-industrial-700 font-semibold">{{ row.batchNo }}</td>
            <td class="px-3 py-2.5 font-mono text-cool-gray-600">{{ row.entryBatchNo || '—' }}</td>
            <td class="px-3 py-2.5 font-mono">
              <span :class="row.dateIssue ? 'text-alert-red-600' : 'text-cool-gray-700'">{{ row.entryDate || '—' }}</span>
            </td>
            <td class="px-3 py-2.5 text-cool-gray-700 whitespace-nowrap">{{ row.quantity || '—' }}</td>
            <td class="px-3 py-2.5 text-cool-gray-600 max-w-[260px] truncate" :title="row.remark">
              {{ row.remark || '—' }}
            </td>
            <td class="px-3 py-2.5">
              <div v-if="row.hasIssue" class="flex flex-wrap gap-1">
                <span
                  v-if="row.dateIssue"
                  class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-alert-red-50 text-alert-red-700 border border-alert-red-200"
                  title="进场日期早于封样日期"
                >
                  <AlertTriangle :size="10" />日期异常
                </span>
                <span
                  v-if="row.photoIssue"
                  class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warn-orange-50 text-warn-orange-700 border border-warn-orange-200"
                >
                  <AlertTriangle :size="10" />缺照片
                </span>
              </div>
              <span v-else class="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ 正常
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
