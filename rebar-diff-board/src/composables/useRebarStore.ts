import { ref, computed, reactive } from 'vue'
import type { RebarItem, ImportBatch, BadRow, ManualJudgment, FilterState, DiffStatus } from '@/types'
import { initDB, getAllItems, addItems, addBatch, getAllBatches, getBatchByFingerprint, addBadRows, getAllBadRows, addJudgment, getAllJudgments, clearAllData, clearItems, calculateFingerprint } from '@/utils/idb'
import { calculateDiff, filterItems, aggregateStats, groupByBuilding, groupByComponent, groupByDiameter } from '@/utils/diffCalculator'
import { generateMockPlanBatch, generateMockActualBatch, MOCK_PLAN_CSV, MOCK_ACTUAL_CSV } from '@/utils/mockData'
import { parseRawRows } from '@/utils/diffCalculator'
import { generateId, getNowString } from '@/utils/specParser'
import { exportToCSV } from '@/utils/csv'

const items = ref<RebarItem[]>([])
const batches = ref<ImportBatch[]>([])
const badRows = ref<BadRow[]>([])
const judgments = ref<ManualJudgment[]>([])
const isLoading = ref(false)
const initialized = ref(false)

const filter = reactive<FilterState>({
  building: [],
  component: [],
  status: [],
  specKeyword: '',
  diffMin: null,
  diffMax: null,
  onlyUnresolved: false
})

export function useRebarStore() {
  const filteredItems = computed(() => {
    return filterItems(items.value, filter)
  })

  const stats = computed(() => aggregateStats(items.value))

  const filteredStats = computed(() => aggregateStats(filteredItems.value))

  const buildings = computed(() => {
    const set = new Set<string>()
    items.value.forEach((i) => i.building && set.add(i.building))
    return Array.from(set).sort()
  })

  const components = computed(() => {
    const set = new Set<string>()
    items.value.forEach((i) => i.component && set.add(i.component))
    return Array.from(set).sort()
  })

  const diameterGroups = computed(() => {
    const groups = groupByDiameter(filteredItems.value)
    const diameters = Object.keys(groups).map(Number).sort((a, b) => a - b)
    return diameters.map((d) => ({
      diameter: d,
      items: groups[d],
      shortage: groups[d].filter((i) => i.status === 'shortage').length,
      surplus: groups[d].filter((i) => i.status === 'surplus').length,
      matched: groups[d].filter((i) => i.status === 'matched').length
    }))
  })

  const buildingGroups = computed(() => {
    const groups = groupByBuilding(filteredItems.value)
    return Object.entries(groups).map(([building, buildingItems]) => ({
      building,
      count: buildingItems.length,
      shortage: buildingItems.filter((i) => i.status === 'shortage').length,
      surplus: buildingItems.filter((i) => i.status === 'surplus').length,
      totalDiff: buildingItems.reduce((sum, i) => sum + i.diffQty, 0)
    }))
  })

  const componentGroups = computed(() => {
    const groups = groupByComponent(filteredItems.value)
    return Object.entries(groups).map(([component, componentItems]) => ({
      component,
      count: componentItems.length,
      shortage: componentItems.filter((i) => i.status === 'shortage').length,
      surplus: componentItems.filter((i) => i.status === 'surplus').length
    }))
  })

  const planBatch = computed(() => batches.value.find((b) => b.type === 'plan'))
  const actualBatch = computed(() => batches.value.find((b) => b.type === 'actual'))

  const unresolvedCount = computed(() => {
    return items.value.filter((i) => !i.judgment && (i.status === 'shortage' || i.status === 'surplus' || i.status === 'pending')).length
  })

  async function init() {
    if (initialized.value) return
    isLoading.value = true
    try {
      await initDB()
      await loadAll()
      initialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function loadAll() {
    const [allItems, allBatches, allBadRows, allJudgments] = await Promise.all([
      getAllItems(),
      getAllBatches(),
      getAllBadRows(),
      getAllJudgments()
    ])

    items.value = allItems
    batches.value = allBatches.sort((a, b) => b.importTime.localeCompare(a.importTime))
    badRows.value = allBadRows
    judgments.value = allJudgments

    attachJudgmentsToItems()
  }

  function attachJudgmentsToItems() {
    const judgeMap = new Map<string, ManualJudgment>()
    judgments.value.forEach((j) => {
      if (j.itemId) judgeMap.set(j.itemId, j)
    })
    items.value.forEach((item) => {
      item.judgment = judgeMap.get(item.id)
    })
  }

  async function loadMockData() {
    isLoading.value = true
    try {
      await clearAllData()

      const plan = generateMockPlanBatch()
      const actual = generateMockActualBatch()

      await addBatch(plan.batch)
      await addBatch(actual.batch)
      await addItems(plan.items)
      await addItems(actual.items)
      if (plan.badRows && plan.badRows.length > 0) {
        await addBadRows(plan.badRows)
      }
      if (actual.badRows.length > 0) {
        await addBadRows(actual.badRows)
      }

      await diffAndSave()
      await loadAll()
    } finally {
      isLoading.value = false
    }
  }

  async function diffAndSave() {
    const allItems = await getAllItems()
    const planItems = allItems.filter((i) => i.source === 'plan' || i.source === 'both')
    const actualItems = allItems.filter((i) => i.source === 'actual')

    const diffedItems = calculateDiff(planItems, actualItems)

    const badItems = allItems.filter((i) => i.status === 'bad')
    const finalItems = [...diffedItems, ...badItems]

    await clearItems()
    await addItems(finalItems)
  }

  async function importPlanCSV(file: File): Promise<{ success: boolean; message: string; rowsCount?: number; badRowsCount?: number }> {
    const Papa = await import('papaparse').then((m) => m.default)

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (results: any) => {
          try {
            const rows = results.data || []
            const fp = calculateFingerprint(rows)

            const existing = await getBatchByFingerprint(fp)
            if (existing) {
              resolve({ success: false, message: '该下料单已导入过，为避免重复已跳过' })
              return
            }

            const batchId = 'plan-' + generateId()
            const { items: newItems, badRows: newBadRows } = parseRawRows(rows, batchId, 'plan')

            const batch = {
              id: batchId,
              type: 'plan' as const,
              filename: file.name,
              importTime: getNowString(),
              rowCount: rows.length,
              badRowCount: newBadRows.length,
              fingerprint: fp
            }

            await addBatch(batch)
            await addItems(newItems)
            if (newBadRows.length > 0) {
              await addBadRows(newBadRows)
            }

            await diffAndSave()
            await loadAll()

            resolve({
              success: true,
              message: `导入成功：${newItems.length} 条有效记录，${newBadRows.length} 条坏行`,
              rowsCount: newItems.length,
              badRowsCount: newBadRows.length
            })
          } catch (e: any) {
            reject(e)
          }
        },
        error: (error: any) => {
          reject(error)
        }
      })
    })
  }

  async function importActualCSV(file: File): Promise<{ success: boolean; message: string; rowsCount?: number; badRowsCount?: number }> {
    const Papa = await import('papaparse').then((m) => m.default)

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (results: any) => {
          try {
            const rows = results.data || []
            const fp = calculateFingerprint(rows)

            const existing = await getBatchByFingerprint(fp)
            if (existing) {
              resolve({ success: false, message: '该实收表已导入过，为避免重复已跳过' })
              return
            }

            const batchId = 'actual-' + generateId()
            const { items: newItems, badRows: newBadRows } = parseRawRows(rows, batchId, 'actual')

            const batch = {
              id: batchId,
              type: 'actual' as const,
              filename: file.name,
              importTime: getNowString(),
              rowCount: rows.length,
              badRowCount: newBadRows.length,
              fingerprint: fp
            }

            await addBatch(batch)
            await addItems(newItems)
            if (newBadRows.length > 0) {
              await addBadRows(newBadRows)
            }

            await diffAndSave()
            await loadAll()

            resolve({
              success: true,
              message: `导入成功：${newItems.length} 条有效记录，${newBadRows.length} 条坏行`,
              rowsCount: newItems.length,
              badRowsCount: newBadRows.length
            })
          } catch (e: any) {
            reject(e)
          }
        },
        error: (error: any) => {
          reject(error)
        }
      })
    })
  }

  async function addManualJudgment(itemId: string, decision: string, decisionLabel: string, reason: string, operator: string) {
    const item = items.value.find((i) => i.id === itemId)
    if (!item) return

    const judgment: ManualJudgment = {
      id: generateId(),
      itemId,
      decision: decision as any,
      decisionLabel,
      reason,
      operator,
      timestamp: getNowString(),
      originalDiff: item.diffQty
    }

    await addJudgment(judgment)
    item.judgment = judgment
    judgments.value.push(judgment)
  }

  function setFilter(newFilter: Partial<FilterState>) {
    Object.assign(filter, newFilter)
  }

  function resetFilter() {
    filter.building = []
    filter.component = []
    filter.status = []
    filter.specKeyword = ''
    filter.diffMin = null
    filter.diffMax = null
    filter.onlyUnresolved = false
  }

  function toggleBuildingFilter(building: string) {
    const idx = filter.building.indexOf(building)
    if (idx === -1) {
      filter.building.push(building)
    } else {
      filter.building.splice(idx, 1)
    }
  }

  function toggleStatusFilter(status: DiffStatus) {
    const idx = filter.status.indexOf(status)
    if (idx === -1) {
      filter.status.push(status)
    } else {
      filter.status.splice(idx, 1)
    }
  }

  function exportFilteredCSV() {
    exportToCSV(filteredItems.value, `钢筋下料差异_${getNowString().replace(/[: ]/g, '-')}.csv`)
  }

  async function clearAll() {
    if (!window.confirm('确定要清空所有数据吗？此操作不可撤销。')) return
    await clearAllData()
    items.value = []
    batches.value = []
    badRows.value = []
    judgments.value = []
    resetFilter()
  }

  return {
    items,
    filteredItems,
    batches,
    badRows,
    judgments,
    filter,
    isLoading,
    initialized,
    stats,
    filteredStats,
    buildings,
    components,
    diameterGroups,
    buildingGroups,
    componentGroups,
    planBatch,
    actualBatch,
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
    clearAll,
    MOCK_PLAN_CSV,
    MOCK_ACTUAL_CSV
  }
}
