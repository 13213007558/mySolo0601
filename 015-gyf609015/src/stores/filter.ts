import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterState, SampleStatus, Sample } from '@/types'
import { useSampleStore } from './sample'
import { isDateBetween } from '@/utils/date'

export const useFilterStore = defineStore('filter', () => {
  const state = ref<FilterState>({
    status: 'all',
    keyword: '',
    dateStart: '',
    dateEnd: '',
  })

  function setStatus(s: FilterState['status']) {
    state.value.status = s
  }

  function setKeyword(k: string) {
    state.value.keyword = k
  }

  function setDateRange(start: string, end: string) {
    state.value.dateStart = start
    state.value.dateEnd = end
  }

  function reset() {
    state.value = {
      status: 'all',
      keyword: '',
      dateStart: '',
      dateEnd: '',
    }
  }

  const filteredSamples = computed<Sample[]>(() => {
    const store = useSampleStore()
    let list = store.samples
    if (state.value.status !== 'all') {
      list = list.filter(s => s.status === state.value.status)
    }
    if (state.value.keyword.trim()) {
      const kw = state.value.keyword.trim().toLowerCase()
      list = list.filter(s =>
        s.sampleNo.toLowerCase().includes(kw) ||
        s.manufacturer.toLowerCase().includes(kw) ||
        s.materialType.toLowerCase().includes(kw) ||
        s.sealConfirmer.toLowerCase().includes(kw) ||
        s.batches.some(b =>
          b.batchNo.toLowerCase().includes(kw) ||
          b.entryBatchNo.toLowerCase().includes(kw),
        ),
      )
    }
    if (state.value.dateStart || state.value.dateEnd) {
      list = list.filter(s => isDateBetween(s.sealDate, state.value.dateStart, state.value.dateEnd))
    }
    return list
  })

  return {
    state,
    setStatus,
    setKeyword,
    setDateRange,
    reset,
    filteredSamples,
  }
}, {
  persist: {
    key: 'curtain-wall-filter',
    storage: localStorage,
    paths: ['state'],
  },
})
