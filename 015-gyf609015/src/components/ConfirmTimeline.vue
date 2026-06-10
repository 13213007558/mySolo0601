<script setup lang="ts">
import { computed } from 'vue'
import type { Sample } from '@/types'
import { CheckCircle2, XCircle, History, User, CalendarDays } from 'lucide-vue-next'
import { maskPhone } from '@/utils/mask'

const props = defineProps<{
  sample: Sample
}>()

const records = computed(() => {
  return [...props.sample.confirmRecords].sort((a, b) =>
    new Date(b.confirmDate).getTime() - new Date(a.confirmDate).getTime(),
  )
})
</script>

<template>
  <div class="space-y-3">
    <h4 class="font-serif font-bold text-industrial-800 text-sm flex items-center gap-2">
      <History :size="16" class="text-industrial-500" />
      确认历史记录
    </h4>

    <div v-if="records.length === 0" class="text-xs text-cool-gray-500 italic py-6 px-4 rounded bg-cool-gray-50 border border-cool-gray-100 text-center">
      暂无确认/退回记录
    </div>

    <ol v-else class="relative border-l-2 border-cool-gray-200 ml-3 space-y-5 pb-2">
      <li
        v-for="(r, idx) in records"
        :key="r.id"
        class="relative pl-5 animate-fade-in"
        :style="{ animationDelay: `${idx * 60}ms` }"
      >
        <div
          :class="[
            'absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white',
            r.action === 'confirm' ? 'border-amber-gold-500 text-amber-gold-600' : 'border-alert-red-500 text-alert-red-600',
          ]"
        >
          <CheckCircle2 v-if="r.action === 'confirm'" :size="12" class="bg-white rounded-full" />
          <XCircle v-else :size="12" class="bg-white rounded-full" />
        </div>

        <div
          :class="[
            'rounded-md border p-3',
            r.action === 'confirm'
              ? 'bg-amber-gold-50/50 border-amber-gold-200'
              : 'bg-alert-red-50/50 border-alert-red-200',
          ]"
        >
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span
              :class="[
                'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold',
                r.action === 'confirm'
                  ? 'bg-amber-gold-500 text-white'
                  : 'bg-alert-red-500 text-white',
              ]"
            >
              {{ r.action === 'confirm' ? '✓ 确认通过' : '✗ 退回' }}
            </span>
            <span class="text-[11px] text-cool-gray-500 flex items-center gap-1 font-mono">
              <CalendarDays :size="11" />
              {{ r.confirmDate }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-x-4 gap-y-1 mb-2 text-xs">
            <div class="flex items-center gap-1.5">
              <User :size="11" class="text-cool-gray-400 shrink-0" />
              <span class="text-cool-gray-500">确认人：</span>
              <span class="text-industrial-700 font-semibold">{{ r.confirmer }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-cool-gray-500">角色：</span>
              <span class="text-industrial-700">{{ r.confirmerRole }}</span>
            </div>
            <div class="col-span-2 flex items-center gap-1.5">
              <span class="text-cool-gray-500">联系电话：</span>
              <span class="font-mono text-industrial-600">{{ maskPhone(r.confirmerPhone) }}</span>
              <span class="text-[10px] text-cool-gray-400 ml-1">(已脱敏)</span>
            </div>
          </div>

          <div class="text-xs leading-relaxed text-cool-gray-700 bg-white/60 rounded border border-cool-gray-100 p-2.5">
            {{ r.description }}
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>
