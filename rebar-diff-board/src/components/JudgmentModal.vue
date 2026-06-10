<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg">
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Scale class="w-5 h-5 text-rebar-orange" />
          人工改判
        </h3>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div v-if="item" class="p-5 space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">楼栋</span>
            <span class="font-medium text-gray-900">{{ item.building }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">构件</span>
            <span class="font-medium text-gray-900">{{ item.component }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">规格</span>
            <span class="font-medium text-gray-900">{{ item.specRaw }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">下料数量</span>
            <span class="font-medium text-gray-900">{{ item.plannedQty }} 根</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">实收数量</span>
            <span class="font-medium text-gray-900">{{ item.actualQty }} 根</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">差异数量</span>
            <span class="font-bold" :class="item.diffQty < 0 ? 'text-red-600' : 'text-green-600'">
              {{ item.diffQty > 0 ? '+' : '' }}{{ item.diffQty }} 根
            </span>
          </div>
        </div>

        <div v-if="item.judgment" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-sm font-medium text-green-800 mb-2">已有处理意见</p>
          <div class="text-sm text-green-700 space-y-1">
            <div>处理方式：{{ item.judgment.decisionLabel }}</div>
            <div>处理意见：{{ item.judgment.reason }}</div>
            <div>处理人：{{ item.judgment.operator }}</div>
            <div>处理时间：{{ item.judgment.timestamp }}</div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">处理方式</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="opt in decisionOptions"
                :key="opt.value"
                @click="form.decision = opt.value"
                :class="[
                  'px-3 py-2 text-sm rounded-lg border transition-colors',
                  form.decision === opt.value
                    ? 'border-rebar-orange bg-orange-50 text-rebar-orange'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                ]"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">处理意见</label>
            <textarea
              v-model="form.reason"
              rows="3"
              placeholder="请说明处理原因和具体安排..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rebar-orange focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">处理人</label>
            <input
              v-model="form.operator"
              type="text"
              placeholder="请输入处理人姓名"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rebar-orange focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        >
          {{ item?.judgment ? '关闭' : '取消' }}
        </button>
        <button
          v-if="!item?.judgment"
          @click="handleSubmit"
          class="px-4 py-2 text-sm bg-rebar-orange text-white rounded-lg hover:bg-rebar-orange-dark transition-colors"
        >
          重新处理
        </button>
        <button
          v-else
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="px-4 py-2 text-sm bg-rebar-orange text-white rounded-lg hover:bg-rebar-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认提交
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { reactive, computed, watch } from 'vue';
import { Scale, X } from 'lucide-vue-next';
import type { RebarItem } from '@/types';

const props = defineProps<{
  visible: boolean
  item: RebarItem | null
}>()

const emit = defineEmits<{
  'close': []
  'submit': [decision: string, decisionLabel: string, reason: string, operator: string]
}>()

const decisionOptions = [
  { value: 'supply', label: '同意补料' },
  { value: 'adjust', label: '调整下料' },
  { value: 'ignore', label: '忽略差异' },
  { value: 'confirmed', label: '确认一致' }
]

const form = reactive({
  decision: '',
  decisionLabel: '',
  reason: '',
  operator: ''
})

const canSubmit = computed(() => {
  return form.decision && form.reason.trim() && form.operator.trim()
})

watch(() => props.visible, (val) => {
  if (val && props.item && !props.item.judgment) {
    form.decision = ''
    form.reason = ''
    form.operator = ''
  }
})

function handleSubmit() {
  const opt = decisionOptions.find((o) => o.value === form.decision)
  if (!opt) return
  emit('submit', form.decision, opt.label, form.reason, form.operator)
}
</script>
