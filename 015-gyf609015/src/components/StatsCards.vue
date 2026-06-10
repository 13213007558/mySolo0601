<script setup lang="ts">
import { useSampleStore } from '@/stores/sample'
import StatusBadge from './StatusBadge.vue'
import { Layers, User, Building2, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-vue-next'

const store = useSampleStore()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="relative overflow-hidden bg-white rounded-md border border-cool-gray-200 shadow-card p-5">
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-industrial-600"></div>
      <div class="pl-3 flex items-center justify-between">
        <div>
          <div class="text-xs font-medium text-cool-gray-500 uppercase tracking-wider">样板总数</div>
          <div class="text-3xl font-serif font-bold text-industrial-800 mt-1">{{ store.samplesCount.total }}</div>
          <div class="text-xs text-cool-gray-400 mt-1">条封样记录</div>
        </div>
        <div class="w-12 h-12 rounded bg-industrial-50 flex items-center justify-center text-industrial-600">
          <Layers :size="22" />
        </div>
      </div>
    </div>

    <div class="relative overflow-hidden bg-white rounded-md border border-cool-gray-200 shadow-card p-5">
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-gold-500"></div>
      <div class="pl-3 flex items-center justify-between">
        <div>
          <div class="text-xs font-medium text-amber-gold-600 uppercase tracking-wider">可用</div>
          <div class="text-3xl font-serif font-bold text-amber-gold-700 mt-1">{{ store.samplesCount.available }}</div>
          <div class="text-xs text-cool-gray-400 mt-1">已确认可使用</div>
        </div>
        <div class="w-12 h-12 rounded bg-amber-gold-50 flex items-center justify-center text-amber-gold-600">
          <CheckCircle2 :size="22" />
        </div>
      </div>
    </div>

    <div class="relative overflow-hidden bg-white rounded-md border border-cool-gray-200 shadow-card p-5">
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-warn-orange-500"></div>
      <div class="pl-3 flex items-center justify-between">
        <div>
          <div class="text-xs font-medium text-warn-orange-600 uppercase tracking-wider">待确认</div>
          <div class="text-3xl font-serif font-bold text-warn-orange-700 mt-1">{{ store.samplesCount.pending }}</div>
          <div class="text-xs text-cool-gray-400 mt-1">等待业主/工程师确认</div>
        </div>
        <div class="w-12 h-12 rounded bg-warn-orange-50 flex items-center justify-center text-warn-orange-600">
          <Clock :size="22" />
        </div>
      </div>
    </div>

    <div class="relative overflow-hidden bg-white rounded-md border border-cool-gray-200 shadow-card p-5">
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-alert-red-500"></div>
      <div class="pl-3 flex items-center justify-between">
        <div>
          <div class="text-xs font-medium text-alert-red-600 uppercase tracking-wider">退回</div>
          <div class="text-3xl font-serif font-bold text-alert-red-700 mt-1">{{ store.samplesCount.rejected }}</div>
          <div class="text-xs text-cool-gray-400 mt-1">已退回厂家</div>
        </div>
        <div class="w-12 h-12 rounded bg-alert-red-50 flex items-center justify-center text-alert-red-600">
          <XCircle :size="22" />
        </div>
      </div>
    </div>
  </div>
</template>
