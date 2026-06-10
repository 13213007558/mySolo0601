<script setup lang="ts">
import { ref } from 'vue'
import { X, Paperclip, Image as ImageIcon, Trash2 } from 'lucide-vue-next'
import { useIssueStore } from '@/stores/issueStore'
import {
  FLOOR_OPTIONS,
  DEPARTMENT_OPTIONS,
  CATEGORY_LABELS,
  SYSTEM_LABELS,
  PRIORITY_LABELS,
  ATTACHMENT_TYPE_LABELS,
} from '@/types'
import type {
  CollisionCategory,
  SystemType,
  IssuePriority,
  Attachment,
} from '@/types'
import AttachmentUploader from '@/components/common/AttachmentUploader.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useIssueStore()

const form = ref({
  title: '',
  floor: '3F',
  system: 'sprinkler' as SystemType,
  category: 'beam' as CollisionCategory,
  location: '',
  elevation: 2800,
  elevationUnit: 'mm' as const,
  responsibleDept: '结构专业',
  assignee: '',
  priority: 'medium' as IssuePriority,
  description: '',
})

const initialAttachments = ref<Omit<Attachment, 'id' | 'uploadedAt' | 'version'>[]>([])
const showAttachmentUploader = ref(false)

const errors = ref<Record<string, string>>({})

function validate() {
  errors.value = {}
  if (!form.value.title.trim()) {
    errors.value.title = '请输入问题标题'
  }
  if (!form.value.location.trim()) {
    errors.value.location = '请输入具体位置'
  }
  if (!form.value.assignee.trim()) {
    errors.value.assignee = '请输入责任人'
  }
  if (!form.value.description.trim()) {
    errors.value.description = '请输入问题描述'
  }
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const attachmentsWithUser = initialAttachments.value.map((att) => ({
    ...att,
    uploadedBy: att.uploadedBy || store.currentUser,
  }))

  store.addIssue({
    ...form.value,
    attachments: attachmentsWithUser,
  })

  emit('close')
}

function handleClose() {
  emit('close')
}

function handleAttachmentUploaded(att: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>) {
  initialAttachments.value.push({
    ...att,
    uploadedBy: store.currentUser,
  })
  showAttachmentUploader.value = false
}

function removeAttachment(idx: number) {
  initialAttachments.value.splice(idx, 1)
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div @click="handleClose" class="absolute inset-0 bg-black/50"></div>
    <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col m-4">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800">新建碰撞问题</h3>
        <button
          @click="handleClose"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              问题标题 <span class="text-fire-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="请输入问题标题"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              :class="{ 'border-fire-500 focus:border-fire-500': errors.title }"
            />
            <p v-if="errors.title" class="mt-1 text-xs text-fire-500">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">楼层</label>
              <select
                v-model="form.floor"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              >
                <option v-for="floor in FLOOR_OPTIONS" :key="floor" :value="floor">{{ floor }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">系统</label>
              <select
                v-model="form.system"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              >
                <option v-for="(label, key) in SYSTEM_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">碰撞类型</label>
              <select
                v-model="form.category"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              >
                <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">优先级</label>
              <select
                v-model="form.priority"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              >
                <option v-for="(label, key) in PRIORITY_LABELS" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              具体位置 <span class="text-fire-500">*</span>
            </label>
            <input
              v-model="form.location"
              type="text"
              placeholder="例如：3F 东区走廊 A-B轴 / 3-5轴"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              :class="{ 'border-fire-500 focus:border-fire-500': errors.location }"
            />
            <p v-if="errors.location" class="mt-1 text-xs text-fire-500">{{ errors.location }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">标高</label>
              <div class="flex gap-2">
                <input
                  v-model.number="form.elevation"
                  type="number"
                  class="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
                />
                <select
                  v-model="form.elevationUnit"
                  class="w-20 px-2 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
                >
                  <option value="mm">mm</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">责任专业</label>
              <select
                v-model="form.responsibleDept"
                class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              >
                <option v-for="dept in DEPARTMENT_OPTIONS" :key="dept" :value="dept">{{ dept }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              责任人 <span class="text-fire-500">*</span>
            </label>
            <input
              v-model="form.assignee"
              type="text"
              placeholder="请输入责任人姓名"
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500"
              :class="{ 'border-fire-500 focus:border-fire-500': errors.assignee }"
            />
            <p v-if="errors.assignee" class="mt-1 text-xs text-fire-500">{{ errors.assignee }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">
              问题描述 <span class="text-fire-500">*</span>
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="请详细描述碰撞问题..."
              class="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 resize-none"
              :class="{ 'border-fire-500 focus:border-fire-500': errors.description }"
            ></textarea>
            <p v-if="errors.description" class="mt-1 text-xs text-fire-500">{{ errors.description }}</p>
          </div>

          <div class="border-t border-slate-200 pt-5">
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Paperclip class="w-4 h-4" />
                初始附件
                <span class="text-xs text-slate-400 font-normal">（BIM截图/现场照片/设计文档，可选）</span>
              </label>
              <button
                @click="showAttachmentUploader = !showAttachmentUploader"
                class="text-[11px] px-2 py-1 text-industrial-600 hover:bg-industrial-50 rounded border border-transparent hover:border-industrial-200"
              >
                {{ showAttachmentUploader ? '收起' : '添加附件' }}
              </button>
            </div>

            <div v-if="showAttachmentUploader" class="mb-3 p-3 bg-industrial-50 rounded-lg border border-industrial-200">
              <AttachmentUploader
                label="新增初始附件"
                :allowed-types="['bim_screenshot', 'photo', 'document']"
                @upload="handleAttachmentUploaded"
              />
            </div>

            <div v-if="initialAttachments.length > 0" class="space-y-2">
              <div
                v-for="(att, idx) in initialAttachments"
                :key="idx"
                class="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200"
              >
                <div class="w-10 h-10 rounded-md overflow-hidden bg-slate-200 flex-shrink-0">
                  <img v-if="att.url" :src="att.url" :alt="att.name" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon class="w-5 h-5" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm text-slate-700 truncate">{{ att.name }}</span>
                    <span class="px-1 py-0.5 text-[9px] font-medium bg-industrial-100 text-industrial-700 rounded flex-shrink-0">
                      {{ ATTACHMENT_TYPE_LABELS[att.type] }}
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400 truncate">
                    {{ att.uploadedBy }}
                    <span v-if="att.remark">· {{ att.remark }}</span>
                  </div>
                </div>
                <button
                  @click="removeAttachment(idx)"
                  class="p-1 text-slate-400 hover:text-fire-500 hover:bg-fire-50 rounded transition-colors"
                  title="移除"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
            <div v-else class="text-center py-3 text-slate-400 text-xs border border-dashed border-slate-200 rounded-md">
              暂无初始附件，点击"添加附件"上传
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-fire-600 hover:bg-fire-700 rounded-md transition-colors"
        >
          创建问题
        </button>
      </div>
    </div>
  </div>
</template>
