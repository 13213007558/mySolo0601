<template>
  <div
    v-if="showDetail && selectedRecord"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
    @click.self="store.closeDetail()"
  >
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <!-- 头部 -->
      <div class="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="text-sm font-mono text-gray-400">{{ selectedRecord.code }}</span>
            <span
              :class="[
                'px-2 py-0.5 text-xs rounded-full border',
                STATUS_BG[selectedRecord.status]
              ]"
            >
              {{ STATUS_LABELS[selectedRecord.status] }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 text-xs rounded-full',
                LEVEL_COLORS[selectedRecord.problemLevel]
              ]"
            >
              {{ LEVEL_LABELS[selectedRecord.problemLevel] }}
            </span>
            <span
              v-if="isOverdue(selectedRecord.deadline, selectedRecord.status)"
              class="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600 border border-red-200"
            >
              逾期 {{ daysOverdue(selectedRecord.deadline) }} 天
            </span>
          </div>
          <h3 class="text-lg font-semibold text-gray-800">{{ selectedRecord.problemTitle }}</h3>
          <div class="text-xs text-gray-500 mt-1">
            {{ selectedRecord.building }} · {{ selectedRecord.floor }} · {{ selectedRecord.location }}
          </div>
        </div>
        <button
          @click="store.closeDetail()"
          class="text-gray-400 hover:text-gray-600 transition-colors ml-4"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 标签页 -->
      <div class="px-6 border-b border-gray-100">
        <div class="flex gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-scaffold-500 text-scaffold-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            ]"
          >
            {{ tab.label }}
            <span v-if="tab.count !== undefined" class="ml-1 text-xs text-gray-400">
              ({{ tab.count }})
            </span>
          </button>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- 基本信息 -->
        <div v-show="activeTab === 'info'" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-gray-500 mb-1">脚手架类型</div>
              <div class="text-sm text-gray-800">{{ selectedRecord.scaffoldTypeLabel }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">责任班组</div>
              <div class="text-sm text-gray-800">{{ selectedRecord.responsibleTeam }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">架子工长</div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-800">{{ selectedRecord.foreman }}</span>
                <button
                  @click="showForemanEdit = !showForemanEdit"
                  class="text-xs text-scaffold-600 hover:text-scaffold-700"
                >
                  变更
                </button>
              </div>
              <div v-if="showForemanEdit" class="mt-2 flex gap-2">
                <input
                  v-model="newForeman"
                  class="flex-1 text-sm border border-gray-200 rounded px-2 py-1"
                  placeholder="新工长姓名"
                />
                <button
                  @click="handleChangeForeman"
                  class="px-2 py-1 text-xs bg-scaffold-500 text-white rounded hover:bg-scaffold-600"
                >
                  确定
                </button>
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">发现人</div>
              <div class="text-sm text-gray-800">{{ selectedRecord.foundBy }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">发现时间</div>
              <div class="text-sm text-gray-800">{{ formatDateTime(selectedRecord.foundAt) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-1">整改期限</div>
              <div
                :class="[
                  'text-sm',
                  isOverdue(selectedRecord.deadline, selectedRecord.status)
                    ? 'text-red-600 font-medium'
                    : 'text-gray-800'
                ]"
              >
                {{ formatDateTime(selectedRecord.deadline) }}
              </div>
            </div>
          </div>

          <div>
            <div class="text-xs text-gray-500 mb-1">问题描述</div>
            <div class="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              {{ selectedRecord.problemDescription }}
            </div>
          </div>

          <div v-if="selectedRecord.rectificationNote">
            <div class="text-xs text-gray-500 mb-1">整改说明</div>
            <div class="text-sm text-gray-700 bg-emerald-50 rounded-lg p-3">
              {{ selectedRecord.rectificationNote }}
            </div>
          </div>

          <div v-if="selectedRecord.recheckNote">
            <div class="text-xs text-gray-500 mb-1">复查意见</div>
            <div class="text-sm text-gray-700 bg-purple-50 rounded-lg p-3">
              {{ selectedRecord.recheckNote }}
            </div>
          </div>

          <!-- 状态操作 -->
          <div class="border-t border-gray-100 pt-4">
            <div class="text-xs text-gray-500 mb-3">状态操作</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="selectedRecord.status === 'found'"
                @click="handleStartRectify"
                class="px-4 py-2 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
              >
                开始整改
              </button>
              <button
                v-if="selectedRecord.status === 'rectifying' || selectedRecord.status === 'returned'"
                @click="handleSubmitRecheck"
                class="px-4 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
              >
                申请复查
              </button>
              <button
                v-if="selectedRecord.status === 'rechecking'"
                @click="handlePass"
                class="px-4 py-2 text-sm bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
              >
                复查通过
              </button>
              <button
                v-if="selectedRecord.status === 'rechecking'"
                @click="showReturnModal = true"
                class="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                退回重改
              </button>
              <button
                v-if="selectedRecord.status === 'passed'"
                @click="handleClose"
                class="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                闭环
              </button>
            </div>

            <div v-if="passError" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="text-xs font-medium text-red-700 mb-1">无法通过</div>
              <ul class="text-xs text-red-600 space-y-0.5">
                <li v-for="(e, i) in passError" :key="i">• {{ e }}</li>
              </ul>
            </div>
          </div>

          <!-- 退回弹层 -->
          <div
            v-if="showReturnModal"
            class="fixed inset-0 z-10 flex items-center justify-center bg-black/30"
          >
            <div class="bg-white rounded-lg p-5 w-96 shadow-xl">
              <div class="text-sm font-medium text-gray-800 mb-3">退回重改原因</div>
              <textarea
                v-model="returnReason"
                rows="3"
                class="w-full text-sm border border-gray-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="请输入退回原因..."
              />
              <div class="flex justify-end gap-2 mt-4">
                <button
                  @click="showReturnModal = false"
                  class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  @click="handleReturn"
                  class="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  确认退回
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 照片对照 -->
        <div v-show="activeTab === 'photos'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-gray-700">照片对照</div>
            <div class="flex gap-2">
              <select
                v-model="uploadPhase"
                class="text-xs border border-gray-200 rounded px-2 py-1"
              >
                <option value="before">整改前</option>
                <option value="during">整改中</option>
                <option value="after">整改后</option>
                <option value="recheck">复查照</option>
              </select>
              <label
                class="px-3 py-1.5 text-xs bg-scaffold-500 text-white rounded-md cursor-pointer hover:bg-scaffold-600 transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handlePhotoUpload"
                />
                上传照片
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="photo in selectedRecord.photos"
              :key="photo.id"
              class="group relative rounded-lg overflow-hidden border border-gray-200"
            >
              <div
                class="aspect-square bg-gray-100 flex items-center justify-center"
                :style="photo.dataUrl ? `background-image: url(${photo.dataUrl}); background-size: cover; background-position: center;` : ''"
              >
                <Image v-if="!photo.dataUrl" class="w-12 h-12 text-gray-300" />
              </div>
              <div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                <div class="font-medium">{{ PHASE_LABELS[photo.phase] }}</div>
                <div class="text-gray-300 truncate">{{ photo.caption }}</div>
              </div>
              <button
                @click="handleRemovePhoto(photo.id)"
                class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="selectedRecord.photos.length === 0" class="text-center py-12">
            <ImageOff class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div class="text-sm text-gray-400">暂无照片</div>
          </div>
        </div>

        <!-- 拆改申请 -->
        <div v-show="activeTab === 'demolition'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-gray-700">拆改申请</div>
            <button
              @click="showAddDemo = true"
              class="px-3 py-1.5 text-xs bg-scaffold-500 text-white rounded-md hover:bg-scaffold-600 transition-colors flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              新增申请
            </button>
          </div>

          <div v-if="selectedRecord.demolitionRequests.length === 0" class="text-center py-12">
            <Hammer class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <div class="text-sm text-gray-400">暂无拆改申请</div>
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="req in selectedRecord.demolitionRequests"
              :key="req.id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Hammer class="w-4 h-4 text-scaffold-500" />
                  <span class="text-sm font-medium text-gray-800">拆改申请</span>
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs rounded-full',
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                      req.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    ]"
                  >
                    {{ req.status === 'approved' ? '已批准' : req.status === 'rejected' ? '已驳回' : '待审批' }}
                  </span>
                </div>
                <span class="text-xs text-gray-400">{{ formatDateTime(req.requestedAt) }}</span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-gray-500">申请人：</span>
                  <span class="text-gray-700">{{ req.requestedBy }}</span>
                </div>
                <div>
                  <span class="text-gray-500">位置：</span>
                  <span class="text-gray-700">{{ req.location }}</span>
                </div>
                <div class="col-span-2">
                  <span class="text-gray-500">原因：</span>
                  <span class="text-gray-700">{{ req.reason }}</span>
                </div>
                <div class="col-span-2">
                  <span class="text-gray-500">范围：</span>
                  <span class="text-gray-700">{{ req.scope }}</span>
                </div>
                <div v-if="req.approvaNote" class="col-span-2">
                  <span class="text-gray-500">审批意见：</span>
                  <span class="text-gray-700">{{ req.approvaNote }}</span>
                </div>
              </div>
              <div v-if="req.status === 'pending'" class="flex justify-end gap-2 mt-3">
                <button
                  @click="handleApproveDemo(req.id, false)"
                  class="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  驳回
                </button>
                <button
                  @click="handleApproveDemo(req.id, true)"
                  class="px-3 py-1 text-xs text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-50"
                >
                  批准
                </button>
              </div>
            </div>
          </div>

          <!-- 新增申请弹层 -->
          <div
            v-if="showAddDemo"
            class="fixed inset-0 z-10 flex items-center justify-center bg-black/30"
          >
            <div class="bg-white rounded-lg p-5 w-96 shadow-xl">
              <div class="text-sm font-medium text-gray-800 mb-4">新增拆改申请</div>
              <div class="space-y-3">
                <div>
                  <label class="text-xs text-gray-500 block mb-1">拆改位置</label>
                  <input
                    v-model="newDemo.location"
                    class="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 block mb-1">拆改原因</label>
                  <input
                    v-model="newDemo.reason"
                    class="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 block mb-1">拆改范围</label>
                  <textarea
                    v-model="newDemo.scope"
                    rows="2"
                    class="w-full text-sm border border-gray-200 rounded px-2 py-1.5"
                  />
                </div>
              </div>
              <div class="flex justify-end gap-2 mt-4">
                <button
                  @click="showAddDemo = false"
                  class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  @click="handleAddDemo"
                  class="px-3 py-1.5 text-sm bg-scaffold-500 text-white rounded-md hover:bg-scaffold-600"
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 审计记录 -->
        <div v-show="activeTab === 'audit'" class="space-y-4">
          <div class="text-sm font-medium text-gray-700">变更历史</div>
          <div class="relative pl-6">
            <div class="absolute left-2 top-1 bottom-1 w-0.5 bg-gray-200"></div>
            <div
              v-for="log in selectedRecord.auditLog.slice().reverse()"
              :key="log.id"
              class="relative mb-4 last:mb-0"
            >
              <div class="absolute -left-6 w-4 h-4 rounded-full bg-white border-2 border-scaffold-400 top-0.5"></div>
              <div class="text-xs text-gray-500 mb-0.5">
                {{ formatDateTime(log.timestamp) }}
                <span class="text-gray-300 mx-1">·</span>
                <span>{{ log.operator }}</span>
              </div>
              <div class="text-sm text-gray-800 font-medium">{{ log.action }}</div>
              <div v-if="log.oldStatus && log.newStatus" class="text-xs text-gray-500 mt-0.5">
                <span :class="STATUS_TEXT_COLORS[log.oldStatus]">{{ STATUS_LABELS[log.oldStatus] }}</span>
                <ArrowRight class="w-3 h-3 inline mx-1 text-gray-300" />
                <span :class="STATUS_TEXT_COLORS[log.newStatus]">{{ STATUS_LABELS[log.newStatus] }}</span>
              </div>
              <div v-if="log.note" class="text-xs text-gray-600 mt-0.5 bg-gray-50 px-2 py-1 rounded">
                {{ log.note }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X, Image, ImageOff, Trash2, Plus, Hammer, ArrowRight
} from 'lucide-vue-next'
import { useInspectionStore } from '@/stores/inspection'
import { storeToRefs } from 'pinia'
import {
  STATUS_LABELS, STATUS_BG, LEVEL_LABELS, LEVEL_COLORS, PHASE_LABELS,
  type InspectionStatus, type PhotoAttachment
} from '@/types'
import { isOverdue, daysOverdue, formatDateTime } from '@/utils/helpers'

const store = useInspectionStore()
const { showDetail, selectedRecord } = storeToRefs(store)

const activeTab = ref<'info' | 'photos' | 'demolition' | 'audit'>('info')
const showForemanEdit = ref(false)
const newForeman = ref('')
const showReturnModal = ref(false)
const returnReason = ref('')
const passError = ref<string[] | null>(null)
const uploadPhase = ref<PhotoAttachment['phase']>('before')
const showAddDemo = ref(false)
const newDemo = ref({ location: '', reason: '', scope: '' })

const STATUS_TEXT_COLORS: Record<InspectionStatus, string> = {
  found: 'text-red-600',
  rectifying: 'text-amber-600',
  rechecking: 'text-purple-600',
  passed: 'text-emerald-600',
  returned: 'text-orange-600',
  closed: 'text-gray-500'
}

const tabs = computed(() => [
  { key: 'info' as const, label: '点位信息' },
  { key: 'photos' as const, label: '照片对照', count: selectedRecord.value?.photos.length || 0 },
  { key: 'demolition' as const, label: '拆改申请', count: selectedRecord.value?.demolitionRequests.length || 0 },
  { key: 'audit' as const, label: '变更历史', count: selectedRecord.value?.auditLog.length || 0 }
])

function handleStartRectify() {
  if (selectedRecord.value) {
    store.startRectification(selectedRecord.value.id)
  }
}

function handleSubmitRecheck() {
  if (selectedRecord.value) {
    store.submitRecheck(selectedRecord.value.id)
  }
}

async function handlePass() {
  if (!selectedRecord.value) return
  const result = await store.passInspection(selectedRecord.value.id)
  if (!result.ok) {
    passError.value = result.reasons
    setTimeout(() => { passError.value = null }, 5000)
  }
}

function handleReturn() {
  if (selectedRecord.value && returnReason.value) {
    store.returnRectification(selectedRecord.value.id, returnReason.value)
    showReturnModal.value = false
    returnReason.value = ''
  }
}

function handleClose() {
  if (selectedRecord.value) {
    store.closeInspection(selectedRecord.value.id)
  }
}

function handleChangeForeman() {
  if (selectedRecord.value && newForeman.value) {
    store.changeForeman(selectedRecord.value.id, newForeman.value)
    showForemanEdit.value = false
    newForeman.value = ''
  }
}

async function handlePhotoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !selectedRecord.value) return

  const caption = prompt('请输入照片说明：', PHASE_LABELS[uploadPhase.value]) || PHASE_LABELS[uploadPhase.value]
  await store.addPhoto(selectedRecord.value.id, file, uploadPhase.value, caption)
  input.value = ''
}

function handleRemovePhoto(photoId: string) {
  if (selectedRecord.value && confirm('确定删除这张照片吗？')) {
    store.removePhoto(selectedRecord.value.id, photoId)
  }
}

function handleAddDemo() {
  if (selectedRecord.value && newDemo.value.reason) {
    store.addDemolitionRequest(selectedRecord.value.id, newDemo.value)
    showAddDemo.value = false
    newDemo.value = { location: '', reason: '', scope: '' }
  }
}

function handleApproveDemo(requestId: string, approved: boolean) {
  if (selectedRecord.value) {
    const note = approved ? '' : prompt('请输入驳回原因：') || ''
    if (!approved && !note) return
    store.approveDemolition(selectedRecord.value.id, requestId, approved, note)
  }
}
</script>
