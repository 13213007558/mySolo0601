import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Sample } from '@/types'

export const useUIStore = defineStore('ui', () => {
  const selectedSampleId = ref<string | null>(null)
  const isDetailDrawerOpen = ref(false)
  const isFormDrawerOpen = ref(false)
  const editingSample = ref<Sample | null>(null)
  const isExportDialogOpen = ref(false)

  function openDetail(sampleId: string) {
    selectedSampleId.value = sampleId
    isDetailDrawerOpen.value = true
  }

  function closeDetail() {
    isDetailDrawerOpen.value = false
  }

  function openCreate() {
    editingSample.value = null
    isFormDrawerOpen.value = true
  }

  function openEdit(sample: Sample) {
    editingSample.value = JSON.parse(JSON.stringify(sample))
    isFormDrawerOpen.value = true
  }

  function closeForm() {
    isFormDrawerOpen.value = false
    editingSample.value = null
  }

  function openExport() {
    isExportDialogOpen.value = true
  }

  function closeExport() {
    isExportDialogOpen.value = false
  }

  return {
    selectedSampleId,
    isDetailDrawerOpen,
    isFormDrawerOpen,
    editingSample,
    isExportDialogOpen,
    openDetail,
    closeDetail,
    openCreate,
    openEdit,
    closeForm,
    openExport,
    closeExport,
  }
})
