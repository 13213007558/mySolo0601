<script setup lang="ts">
import { computed } from 'vue'
import { useSampleStore } from '@/stores/sample'
import { useUIStore } from '@/stores/ui'
import type { Sample } from '@/types'
import StatusBadge from './StatusBadge.vue'
import { Layers, Calendar, UserCheck, ChevronRight, Package } from 'lucide-vue-next'

const props = defineProps<{
  sample: Sample
  index: number
}>()

const store = useSampleStore()
const ui = useUIStore()

const leftBorderColor = computed(() => {
  switch (props.sample.status) {
    case 'available': return 'bg-amber-gold-500'
    case 'pending': return 'bg-warn-orange-500'
    case 'rejected': return 'bg-alert-red-500'
    default: return 'bg-cool-gray-400'
  }
})

function onClick() {
  ui.openDetail(props.sample.id)
}

const latestBatch = computed(() => props.sample.batches[props.sample.batches.length - 1])
const warnings = computed(() => {
  const list: string[] = []
  if (props.sample.batches.some(b => !b.entryPhoto)) list.push('缺少进场照片')
  if (props.sample.status === 'pending') list.push('待业主确认')
  return list
})
</script>

<template>
  <div
    class="group relative bg-white rounded-md border border-cool-gray-200 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer overflow-hidden animate-fade-in"
    :style="{ animationDelay: `${Math.min(index, 10) * 40}ms` }"
    @click="onClick"
  >
    <div :class="['absolute left-0 top-0 bottom-0 w-1', leftBorderColor]"></div>

    <div class="p-4 pl-5">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-serif font-bold text-industrial-800 text-base tracking-tight">{{ sample.sampleNo }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded bg-industrial-50 text-industrial-600 border border-industrial-100 font-mono">{{ sample.version }}</span>
          </div>
          <div class="text-sm text-cool-gray-600 mt-1 truncate">{{ sample.materialType }}</div>
        </div>
        <StatusBadge :status="sample.status" size="sm" />
      </div>

      <div class="relative aspect-[4/3] rounded overflow-hidden bg-cool-gray-100 mb-3 border border-cool-gray-100 group-hover:border-industrial-300 transition-colors">
        <img
          v-if="sample.sealPhoto"
          :src="sample.sealPhoto"
          :alt="sample.sampleNo"
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-cool-gray-400 text-xs">
          <Package :size="24" />
        </div>
        <div class="absolute left-2 top-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm">
          封样
        </div>
        <div class="absolute right-2 bottom-2 text-[10px] px-1.5 py-0.5 rounded bg-industrial-800/80 text-white backdrop-blur-sm flex items-center gap-1">
          <Layers :size="10" />
          {{ sample.batches.length }} 批次
        </div>
      </div>

      <div class="space-y-1.5 text-xs text-cool-gray-600">
        <div class="flex items-center gap-1.5">
          <Calendar :size="12" class="text-cool-gray-400 shrink-0" />
          <span class="truncate">封样：{{ sample.sealDate }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <UserCheck :size="12" class="text-cool-gray-400 shrink-0" />
          <span class="truncate">{{ sample.sealConfirmer }}</span>
        </div>
        <div v-if="latestBatch" class="flex items-center gap-1.5 pt-1 border-t border-cool-gray-100 mt-2">
          <Package :size="12" class="text-industrial-500 shrink-0" />
          <span class="truncate font-mono text-industrial-700">{{ latestBatch.batchNo }}</span>
        </div>
      </div>

      <div v-if="warnings.length" class="mt-3 flex flex-wrap gap-1">
        <span
          v-for="w in warnings"
          :key="w"
          class="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-warn-orange-50 text-warn-orange-700 border border-warn-orange-200"
        >
          ⚠ {{ w }}
        </span>
      </div>

      <div class="mt-3 pt-3 border-t border-cool-gray-100 flex items-center justify-between">
        <span class="text-xs text-cool-gray-400 truncate">{{ sample.manufacturer }}</span>
        <ChevronRight :size="16" class="text-cool-gray-300 group-hover:text-industrial-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </div>
  </div>
</template>
