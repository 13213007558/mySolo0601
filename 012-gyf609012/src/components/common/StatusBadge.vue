<script setup lang="ts">
import { computed } from 'vue'
import type { IssueStatus, IssuePriority } from '@/types'
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types'

const props = defineProps<{
  status?: IssueStatus
  priority?: IssuePriority
  size?: 'sm' | 'md'
}>()

const statusBgClasses: Record<IssueStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-warning-50 text-warning-700 border-warning-200',
  replied: 'bg-industrial-50 text-industrial-700 border-industrial-200',
  completed: 'bg-success-50 text-success-700 border-success-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

const priorityBgClasses: Record<IssuePriority, string> = {
  high: 'bg-fire-50 text-fire-700 border-fire-200',
  medium: 'bg-warning-50 text-warning-700 border-warning-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
}

const label = computed(() => {
  if (props.status) return STATUS_LABELS[props.status]
  if (props.priority) return PRIORITY_LABELS[props.priority]
  return ''
})

const classes = computed(() => {
  const sizeClasses = props.size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  if (props.status) {
    return `${statusBgClasses[props.status]} ${sizeClasses}`
  }
  if (props.priority) {
    return `${priorityBgClasses[props.priority]} ${sizeClasses}`
  }
  return ''
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center font-medium rounded border',
      classes,
    ]"
  >
    {{ label }}
  </span>
</template>
