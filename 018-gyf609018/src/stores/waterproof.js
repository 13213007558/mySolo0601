import { reactive, computed, watch } from 'vue'
import { loadRecords, saveRecords, generateId, markInitialized, isInitialized, clearRecords } from '../utils/storage.js'
import { generateMockData, BUILDINGS, ROOM_TYPES } from '../utils/mockData.js'
import { getRecordStatus } from '../utils/validators.js'

const state = reactive({
  records: [],
  filters: {
    building: '',
    unit: '',
    roomNumber: '',
    status: ''
  },
  ui: {
    showForm: false,
    editingId: null,
    showRetest: false,
    retestRecordId: null,
    showGuide: false,
    activeTab: 'records'
  }
})

const statusMap = computed(() => {
  const map = {}
  state.records.forEach(r => { map[r.id] = getRecordStatus(r) })
  return map
})

const buildings = computed(() => BUILDINGS)
const roomTypes = computed(() => ROOM_TYPES)

const availableUnits = computed(() => {
  if (!state.filters.building) return []
  const set = new Set()
  state.records
    .filter(r => r.building === state.filters.building && r.unit)
    .forEach(r => set.add(r.unit))
  return Array.from(set).sort()
})

const availableRoomNumbers = computed(() => {
  const set = new Set()
  state.records
    .filter(r => {
      if (state.filters.building && r.building !== state.filters.building) return false
      if (state.filters.unit && r.unit !== state.filters.unit) return false
      return true
    })
    .forEach(r => r.roomNumber && set.add(r.roomNumber))
  return Array.from(set).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
})

const filteredRecords = computed(() => {
  return state.records.filter(r => {
    if (state.filters.building && r.building !== state.filters.building) return false
    if (state.filters.unit && r.unit !== state.filters.unit) return false
    if (state.filters.roomNumber && r.roomNumber !== state.filters.roomNumber) return false
    if (state.filters.status) {
      const s = statusMap.value[r.id]?.overall
      if (s !== state.filters.status) return false
    }
    return true
  }).sort((a, b) => {
    if (a.building !== b.building) return a.building.localeCompare(b.building)
    if ((a.unit || '') !== (b.unit || '')) return (a.unit || '').localeCompare(b.unit || '')
    if (a.roomNumber !== b.roomNumber) return (Number(a.roomNumber) || 0) - (Number(b.roomNumber) || 0)
    return (a.roomType || '').localeCompare(b.roomType || '')
  })
})

const groupedRecords = computed(() => {
  const groups = {}
  filteredRecords.value.forEach(r => {
    const key = `${r.building}|${r.unit || ''}|${r.roomNumber}`
    if (!groups[key]) groups[key] = { building: r.building, unit: r.unit || '', roomNumber: r.roomNumber, items: [] }
    groups[key].items.push(r)
  })
  return Object.values(groups)
})

const statistics = computed(() => {
  const total = state.records.length
  const buildingStats = {}
  const roomTypeStats = {}
  const statusCounts = { normal: 0, pending_retest: 0, abnormal: 0, warning: 0, incomplete: 0 }
  state.records.forEach(r => {
    buildingStats[r.building] = (buildingStats[r.building] || 0) + 1
    roomTypeStats[r.roomType || '未分类'] = (roomTypeStats[r.roomType || '未分类'] || 0) + 1
    const s = statusMap.value[r.id]?.overall
    if (s && statusCounts[s] !== undefined) statusCounts[s]++
  })
  return { total, buildingStats, roomTypeStats, statusCounts }
})

function initStore() {
  const saved = loadRecords()
  if (saved && Array.isArray(saved.records)) {
    state.records = saved.records
    if (!isInitialized()) markInitialized()
  } else {
    state.records = []
  }
  watch(() => state.records, val => {
    saveRecords({ records: val, updatedAt: Date.now() })
  }, { deep: true })
}

function addRecord(payload) {
  const now = Date.now()
  const rec = {
    id: generateId(),
    ...payload,
    retests: [],
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString()
  }
  state.records.push(rec)
  return rec
}

function updateRecord(id, payload) {
  const idx = state.records.findIndex(r => r.id === id)
  if (idx === -1) return null
  state.records[idx] = {
    ...state.records[idx],
    ...payload,
    updatedAt: new Date().toISOString()
  }
  return state.records[idx]
}

function deleteRecord(id) {
  const idx = state.records.findIndex(r => r.id === id)
  if (idx !== -1) state.records.splice(idx, 1)
}

function addRetest(recordId, retestData) {
  const rec = state.records.find(r => r.id === recordId)
  if (!rec) return null
  const retest = {
    id: generateId(),
    ...retestData,
    createdAt: new Date().toISOString()
  }
  if (!rec.retests) rec.retests = []
  rec.retests.push(retest)
  rec.updatedAt = new Date().toISOString()
  return retest
}

function loadSampleData() {
  state.records = generateMockData()
  markInitialized()
}

function resetAllData() {
  state.records = []
  clearRecords()
}

function setFilters(f) { Object.assign(state.filters, f) }
function resetFilters() {
  state.filters.building = ''
  state.filters.unit = ''
  state.filters.roomNumber = ''
  state.filters.status = ''
}

function openForm(editingId = null) {
  state.ui.editingId = editingId
  state.ui.showForm = true
}
function closeForm() {
  state.ui.showForm = false
  state.ui.editingId = null
}

function openRetest(recordId) {
  state.ui.retestRecordId = recordId
  state.ui.showRetest = true
}
function closeRetest() {
  state.ui.showRetest = false
  state.ui.retestRecordId = null
}

function openGuide() { state.ui.showGuide = true }
function closeGuide() { state.ui.showGuide = false }

function getById(id) { return state.records.find(r => r.id === id) }

export function useWaterproofStore() {
  return {
    state,
    statusMap,
    buildings,
    roomTypes,
    availableUnits,
    availableRoomNumbers,
    filteredRecords,
    groupedRecords,
    statistics,
    initStore,
    addRecord,
    updateRecord,
    deleteRecord,
    addRetest,
    loadSampleData,
    resetAllData,
    setFilters,
    resetFilters,
    openForm,
    closeForm,
    openRetest,
    closeRetest,
    openGuide,
    closeGuide,
    getById
  }
}
