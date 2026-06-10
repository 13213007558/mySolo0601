<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIssueStore } from '@/stores/issueStore'
import {
  CATEGORY_LABELS,
  SYSTEM_LABELS,
} from '@/types'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatDateShort, formatElevation } from '@/utils/storage'
import { MapPin, User, Calendar, ChevronRight, Building2 } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'select', id: string): void
}>()

const store = useIssueStore()

const currentPage = ref(1)
const pageSize = 10

const totalPages = computed(() => {
  return Math.ceil(store.filteredIssues.length / pageSize)
})

const pagedIssues = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return store.filteredIssues.slice(start, start + pageSize)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function handleSelect(id: string) {
  emit('select', id)
  store.selectIssue(id)
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-4 py-3 border-b border-slate-200 bg-slate-50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-700">问题列表</span>
          <span class="px-2 py-0.5 text-xs bg-slate-200 text-slate-600 rounded-full">
            共 {{ store.filteredIssues.length }} 条
          </span>
        </div>
      </div>
    </div>

    <div class="divide-y divide-slate-100">
      <div
        v-for="issue in pagedIssues"
        :key="issue.id"
        @click="handleSelect(issue.id)"
        class="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-xs font-mono text-slate-400">{{ issue.id }}</span>
              <StatusBadge :status="issue.status" size="sm" />
              <StatusBadge :priority="issue.priority" size="sm" />
            </div>
            <h4 class="text-sm font-medium text-slate-800 truncate group-hover:text-industrial-600 transition-colors">
              {{ issue.title }}
            </h4>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
              <span class="flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5" />
                {{ issue.floor }}
              </span>
              <span class="flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5" />
                {{ issue.location }}
              </span>
              <span class="flex items-center gap-1">
                <User class="w-3.5 h-3.5" />
                {{ issue.assignee }}
              </span>
              <span class="flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5" />
                {{ formatDateShort(issue.createdAt) }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="px-2 py-0.5 text-xs bg-industrial-50 text-industrial-600 rounded">
                {{ SYSTEM_LABELS[issue.system] }}
              </span>
              <span class="px-2 py-0.5 text-xs bg-warning-50 text-warning-600 rounded">
                {{ CATEGORY_LABELS[issue.category] }}
              </span>
              <span class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                标高: {{ formatElevation(issue.elevation, issue.elevationUnit) }}
              </span>
              <span class="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                {{ issue.responsibleDept }}
              </span>
            </div>
          </div>
          <ChevronRight class="w-5 h-5 text-slate-300 group-hover:text-industrial-500 transition-colors shrink-0 mt-1" />
        </div>
      </div>

      <div v-if="pagedIssues.length === 0" class="px-4 py-12 text-center">
        <div class="text-slate-400 text-sm">
          暂无符合条件的问题记录
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="px-4 py-3 border-t border-slate-200 bg-slate-50">
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-500">
          第 {{ currentPage }} / {{ totalPages }} 页
        </span>
        <div class="flex items-center gap-1">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-xs border border-slate-200 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
