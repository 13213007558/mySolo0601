<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filter'
import FilterBar from '@/components/FilterBar.vue'
import StatsCards from '@/components/StatsCards.vue'
import SampleCard from '@/components/SampleCard.vue'
import SampleForm from '@/components/SampleForm.vue'
import DetailDrawer from '@/components/DetailDrawer.vue'
import ExportDialog from '@/components/ExportDialog.vue'
import { PackageSearch, ClipboardList } from 'lucide-vue-next'

const filter = useFilterStore()

const samples = computed(() => filter.filteredSamples)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-cool-gray-50 via-industrial-50/30 to-cool-gray-100">
    <header class="bg-industrial-900 text-white border-b border-industrial-800 relative overflow-hidden">
      <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 40px 40px;"></div>
      <div class="max-w-7xl mx-auto px-6 py-5 relative">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-gold-400 to-amber-gold-600 flex items-center justify-center shadow-lg shadow-amber-gold-900/20">
              <ClipboardList :size="24" class="text-industrial-900" />
            </div>
            <div>
              <h1 class="font-serif font-bold text-2xl tracking-wide">幕墙样板封样对账管理系统</h1>
              <p class="text-xs text-industrial-300 mt-0.5">
                Curtain Wall Sample Sealing Reconciliation System · 批次对照 · 照片比对 · 历史可追溯
              </p>
            </div>
          </div>
          <div class="text-[11px] text-industrial-400 text-right space-y-0.5">
            <div>数据存储：浏览器 localStorage · 刷新不丢失</div>
            <div>离线可用 · 纯前端实现</div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-6 space-y-6">
      <FilterBar />
      <StatsCards />

      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-serif font-bold text-industrial-800 text-lg flex items-center gap-2">
            <PackageSearch :size="20" class="text-industrial-500" />
            样板列表
          </h2>
        </div>

        <div v-if="samples.length === 0" class="bg-white rounded-md border border-cool-gray-200 border-dashed p-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-cool-gray-100 flex items-center justify-center text-cool-gray-400">
            <PackageSearch :size="30" />
          </div>
          <div class="text-sm text-cool-gray-600 font-medium">没有找到匹配的样板记录</div>
          <div class="text-xs text-cool-gray-400 mt-1">请尝试调整筛选条件或新增样板</div>
        </div>

        <div
          v-else
          class="grid gap-4"
          :class="{
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4': samples.length >= 4,
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': samples.length === 3,
            'grid-cols-1 sm:grid-cols-2': samples.length === 2,
            'grid-cols-1 sm:max-w-md mx-auto': samples.length === 1,
          }"
        >
          <SampleCard
            v-for="(s, i) in samples"
            :key="s.id"
            :sample="s"
            :index="i"
          />
        </div>
      </section>
    </main>

    <footer class="mt-12 py-6 border-t border-cool-gray-200 bg-white/50">
      <div class="max-w-7xl mx-auto px-6 text-center text-[11px] text-cool-gray-400 space-y-1">
        <div>© 幕墙样板封样对账系统 · 项目部专用工具</div>
        <div>所有数据仅存储于本地浏览器，清空浏览器数据将导致记录丢失，请定期导出对账表备份</div>
      </div>
    </footer>

    <SampleForm />
    <DetailDrawer />
    <ExportDialog />
  </div>
</template>
