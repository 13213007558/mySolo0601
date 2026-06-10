<script setup lang="ts">
import { useFilterStore } from '@/stores/filter'
import { useUIStore } from '@/stores/ui'
import { useSampleStore } from '@/stores/sample'
import { STATUS_OPTIONS } from '@/types'
import { Search, Plus, Download, RotateCcw, Calendar, Filter, X } from 'lucide-vue-next'

const filter = useFilterStore()
const ui = useUIStore()
const sample = useSampleStore()

const statusOptions = STATUS_OPTIONS

function onExport() {
  ui.openExport()
}

function onCreate() {
  ui.openCreate()
}

function onResetAll() {
  filter.reset()
  sample.resetToMock()
}
</script>

<template>
  <div class="bg-industrial-800 rounded-md shadow-card overflow-hidden">
    <div class="px-5 py-4 flex flex-wrap items-center gap-4 border-b border-industrial-700/50">
      <div class="flex items-center gap-3">
        <Filter :size="18" class="text-industrial-300" />
        <h2 class="font-serif font-bold text-white text-lg tracking-wide">幕墙样板封样对账</h2>
      </div>
      <div class="flex-1"></div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-industrial-600 text-industrial-200 hover:bg-industrial-700/50 transition-colors"
          @click="onResetAll"
        >
          <RotateCcw :size="14" />
          重置数据
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
          @click="onExport"
        >
          <Download :size="14" />
          导出对账表
          <span class="bg-amber-gold-500 text-industrial-900 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
            {{ filter.filteredSamples.length }}
          </span>
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs rounded bg-amber-gold-500 hover:bg-amber-gold-400 text-industrial-900 font-bold transition-colors shadow-sm"
          @click="onCreate"
        >
          <Plus :size="14" />
          新增样板
        </button>
      </div>
    </div>

    <div class="px-5 py-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-1 rounded bg-industrial-900/50 p-1 border border-industrial-700/50">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          :class="[
            'px-3 py-1.5 text-xs rounded font-medium transition-all',
            filter.state.status === opt.value
              ? 'bg-white text-industrial-800 shadow-sm'
              : 'text-industrial-200 hover:text-white hover:bg-white/5',
          ]"
          @click="filter.setStatus(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="relative min-w-[260px]">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
        <input
          :value="filter.state.keyword"
          type="text"
          placeholder="搜索样板编号/厂家/批次..."
          class="w-full h-9 pl-9 pr-8 rounded bg-industrial-900/50 border border-industrial-700/50 text-white placeholder-industrial-400 text-xs focus:outline-none focus:border-amber-gold-500/70 focus:ring-1 focus:ring-amber-gold-500/30 transition-colors"
          @input="(e: Event) => filter.setKeyword((e.target as HTMLInputElement).value)"
        />
        <button
          v-if="filter.state.keyword"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-industrial-400"
          @click="filter.setKeyword('')"
        >
          <X :size="12" />
        </button>
      </div>

      <div class="flex items-center gap-2">
        <Calendar :size="14" class="text-industrial-400" />
        <input
          :value="filter.state.dateStart"
          type="date"
          class="h-9 px-2 rounded bg-industrial-900/50 border border-industrial-700/50 text-white text-xs focus:outline-none focus:border-amber-gold-500/70"
          @change="(e: Event) => filter.setDateRange((e.target as HTMLInputElement).value, filter.state.dateEnd)"
        />
        <span class="text-industrial-500 text-xs">至</span>
        <input
          :value="filter.state.dateEnd"
          type="date"
          class="h-9 px-2 rounded bg-industrial-900/50 border border-industrial-700/50 text-white text-xs focus:outline-none focus:border-amber-gold-500/70"
          @change="(e: Event) => filter.setDateRange(filter.state.dateStart, (e.target as HTMLInputElement).value)"
        />
        <button
          v-if="filter.state.dateStart || filter.state.dateEnd"
          class="text-xs text-industrial-400 hover:text-white underline underline-offset-2 ml-1"
          @click="filter.setDateRange('', '')"
        >
          清除
        </button>
      </div>

      <div class="flex-1"></div>

      <div class="text-xs text-industrial-300">
        筛选结果
        <span class="text-amber-gold-400 font-bold ml-1">{{ filter.filteredSamples.length }}</span>
        <span class="text-industrial-500 mx-1">/</span>
        <span class="text-industrial-400">{{ sample.samples.length }}</span>
        条
      </div>
    </div>
  </div>
</template>
