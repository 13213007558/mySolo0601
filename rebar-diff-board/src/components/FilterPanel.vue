<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Filter class="w-5 h-5 text-rebar-orange" />
        <h3 class="font-semibold text-gray-900">筛选条件</h3>
        <span class="text-xs text-gray-500">({{ filteredCount }} 条)</span>
      </div>
      <button
        v-if="hasActiveFilters"
        @click="$emit('reset')"
        class="text-xs text-rebar-orange hover:text-rebar-orange-dark flex items-center gap-1"
      >
        <X class="w-3.5 h-3.5" />
        重置
      </button>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">规格关键词</label>
      <input
        type="text"
        :value="filter.specKeyword"
        @input="$emit('update:filter', { specKeyword: ($event.target as HTMLInputElement).value })"
        placeholder="如：HRB400、Φ20..."
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rebar-orange focus:border-transparent"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="status in statusOptions"
          :key="status.value"
          @click="$emit('toggle-status', status.value)"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            filter.status.includes(status.value)
              ? 'text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
          :style="{ backgroundColor: filter.status.includes(status.value) ? status.color : undefined }"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">楼栋</label>
      <div class="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
        <button
          v-for="b in buildings"
          :key="b"
          @click="$emit('toggle-building', b)"
          :class="[
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            filter.building.includes(b)
              ? 'bg-rebar-blue text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ b }}
        </button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">差异数量范围</label>
      <div class="flex items-center gap-2">
        <input
          type="number"
          :value="filter.diffMin ?? ''"
          @input="$emit('update:filter', { diffMin: ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null })"
          placeholder="最小"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rebar-orange focus:border-transparent"
        />
        <span class="text-gray-400">~</span>
        <input
          type="number"
          :value="filter.diffMax ?? ''"
          @input="$emit('update:filter', { diffMax: ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null })"
          placeholder="最大"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rebar-orange focus:border-transparent"
        />
      </div>
    </div>

    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        :checked="filter.onlyUnresolved"
        @change="$emit('update:filter', { onlyUnresolved: ($event.target as HTMLInputElement).checked })"
        id="onlyUnresolved"
        class="w-4 h-4 text-rebar-orange focus:ring-rebar-orange"
      />
      <label for="onlyUnresolved" class="text-sm text-gray-700">仅显示未处理</label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Filter, X } from 'lucide-vue-next'
import type { FilterState, DiffStatus } from '@/types'

defineProps<{
  filter: FilterState
  buildings: string[]
  filteredCount: number
  hasActiveFilters: boolean
}>()

defineEmits<{
  'update:filter': [filter: Partial<FilterState>]
  'toggle-building': [building: string]
  'toggle-status': [status: DiffStatus]
  'reset': []
}>()

const statusOptions = [
  { value: 'shortage' as DiffStatus, label: '少料', color: '#DC2626' },
  { value: 'surplus' as DiffStatus, label: '多料', color: '#059669' },
  { value: 'matched' as DiffStatus, label: '一致', color: '#6B7280' },
  { value: 'pending' as DiffStatus, label: '待确认', color: '#D97706' },
  { value: 'bad' as DiffStatus, label: '坏行', color: '#7C3AED' }
]
</script>
