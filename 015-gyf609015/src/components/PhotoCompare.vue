<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Sample } from '@/types'
import { Image as ImageIcon, ZoomIn } from 'lucide-vue-next'

const props = defineProps<{
  sample: Sample
}>()

const selectedBatchIndex = ref(0)

const currentBatch = computed(() => props.sample.batches[selectedBatchIndex.value])
const hasBatches = computed(() => props.sample.batches.length > 0)

const hovered = ref<'left' | 'right' | null>(null)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="font-serif font-bold text-industrial-800 text-sm flex items-center gap-2">
        <ImageIcon :size="16" class="text-industrial-500" />
        色板照片比对
      </h4>
      <div v-if="hasBatches" class="flex items-center gap-1">
        <select
          v-model="selectedBatchIndex"
          class="h-7 px-2 text-xs rounded border border-cool-gray-300 bg-white text-cool-gray-700 focus:outline-none focus:border-industrial-500"
        >
          <option v-for="(b, i) in sample.batches" :key="b.id" :value="i">
            批次 {{ i + 1 }}：{{ b.batchNo }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div
        class="relative group rounded-md overflow-hidden border-2 transition-all cursor-zoom-in"
        :class="hovered === 'left' ? 'border-amber-gold-400 shadow-lg scale-[1.02] z-10' : 'border-cool-gray-200'"
        @mouseenter="hovered = 'left'"
        @mouseleave="hovered = null"
      >
        <div class="absolute left-2 top-2 z-10 text-[10px] px-2 py-0.5 rounded bg-amber-gold-600 text-white font-bold shadow-sm">
          封样标准
        </div>
        <div class="aspect-square bg-cool-gray-100">
          <img
            v-if="sample.sealPhoto"
            :src="sample.sealPhoto"
            class="w-full h-full object-cover transition-transform duration-300"
            :class="hovered === 'left' ? 'scale-110' : ''"
            alt="封样照片"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-cool-gray-400 gap-2">
            <ImageIcon :size="32" />
            <span class="text-xs">未上传封样照片</span>
          </div>
        </div>
        <div class="px-3 py-2 bg-white border-t border-cool-gray-100 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-cool-gray-500">封样日期</span>
            <span class="font-mono text-industrial-700">{{ sample.sealDate }}</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-cool-gray-500">确认人</span>
            <span class="text-industrial-700 truncate ml-2">{{ sample.sealConfirmer }}</span>
          </div>
        </div>
        <div
          class="absolute right-2 bottom-12 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm"
        >
          <ZoomIn :size="12" class="inline mr-1" />悬停放大
        </div>
      </div>

      <div
        class="relative group rounded-md overflow-hidden border-2 transition-all cursor-zoom-in"
        :class="[
          hovered === 'right' ? 'shadow-lg scale-[1.02] z-10' : 'border-cool-gray-200',
          !currentBatch?.entryPhoto ? 'border-dashed' : '',
          sample.status === 'rejected' && currentBatch ? 'border-alert-red-400' : '',
          hovered === 'right' && sample.status === 'rejected' ? 'border-alert-red-500' : '',
        ]"
        @mouseenter="hovered = 'right'"
        @mouseleave="hovered = null"
      >
        <div class="absolute left-2 top-2 z-10 text-[10px] px-2 py-0.5 rounded bg-industrial-700 text-white font-bold shadow-sm">
          进场材料
        </div>
        <div v-if="sample.status === 'rejected'" class="absolute right-2 top-2 z-10 text-[10px] px-2 py-0.5 rounded bg-alert-red-600 text-white font-bold shadow-sm">
          存在色差
        </div>
        <div class="aspect-square bg-cool-gray-100">
          <img
            v-if="currentBatch?.entryPhoto"
            :src="currentBatch.entryPhoto"
            class="w-full h-full object-cover transition-transform duration-300"
            :class="hovered === 'right' ? 'scale-110' : ''"
            alt="进场照片"
          />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-cool-gray-400 gap-2 border-2 border-dashed border-cool-gray-200">
            <ImageIcon :size="32" />
            <span class="text-xs">暂无进场照片</span>
            <span class="text-[10px] text-warn-orange-600 bg-warn-orange-50 px-2 py-0.5 rounded">请补充上传</span>
          </div>
        </div>
        <div class="px-3 py-2 bg-white border-t border-cool-gray-100 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-cool-gray-500">厂家批次</span>
            <span class="font-mono text-industrial-700 truncate ml-2">{{ currentBatch?.batchNo || '—' }}</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-cool-gray-500">进场日期</span>
            <span class="font-mono text-industrial-700">{{ currentBatch?.entryDate || '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!hasBatches" class="text-xs text-cool-gray-500 italic py-2 px-3 rounded bg-cool-gray-50 border border-cool-gray-100">
      该样板暂无进场批次记录，无法进行照片比对。
    </div>
  </div>
</template>
