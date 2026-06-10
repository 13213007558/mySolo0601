<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-rebar-orange to-rebar-orange-dark rounded-lg flex items-center justify-center">
              <Construction class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">钢筋下料单差异看板</h1>
              <p class="text-xs text-gray-500">下料核对 · 实收比对 · 差异闭环</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="showPlanImport = true"
              class="px-4 py-2 text-sm bg-rebar-blue text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <FilePlus class="w-4 h-4" />
              导入下料单
            </button>
            <button
              @click="showActualImport = true"
              class="px-4 py-2 text-sm bg-rebar-green text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <FileDown class="w-4 h-4" />
              导入实收表
            </button>
            <button
              @click="handleExport"
              class="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
            <button
              @click="handleClearAll"
              class="px-4 py-2 text-sm bg-white border border-gray-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 class="w-4 h-4" />
              清空
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div v-if="isLoading" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-rebar-orange animate-spin" />
        <span class="ml-3 text-gray-500">加载中...</span>
      </div>

      <template v-else>
        <div v-if="items.length === 0" class="text-center py-20">
          <div class="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet class="w-10 h-10 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">暂无数据</h3>
          <p class="text-gray-500 mb-6">请导入下料单和实收表，或加载样例数据体验功能</p>
          <button
            @click="handleLoadMock"
            class="px-6 py-2.5 bg-rebar-orange text-white rounded-lg hover:bg-rebar-orange-dark transition-colors flex items-center gap-2 mx-auto"
          >
            <Sparkles class="w-4 h-4" />
            加载样例数据
          </button>
        </div>

        <template v-else>
          <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building class="w-5 h-5 text-rebar-blue" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ buildings.length }}</div>
                  <div class="text-xs text-gray-500">楼栋数</div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Layers class="w-5 h-5 text-rebar-green" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-gray-900">{{ components.length }}</div>
                  <div class="text-xs text-gray-500">构件数</div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle class="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-red-600">{{ stats.shortage }}</div>
                  <div class="text-xs text-gray-500">少料项</div>
                </div>
              </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock class="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div class="text-2xl font-bold text-yellow-600">{{ unresolvedCount }}</div>
                  <div class="text-xs text-gray-500">待处理</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-6">
            <div class="col-span-1 space-y-4">
              <FilterPanel
                :filter="filter"
                :buildings="buildings"
                :filtered-count="filteredItems.length"
                :has-active-filters="hasActiveFilters"
                @update:filter="setFilter"
                @toggle-building="toggleBuildingFilter"
                @toggle-status="toggleStatusFilter"
                @reset="resetFilter"
              />

              <BadRowsPanel :bad-rows="badRows" />
            </div>

            <div class="col-span-3 space-y-4">
              <DiffChart
                :stats="stats"
                :diameter-groups="diameterGroups"
                @click-diameter="handleClickDiameter"
              />

              <DiffTable
                :items="filteredItems"
                @select="handleSelectItem"
                @judge="openJudgment"
              />
            </div>
          </div>
        </template>
      </template>
    </main>

    <ImportModal
      :visible="showPlanImport"
      type="plan"
      title="导入下料单"
      @close="showPlanImport = false"
      @import="handlePlanImport"
      @load-sample="handleLoadMock"
    />

    <ImportModal
      :visible="showActualImport"
      type="actual"
      title="导入实收表"
      @close="showActualImport = false"
      @import="handleActualImport"
      @load-sample="handleLoadMock"
    />

    <JudgmentModal
      :visible="showJudgment"
      :item="selectedItem"
      @close="showJudgment = false"
      @submit="handleJudgmentSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Construction, FilePlus, FileDown, Download, Trash2,
  Building, Layers, AlertCircle, Clock,
  FileSpreadsheet, Sparkles, Loader2
} from 'lucide-vue-next'
import { useRebarStore } from '@/composables/useRebarStore'
import FilterPanel from '@/components/FilterPanel.vue'
import DiffChart from '@/components/DiffChart.vue'
import DiffTable from '@/components/DiffTable.vue'
import BadRowsPanel from '@/components/BadRowsPanel.vue'
import ImportModal from '@/components/ImportModal.vue'
import JudgmentModal from '@/components/JudgmentModal.vue'
import type { RebarItem } from '@/types'

const {
  items,
  filteredItems,
  badRows,
  filter,
  isLoading,
  stats,
  buildings,
  components,
  diameterGroups,
  unresolvedCount,
  init,
  loadMockData,
  importPlanCSV,
  importActualCSV,
  addManualJudgment,
  setFilter,
  resetFilter,
  toggleBuildingFilter,
  toggleStatusFilter,
  exportFilteredCSV,
  clearAll
} = useRebarStore()

const showPlanImport = ref(false)
const showActualImport = ref(false)
const showJudgment = ref(false)
const selectedItem = ref<RebarItem | null>(null)

const hasActiveFilters = computed(() => {
  return (
    filter.building.length > 0 ||
    filter.status.length > 0 ||
    filter.specKeyword !== '' ||
    filter.diffMin !== null ||
    filter.diffMax !== null ||
    filter.onlyUnresolved
  )
})

onMounted(async () => {
  await init()
})

async function handleLoadMock() {
  showPlanImport.value = false
  showActualImport.value = false
  await loadMockData()
}

async function handlePlanImport(file: File) {
  try {
    const result = await importPlanCSV(file)
    if (result.success) {
      showPlanImport.value = false
    }
  } catch (e) {
    console.error('导入失败:', e)
    alert('导入失败：' + (e as Error).message)
  }
}

async function handleActualImport(file: File) {
  try {
    const result = await importActualCSV(file)
    if (result.success) {
      showActualImport.value = false
    }
  } catch (e) {
    console.error('导入失败:', e)
    alert('导入失败：' + (e as Error).message)
  }
}

function handleExport() {
  exportFilteredCSV()
}

async function handleClearAll() {
  await clearAll()
}

function handleClickDiameter(diameter: number) {
  setFilter({ specKeyword: `Φ${diameter}` })
}

function handleSelectItem(item: RebarItem) {
  // 点击行可以后续扩展详情
}

function openJudgment(item: RebarItem) {
  selectedItem.value = item
  showJudgment.value = true
}

async function handleJudgmentSubmit(decision: string, decisionLabel: string, reason: string, operator: string) {
  if (!selectedItem.value) return
  await addManualJudgment(selectedItem.value.id, decision, decisionLabel, reason, operator)
  showJudgment.value = false
}
</script>
