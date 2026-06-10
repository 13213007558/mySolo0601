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
import type { IssueStatus } from '@/types'
import StatusBadge from '@/components/common/StatusBadge.vue'
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
} from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useIssueStore()

const showDesignReplyForm = ref(false)
const newReplyContent = ref('')
const newReplyBy = ref('设计院')

const showAssigneeEdit = ref(false)
const newAssignee = ref('')

const replyForm = ref<HTMLTextAreaElement | null>(null)

const issue = computed(() => store.selectedIssue)

const canSubmit = computed(() => issue.value?.status === 'draft')
const canReply = computed(() => issue.value?.status === 'pending' || issue.value?.status === 'replied')
const canComplete = computed(() => issue.value?.status === 'replied')
const canReopen = computed(() => issue.value?.status === 'completed' || issue.value?.status === 'cancelled')
const canCancel = computed(() => issue.value?.status === 'pending' || issue.value?.status === 'replied')

function close() {
  emit('close')
  store.selectIssue(null)
}

function handleSubmit() {
  if (!issue.value) return
  store.changeStatus(issue.value.id, 'pending', '提交审核')
}

function handleReply() {
  if (!issue.value || !newReplyContent.value.trim()) return
  store.addDesignReply(issue.value.id, {
    content: newReplyContent.value,
    repliedBy: newReplyBy.value,
    attachments: [],
  })
  newReplyContent.value = ''
  showDesignReplyForm.value = false
}

function handleComplete() {
  if (!issue.value) return
  if (confirm('确认该问题已整改完成？')) {
    store.changeStatus(issue.value.id, 'completed', '现场确认整改完成')
  }
}

function handleReopen() {
  if (!issue.value) return
  if (confirm('确认重新打开该问题？')) {
    store.changeStatus(issue.value.id, 'pending', '重新打开问题')
  }
}

function handleCancel() {
  if (!issue.value) return
  if (confirm('确认取消该问题？')) {
    store.changeStatus(issue.value.id, 'cancelled', '问题取消')
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
        <div class="flex items-center gap-2 mb-1">
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

        <div class="border-t border-slate-200 pt-5">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Paperclip class="w-4 h-4" />
              附件 ({{ issue.attachments.length }})
            </h4>
            <button
              class="flex items-center gap-1.5 text-xs text-industrial-600 hover:text-industrial-700"
            >
              <Upload class="w-3.5 h-3.5" />
              上传
            </button>
          </div>
          <div v-if="issue.attachments.length > 0" class="grid grid-cols-3 gap-2">
            <div
              v-for="att in issue.attachments"
              :key="att.id"
              class="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
            >
              <img
                v-if="att.url"
                :src="att.url"
                :alt="att.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center text-slate-400"
              >
                <ImageIcon class="w-8 h-8" />
                <span class="text-xs mt-1">{{ att.type }}</span>
              </div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                <div class="p-2 w-full">
                  <p class="text-xs text-white truncate">{{ att.name }}</p>
                  <p class="text-xs text-slate-300">v{{ att.version }} · {{ att.uploadedBy }}</p>
                </div>
              </div>
              <span
                class="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[10px] bg-black/60 text-white rounded"
              >
                {{ ATTACHMENT_TYPE_LABELS[att.type] }}
              </span>
            </div>
          </div>
          <div v-else class="text-center py-6 text-slate-400 text-sm">
            暂无附件
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

          <div v-if="showDesignReplyForm" class="mb-4 p-3 bg-industrial-50 rounded-lg border border-industrial-200">
            <input
              v-model="newReplyBy"
              type="text"
              placeholder="回复人"
              class="w-full px-3 py-1.5 text-sm border border-industrial-200 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-industrial-500"
            />
            <textarea
              ref="replyForm"
              v-model="newReplyContent"
              placeholder="输入设计回复内容..."
              rows="3"
              class="w-full px-3 py-2 text-sm border border-industrial-200 rounded focus:outline-none focus:ring-1 focus:ring-industrial-500 resize-none"
            />
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
                <div class="flex items-center gap-2">
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
                <div class="flex items-center gap-2 mb-0.5">
                  <StatusBadge :status="record.toStatus" size="sm" />
                  <span class="text-xs text-slate-500">{{ record.operator }}</span>
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
      <div class="flex items-center gap-2">
        <button
          v-if="canSubmit"
          @click="handleSubmit"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-fire-600 hover:bg-fire-700 rounded-md transition-colors"
        >
          <Send class="w-4 h-4" />
          提交审核
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
