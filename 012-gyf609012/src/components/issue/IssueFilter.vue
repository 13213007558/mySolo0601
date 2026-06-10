<script setup lang="ts">
import { computed } from 'vue'
import { Search, RotateCcw, Filter, X } from 'lucide-vue-next'
import { useIssueStore } from '@/stores/issueStore'
import {
  FLOOR_OPTIONS,
  DEPARTMENT_OPTIONS,
  STATUS_LABELS,
  CATEGORY_LABELS,
  SYSTEM_LABELS,
  PRIORITY_LABELS,
} from '@/types'
import type {
  IssueStatus,
  CollisionCategory,
  SystemType,
  IssuePriority,
} from '@/types'

const store = useIssueStore()

const activeFilterCount = computed(() => {
  let count = 0
  if (store.filters.floor.length > 0) count++
  if (store.filters.system.length > 0) count++
  if (store.filters.category.length > 0) count++
  if (store.filters.responsibleDept.length > 0) count++
  if (store.filters.status.length > 0) count++
  if (store.filters.priority.length > 0) count++
  if (store.filters.keyword) count++
  return count
})

function toggleFilter<T extends string>(type: keyof typeof store.filters, value: T) {
  const current = store.filters[type] as T[]
  const index = current.indexOf(value)
  if (index === -1) {
    store.setFilters({ [type]: [...current, value] })
  } else {
    const newArr = [...current]
    newArr.splice(index, 1)
    store.setFilters({ [type]: newArr })
  }
}

function isFilterActive<T extends string>(type: keyof typeof store.filters, value: T): boolean {
  return (store.filters[type] as T[]).includes(value)
}

function clearFilter(type: keyof typeof store.filters) {
  store.setFilters({ [type]: Array.isArray(store.filters[type]) ? [] : '' })
}

function handleKeywordInput(e: Event) {
  const target = e.target as HTMLInputElement
  store.setFilters({ keyword: target.value })
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-slate-500" />
        <span class="text-sm font-medium text-slate-700">筛选条件</span>
        <span
          v-if="activeFilterCount > 0"
          class="px-2 py-0.5 text-xs font-medium bg-fire-100 text-fire-700 rounded-full"
        >
          {{ activeFilterCount }} 个条件
        </span>
      </div>
      <button
        @click="store.resetFilters"
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        重置
      </button>
    </div>

    <div class="space-y-3">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          :value="store.filters.keyword"
          @input="handleKeywordInput"
          placeholder="搜索问题标题、位置、责任人..."
          class="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all"
        />
        <button
          v-if="store.filters.keyword"
          @click="clearFilter('keyword')"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500 w-16 shrink-0">楼层</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="floor in FLOOR_OPTIONS"
              :key="floor"
              @click="toggleFilter('floor', floor)"
              :class="[
                'px-2 py-1 text-xs rounded-md border transition-all',
                isFilterActive('floor', floor)
                  ? 'bg-industrial-500 text-white border-industrial-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-industrial-300 hover:text-industrial-600',
              ]"
            >
              {{ floor }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500 w-16 shrink-0">系统</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="(label, key) in SYSTEM_LABELS"
              :key="key"
              @click="toggleFilter('system', key as SystemType)"
              :class="[
                'px-2 py-1 text-xs rounded-md border transition-all',
                isFilterActive('system', key as SystemType)
                  ? 'bg-fire-500 text-white border-fire-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-fire-300 hover:text-fire-600',
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500 w-16 shrink-0">碰撞类型</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="(label, key) in CATEGORY_LABELS"
              :key="key"
              @click="toggleFilter('category', key as CollisionCategory)"
              :class="[
                'px-2 py-1 text-xs rounded-md border transition-all',
                isFilterActive('category', key as CollisionCategory)
                  ? 'bg-warning-500 text-white border-warning-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-warning-300 hover:text-warning-600',
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500 w-16 shrink-0">状态</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="(label, key) in STATUS_LABELS"
              :key="key"
              @click="toggleFilter('status', key as IssueStatus)"
              :class="[
                'px-2 py-1 text-xs rounded-md border transition-all',
                isFilterActive('status', key as IssueStatus)
                  ? 'bg-success-500 text-white border-success-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-success-300 hover:text-success-600',
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500 w-16 shrink-0">优先级</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="(label, key) in PRIORITY_LABELS"
              :key="key"
              @click="toggleFilter('priority', key as IssuePriority)"
              :class="[
                'px-2 py-1 text-xs rounded-md border transition-all',
                isFilterActive('priority', key as IssuePriority)
                  ? 'bg-fire-500 text-white border-fire-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-fire-300 hover:text-fire-600',
              ]"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-medium text-slate-500 w-16 shrink-0">责任专业</span>
          <div class="flex flex-wrap gap-1.5 flex-1">
            <button
              v-for="dept in DEPARTMENT_OPTIONS"
              :key="dept"
              @click="toggleFilter('responsibleDept', dept)"
              :class="[
                'px-2 py-1 text-xs rounded-md border transition-all',
                isFilterActive('responsibleDept', dept)
                  ? 'bg-industrial-500 text-white border-industrial-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-industrial-300 hover:text-industrial-600',
              ]"
            >
              {{ dept }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
