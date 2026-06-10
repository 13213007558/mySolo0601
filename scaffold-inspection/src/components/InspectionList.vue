<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <div class="text-sm font-medium text-gray-700">
        巡检记录 <span class="text-gray-400 font-normal">（{{ filteredRecords.length }} 条）</span>
      </div>
      <BatchActionBar />
    </div>

    <div v-if="filteredRecords.length === 0" class="p-12 text-center">
      <div v-if="records.length === 0" class="space-y-3">
        <div class="text-5xl mb-4">🏗️</div>
        <div class="text-lg font-medium text-gray-700">暂无巡检记录</div>
        <div class="text-sm text-gray-400">点击右上角「加载样例」体验完整功能</div>
        <div class="text-xs text-gray-300 mt-4">
          所有数据存储在浏览器本地 IndexedDB 中<br />
          刷新页面数据不会丢失
        </div>
      </div>
      <div v-else class="space-y-2">
        <div class="text-4xl mb-3">🔍</div>
        <div class="text-sm text-gray-500">当前筛选条件下没有匹配的记录</div>
        <button
          @click="store.resetFilter()"
          class="text-sm text-scaffold-600 hover:text-scaffold-700"
        >
          清除筛选条件
        </button>
      </div>
    </div>

    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="record in filteredRecords"
        :key="record.id"
        @click="store.selectRecord(record.id)"
        :class="[
          'p-4 cursor-pointer hover:bg-scaffold-50/50 transition-colors border-l-4',
          isOverdue(record.deadline, record.status) ? 'border-l-red-500' : 'border-l-transparent hover:border-l-scaffold-300'
        ]"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-xs font-mono text-gray-400">{{ record.code }}</span>
              <span
                :class="[
                  'px-2 py-0.5 text-xs rounded-full border',
                  STATUS_BG[record.status]
                ]"
              >
                {{ STATUS_LABELS[record.status] }}
              </span>
              <span
                :class="[
                  'px-2 py-0.5 text-xs rounded-full',
                  LEVEL_COLORS[record.problemLevel]
                ]"
              >
                {{ LEVEL_LABELS[record.problemLevel] }}
              </span>
              <span
                v-if="repeatProblemIds.has(record.id)"
                class="px-2 py-0.5 text-xs rounded-full bg-purple-50 text-purple-600 border border-purple-200"
              >
                重复
              </span>
              <span
                v-if="isOverdue(record.deadline, record.status)"
                class="px-2 py-0.5 text-xs rounded-full bg-red-50 text-red-600 border border-red-200"
              >
                逾期 {{ daysOverdue(record.deadline) }} 天
              </span>
              <span
                v-if="record.photos.length === 0"
                class="px-2 py-0.5 text-xs rounded-full bg-amber-50 text-amber-600 border border-amber-200"
              >
                缺照片
              </span>
            </div>
            <div class="text-sm font-medium text-gray-800 mb-1">
              {{ record.problemTitle }}
            </div>
            <div class="text-xs text-gray-500 mb-2 line-clamp-1">
              {{ record.problemDescription }}
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span class="flex items-center gap-1">
                <Building2 class="w-3.5 h-3.5" />
                {{ record.building }} · {{ record.floor }}
              </span>
              <span class="flex items-center gap-1">
                <MapPin class="w-3.5 h-3.5" />
                {{ record.location }}
              </span>
              <span class="flex items-center gap-1">
                <Users class="w-3.5 h-3.5" />
                {{ record.responsibleTeam }} · {{ record.foreman }}
              </span>
              <span class="flex items-center gap-1">
                <Camera class="w-3.5 h-3.5" />
                {{ record.photos.length }} 张
              </span>
              <span v-if="record.demolitionRequests.length > 0" class="flex items-center gap-1 text-scaffold-600">
                <Hammer class="w-3.5 h-3.5" />
                {{ record.demolitionRequests.length }} 份拆改申请
              </span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-xs text-gray-400 mb-1">整改期限</div>
            <div
              :class="[
                'text-xs font-medium',
                isOverdue(record.deadline, record.status) ? 'text-red-500' : 'text-gray-600'
              ]"
            >
              {{ formatDate(record.deadline) }}
            </div>
            <div class="text-xs text-gray-400 mt-1">
              发现于 {{ formatDate(record.foundAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Building2, MapPin, Users, Camera, Hammer } from 'lucide-vue-next'
import { useInspectionStore } from '@/stores/inspection'
import { storeToRefs } from 'pinia'
import { STATUS_LABELS, STATUS_BG, LEVEL_LABELS, LEVEL_COLORS } from '@/types'
import { isOverdue, daysOverdue, formatDate } from '@/utils/helpers'
import BatchActionBar from './BatchActionBar.vue'

const store = useInspectionStore()
const { filteredRecords, records, repeatProblemIds } = storeToRefs(store)
</script>
