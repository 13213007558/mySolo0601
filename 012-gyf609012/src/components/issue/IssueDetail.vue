<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useIssueStore } from '@/stores/issueStore'
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  SYSTEM_LABELS,
  PRIORITY_LABELS,
  ATTACHMENT_TYPE_LABELS,
  FLOOR_OPTIONS,
  DEPARTMENT_OPTIONS,
} from '@/types'
import type { IssueStatus, AttachmentType, Attachment } from '@/types'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AttachmentUploader from '@/components/common/AttachmentUploader.vue'
import { formatDate, formatElevation } from '@/utils/storage'
import {
  X,
  MapPin,
  User,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  Paperclip,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  Edit,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Building2,
  Ruler,
  ChevronRight,
  Download,
  CornerUpLeft,
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useIssueStore()

const showDesignReplyForm = ref(false)
const newReplyContent = ref('')
const newReplyBy = ref('设计院')
const pendingReplyAttachments = ref<Omit<Attachment, 'id' | 'uploadedAt' | 'version'>[]>([])

const showAssigneeEdit = ref(false)
const newAssignee = ref('')

const activeUploadTab = ref<AttachmentType | null>(null)
const replyAttachmentUploadOpen = ref(false)

const replyForm = ref<HTMLTextAreaElement | null>(null)

const issue = computed(() => store.selectedIssue)

const bimAttachments = computed(() =>
  (issue.value?.attachments || []).filter((a) => a.type === 'bim_screenshot').sort((a, b) => b.version - a.version)
)
const photoAttachments = computed(() =>
  (issue.value?.attachments || []).filter((a) => a.type === 'photo').sort((a, b) => b.version - a.version)
)
const docAttachments = computed(() =>
  (issue.value?.attachments || []).filter((a) => a.type === 'document').sort((a, b) => b.version - a.version)
)
const otherAttachments = computed(() =>
  (issue.value?.attachments || []).filter((a) => a.type === 'other').sort((a, b) => b.version - a.version)
)

const canSubmit = computed(() =>
  issue.value?.status === 'draft' || issue.value?.status === 'returned'
)
const canReply = computed(() =>
  issue.value?.status === 'pending' || issue.value?.status === 'replied' || issue.value?.status === 'returned'
)
const canReturn = computed(() =>
  issue.value?.status === 'pending' || issue.value?.status === 'replied'
)
const canComplete = computed(() =>
  issue.value?.status === 'replied' || issue.value?.status === 'returned'
)
const canReopen = computed(() =>
  issue.value?.status === 'completed' || issue.value?.status === 'cancelled'
)
const canCancel = computed(() =>
  issue.value?.status === 'draft' || issue.value?.status === 'pending' || issue.value?.status === 'replied' || issue.value?.status === 'returned'
)

function close() {
  emit('close')
  store.selectIssue(null)
  activeUploadTab.value = null
  replyAttachmentUploadOpen.value = false
}

function handleSubmit() {
  if (!issue.value) return
  store.submitIssue(issue.value.id)
}

function handleReturn() {
  if (!issue.value) return
  const remark = '设计审查不通过，退回待改'
  store.returnForRevision(issue.value.id, remark)
}

function handleReply() {
  if (!issue.value || !newReplyContent.value.trim()) return
  const rep = store.addDesignReply(issue.value.id, {
    content: newReplyContent.value,
    repliedBy: newReplyBy.value,
    attachments: pendingReplyAttachments.value,
  })
  newReplyContent.value = ''
  pendingReplyAttachments.value = []
  replyAttachmentUploadOpen.value = false
  showDesignReplyForm.value = false
}

function handleReplyAttachmentUploaded(att: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>) {
  pendingReplyAttachments.value.push({ ...att })
}

function handleComplete() {
  if (!issue.value) return
  if (confirm('确认该问题已整改完成？')) {
    store.confirmCompleted(issue.value.id)
  }
}

function handleReopen() {
  if (!issue.value) return
  if (confirm('确认重新打开该问题？')) {
    store.reopenIssue(issue.value.id)
  }
}

function handleCancel() {
  if (!issue.value) return
  if (confirm('确认取消该问题？')) {
    store.cancelIssue(issue.value.id)
  }
}

function startEditAssignee() {
  if (issue.value) {
    newAssignee.value = issue.value.assignee
    showAssigneeEdit.value = true
  }
}

function saveAssignee() {
  if (issue.value && newAssignee.value.trim()) {
    store.updateAssignee(issue.value.id, newAssignee.value.trim())
    showAssigneeEdit.value = false
  }
}

function onAttachmentUploaded(type: AttachmentType, att: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>) {
  if (!issue.value) return
  const final: Omit<Attachment, 'id' | 'uploadedAt' | 'version'> = {
    ...att,
    type,
    uploadedBy: store.currentUser,
  }
  store.addAttachment(issue.value.id, final)
  activeUploadTab.value = null
}

function viewAttachment(url: string) {
  window.open(url, '_blank')
}

watch(showDesignReplyForm, (val) => {
  if (val && replyForm.value) {
    setTimeout(() => replyForm.value?.focus(), 100)
  }
})
</script>

<template>
  <div
    v-if="issue"
    class="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
  >
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="text-xs font-mono text-slate-400">{{ issue.id }}</span>
          <StatusBadge :status="issue.status" size="sm" />
          <StatusBadge :priority="issue.priority" size="sm" />
        </div>
        <h3 class="text-base font-semibold text-slate-800 truncate">{{ issue.title }}</h3>
      </div>
      <button
        @click="close"
        class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="px-5 py-4 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-xs text-slate-500 block mb-1">楼层</span>
            <div class="flex items-center gap-1.5 text-sm text-slate-700">
              <Building2 class="w-4 h-4 text-slate-400" />
              {{ issue.floor }}
            </div>
          </div>
          <div>
            <span class="text-xs text-slate-500 block mb-1">系统</span>
            <div class="text-sm text-slate-700">
              {{ SYSTEM_LABELS[issue.system] }}
            </div>
          </div>
          <div>
            <span class="text-xs text-slate-500 block mb-1">碰撞类型</span>
            <div class="text-sm text-slate-700">
              {{ CATEGORY_LABELS[issue.category] }}
            </div>
          </div>
          <div>
            <span class="text-xs text-slate-500 block mb-1">标高</span>
            <div class="flex items-center gap-1.5 text-sm text-slate-700">
              <Ruler class="w-4 h-4 text-slate-400" />
              {{ formatElevation(issue.elevation, issue.elevationUnit) }}
            </div>
          </div>
          <div>
            <span class="text-xs text-slate-500 block mb-1">责任专业</span>
            <div class="text-sm text-slate-700">{{ issue.responsibleDept }}</div>
          </div>
          <div>
            <span class="text-xs text-slate-500 block mb-1">责任人</span>
            <div class="flex items-center gap-2">
              <div v-if="!showAssigneeEdit" class="flex items-center gap-1.5 text-sm text-slate-700">
                <User class="w-4 h-4 text-slate-400" />
                {{ issue.assignee || '未指定' }}
              </div>
              <select
                v-else
                v-model="newAssignee"
                class="text-sm border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-industrial-500"
              >
                <option v-for="dept in DEPARTMENT_OPTIONS" :key="dept" :value="dept">{{ dept }}</option>
                <option value="张工">张工</option>
                <option value="李工">李工</option>
                <option value="王工">王工</option>
                <option value="刘工">刘工</option>
                <option value="赵工">赵工</option>
                <option value="陈工">陈工</option>
              </select>
              <button
                v-if="!showAssigneeEdit"
                @click="startEditAssignee"
                class="text-industrial-500 hover:text-industrial-700"
                title="修改责任人"
              >
                <Edit class="w-3.5 h-3.5" />
              </button>
              <button
                v-else
                @click="saveAssignee"
                class="text-success-600 hover:text-success-700 text-xs font-medium"
              >
                确认
              </button>
            </div>
          </div>
        </div>

        <div>
          <span class="text-xs text-slate-500 block mb-1">
            <MapPin class="w-3.5 h-3.5 inline mr-1" />
            具体位置
          </span>
          <p class="text-sm text-slate-700">{{ issue.location }}</p>
        </div>

        <div>
          <span class="text-xs text-slate-500 block mb-1">
            <FileText class="w-3.5 h-3.5 inline mr-1" />
            问题描述
          </span>
          <p class="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-md">
            {{ issue.description }}
          </p>
        </div>

        <div>
          <span class="text-xs text-slate-500 block mb-1">
            <Calendar class="w-3.5 h-3.5 inline mr-1" />
            创建信息
          </span>
          <div class="text-sm text-slate-600 space-y-0.5">
            <div>创建人：{{ issue.createdBy }}</div>
            <div>创建时间：{{ formatDate(issue.createdAt) }}</div>
            <div>更新时间：{{ formatDate(issue.updatedAt) }}</div>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-5 space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Paperclip class="w-4 h-4" />
              附件 ({{ issue.attachments.length }})
            </h4>
          </div>

          <div class="space-y-4">
            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-slate-700 text-white rounded">BIM</span>
                  <span class="text-xs font-medium text-slate-700">BIM截图</span>
                  <span class="text-xs text-slate-400">{{ bimAttachments.length }} 个版本</span>
                </div>
                <button
                  @click="activeUploadTab = activeUploadTab === 'bim_screenshot' ? null : 'bim_screenshot'"
                  class="flex items-center gap-1 text-[11px] px-2 py-1 rounded text-industrial-600 hover:bg-white border border-transparent hover:border-industrial-200"
                >
                  <Upload class="w-3 h-3" />
                  <span>{{ activeUploadTab === 'bim_screenshot' ? '收起' : '新增上传' }}</span>
                </button>
              </div>
              <div v-if="activeUploadTab === 'bim_screenshot'" class="p-3 bg-industrial-50 border-b border-slate-200">
                <AttachmentUploader
                  :allowed-types="['bim_screenshot']"
                  label="上传BIM截图（同类型保留历史版本）"
                  @upload="(a) => onAttachmentUploaded('bim_screenshot', a)"
                />
              </div>
              <div v-if="bimAttachments.length > 0" class="p-3 grid grid-cols-4 gap-2">
                <div
                  v-for="att in bimAttachments"
                  :key="att.id"
                  @click="viewAttachment(att.url)"
                  class="relative aspect-square bg-slate-100 rounded-md overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-industrial-400 transition-all"
                  :title="`${att.name} · v${att.version} · ${att.uploadedBy} · ${formatDate(att.uploadedAt)}`"
                >
                  <img :src="att.url" :alt="att.name" class="w-full h-full object-cover" />
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                    <div class="text-[10px] text-white font-semibold">v{{ att.version }}</div>
                    <div class="text-[9px] text-slate-200 truncate">{{ att.uploadedBy }}</div>
                  </div>
                  <div
                    v-if="att.version === Math.max(...bimAttachments.map(a => a.version))"
                    class="absolute top-1 left-1 px-1 py-0.5 text-[9px] font-bold bg-success-500 text-white rounded"
                  >最新</div>
                  <div v-if="att.remark" class="absolute top-1 right-1 text-[9px] bg-black/60 text-white px-1 py-0.5 rounded">备注</div>
                </div>
              </div>
              <div v-else class="p-6 text-center text-slate-400 text-xs">暂无 BIM 截图</div>
            </div>

            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-fire-500 text-white rounded">PHOTO</span>
                  <span class="text-xs font-medium text-slate-700">现场照片</span>
                  <span class="text-xs text-slate-400">{{ photoAttachments.length }} 个版本</span>
                </div>
                <button
                  @click="activeUploadTab = activeUploadTab === 'photo' ? null : 'photo'"
                  class="flex items-center gap-1 text-[11px] px-2 py-1 rounded text-industrial-600 hover:bg-white border border-transparent hover:border-industrial-200"
                >
                  <Upload class="w-3 h-3" />
                  <span>{{ activeUploadTab === 'photo' ? '收起' : '新增上传' }}</span>
                </button>
              </div>
              <div v-if="activeUploadTab === 'photo'" class="p-3 bg-industrial-50 border-b border-slate-200">
                <AttachmentUploader
                  :allowed-types="['photo']"
                  label="上传现场照片（同类型保留历史版本）"
                  @upload="(a) => onAttachmentUploaded('photo', a)"
                />
              </div>
              <div v-if="photoAttachments.length > 0" class="p-3 grid grid-cols-4 gap-2">
                <div
                  v-for="att in photoAttachments"
                  :key="att.id"
                  @click="viewAttachment(att.url)"
                  class="relative aspect-square bg-slate-100 rounded-md overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-industrial-400 transition-all"
                  :title="`${att.name} · v${att.version} · ${att.uploadedBy}`"
                >
                  <img :src="att.url" :alt="att.name" class="w-full h-full object-cover" />
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                    <div class="text-[10px] text-white font-semibold">v{{ att.version }}</div>
                    <div class="text-[9px] text-slate-200 truncate">{{ att.uploadedBy }}</div>
                  </div>
                  <div
                    v-if="att.version === Math.max(...photoAttachments.map(a => a.version))"
                    class="absolute top-1 left-1 px-1 py-0.5 text-[9px] font-bold bg-success-500 text-white rounded"
                  >最新</div>
                </div>
              </div>
              <div v-else class="p-6 text-center text-slate-400 text-xs">暂无现场照片</div>
            </div>

            <div class="border border-slate-200 rounded-lg overflow-hidden">
              <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-warning-600 text-white rounded">DOC</span>
                  <span class="text-xs font-medium text-slate-700">设计回复 / 文档</span>
                  <span class="text-xs text-slate-400">{{ docAttachments.length }} 个版本</span>
                </div>
                <button
                  @click="activeUploadTab = activeUploadTab === 'document' ? null : 'document'"
                  class="flex items-center gap-1 text-[11px] px-2 py-1 rounded text-industrial-600 hover:bg-white border border-transparent hover:border-industrial-200"
                >
                  <Upload class="w-3 h-3" />
                  <span>{{ activeUploadTab === 'document' ? '收起' : '新增上传' }}</span>
                </button>
              </div>
              <div v-if="activeUploadTab === 'document'" class="p-3 bg-industrial-50 border-b border-slate-200">
                <AttachmentUploader
                  :allowed-types="['document', 'photo', 'bim_screenshot']"
                  label="上传设计回复或文档文件（保留版本历史）"
                  @upload="(a) => onAttachmentUploaded('document', a)"
                />
              </div>
              <div v-if="docAttachments.length > 0" class="p-3 space-y-2">
                <div
                  v-for="att in docAttachments"
                  :key="att.id"
                  @click="viewAttachment(att.url)"
                  class="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 hover:border-industrial-300 cursor-pointer transition-all"
                >
                  <FileText class="w-5 h-5 text-slate-500 flex-shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-medium text-slate-700 truncate">{{ att.name }}</span>
                      <span class="px-1 py-0.5 text-[9px] font-semibold bg-industrial-100 text-industrial-700 rounded flex-shrink-0">v{{ att.version }}</span>
                      <span
                        v-if="att.version === Math.max(...docAttachments.map(a => a.version))"
                        class="px-1 py-0.5 text-[9px] font-bold bg-success-500 text-white rounded flex-shrink-0"
                      >最新</span>
                    </div>
                    <div class="text-[11px] text-slate-400 truncate">
                      {{ att.uploadedBy }} · {{ formatDate(att.uploadedAt) }}
                      <span v-if="att.remark">· {{ att.remark }}</span>
                    </div>
                  </div>
                  <Download class="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              </div>
              <div v-else class="p-6 text-center text-slate-400 text-xs">暂无文档</div>
            </div>

            <div v-if="otherAttachments.length > 0" class="border border-slate-200 rounded-lg overflow-hidden">
              <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div class="flex items-center gap-2">
                  <span class="px-1.5 py-0.5 text-[10px] font-medium bg-slate-400 text-white rounded">OTHER</span>
                  <span class="text-xs font-medium text-slate-700">其他附件</span>
                  <span class="text-xs text-slate-400">{{ otherAttachments.length }} 个</span>
                </div>
              </div>
              <div class="p-3 grid grid-cols-4 gap-2">
                <div
                  v-for="att in otherAttachments"
                  :key="att.id"
                  @click="viewAttachment(att.url)"
                  class="relative aspect-square bg-slate-100 rounded-md overflow-hidden border border-slate-200 cursor-pointer"
                >
                  <img :src="att.url" :alt="att.name" class="w-full h-full object-cover" />
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1">
                    <div class="text-[10px] text-white font-semibold">v{{ att.version }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-5">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageSquare class="w-4 h-4" />
              设计回复 ({{ issue.designReplies.length }})
            </h4>
            <button
              v-if="canReply"
              @click="showDesignReplyForm = !showDesignReplyForm"
              class="flex items-center gap-1.5 text-xs text-industrial-600 hover:text-industrial-700"
            >
              <Send class="w-3.5 h-3.5" />
              添加回复
            </button>
          </div>

          <div v-if="showDesignReplyForm" class="mb-4 p-3 bg-industrial-50 rounded-lg border border-industrial-200 space-y-2">
            <input
              v-model="newReplyBy"
              type="text"
              placeholder="回复人"
              class="w-full px-3 py-1.5 text-sm border border-industrial-200 rounded focus:outline-none focus:ring-1 focus:ring-industrial-500"
            />
            <textarea
              ref="replyForm"
              v-model="newReplyContent"
              placeholder="输入设计回复内容..."
              rows="3"
              class="w-full px-3 py-2 text-sm border border-industrial-200 rounded focus:outline-none focus:ring-1 focus:ring-industrial-500 resize-none"
            />
            <div class="space-y-2">
              <button
                @click="replyAttachmentUploadOpen = !replyAttachmentUploadOpen"
                class="text-[11px] text-industrial-600 hover:text-industrial-700 flex items-center gap-1"
              >
                <Paperclip class="w-3 h-3" />
                {{ replyAttachmentUploadOpen ? '收起回复附件' : '添加回复附件' }}
                <span v-if="pendingReplyAttachments.length > 0" class="px-1 py-0.5 bg-industrial-500 text-white rounded text-[10px]">
                  {{ pendingReplyAttachments.length }}
                </span>
              </button>
              <div v-if="replyAttachmentUploadOpen">
                <AttachmentUploader
                  :allowed-types="['document', 'bim_screenshot', 'photo']"
                  label="回复附件（支持设计变更单、复核图等）"
                  @upload="handleReplyAttachmentUploaded"
                />
                <div v-if="pendingReplyAttachments.length > 0" class="mt-2 space-y-1">
                  <div
                    v-for="(att, idx) in pendingReplyAttachments"
                    :key="idx"
                    class="text-[11px] flex items-center justify-between bg-white px-2 py-1 rounded border border-industrial-200"
                  >
                    <span class="truncate">{{ att.name }}（{{ ATTACHMENT_TYPE_LABELS[att.type] }}）</span>
                    <span class="text-slate-400 text-[10px] flex-shrink-0 ml-2">已添加</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-2">
              <button
                @click="showDesignReplyForm = false"
                class="px-3 py-1.5 text-xs text-slate-600 hover:bg-white rounded transition-colors"
              >
                取消
              </button>
              <button
                @click="handleReply"
                :disabled="!newReplyContent.trim()"
                class="px-3 py-1.5 text-xs text-white bg-industrial-600 hover:bg-industrial-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                提交回复
              </button>
            </div>
          </div>

          <div v-if="issue.designReplies.length > 0" class="space-y-3">
            <div
              v-for="reply in [...issue.designReplies].reverse()"
              :key="reply.id"
              :class="[
                'p-3 rounded-lg border',
                reply.isLatest
                  ? 'bg-success-50 border-success-200'
                  : 'bg-slate-50 border-slate-200',
              ]"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium text-slate-700">{{ reply.repliedBy }}</span>
                  <span
                    v-if="reply.isLatest"
                    class="px-1.5 py-0.5 text-[10px] font-medium bg-success-500 text-white rounded"
                  >
                    最新
                  </span>
                </div>
                <span class="text-xs text-slate-500">{{ formatDate(reply.repliedAt) }}</span>
              </div>
              <p class="text-sm text-slate-600 leading-relaxed">{{ reply.content }}</p>
              <div v-if="reply.attachments.length > 0" class="mt-2 pt-2 border-t border-slate-200/50 space-y-1">
                <div class="text-[11px] text-slate-500 mb-1">回复附件：</div>
                <div
                  v-for="att in reply.attachments"
                  :key="att.id"
                  @click="viewAttachment(att.url)"
                  class="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-industrial-600 cursor-pointer"
                >
                  <FileText class="w-3 h-3" />
                  <span class="truncate">{{ att.name }}</span>
                  <span class="text-slate-400 flex-shrink-0">({{ ATTACHMENT_TYPE_LABELS[att.type] }}, v{{ att.version }})</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6 text-slate-400 text-sm">
            暂无设计回复
          </div>
        </div>

        <div class="border-t border-slate-200 pt-5">
          <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Clock class="w-4 h-4" />
            状态历史
          </h4>
          <div class="relative pl-5 space-y-4">
            <div
              v-for="record in [...issue.statusHistory].reverse()"
              :key="record.id"
              class="relative"
            >
              <div class="absolute -left-5 top-0.5 w-3 h-3 rounded-full bg-industrial-500 border-2 border-white shadow-sm"></div>
              <div class="absolute -left-[9px] top-3 bottom-0 w-px bg-slate-200"></div>
              <div class="pb-3">
                <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                  <StatusBadge :status="record.toStatus" size="sm" />
                  <span class="text-xs text-slate-500">{{ record.operator }}</span>
                </div>
                <div v-if="record.fromStatus" class="text-[11px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <span>{{ STATUS_LABELS[record.fromStatus] }}</span>
                  <ChevronRight class="w-3 h-3" />
                  <span>{{ STATUS_LABELS[record.toStatus] }}</span>
                </div>
                <p v-if="record.remark" class="text-xs text-slate-600">{{ record.remark }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(record.operateTime) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-5 py-4 border-t border-slate-200 bg-slate-50">
      <div class="flex items-center gap-2 flex-wrap">
        <button
          v-if="canSubmit"
          @click="handleSubmit"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-fire-600 hover:bg-fire-700 rounded-md transition-colors"
        >
          <Send class="w-4 h-4" />
          提交
        </button>
        <button
          v-if="canReturn"
          @click="handleReturn"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-fire-500 hover:bg-fire-600 rounded-md transition-colors"
          title="退回待改"
        >
          <CornerUpLeft class="w-4 h-4" />
          退回待改
        </button>
        <button
          v-if="canComplete"
          @click="handleComplete"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-md transition-colors"
        >
          <CheckCircle class="w-4 h-4" />
          确认完成
        </button>
        <button
          v-if="canReopen"
          @click="handleReopen"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-warning-600 hover:bg-warning-700 rounded-md transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
          重新打开
        </button>
        <button
          v-if="canCancel"
          @click="handleCancel"
          class="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
        >
          <XCircle class="w-4 h-4" />
          取消
        </button>
      </div>
    </div>
  </div>

  <div v-if="issue" @click="close" class="fixed inset-0 bg-black/30 z-40"></div>
</template>
