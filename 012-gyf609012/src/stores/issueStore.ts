import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CollisionIssue,
  FilterOptions,
  IssueStatus,
  Attachment,
  DesignReply,
  StatusRecord,
  IssuePriority,
} from '@/types'
import {
  loadIssuesFromStorage,
  saveIssuesToStorage,
  generateId,
  downloadFile,
  formatDate,
} from '@/utils/storage'
import { mockIssues } from '@/utils/mockData'
import { DEFAULT_FILTERS } from '@/types'

export const useIssueStore = defineStore('issue', () => {
  const issues = ref<CollisionIssue[]>([])
  const filters = ref<FilterOptions>({ ...DEFAULT_FILTERS })
  const selectedIssueId = ref<string | null>(null)
  const currentUser = ref('张工')

  function initIssues() {
    const stored = loadIssuesFromStorage()
    if (stored.length > 0) {
      issues.value = stored
    } else {
      issues.value = [...mockIssues]
      saveIssuesToStorage(issues.value)
    }
  }

  function saveIssues() {
    saveIssuesToStorage(issues.value)
  }

  const filteredIssues = computed(() => {
    return issues.value.filter((issue) => {
      if (filters.value.floor.length > 0 && !filters.value.floor.includes(issue.floor)) {
        return false
      }
      if (filters.value.system.length > 0 && !filters.value.system.includes(issue.system)) {
        return false
      }
      if (filters.value.category.length > 0 && !filters.value.category.includes(issue.category)) {
        return false
      }
      if (
        filters.value.responsibleDept.length > 0 &&
        !filters.value.responsibleDept.includes(issue.responsibleDept)
      ) {
        return false
      }
      if (filters.value.status.length > 0 && !filters.value.status.includes(issue.status)) {
        return false
      }
      if (filters.value.priority.length > 0 && !filters.value.priority.includes(issue.priority)) {
        return false
      }
      if (filters.value.keyword) {
        const keyword = filters.value.keyword.toLowerCase()
        return (
          issue.title.toLowerCase().includes(keyword) ||
          issue.location.toLowerCase().includes(keyword) ||
          issue.description.toLowerCase().includes(keyword) ||
          issue.assignee.toLowerCase().includes(keyword)
        )
      }
      return true
    })
  })

  const selectedIssue = computed(() => {
    if (!selectedIssueId.value) return null
    return issues.value.find((i) => i.id === selectedIssueId.value) || null
  })

  const stats = computed(() => {
    const data = filteredIssues.value
    const statusCount: Record<string, number> = {}
    const floorCount: Record<string, number> = {}
    const categoryCount: Record<string, number> = {}
    const deptCount: Record<string, number> = {}

    data.forEach((issue) => {
      statusCount[issue.status] = (statusCount[issue.status] || 0) + 1
      floorCount[issue.floor] = (floorCount[issue.floor] || 0) + 1
      categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1
      deptCount[issue.responsibleDept] = (deptCount[issue.responsibleDept] || 0) + 1
    })

    return {
      total: data.length,
      statusCount,
      floorCount,
      categoryCount,
      deptCount,
    }
  })

  function setFilters(newFilters: Partial<FilterOptions>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = { ...DEFAULT_FILTERS }
  }

  function selectIssue(id: string | null) {
    selectedIssueId.value = id
  }

  function addIssue(issueData: Partial<CollisionIssue>): CollisionIssue {
    const now = new Date().toISOString()
    const newIssue: CollisionIssue = {
      id: `ISSUE-${String(issues.value.length + 1).padStart(3, '0')}`,
      title: issueData.title || '',
      floor: issueData.floor || '1F',
      system: issueData.system || 'sprinkler',
      category: issueData.category || 'beam',
      location: issueData.location || '',
      elevation: issueData.elevation || 0,
      elevationUnit: issueData.elevationUnit || 'mm',
      beamHeight: issueData.beamHeight,
      responsibleDept: issueData.responsibleDept || '',
      assignee: issueData.assignee || '',
      status: issueData.status || 'draft',
      priority: issueData.priority || 'medium',
      description: issueData.description || '',
      attachments: issueData.attachments || [],
      designReplies: issueData.designReplies || [],
      statusHistory: [
        {
          id: generateId(),
          fromStatus: null,
          toStatus: issueData.status || 'draft',
          operator: currentUser.value,
          operateTime: now,
          remark: '创建问题记录',
        },
      ],
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser.value,
    }
    issues.value.unshift(newIssue)
    saveIssues()
    return newIssue
  }

  function updateIssue(id: string, updates: Partial<CollisionIssue>) {
    const index = issues.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      issues.value[index] = {
        ...issues.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      saveIssues()
    }
  }

  function changeStatus(id: string, newStatus: IssueStatus, remark: string = '') {
    const issue = issues.value.find((i) => i.id === id)
    if (issue) {
      const oldStatus = issue.status
      issue.status = newStatus
      issue.updatedAt = new Date().toISOString()

      const record: StatusRecord = {
        id: generateId(),
        fromStatus: oldStatus,
        toStatus: newStatus,
        operator: currentUser.value,
        operateTime: new Date().toISOString(),
        remark,
      }
      issue.statusHistory.push(record)
      saveIssues()
    }
  }

  function addAttachment(issueId: string, attachment: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>) {
    const issue = issues.value.find((i) => i.id === issueId)
    if (issue) {
      const sameTypeCount = issue.attachments.filter((a) => a.type === attachment.type).length
      const newAttachment: Attachment = {
        ...attachment,
        id: generateId(),
        uploadedAt: new Date().toISOString(),
        version: sameTypeCount + 1,
      }
      issue.attachments.push(newAttachment)
      issue.updatedAt = new Date().toISOString()
      saveIssues()
    }
  }

  function addDesignReply(issueId: string, reply: Omit<DesignReply, 'id' | 'repliedAt' | 'isLatest'>) {
    const issue = issues.value.find((i) => i.id === issueId)
    if (issue) {
      issue.designReplies.forEach((r) => (r.isLatest = false))

      const newReply: DesignReply = {
        ...reply,
        id: generateId(),
        repliedAt: new Date().toISOString(),
        isLatest: true,
      }
      issue.designReplies.push(newReply)
      issue.updatedAt = new Date().toISOString()

      if (issue.status === 'pending') {
        changeStatus(issueId, 'replied', '设计回复已更新')
      } else {
        saveIssues()
      }
    }
  }

  function updateAssignee(issueId: string, newAssignee: string) {
    const issue = issues.value.find((i) => i.id === issueId)
    if (issue) {
      issue.assignee = newAssignee
      issue.updatedAt = new Date().toISOString()
      const record: StatusRecord = {
        id: generateId(),
        fromStatus: issue.status,
        toStatus: issue.status,
        operator: currentUser.value,
        operateTime: new Date().toISOString(),
        remark: `责任人变更为：${newAssignee}`,
      }
      issue.statusHistory.push(record)
      saveIssues()
    }
  }

  function exportMeetingMinutes(selectedIds?: string[]): string {
    const issuesToExport = selectedIds
      ? issues.value.filter((i) => selectedIds.includes(i.id))
      : filteredIssues.value

    let content = '消防喷淋碰撞问题协调纪要\n'
    content += '='.repeat(50) + '\n'
    content += `生成时间：${formatDate(new Date().toISOString())}\n`
    content += `问题数量：${issuesToExport.length} 条\n`
    content += '='.repeat(50) + '\n\n'

    issuesToExport.forEach((issue, index) => {
      content += `【问题 ${index + 1}】${issue.id} - ${issue.title}\n`
      content += '-'.repeat(40) + '\n'
      content += `楼层：${issue.floor}\n`
      content += `系统：${issue.system}\n`
      content += `碰撞类型：${issue.category}\n`
      content += `位置：${issue.location}\n`
      content += `标高：${issue.elevation} ${issue.elevationUnit}\n`
      content += `责任专业：${issue.responsibleDept}\n`
      content += `责任人：${issue.assignee}\n`
      content += `状态：${issue.status}\n`
      content += `优先级：${issue.priority}\n`
      content += `问题描述：${issue.description}\n`

      if (issue.designReplies.length > 0) {
        content += `\n设计回复（共${issue.designReplies.length}条）：\n`
        issue.designReplies.forEach((reply, idx) => {
          content += `  回复 ${idx + 1}（${formatDate(reply.repliedAt)} - ${reply.repliedBy}）：\n`
          content += `    ${reply.content}\n`
        })
      }

      if (issue.attachments.length > 0) {
        content += `\n附件（共${issue.attachments.length}个）：\n`
        issue.attachments.forEach((att) => {
          content += `  - ${att.name}（${att.type}, v${att.version}, ${att.uploadedBy}）\n`
        })
      }

      content += '\n'
    })

    content += '='.repeat(50) + '\n'
    content += '本纪要由消防喷淋碰撞问题管理看板自动生成\n'

    return content
  }

  function downloadMinutes(selectedIds?: string[]) {
    const content = exportMeetingMinutes(selectedIds)
    const filename = `碰撞问题协调纪要_${formatDate(new Date().toISOString()).replace(/[- :]/g, '')}.txt`
    downloadFile(content, filename, 'text/plain;charset=utf-8')
  }

  function resetToMockData() {
    issues.value = [...mockIssues]
    saveIssues()
  }

  return {
    issues,
    filters,
    selectedIssueId,
    currentUser,
    filteredIssues,
    selectedIssue,
    stats,
    initIssues,
    setFilters,
    resetFilters,
    selectIssue,
    addIssue,
    updateIssue,
    changeStatus,
    addAttachment,
    addDesignReply,
    updateAssignee,
    exportMeetingMinutes,
    downloadMinutes,
    resetToMockData,
  }
})
