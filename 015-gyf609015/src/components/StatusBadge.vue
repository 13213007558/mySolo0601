<script setup lang="ts">
import { computed } from 'vue'
import type { SampleStatus } from '@/types'
import { CheckCircle2, Clock, XCircle } from 'lucide-vue-next'

const props = defineProps<{
  status: SampleStatus
  size?: 'sm' | 'md'
}>()

const config = computed(() => {
  switch (props.status) {
    case 'available':
      return {
        label: '可用',
        bg: 'bg-amber-gold-50',
        text: 'text-amber-gold-700',
        border: 'border-amber-gold-300',
        ring: 'ring-amber-gold-200',
        Icon: CheckCircle2,
      }
    case 'pending':
      return {
        label: '待确认',
        bg: 'bg-warn-orange-50',
        text: 'text-warn-orange-700',
        border: 'border-warn-orange-300',
        ring: 'ring-warn-orange-200',
        Icon: Clock,
      }
    case 'rejected':
      return {
        label: '退回',
        bg: 'bg-alert-red-50',
        text: 'text-alert-red-700',
        border: 'border-alert-red-300',
        ring: 'ring-alert-red-200',
        Icon: XCircle,
      }
    default:
      return {
        label: props.status,
        bg: 'bg-cool-gray-50',
        text: 'text-cool-gray-700',
        border: 'border-cool-gray-300',
        ring: 'ring-cool-gray-200',
        Icon: Clock,
      }
  }
})

const sizeCls = computed(() => props.size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5')
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded border font-medium ring-1 ring-inset',
      config.bg, config.text, config.border, config.ring, sizeCls,
    ]"
  >
    <component :is="config.Icon" :size="size === 'sm' ? 12 : 14" />
    {{ config.label }}
  </span>
</template>
