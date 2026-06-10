import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  InspectionRecord,
  InspectionStatus,
  PhotoAttachment,
  DemolitionRequest,
  FilterState,
  ScaffoldType,
  ProblemLevel
} from '@/types'
import {
  getAllInspections,
  saveInspection,
  deleteInspection,
  clearAllInspections,
  getSetting,
  saveSetting
} from '@/utils/db'
import {
  generateId,
  getNowString,
  calcStats,
  filterRecords,
  validateForPass,
  detectRepeatProblems,
  groupByBuilding,
  groupByTeam,
  isOverdue,
  fileToDataURL,
  compressDataUrl,
  downloadCSV,
  buildWeeklyReportRows,
  WEEKLY_REPORT_HEADERS,
  buildDetailExportRows,
  DETAIL_EXPORT_HEADERS
} from '@/utils/helpers'
import { generateMockRecords } from '@/utils/mockData'
import { STATUS_LABELS } from '@/types'

export const useInspectionStore = defineStore('inspection', () => {
  const records = ref<InspectionRecord[]>([])
  const loading = ref(false)
  const currentOperator = ref('安全员-小李')
  const selectedId = ref<string | null>(null)
  const showDetail = ref(false)

  const filter = ref<FilterState>({
    status: [],
    scaffoldType: [],
    building: null,
    problemLevel: [],
    team: null,
    keyword: '',
    onlyOverdue: false,
    onlyNoPhoto: false,
    onlyRepeat: false,
    dateRange: null
  })

  const batchResult = ref<{ total: number; passed: number; skipped: number; reasons: string[] } | null>(null)

  // 加载数据
  async function loadData() {
    loading.value = true
    try {
      const data = await getAllInspections()
      records.value = data
      const savedOperator = await getSetting('operator')
      if (savedOperator) currentOperator.value = savedOperator
    } finally {
      loading.value = false
    }
  }

  // 加载样例
  async function loadMockData() {
    const mocks = generateMockRecords()
    for (const r of mocks) {
      await saveInspection(r)
    }
    await loadData()
  }

  // 清空
  async function clearAll() {
    await clearAllInspections()
    records.value = []
    selectedId.value = null
    showDetail.value = false
  }

  // 计算属性
  const filteredRecords = computed(() => {
    let result = filterRecords(records.value, filter.value)
    if (filter.value.onlyRepeat) {
      const repeatMap = new Set(
        detectRepeatProblems(records.value).flatMap((d) => d.ids)
      )
      result = result.filter((r) => repeatMap.has(r.id))
    }
    return result
  })

  const stats = computed(() => calcStats(filteredRecords.value))

  const allStats = computed(() => calcStats(records.value))

  const buildings = computed(() => {
    const set = new Set(records.value.map((r) => r.building))
    return Array.from(set).sort()
  })

  const teams = computed(() => {
    const set = new Set(records.value.map((r) => r.responsibleTeam))
    return Array.from(set).sort()
  })

  const selectedRecord = computed(() =>
    records.value.find((r) => r.id === selectedId.value) || null
  )

  const repeatProblemIds = computed(() => {
    return new Set(detectRepeatProblems(records.value).flatMap((d) => d.ids))
  })

  const overdueRecords = computed(() =>
    records.value.filter((r) => isOverdue(r.deadline, r.status))
  )

  const buildingStats = computed(() => {
    const groups = groupByBuilding(records.value)
    const result: Record<string, ReturnType<typeof calcStats>> = {}
    Object.entries(groups).forEach(([k, v]) => {
      result[k] = calcStats(v)
    })
    return result
  })

  const teamStats = computed(() => {
    const groups = groupByTeam(records.value)
    const result: Record<string, ReturnType<typeof calcStats>> = {}
    Object.entries(groups).forEach(([k, v]) => {
      result[k] = calcStats(v)
    })
    return result
  })

  // 操作方法
  function selectRecord(id: string) {
    selectedId.value = id
    showDetail.value = true
  }

  function closeDetail() {
    showDetail.value = false
    selectedId.value = null
  }

  async function _saveAndReload(record: InspectionRecord) {
    record.updatedAt = getNowString()
    await saveInspection(record)
    await loadData()
  }

  function _addAudit(record: InspectionRecord, action: string, opts: {
    oldStatus?: InspectionStatus
    newStatus?: InspectionStatus
    oldValue?: string
    newValue?: string
    note?: string
  } = {}) {
    record.auditLog.push({
      id: generateId(),
      inspectionId: record.id,
      timestamp: getNowString(),
      operator: currentOperator.value,
      action,
      oldStatus: opts.oldStatus,
      newStatus: opts.newStatus,
      oldValue: opts.oldValue,
      newValue: opts.newValue,
      note: opts.note
    })
  }

  // 状态流转
  async function changeStatus(id: string, newStatus: InspectionStatus, note?: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return
    const oldStatus = record.status
    record.status = newStatus

    if (newStatus === 'rectifying') {
      record.rectifiedAt = getNowString()
      record.rectifiedBy = currentOperator.value
    }
    if (newStatus === 'rechecking') {
      // 申请复查
    }
    if (newStatus === 'passed' || newStatus === 'closed') {
      record.recheckedAt = getNowString()
      record.recheckedBy = currentOperator.value
      record.recheckNote = note || record.recheckNote
    }
    if (newStatus === 'returned') {
      record.returnCount = (record.returnCount || 0) + 1
      record.recheckNote = note || record.recheckNote
    }

    _addAudit(record, '状态变更', {
      oldStatus,
      newStatus,
      note
    })

    await _saveAndReload(record)
  }

  async function startRectification(id: string, note?: string) {
    await changeStatus(id, 'rectifying', note)
  }

  async function submitRecheck(id: string, note?: string) {
    await changeStatus(id, 'rechecking', note)
  }

  async function passInspection(id: string, note?: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return { ok: false, reasons: ['记录不存在'] }
    const validation = validateForPass(record)
    if (!validation.canPass) {
      return { ok: false, reasons: validation.reasons }
    }
    await changeStatus(id, 'passed', note)
    return { ok: true, reasons: [] }
  }

  async function returnRectification(id: string, reason: string) {
    await changeStatus(id, 'returned', reason)
  }

  async function closeInspection(id: string, note?: string) {
    await changeStatus(id, 'closed', note)
  }

  // 照片管理
  async function addPhoto(id: string, file: File, phase: PhotoAttachment['phase'], caption: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return

    const dataUrl = await fileToDataURL(file)
    const compressed = await compressDataUrl(dataUrl, 1200, 0.8)

    const photo: PhotoAttachment = {
      id: generateId(),
      inspectionId: id,
      dataUrl: compressed,
      uploadedAt: getNowString(),
      uploadedBy: currentOperator.value,
      caption,
      phase
    }

    record.photos.push(photo)
    _addAudit(record, '上传照片', {
      note: `${caption}（${phase === 'before' ? '整改前' : phase === 'during' ? '整改中' : phase === 'after' ? '整改后' : '复查'}）`
    })

    await _saveAndReload(record)
  }

  async function removePhoto(id: string, photoId: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return

    const idx = record.photos.findIndex((p) => p.id === photoId)
    if (idx >= 0) {
      const photo = record.photos[idx]
      record.photos.splice(idx, 1)
      _addAudit(record, '删除照片', {
        note: photo.caption
      })
      await _saveAndReload(record)
    }
  }

  // 责任人/班组变更
  async function changeForeman(id: string, newForeman: string, note?: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return
    const old = record.foreman
    record.foreman = newForeman
    _addAudit(record, '变更责任人', {
      oldValue: old,
      newValue: newForeman,
      note
    })
    await _saveAndReload(record)
  }

  async function changeTeam(id: string, newTeam: string, note?: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return
    const old = record.responsibleTeam
    record.responsibleTeam = newTeam
    _addAudit(record, '变更责任班组', {
      oldValue: old,
      newValue: newTeam,
      note
    })
    await _saveAndReload(record)
  }

  // 整改说明
  async function updateRectificationNote(id: string, note: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return
    record.rectificationNote = note
    _addAudit(record, '更新整改说明', { note })
    await _saveAndReload(record)
  }

  async function updateRecheckNote(id: string, note: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return
    record.recheckNote = note
    _addAudit(record, '更新复查意见', { note })
    await _saveAndReload(record)
  }

  // 拆改申请
  async function addDemolitionRequest(id: string, data: Partial<DemolitionRequest>) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return

    const request: DemolitionRequest = {
      id: generateId(),
      inspectionId: id,
      requestedBy: currentOperator.value,
      requestedAt: getNowString(),
      location: data.location || record.location,
      reason: data.reason || '',
      scope: data.scope || '',
      status: 'pending'
    }

    record.demolitionRequests.push(request)
    _addAudit(record, '提交拆改申请', {
      note: `位置：${request.location}，原因：${request.reason}`
    })

    await _saveAndReload(record)
  }

  async function approveDemolition(id: string, requestId: string, approved: boolean, approveNote?: string) {
    const record = records.value.find((r) => r.id === id)
    if (!record) return

    const req = record.demolitionRequests.find((r) => r.id === requestId)
    if (!req) return

    req.status = approved ? 'approved' : 'rejected'
    req.approvedBy = currentOperator.value
    req.approvedAt = getNowString()
    req.approvaNote = approveNote

    _addAudit(record, approved ? '批准拆改' : '驳回拆改', {
      note: approveNote
    })

    await _saveAndReload(record)
  }

  // 批量复查通过
  async function batchPassRecords(recordIds?: string[]) {
    const targets = recordIds
      ? records.value.filter((r) => recordIds.includes(r.id))
      : filteredRecords.value

    const skipped: Array<{ id: string; code: string; reason: string }> = []
    const passed: string[] = []

    for (const record of targets) {
      const validation = validateForPass(record)
      if (!validation.canPass) {
        skipped.push({
          id: record.id,
          code: record.code,
          reason: validation.reasons.join('；')
        })
        continue
      }

      const oldStatus = record.status
      record.status = 'passed'
      record.recheckedAt = getNowString()
      record.recheckedBy = currentOperator.value
      _addAudit(record, '批量复查通过', { oldStatus, newStatus: 'passed' })
      await saveInspection(record)
      passed.push(record.code)
    }

    await loadData()

    batchResult.value = {
      total: targets.length,
      passed: passed.length,
      skipped: skipped.length,
      reasons: skipped.map((s) => `${s.code}：${s.reason}`)
    }

    return batchResult.value
  }

  function clearBatchResult() {
    batchResult.value = null
  }

  // 导出
  function exportWeeklyReport() {
    const rows = buildWeeklyReportRows(filteredRecords.value)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(`脚手架巡检周报_${date}.csv`, rows, WEEKLY_REPORT_HEADERS)
  }

  function exportDetailList() {
    const rows = buildDetailExportRows(filteredRecords.value)
    const date = new Date().toISOString().slice(0, 10)
    downloadCSV(`脚手架巡检明细_${date}.csv`, rows, DETAIL_EXPORT_HEADERS)
  }

  // 设置操作员
  async function setOperator(name: string) {
    currentOperator.value = name
    await saveSetting('operator', name)
  }

  // 筛选
  function setFilter(key: keyof FilterState, value: any) {
    ;(filter.value as any)[key] = value
  }

  function resetFilter() {
    filter.value = {
      status: [],
      scaffoldType: [],
      building: null,
      problemLevel: [],
      team: null,
      keyword: '',
      onlyOverdue: false,
      onlyNoPhoto: false,
      onlyRepeat: false,
      dateRange: null
    }
  }

  // 新增巡检
  async function createInspection(data: Partial<InspectionRecord>): Promise<InspectionRecord> {
    const now = getNowString()
    const id = generateId()
    const buildingNum = data.building?.replace(/\D/g, '') || '0'
    const seq = String(records.value.length + 1).padStart(3, '0')
    const code = `SJ-${buildingNum}-${seq}`

    const newRecord: InspectionRecord = {
      id,
      code,
      building: data.building || '1号楼',
      floor: data.floor || '',
      location: data.location || '',
      scaffoldType: data.scaffoldType || 'external',
      scaffoldTypeLabel: data.scaffoldType
        ? (STATUS_LABELS as any)[data.scaffoldType] || '外脚手架'
        : '外脚手架',
      problemLevel: data.problemLevel || 'minor',
      problemTitle: data.problemTitle || '',
      problemDescription: data.problemDescription || '',
      status: 'found',
      responsibleTeam: data.responsibleTeam || '外架一班',
      foreman: data.foreman || '',
      deadline: data.deadline || '',
      foundAt: now,
      foundBy: currentOperator.value,
      returnCount: 0,
      createdAt: now,
      updatedAt: now,
      photos: [],
      demolitionRequests: [],
      auditLog: [
        {
          id: generateId(),
          inspectionId: id,
          timestamp: now,
          operator: currentOperator.value,
          action: '问题录入',
          newStatus: 'found',
          note: '新建巡检记录'
        }
      ]
    }

    await saveInspection(newRecord)
    await loadData()
    return newRecord
  }

  return {
    // state
    records,
    loading,
    currentOperator,
    selectedId,
    showDetail,
    filter,
    batchResult,
    // computed
    filteredRecords,
    stats,
    allStats,
    buildings,
    teams,
    selectedRecord,
    repeatProblemIds,
    overdueRecords,
    buildingStats,
    teamStats,
    // actions
    loadData,
    loadMockData,
    clearAll,
    selectRecord,
    closeDetail,
    changeStatus,
    startRectification,
    submitRecheck,
    passInspection,
    returnRectification,
    closeInspection,
    addPhoto,
    removePhoto,
    changeForeman,
    changeTeam,
    updateRectificationNote,
    updateRecheckNote,
    addDemolitionRequest,
    approveDemolition,
    batchPassRecords,
    clearBatchResult,
    exportWeeklyReport,
    exportDetailList,
    setOperator,
    setFilter,
    resetFilter,
    createInspection
  }
})
