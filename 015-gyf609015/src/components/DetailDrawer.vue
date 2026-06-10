<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSampleStore } from '@/stores/sample'
import { useUIStore } from '@/stores/ui'
import StatusBadge from './StatusBadge.vue'
import PhotoCompare from './PhotoCompare.vue'
import BatchTable from './BatchTable.vue'
import ConfirmTimeline from './ConfirmTimeline.vue'
import { X, Edit2, Building2, User, Phone, Tag, FileText, Calendar, CheckCircle2, XCircle } from 'lucide-vue-next'
import { maskPhone } from '@/utils/mask'
import type { ConfirmAction, SampleStatus } from '@/types'

const store = useSampleStore()
const ui = useUIStore()

const sample = computed(() => ui.selectedSampleId ? store.findById(ui.selectedSampleId) : null)

function close() {
  ui.closeDetail()
}

function edit() {
  if (sample.value) ui.openEdit(sample.value)
}

const showConfirmForm = ref(false)
const confirmAction = ref<ConfirmAction>('confirm')
const confirmer = ref('')
const confirmerRole = ref('幕墙工程师')
const confirmerPhone = ref('')
const confirmDescription = ref('')

function openConfirm(action: ConfirmAction) {
  confirmAction.value = action
  confirmer.value = ''
  confirmerRole.value = '幕墙工程师'
  confirmerPhone.value = ''
  confirmDescription.value = ''
  showConfirmForm.value = true
}

function submitConfirm() {
  if (!sample.value || !confirmer.value.trim() || !confirmDescription.value.trim()) return
  store.addConfirmRecord(sample.value.id, {
    batchId: sample.value.batches[sample.value.batches.length - 1]?.id || '',
    action: confirmAction.value,
    confirmer: confirmer.value.trim(),
    confirmerRole: confirmerRole.value,
    confirmerPhone: confirmerPhone.value.trim(),
    confirmDate: new Date().toISOString().slice(0, 10),
    description: confirmDescription.value.trim(),
  })
  showConfirmForm.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="ui.isDetailDrawerOpen && sample"
        class="fixed inset-0 z-40 flex"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

        <div class="ml-auto relative w-full max-w-2xl h-full bg-cool-gray-50 shadow-2xl flex flex-col animate-slide-in overflow-hidden">
          <div
            class="px-6 py-4 text-white shrink-0 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-amber-gold-600 to-amber-gold-500': sample.status === 'available',
              'bg-gradient-to-r from-warn-orange-600 to-warn-orange-500': sample.status === 'pending',
              'bg-gradient-to-r from-alert-red-700 to-alert-red-600': sample.status === 'rejected',
            }"
          >
            <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%); background-size: 20px 20px;"></div>
            <div class="relative flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-serif font-bold text-xl">{{ sample.sampleNo }}</h3>
                  <span class="px-2 py-0.5 rounded bg-white/20 backdrop-blur-sm text-xs font-mono">{{ sample.version }}</span>
                  <StatusBadge :status="sample.status" size="sm" />
                </div>
                <p class="text-white/80 text-sm mt-1">{{ sample.materialType }}</p>
                <p class="text-white/60 text-xs mt-0.5">{{ sample.specification }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  class="p-2 rounded hover:bg-white/15 transition-colors text-white"
                  title="编辑"
                  @click="edit"
                >
                  <Edit2 :size="16" />
                </button>
                <button
                  class="p-2 rounded hover:bg-white/15 transition-colors text-white"
                  title="关闭"
                  @click="close"
                >
                  <X :size="18" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div class="px-6 py-5 space-y-6">
              <section class="bg-white rounded-md border border-cool-gray-200 p-4 shadow-card">
                <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div class="flex items-start gap-2">
                    <Building2 :size="13" class="text-industrial-500 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <div class="text-cool-gray-500 text-[11px] mb-0.5">生产厂家</div>
                      <div class="text-cool-gray-800 font-medium">{{ sample.manufacturer }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <User :size="13" class="text-industrial-500 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <div class="text-cool-gray-500 text-[11px] mb-0.5">厂家联系人</div>
                      <div class="text-cool-gray-800 font-medium">{{ sample.manufacturerContact || '—' }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <Phone :size="13" class="text-industrial-500 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <div class="text-cool-gray-500 text-[11px] mb-0.5">联系电话</div>
                      <div class="text-cool-gray-800 font-mono text-xs">
                        {{ sample.manufacturerPhone ? maskPhone(sample.manufacturerPhone) : '—' }}
                        <span class="text-[10px] text-cool-gray-400 ml-1">(脱敏)</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <Tag :size="13" class="text-industrial-500 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <div class="text-cool-gray-500 text-[11px] mb-0.5">封样确认人</div>
                      <div class="text-cool-gray-800 font-medium">{{ sample.sealConfirmer }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <Calendar :size="13" class="text-industrial-500 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <div class="text-cool-gray-500 text-[11px] mb-0.5">封样日期</div>
                      <div class="text-cool-gray-800 font-mono">{{ sample.sealDate }}</div>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <FileText :size="13" class="text-industrial-500 mt-0.5 shrink-0" />
                    <div class="min-w-0">
                      <div class="text-cool-gray-500 text-[11px] mb-0.5">备注说明</div>
                      <div class="text-cool-gray-800 leading-relaxed">{{ sample.remark || '—' }}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="bg-white rounded-md border border-cool-gray-200 p-4 shadow-card">
                <PhotoCompare :sample="sample" />
              </section>

              <section class="bg-white rounded-md border border-cool-gray-200 p-4 shadow-card">
                <BatchTable :sample="sample" />
              </section>

              <section class="bg-white rounded-md border border-cool-gray-200 p-4 shadow-card">
                <div class="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <ConfirmTimeline :sample="sample" />
                </div>

                <div v-if="!showConfirmForm" class="mt-5 pt-4 border-t border-cool-gray-100">
                  <div class="text-xs font-bold text-cool-gray-700 mb-2">追加确认/退回操作</div>
                  <div class="flex gap-2">
                    <button
                      class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-amber-gold-500 hover:bg-amber-gold-400 text-white text-xs font-bold transition-colors shadow-sm"
                      @click="openConfirm('confirm')"
                    >
                      <CheckCircle2 :size="14" /> 确认可用
                    </button>
                    <button
                      class="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-alert-red-500 hover:bg-alert-red-400 text-white text-xs font-bold transition-colors shadow-sm"
                      @click="openConfirm('reject')"
                    >
                      <XCircle :size="14" /> 退回处理
                    </button>
                  </div>
                </div>

                <div v-else class="mt-5 pt-4 border-t border-cool-gray-100 space-y-3">
                  <div class="text-xs font-bold" :class="confirmAction === 'confirm' ? 'text-amber-gold-700' : 'text-alert-red-700'">
                    {{ confirmAction === 'confirm' ? '确认材料可用' : '记录退回处理' }}
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">确认人姓名 *</label>
                      <input
                        v-model="confirmer"
                        type="text"
                        class="w-full h-8 px-2.5 rounded border border-cool-gray-300 text-xs focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">角色</label>
                      <select
                        v-model="confirmerRole"
                        class="w-full h-8 px-2.5 rounded border border-cool-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                      >
                        <option>幕墙工程师</option>
                        <option>业主代表</option>
                        <option>设计总监</option>
                        <option>项目经理</option>
                        <option>采购主管</option>
                        <option>厂家代表</option>
                      </select>
                    </div>
                    <div class="col-span-2">
                      <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">联系电话（导出时自动脱敏）</label>
                      <input
                        v-model="confirmerPhone"
                        type="tel"
                        class="w-full h-8 px-2.5 rounded border border-cool-gray-300 text-xs focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20"
                      />
                    </div>
                    <div class="col-span-2">
                      <label class="block text-[11px] font-medium text-cool-gray-600 mb-1">确认/退回说明 *</label>
                      <textarea
                        v-model="confirmDescription"
                        rows="3"
                        placeholder="请详细描述确认结论或退回原因..."
                        class="w-full px-2.5 py-2 rounded border border-cool-gray-300 text-xs focus:outline-none focus:ring-2 focus:border-industrial-500 focus:ring-industrial-500/20 resize-none"
                      ></textarea>
                    </div>
                  </div>
                  <div class="flex justify-end gap-2 pt-1">
                    <button
                      class="px-3 py-1.5 rounded border border-cool-gray-300 text-cool-gray-600 text-xs hover:bg-cool-gray-50"
                      @click="showConfirmForm = false"
                    >
                      取消
                    </button>
                    <button
                      class="px-4 py-1.5 rounded text-xs font-bold text-white transition-colors disabled:opacity-50"
                      :class="confirmAction === 'confirm' ? 'bg-amber-gold-500 hover:bg-amber-gold-400' : 'bg-alert-red-500 hover:bg-alert-red-400'"
                      :disabled="!confirmer.trim() || !confirmDescription.trim()"
                      @click="submitConfirm"
                    >
                      提交记录
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
