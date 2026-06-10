<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useIssueStore } from '@/stores/issueStore'
import {
  FLOOR_OPTIONS,
  DEPARTMENT_OPTIONS,
  CATEGORY_LABELS,
  SYSTEM_LABELS,
  PRIORITY_LABELS,
} from '@/types'
import type {
  CollisionCategory,
  SystemType,
  IssuePriority,
} from '@/types'

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

  store.addIssue({
    ...form.value,
  })

  emit('close')
}

function handleClose() {
  emit('close')
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
