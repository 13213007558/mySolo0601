<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div class="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
      <h3 class="font-semibold text-gray-900 flex items-center gap-2">
        <List class="w-5 h-5 text-rebar-orange" />
        差异明细
        <span class="text-xs font-normal text-gray-500">({{ items.length }} 条)</span>
      </h3>
    </div>
    <div class="overflow-x-auto max-h-96">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th class="text-left py-2.5 px-3 text-xs font-medium text-gray-500">楼栋</th>
            <th class="text-left py-2.5 px-3 text-xs font-medium text-gray-500">构件</th>
            <th class="text-left py-2.5 px-3 text-xs font-medium text-gray-500">规格</th>
            <th class="text-right py-2.5 px-3 text-xs font-medium text-gray-500">下料</th>
            <th class="text-right py-2.5 px-3 text-xs font-medium text-gray-500">实收</th>
            <th class="text-right py-2.5 px-3 text-xs font-medium text-gray-500">差异</th>
            <th class="text-center py-2.5 px-3 text-xs font-medium text-gray-500">状态</th>
            <th class="text-left py-2.5 px-3 text-xs font-medium text-gray-500">处理情况</th>
            <th class="text-center py-2.5 px-3 text-xs font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="item in items"
            :key="item.id"
            class="hover:bg-gray-50 cursor-pointer"
            :class="{ 'bg-yellow-50': item.status === 'pending', 'bg-purple-50': item.status === 'bad' }"
            @click="$emit('select', item)"
          >
            <td class="py-2.5 px-3 text-gray-900">{{ item.building || '-' }}</td>
            <td class="py-2.5 px-3 text-gray-900">{{ item.component || '-' }}</td>
            <td class="py-2.5 px-3">
              <div class="font-medium text-gray-900">{{ item.specRaw }}</div>
              <div class="text-xs text-gray-500">{{ item.spec.grade }} Φ{{ item.spec.diameter }}</div>
            </td>
            <td class="py-2.5 px-3 text-right text-gray-900">{{ item.plannedQty || 0 }}</td>
            <td class="py-2.5 px-3 text-right text-gray-900">{{ item.actualQty || 0 }}</td>
            <td class="py-2.5 px-3 text-right font-medium" :class="diffClass(item.diffQty)">
              {{ item.diffQty > 0 ? '+' : '' }}{{ item.diffQty }}
            </td>
            <td class="py-2.5 px-3 text-center">
              <span
                class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                :style="{ backgroundColor: statusColor(item.status) }"
              >
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td class="py-2.5 px-3">
              <template v-if="item.judgment">
                <div class="text-xs font-medium text-green-600">{{ item.judgment.decisionLabel }}</div>
                <div class="text-xs text-gray-500 truncate max-w-32" :title="item.judgment.reason">
                  {{ item.judgment.reason }}
                </div>
              </template>
              <template v-else>
                <span class="text-xs text-gray-400">未处理</span>
              </template>
            </td>
            <td class="py-2.5 px-3 text-center">
              <button
                @click.stop="$emit('judge', item)"
                class="text-xs text-rebar-blue hover:text-rebar-blue-light"
              >
                {{ item.judgment ? '查看' : '处理' }}
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="9" class="py-8 text-center text-gray-400 text-sm">
              没有符合条件的记录
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { List } from 'lucide-vue-next'
import type { RebarItem, DiffStatus } from '@/types'
import { DIFF_STATUS_LABELS, DIFF_STATUS_COLORS } from '@/types'

defineProps<{
  items: RebarItem[]
}>()

defineEmits<{
  'select': [item: RebarItem]
  'judge': [item: RebarItem]
}>()

function diffClass(diff: number): string {
  if (diff < 0) return 'text-red-600'
  if (diff > 0) return 'text-green-600'
  return 'text-gray-500'
}

function statusColor(status: DiffStatus | string): string {
  return DIFF_STATUS_COLORS[status as DiffStatus] || '#9CA3AF'
}

function statusLabel(status: DiffStatus | string): string {
  return DIFF_STATUS_LABELS[status as DiffStatus] || status
}
</script>
