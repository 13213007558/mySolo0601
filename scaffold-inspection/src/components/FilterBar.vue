<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm space-y-3">
    <div class="flex flex-wrap gap-2 items-center">
      <div class="relative flex-1 min-w-[200px]">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索编号、楼栋、位置、班组..."
          class="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-scaffold-400 focus:border-transparent"
        />
      </div>

      <select
        v-model="buildingFilter"
        class="text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-scaffold-400"
      >
        <option value="">全部楼栋</option>
        <option v-for="b in buildings" :key="b" :value="b">{{ b }}</option>
      </select>

      <select
        v-model="statusFilter"
        multiple
        class="text-sm border border-gray-200 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-scaffold-400 h-[38px]"
        style="display: none;"
      >
      </select>

      <div class="flex gap-2 flex-wrap">
        <button
          v-for="s in statusOptions"
          :key="s.value"
          @click="toggleStatus(s.value)"
          :class="[
            'px-3 py-1.5 text-xs rounded-md border transition-colors',
            activeStatuses.includes(s.value)
              ? 'bg-scaffold-600 text-white border-scaffold-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-scaffold-300'
          ]"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 items-center">
      <div class="flex gap-1.5 flex-wrap">
        <button
          @click="toggleOverdue"
          :class="[
            'px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors',
            onlyOverdue
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
          ]"
        >
          <AlertTriangle class="w-3.5 h-3.5" />
          只看逾期
        </button>
        <button
          @click="toggleNoPhoto"
          :class="[
            'px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors',
            onlyNoPhoto
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
          ]"
        >
          <ImageOff class="w-3.5 h-3.5" />
          缺照片
        </button>
        <button
          @click="toggleRepeat"
          :class="[
            'px-3 py-1.5 text-xs rounded-md border flex items-center gap-1 transition-colors',
            onlyRepeat
              ? 'bg-purple-500 text-white border-purple-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
          ]"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          重复问题
        </button>
      </div>

      <div class="flex-1"></div>

      <div class="flex items-center gap-2">
        <User class="w-4 h-4 text-gray-400" />
        <input
          v-model="operatorName"
          @blur="saveOperator"
          @keyup.enter="saveOperator"
          class="text-sm border border-gray-200 rounded-md px-2 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-scaffold-400"
        />
      </div>

      <button
        @click="handleLoadMock"
        class="px-3 py-1.5 text-sm text-scaffold-700 bg-scaffold-50 rounded-md border border-scaffold-200 hover:bg-scaffold-100 transition-colors"
      >
        加载样例
      </button>
      <button
        @click="handleClear"
        class="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
      >
        清空数据
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, AlertTriangle, ImageOff, RotateCcw, User } from 'lucide-vue-next'
import { useInspectionStore } from '@/stores/inspection'
import { storeToRefs } from 'pinia'
import { STATUS_LABELS, type InspectionStatus } from '@/types'

const store = useInspectionStore()
const { buildings, filter } = storeToRefs(store)

const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value: value as InspectionStatus,
  label
}))

const keyword = ref(filter.value.keyword)
const buildingFilter = ref(filter.value.building || '')
const onlyOverdue = ref(filter.value.onlyOverdue)
const onlyNoPhoto = ref(filter.value.onlyNoPhoto)
const onlyRepeat = ref(filter.value.onlyRepeat)
const activeStatuses = ref<InspectionStatus[]>([...filter.value.status])
const operatorName = ref(store.currentOperator)

function toggleStatus(s: InspectionStatus) {
  const idx = activeStatuses.value.indexOf(s)
  if (idx >= 0) {
    activeStatuses.value.splice(idx, 1)
  } else {
    activeStatuses.value.push(s)
  }
}

function toggleOverdue() {
  onlyOverdue.value = !onlyOverdue.value
}

function toggleNoPhoto() {
  onlyNoPhoto.value = !onlyNoPhoto.value
}

function toggleRepeat() {
  onlyRepeat.value = !onlyRepeat.value
}

function saveOperator() {
  store.setOperator(operatorName.value)
}

function handleLoadMock() {
  if (confirm('加载样例数据将添加多条巡检记录，确定吗？')) {
    store.loadMockData()
  }
}

function handleClear() {
  if (confirm('确定要清空所有巡检数据吗？此操作不可撤销。')) {
    store.clearAll()
  }
}

watch(keyword, (v) => store.setFilter('keyword', v))
watch(buildingFilter, (v) => store.setFilter('building', v || null))
watch(onlyOverdue, (v) => store.setFilter('onlyOverdue', v))
watch(onlyNoPhoto, (v) => store.setFilter('onlyNoPhoto', v))
watch(onlyRepeat, (v) => store.setFilter('onlyRepeat', v))
watch(activeStatuses, (v) => store.setFilter('status', v), { deep: true })
</script>
