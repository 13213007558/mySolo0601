<template>
  <div class="min-h-screen bg-gray-50 font-['Noto_Sans_SC']">
    <!-- 头部 -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 bg-scaffold-600 rounded-lg flex items-center justify-center">
            <Construction class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-base font-semibold text-gray-800">脚手架巡检整改板</h1>
            <p class="text-xs text-gray-500">外架 · 内架 · 连墙件 · 拆改申请 · 逐点闭环</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <Database class="w-4 h-4" />
          <span>IndexedDB 本地存储 · 数据保留在浏览器</span>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <StatsCards />
      <FilterBar />
      <WarningBanner />
      <InspectionList />
    </main>

    <!-- 说明卡片 -->
    <div class="max-w-7xl mx-auto px-4 pb-8">
      <div class="bg-scaffold-50 border border-scaffold-200 rounded-lg p-4">
        <div class="text-sm font-medium text-scaffold-800 mb-2 flex items-center gap-2">
          <Info class="w-4 h-4" />
          使用说明
        </div>
        <ul class="text-xs text-scaffold-700 space-y-1.5">
          <li>• 点击任意巡检记录查看详情，可进行状态流转、照片上传、拆改申请等操作</li>
          <li>• 批量复查通过会自动跳过缺照片、超期、重复问题等异常记录</li>
          <li>• 所有数据存储在浏览器本地 IndexedDB，刷新后不会丢失</li>
          <li>• 点击「加载样例」可快速体验完整功能，包含逾期、重复、缺照片等场景</li>
          <li>• 可导出周报（按班组和楼栋分组）和明细清单用于存档</li>
        </ul>
      </div>
    </div>

    <InspectionDetailModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Construction, Database, Info } from 'lucide-vue-next'
import { useInspectionStore } from '@/stores/inspection'
import StatsCards from '@/components/StatsCards.vue'
import FilterBar from '@/components/FilterBar.vue'
import WarningBanner from '@/components/WarningBanner.vue'
import InspectionList from '@/components/InspectionList.vue'
import InspectionDetailModal from '@/components/InspectionDetailModal.vue'

const store = useInspectionStore()

onMounted(() => {
  store.loadData()
})
</script>
