<script setup lang="ts">
import { Flame, Download, Plus, RefreshCw, User } from 'lucide-vue-next'
import { useIssueStore } from '@/stores/issueStore'

const store = useIssueStore()

const emit = defineEmits<{
  (e: 'newIssue'): void
}>()

function handleExport() {
  store.downloadMinutes()
}

function handleResetData() {
  if (confirm('确定要重置为初始样例数据吗？当前所有修改将丢失。')) {
    store.resetToMockData()
  }
}
</script>

<template>
  <header class="bg-slate-900 text-white shadow-lg">
    <div class="px-6 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-fire-600 rounded-lg flex items-center justify-center">
            <Flame class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-lg font-bold tracking-wide">消防喷淋碰撞问题看板</h1>
            <p class="text-xs text-slate-400">Fire Sprinkler Collision Management</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleResetData"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="重置样例数据"
          >
            <RefreshCw class="w-4 h-4" />
            <span class="hidden sm:inline">重置数据</span>
          </button>
          <button
            @click="handleExport"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <Download class="w-4 h-4" />
            <span class="hidden sm:inline">导出纪要</span>
          </button>
          <button
            @click="emit('newIssue')"
            class="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-fire-600 hover:bg-fire-700 rounded-md transition-colors"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">新建问题</span>
          </button>
          <div class="w-px h-6 bg-slate-700 mx-1"></div>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <User class="w-4 h-4 text-slate-300" />
            </div>
            <span class="text-sm text-slate-300 hidden md:inline">{{ store.currentUser }}</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
