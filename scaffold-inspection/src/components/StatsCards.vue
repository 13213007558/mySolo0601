<template>
  <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div class="text-xs text-gray-500 mb-1">总问题</div>
      <div class="text-2xl font-bold text-gray-800">{{ stats.total }}</div>
      <div class="text-xs text-gray-400 mt-1">共 {{ buildings.length }} 栋楼</div>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div class="text-xs text-gray-500 mb-1">待整改</div>
      <div class="text-2xl font-bold text-red-600">{{ stats.found }}</div>
      <div class="text-xs text-gray-400 mt-1">新发现问题</div>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div class="text-xs text-gray-500 mb-1">整改中</div>
      <div class="text-2xl font-bold text-amber-600">{{ stats.rectifying }}</div>
      <div class="text-xs text-gray-400 mt-1">班组处理中</div>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div class="text-xs text-gray-500 mb-1">待复查</div>
      <div class="text-2xl font-bold text-purple-600">{{ stats.rechecking }}</div>
      <div class="text-xs text-gray-400 mt-1">等待安全员复核</div>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div class="text-xs text-gray-500 mb-1">已通过</div>
      <div class="text-2xl font-bold text-emerald-600">{{ stats.passed }}</div>
      <div class="text-xs text-gray-400 mt-1">闭环率 {{ stats.closeRate }}%</div>
    </div>
    <div class="bg-white rounded-lg border border-red-200 p-4 shadow-sm bg-red-50/50">
      <div class="text-xs text-red-500 mb-1">逾期</div>
      <div class="text-2xl font-bold text-red-600">{{ stats.overdue }}</div>
      <div class="text-xs text-red-400 mt-1">超过整改期限</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInspectionStore } from '@/stores/inspection'
import { storeToRefs } from 'pinia'

const store = useInspectionStore()
const { stats, buildings } = storeToRefs(store)
</script>
