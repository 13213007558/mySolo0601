<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload class="w-5 h-5 text-rebar-orange" />
          {{ title }}
        </h3>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div class="p-5 space-y-4">
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-rebar-orange cursor-pointer transition-colors"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <FileUp class="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p class="text-sm text-gray-600 mb-1">
            点击或拖拽 CSV 文件到此处
          </p>
          <p class="text-xs text-gray-400">
            支持 CSV 格式，UTF-8 编码</p>
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileChange"
          />
        </div>

        <div v-if="fileName" class="bg-gray-50 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-rebar-blue" />
            <span class="text-sm text-gray-900 truncate">{{ fileName }}</span>
          </div>
        </div>

        <div v-if="result" class="rounded-lg p-3" :class="resultSuccess ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'">
          <p class="text-sm" :class="resultSuccess ? 'text-green-700' : 'text-yellow-700'">
            {{ result }}
          </p>
        </div>

        <div class="bg-blue-50 rounded-lg p-3">
          <p class="text-xs text-blue-700 mb-2 font-medium">必填字段：</p>
          <ul class="text-xs text-blue-600 space-y-1">
            <li>• 楼栋 / building</li>
            <li>• 构件 / component</li>
            <li>• 规格 / spec（如 HRB400E Φ20）</li>
            <li>• {{ type === 'plan' ? '下料数量' : '实收数量'}} / qty</li>
          </ul>
        </div>
      </div>
      <div class="flex items-center gap-3 p-4 border-t border-gray-200 bg-gray-50">
        <button
          @click="downloadTemplate"
          class="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
        >
          下载模板
        </button>
        <button
          @click="loadSample"
          class="flex-1 px-4 py-2 text-sm bg-rebar-blue text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          加载样例
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">import { ref } from 'vue';
import { Upload, X, FileUp, FileText } from 'lucide-vue-next';
import { generateCSVTemplate } from '@/utils/csv';

const props = defineProps<{
  visible: boolean
  type: 'plan' | 'actual'
  title: string
}>()

const emit = defineEmits<{
  'close': []
  'import': [file: File]
  'load-sample': []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const result = ref('')
const resultSuccess = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    fileName.value = file.name
    emit('import', file)
  }
}

function handleDrop(e: DragEvent) {
  const file = e.dataTransfer?.files?.[0]
  if (file && file.name.endsWith('.csv')) {
    fileName.value = file.name
    emit('import', file)
  }
}

function downloadTemplate() {
  const csv = generateCSVTemplate(props.type)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = props.type === 'plan' ? '下料单模板.csv' : '实收表模板.csv'
  link.click()
  URL.revokeObjectURL(url)
}

function loadSample() {
  emit('load-sample')
}

function setResult(msg: string, success: boolean) {
  result.value = msg
  resultSuccess.value = success
}

defineExpose({ setResult })
</script>
