<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Attachment, AttachmentType } from '@/types'
import { ATTACHMENT_TYPE_LABELS } from '@/types'
import { Upload, X, Image as ImageIcon, FileText } from 'lucide-vue-next'

const props = defineProps<{
  allowedTypes?: AttachmentType[]
  maxSizeMB?: number
  label?: string
}>()

const emit = defineEmits<{
  (e: 'upload', attachment: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploadRemark = ref('')
const selectedType = ref<AttachmentType>('bim_screenshot')

const allowed = computed<AttachmentType[]>(() => props.allowedTypes || ['bim_screenshot', 'photo', 'document', 'other'])

const acceptStr = computed(() => {
  const types: string[] = []
  if (allowed.value.includes('bim_screenshot') || allowed.value.includes('photo') || allowed.value.includes('other')) {
    types.push('image/*')
  }
  if (allowed.value.includes('document')) {
    types.push('.pdf,.doc,.docx,.xls,.xlsx,.txt')
  }
  return types.join(',')
})

function handleFiles(fileList: FileList | null) {
  if (!fileList || fileList.length === 0) return
  const file = fileList[0]
  processFile(file)
}

function processFile(file: File) {
  const maxSize = (props.maxSizeMB || 10) * 1024 * 1024
  if (file.size > maxSize) {
    alert(`文件大小不能超过 ${props.maxSizeMB || 10}MB`)
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    const type = resolveAttachmentType(file, selectedType.value)
    emit('upload', {
      name: file.name,
      type,
      url: dataUrl,
      uploadedBy: '',
      remark: uploadRemark.value,
    })
    uploadRemark.value = ''
    if (fileInput.value) fileInput.value.value = ''
  }
  reader.readAsDataURL(file)
}

function resolveAttachmentType(file: File, preferred: AttachmentType): AttachmentType {
  if (allowed.value.includes(preferred)) return preferred
  if (file.type.startsWith('image/')) return 'photo'
  if (file.type.includes('pdf') || /\.(pdf|doc|docx|xls|xlsx)$/i.test(file.name)) return 'document'
  return 'other'
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  handleFiles(e.dataTransfer?.files || null)
}

function triggerFileInput() {
  fileInput.value?.click()
}

function setType(type: AttachmentType) {
  if (allowed.value.includes(type)) selectedType.value = type
}
</script>

<template>
  <div class="space-y-2">
    <div v-if="label" class="text-xs font-medium text-slate-600">{{ label }}</div>

    <div class="flex items-center gap-2 mb-2 flex-wrap">
      <span class="text-xs text-slate-500">类型：</span>
      <button
        v-for="t in allowed"
        :key="t"
        @click="setType(t)"
        :class="[
          'px-2 py-0.5 text-xs rounded border transition-all',
          selectedType === t
            ? 'bg-industrial-500 text-white border-industrial-500'
            : 'bg-white text-slate-600 border-slate-200 hover:border-industrial-300',
        ]"
      >
        {{ ATTACHMENT_TYPE_LABELS[t] }}
      </button>
    </div>

    <input
      v-model="uploadRemark"
      type="text"
      placeholder="备注说明（可选）"
      class="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-industrial-500 mb-2"
    />

    <div
      @click="triggerFileInput"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop="onDrop"
      :class="[
        'relative border-2 border-dashed rounded-md px-4 py-5 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-industrial-500 bg-industrial-50'
          : 'border-slate-300 hover:border-industrial-400 hover:bg-slate-50',
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptStr"
        class="hidden"
        @change="(e: any) => handleFiles(e.target.files)"
      />
      <Upload class="w-6 h-6 mx-auto text-slate-400 mb-1" />
      <p class="text-xs text-slate-600">点击选择文件或拖拽到此区域</p>
      <p class="text-[10px] text-slate-400 mt-0.5">
        支持 {{ allowed.map(t => ATTACHMENT_TYPE_LABELS[t]).join('、') }}，最大 {{ props.maxSizeMB || 10 }}MB
      </p>
    </div>
  </div>
</template>
