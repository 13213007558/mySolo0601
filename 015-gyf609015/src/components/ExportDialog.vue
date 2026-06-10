<script setup lang="ts">import { ref, computed } from 'vue';
import { useUIStore } from '@/stores/ui';
import { useExport } from '@/composables/useExport';
import { useFilterStore } from '@/stores/filter';
import { X, Download, ShieldCheck, FileText, CheckCircle2, CalendarDays, Filter } from 'lucide-vue-next';
import { formatDate } from '@/utils/date';
const ui = useUIStore();
const filter = useFilterStore();
const { exportLoading, downloadCSV } = useExport();
const today = formatDate(new Date());
const fileNameBase = computed(() => `幕墙样板封样对账表_${today}`);
const summary = computed(() => {
 const list = filter.filteredSamples;
 return {
 total: list.length,
 available: list.filter(s => s.status === 'available').length,
 pending: list.filter(s => s.status === 'pending').length,
 rejected: list.filter(s => s.status === 'rejected').length,
 batches: list.reduce((n, s) => n + s.batches.length, 0),
 };
});
function getStatusLabel() {
 switch (filter.state.status) {
 case 'available': return '仅可用';
 case 'pending': return '仅待确认';
 case 'rejected': return '仅退回';
 default: return '全部状态';
 }
}
function doExport() {
 downloadCSV(`${fileNameBase.value}.csv`, true);
}
function doExportRaw() {
 downloadCSV(`${fileNameBase.value}_完整.csv`, false);
}
function close() {
 ui.closeExport();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="ui.isExportDialogOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <div class="relative w-full max-w-lg bg-white rounded-lg shadow-2xl animate-fade-in overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-industrial-800 to-industrial-700 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                <Download :size="20" />
              </div>
              <div>
                <h3 class="font-serif font-bold text-lg">导出对账表</h3>
                <p class="text-xs text-industrial-200 mt-0.5">CSV 格式，可在 Excel 中打开</p>
              </div>
            </div>
            <button class="p-2 rounded hover:bg-white/10 transition-colors" @click="close">
              <X :size="18" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-5">
            <div class="rounded-md border-2 border-amber-gold-200 bg-amber-gold-50/40 p-4">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-amber-gold-100 text-amber-gold-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck :size="18" />
                </div>
                <div class="flex-1">
                  <div class="text-sm font-bold text-amber-gold-800 mb-1">默认模式：敏感信息脱敏</div>
                  <div class="text-xs text-amber-gold-700/90 leading-relaxed">
                    厂家联系电话、确认人电话将被脱敏（如 138****8001）。
                    适合发送给采购和业主查阅。批次、状态和历史说明等核心信息完整保留。
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-md border border-cool-gray-200 bg-cool-gray-50 p-4">
              <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-full bg-cool-gray-200 text-cool-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText :size="18" />
                </div>
                <div class="flex-1 space-y-2">
                  <div class="text-sm font-bold text-cool-gray-800">本次导出范围</div>
                  <div class="text-xs text-cool-gray-600 space-y-1">
                    <div class="flex items-center gap-1.5">
                      <Filter :size="12" class="text-cool-gray-400" />
                      <span>筛选条件：</span>
                      <span class="font-medium text-industrial-700">{{ getStatusLabel() }}</span>
                      <span v-if="filter.state.keyword" class="text-cool-gray-400">·</span>
                      <span v-if="filter.state.keyword" class="font-medium text-industrial-700">关键词={{ filter.state.keyword }}</span>
                      <span v-if="filter.state.dateStart || filter.state.dateEnd" class="text-cool-gray-400">·</span>
                      <span v-if="filter.state.dateStart || filter.state.dateEnd" class="font-medium text-industrial-700">
                        日期范围 {{ filter.state.dateStart || '不限' }} 至 {{ filter.state.dateEnd || '不限' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 pt-1">
                      <div class="flex items-center gap-1">
                        <CheckCircle2 :size="12" class="text-amber-gold-600" />
                        <span class="font-mono text-cool-gray-700">{{ summary.total }}</span>
                        <span class="text-cool-gray-500">条样板</span>
                      </div>
                      <div class="text-cool-gray-300">|</div>
                      <div class="flex items-center gap-1">
                        <CalendarDays :size="12" class="text-industrial-500" />
                        <span class="font-mono text-cool-gray-700">{{ summary.batches }}</span>
                        <span class="text-cool-gray-500">条批次</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 pt-1 text-[11px]">
                      <span class="inline-flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-amber-gold-500"></span>
                        可用 {{ summary.available }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-warn-orange-500"></span>
                        待确认 {{ summary.pending }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full bg-alert-red-500"></span>
                        退回 {{ summary.rejected }}
                      </span>
                    </div>
                  </div>
                  <div class="pt-2 text-[11px] text-industrial-600 bg-industrial-50 rounded p-2 border border-industrial-100 flex items-center gap-1.5">
                    <ShieldCheck :size="12" class="text-industrial-500 shrink-0" />
                    导出内容随筛选条件实时联动，调整筛选后重新导出即可获得最新结果。
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 bg-cool-gray-50 border-t border-cool-gray-200 flex items-center justify-end gap-3">
            <button
              class="px-4 py-2 rounded border border-cool-gray-300 text-cool-gray-600 text-xs hover:bg-white transition-colors"
              @click="doExportRaw"
              :disabled="exportLoading"
            >
              导出（含完整电话）
            </button>
            <button
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-industrial-800 hover:bg-industrial-700 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              @click="doExport"
              :disabled="exportLoading"
            >
              <Download :size="15" />
              {{ exportLoading ? '正在导出...' : '下载对账表' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
