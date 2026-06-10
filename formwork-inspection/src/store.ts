import { writable, derived, get } from 'svelte/store'
import type { CheckPoint, PointStatus, RectificationRecord, PhotoAttachment, UnitType } from '@/types'
import { DEFAULT_THRESHOLDS, TYPE_LABELS } from '@/types'
import { loadFromStorage, saveToStorage } from '@/utils/storage'
import { MOCK_POINTS } from '@/utils/mockData'
import {
  generateId,
  getNowString,
  checkThreshold,
  validatePoint,
  toDisplayValue,
  calcAreaStats,
  groupPointsByArea
} from '@/utils/validators'

const STORAGE_POINTS = 'points'
const STORAGE_OPERATOR = 'operator'
const STORAGE_FILTER = 'filter'

function createStore() {
  const initialPoints: CheckPoint[] = loadFromStorage(STORAGE_POINTS, [])
  const initialOperator: string = loadFromStorage(STORAGE_OPERATOR, '张安全')
  const initialFilter = loadFromStorage(STORAGE_FILTER, {
    status: [] as PointStatus[],
    type: [] as string[],
    keyword: '',
    onlyNoPhoto: false,
    onlyOutOfThreshold: false
  })

  const points = writable<CheckPoint[]>(initialPoints)
  const operatorName = writable<string>(initialOperator)
  const selectedArea = writable<string | null>(null)
  const selectedPointId = writable<string | null>(null)
  const showDetail = writable(false)
  const globalFilter = writable(initialFilter)
  const lastBatchSummary = writable<string | null>(null)

  points.subscribe((v) => saveToStorage(STORAGE_POINTS, v))
  operatorName.subscribe((v) => saveToStorage(STORAGE_OPERATOR, v))
  globalFilter.subscribe((v) => saveToStorage(STORAGE_FILTER, v))

  function loadMock() {
    points.set(MOCK_POINTS.map((p) => ({ ...p, id: generateId() })))
    selectedArea.set(null)
    selectedPointId.set(null)
    showDetail.set(false)
  }

  function clearAll() {
    points.set([])
    selectedArea.set(null)
    selectedPointId.set(null)
    showDetail.set(false)
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('formwork-inspection-v1:'))
        .forEach((k) => localStorage.removeItem(k))
    }
  }

  function selectPoint(id: string | null) {
    selectedPointId.set(id)
    showDetail.set(id !== null)
  }

  function closeDetail() {
    showDetail.set(false)
    selectedPointId.set(null)
  }

  function updatePoint(id: string, patch: Partial<CheckPoint>) {
    points.update((list) =>
      list.map((p) => {
        if (p.id !== id) return p
        return { ...p, ...patch, updatedAt: getNowString() }
      })
    )
  }

  function setMeasuredValue(
    id: string,
    raw: string,
    numeric: number | null,
    unit: UnitType | null,
    operator: string
  ) {
    const p = get(points).find((x) => x.id === id)
    if (!p) return

    let status: PointStatus = p.status

    if (numeric === null) {
      status = 'pending'
    } else {
      const check = checkThreshold(numeric, p.threshold)
      if (!check.isOk) {
        status = 'failed'
      } else if (status === 'pending' || status === 'failed') {
        status = p.hasPhoto ? 'passed' : 'need_photo'
      } else if (status === 'need_photo') {
        status = 'need_photo'
      }
    }

    const history: RectificationRecord = {
      id: generateId(),
      pointId: id,
      timestamp: getNowString(),
      operator,
      oldValue: p.measuredValue,
      newValue: raw || undefined,
      oldStatus: p.status,
      newStatus: status,
      note: `实测值更新：${p.measuredValue || '(空)'} → ${raw || '(空)'}`,
      photoIds: []
    }

    updatePoint(id, {
      measuredValue: raw || undefined,
      measuredNumeric: numeric ?? undefined,
      measuredUnit: unit ?? undefined,
      measuredAt: getNowString(),
      measuredBy: operator,
      status,
      rectificationHistory: [...p.rectificationHistory, history]
    })
  }

  function setStatus(id: string, status: PointStatus, note: string, operator: string) {
    const list = get(points)
    const p = list.find((x) => x.id === id)
    if (!p) return

    const history: RectificationRecord = {
      id: generateId(),
      pointId: id,
      timestamp: getNowString(),
      operator,
      oldValue: p.measuredValue,
      newValue: undefined,
      oldStatus: p.status,
      newStatus: status,
      note: note || '状态变更',
      photoIds: []
    }

    updatePoint(id, {
      status,
      note: note || p.note,
      rectificationHistory: [...p.rectificationHistory, history]
    })
  }

  function addPhoto(
    id: string,
    dataUrl: string,
    caption: string,
    operator: string,
    isRectification = false
  ): PhotoAttachment {
    const list = get(points)
    const p = list.find((x) => x.id === id)
    if (!p) return null as any

    const photo: PhotoAttachment = {
      id: generateId(),
      pointId: id,
      dataUrl,
      uploadedAt: getNowString(),
      uploadedBy: operator,
      caption,
      isRectification
    }

    const photos = [...p.photos, photo]
    const hasPhoto = photos.length > 0
    let status = p.status
    if (status === 'need_photo' && hasPhoto && p.measuredNumeric !== undefined) {
      const check = checkThreshold(p.measuredNumeric, p.threshold)
      status = check.isOk ? 'passed' : 'failed'
    }

    const history: RectificationRecord = {
      id: generateId(),
      pointId: id,
      timestamp: getNowString(),
      operator,
      oldValue: undefined,
      newValue: undefined,
      oldStatus: p.status,
      newStatus: status,
      note: `新增${isRectification ? '整改' : ''}照片：${caption}`,
      photoIds: [photo.id]
    }

    updatePoint(id, {
      photos,
      hasPhoto,
      status,
      rectificationHistory: [...p.rectificationHistory, history]
    })

    return photo
  }

  function removePhoto(pointId: string, photoId: string) {
    const list = get(points)
    const p = list.find((x) => x.id === pointId)
    if (!p) return

    const photos = p.photos.filter((ph) => ph.id !== photoId)
    const hasPhoto = photos.length > 0
    const status = !hasPhoto && (p.status === 'passed') ? 'need_photo' : p.status

    updatePoint(pointId, {
      photos,
      hasPhoto,
      status
    })
  }

  function changeResponsible(id: string, responsible: string, operator: string) {
    const list = get(points)
    const p = list.find((x) => x.id === id)
    if (!p) return

    const history: RectificationRecord = {
      id: generateId(),
      pointId: id,
      timestamp: getNowString(),
      operator,
      oldValue: p.responsible,
      newValue: responsible,
      oldStatus: p.status,
      newStatus: p.status,
      note: `责任人变更：「${p.responsible || '未指定'}」→「${responsible || '未指定'}」`,
      photoIds: []
    }

    updatePoint(id, {
      responsible,
      rectificationHistory: [...p.rectificationHistory, history]
    })
  }

  function batchPass(area: string | null, operator: string): {
    passed: number
    skipped: number
    skippedReasons: string[]
  } {
    const list = get(points)
    const targets = area ? list.filter((p) => p.area === area) : list

    let passed = 0
    let skipped = 0
    const skippedReasons: string[] = []

    const next: CheckPoint[] = list.map((p): CheckPoint => {
      if (!targets.find((t) => t.id === p.id)) return p

      const noPhoto = !p.hasPhoto && p.photos.length === 0
      const outOfThreshold =
        p.measuredNumeric !== undefined &&
        p.measuredNumeric !== null &&
        !checkThreshold(p.measuredNumeric, p.threshold).isOk

      if (noPhoto && p.status !== 'pending') {
        skipped++
        skippedReasons.push(`${p.code} ${p.typeLabel}：缺少验收照片`)
        return p
      }
      if (outOfThreshold) {
        skipped++
        const reason =
          p.measuredNumeric !== undefined
            ? `${p.code} ${p.typeLabel}：实测 ${toDisplayValue(
                p.measuredNumeric,
                p.requiredUnit
              )} 超出阈值（${p.threshold.description}）`
            : `${p.code} ${p.typeLabel}：超出阈值`
        skippedReasons.push(reason)
        return p
      }
      if (p.status === 'failed') {
        skipped++
        skippedReasons.push(`${p.code} ${p.typeLabel}：当前为不合格状态，需手动确认整改`)
        return p
      }
      if (p.status === 'pending' && !p.measuredValue) {
        skipped++
        skippedReasons.push(`${p.code} ${p.typeLabel}：空点位，未填写实测值`)
        return p
      }

      passed++
      const history: RectificationRecord = {
        id: generateId(),
        pointId: p.id,
        timestamp: getNowString(),
        operator,
        oldValue: undefined,
        newValue: undefined,
        oldStatus: p.status,
        newStatus: 'passed',
        note: '批量复核通过',
        photoIds: []
      }
      return {
        ...p,
        status: 'passed' as PointStatus,
        measuredAt: p.measuredAt || getNowString(),
        measuredBy: p.measuredBy || operator,
        rectificationHistory: [...p.rectificationHistory, history],
        updatedAt: getNowString()
      }
    })

    points.set(next)

    const summary = `批量复核完成：通过 ${passed} 个，跳过 ${skipped} 个`
    lastBatchSummary.set(summary)
    setTimeout(() => lastBatchSummary.set(null), 6000)

    return { passed, skipped, skippedReasons }
  }

  return {
    points,
    operatorName,
    selectedArea,
    selectedPointId,
    showDetail,
    globalFilter,
    lastBatchSummary,
    loadMock,
    clearAll,
    selectPoint,
    closeDetail,
    updatePoint,
    setMeasuredValue,
    setStatus,
    addPhoto,
    removePhoto,
    changeResponsible,
    batchPass
  }
}

export const store = createStore()

export const pointsStore = store.points
export const operatorNameStore = store.operatorName
export const selectedAreaStore = store.selectedArea
export const selectedPointIdStore = store.selectedPointId
export const showDetailStore = store.showDetail
export const globalFilterStore = store.globalFilter
export const lastBatchSummaryStore = store.lastBatchSummary

export const selectedPoint = derived(
  [store.points, store.selectedPointId],
  ([$points, $id]) => $points.find((p) => p.id === $id) || null
)

export const areas = derived(store.points, ($points) => {
  const set = new Set<string>()
  $points.forEach((p) => set.add(p.area))
  return Array.from(set).sort()
})

export const areaStatsMap = derived(store.points, ($points) => {
  const groups = groupPointsByArea($points)
  const map: Record<string, ReturnType<typeof calcAreaStats>> = {}
  Object.entries(groups).forEach(([area, list]) => {
    map[area] = calcAreaStats(list)
  })
  return map
})

export const totalStats = derived(store.points, ($points) => calcAreaStats($points))
