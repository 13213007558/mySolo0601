<script setup lang="ts">
import { computed } from 'vue'
import { useIssueStore } from '@/stores/issueStore'
import { STATUS_LABELS } from '@/types'
import { AlertTriangle, Clock, CheckCircle, FileX, ListTodo } from 'lucide-vue-next'

const store = useIssueStore()

const statItems = computed(() => [
  {
    label: '总问题数',
    value: store.stats.total,
    icon: ListTodo,
    color: 'bg-slate-500',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
  },
  {
    label: STATUS_LABELS.pending,
    value: store.stats.statusCount['pending'] || 0,
    icon: AlertTriangle,
    color: 'bg-warning-500',
    bgColor: 'bg-warning-50',
    textColor: 'text-warning-600',
  },
  {
    label: STATUS_LABELS.replied,
    value: store.stats.statusCount['replied'] || 0,
    icon: Clock,
    color: 'bg-industrial-500',
    bgColor: 'bg-industrial-50',
    textColor: 'text-industrial-600',
  },
  {
    label: STATUS_LABELS.completed,
    value: store.stats.statusCount['completed'] || 0,
    icon: CheckCircle,
    color: 'bg-success-500',
    bgColor: 'bg-success-50',
    textColor: 'text-success-600',
  },
])
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div
      v-for="item in statItems"
      :key="item.label"
      class="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-500 mb-1">{{ item.label }}</p>
          <p class="text-2xl font-bold" :class="item.textColor">
            {{ item.value }}
          </p>
        </div>
        <div :class="[item.bgColor, 'w-12 h-12 rounded-lg flex items-center justify-center']">
          <component :is="item.icon" :class="[item.textColor, 'w-6 h-6']" />
        </div>
      </div>
    </div>
  </div>
</template>
