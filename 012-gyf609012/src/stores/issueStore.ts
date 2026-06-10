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
  AttachmentType,
} from '@/types'
import {
  loadIssuesFromStorage,
  saveIssuesToStorage,
  generateId,
  downloadFile,
  formatDate,
} from '@/utils/storage'
import { mockIssues } from '@/utils/mockData'
import { DEFAULT_FILTERS, STATUS_LABELS, CATEGORY_LABELS, SYSTEM_LABELS, ATTACHMENT_TYPE_LABELS } from '@/types'

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

  function addIssue(issueData: any): CollisionIssue {
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
      attachments: (issueData.attachments || []).map((att, idx) => ({
        id: generateId(),
        name: att.name,
        type: att.type,
        url: att.url,
        uploadedBy: att.uploadedBy || currentUser.value,
        uploadedAt: now,
        version: (issueData.attachments || []).filter(a => a.type === att.type).slice(0, idx + 1).length,
        remark: att.remark || '',
      })),
      designReplies: (issueData.designReplies || []).map((reply) => ({
        id: reply.id || generateId(),
        content: reply.content,
        repliedBy: reply.repliedBy,
        repliedAt: reply.repliedAt || now,
        isLatest: true,
        attachments: (reply.attachments || []).map((att, idx) => ({
          id: generateId(),
          name: att.name,
          type: att.type,
          url: att.url,
          uploadedBy: att.uploadedBy || reply.repliedBy,
          uploadedAt: now,
          version: idx + 1,
          remark: att.remark || '',
        })),
      })),
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
      const sameTypeVersions = issue.attachments
        .filter((a) => a.type === attachment.type)
        .map((a) => a.version)
      const maxVersion = sameTypeVersions.length > 0 ? Math.max(...sameTypeVersions) : 0
      const newAttachment: Attachment = {
        ...attachment,
        id: generateId(),
        uploadedAt: new Date().toISOString(),
        version: maxVersion + 1,
      }
      issue.attachments.push(newAttachment)
      issue.updatedAt = new Date().toISOString()

      const record: StatusRecord = {
        id: generateId(),
        fromStatus: issue.status,
        toStatus: issue.status,
        operator: currentUser.value,
        operateTime: new Date().toISOString(),
        remark: `新增附件：${newAttachment.name}（${newAttachment.type}, v${newAttachment.version}）`,
      }
      issue.statusHistory.push(record)
      saveIssues()
    }
  }

  function addAttachmentToReply(
    issueId: string,
    replyId: string,
    attachment: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>
  ) {
    const issue = issues.value.find((i) => i.id === issueId)
    if (issue) {
      const reply = issue.designReplies.find((r) => r.id === replyId)
      if (reply) {
        const sameTypeVersions = reply.attachments
          .filter((a) => a.type === attachment.type)
          .map((a) => a.version)
        const maxVersion = sameTypeVersions.length > 0 ? Math.max(...sameTypeVersions) : 0
        const newAttachment: Attachment = {
          ...attachment,
          id: generateId(),
          uploadedAt: new Date().toISOString(),
          version: maxVersion + 1,
        }
        reply.attachments.push(newAttachment)
        issue.updatedAt = new Date().toISOString()

        const record: StatusRecord = {
          id: generateId(),
          fromStatus: issue.status,
          toStatus: issue.status,
          operator: currentUser.value,
          operateTime: new Date().toISOString(),
          remark: `设计回复新增附件：${newAttachment.name}（${newAttachment.type}, v${newAttachment.version}）`,
        }
        issue.statusHistory.push(record)
        saveIssues()
      }
    }
  }

  function returnForRevision(id: string, remark: string = '') {
    const issue = issues.value.find((i) => i.id === id)
    if (issue && (issue.status === 'replied' || issue.status === 'pending')) {
      changeStatus(id, 'returned', remark || '设计审查不通过，退回待改')
    }
  }

  function submitIssue(id: string, remark: string = '') {
    const issue = issues.value.find((i) => i.id === id)
    if (issue && (issue.status === 'draft' || issue.status === 'returned')) {
      changeStatus(id, 'pending', remark || '提交待处理')
    }
  }

  function confirmCompleted(id: string, remark: string = '') {
    const issue = issues.value.find((i) => i.id === id)
    if (issue && (issue.status === 'replied' || issue.status === 'returned')) {
      changeStatus(id, 'completed', remark || '现场确认整改完成')
    }
  }

  function reopenIssue(id: string, remark: string = '') {
    const issue = issues.value.find((i) => i.id === id)
    if (issue && (issue.status === 'completed' || issue.status === 'cancelled')) {
      changeStatus(id, 'pending', remark || '重新打开问题')
    }
  }

  function cancelIssue(id: string, remark: string = '') {
    const issue = issues.value.find((i) => i.id === id)
    if (issue && issue.status !== 'completed' && issue.status !== 'cancelled') {
      changeStatus(id, 'cancelled', remark || '问题取消')
    }
  }

  function addDesignReply(issueId: string, reply: Omit<DesignReply, 'id' | 'repliedAt' | 'isLatest' | 'attachments'> & { attachments?: Omit<Attachment, 'id' | 'uploadedAt' | 'version'>[] }) {
    const issue = issues.value.find((i) => i.id === issueId)
    if (issue) {
      issue.designReplies.forEach((r) => (r.isLatest = false))

      const now = new Date().toISOString()
      const processedAttachments: Attachment[] = (reply.attachments || []).map((att, idx) => ({
        id: generateId(),
        name: att.name,
        type: att.type,
        url: att.url,
        uploadedBy: att.uploadedBy || reply.repliedBy,
        uploadedAt: now,
        version: idx + 1,
        remark: att.remark || '',
      }))

      const newReply: DesignReply = {
        content: reply.content,
        repliedBy: reply.repliedBy,
        attachments: processedAttachments,
        id: generateId(),
        repliedAt: now,
        isLatest: true,
      }
      issue.designReplies.push(newReply)
      issue.updatedAt = now

      if (issue.status === 'pending' || issue.status === 'returned') {
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
      content += `系统：${SYSTEM_LABELS[issue.system]}\n`
      content += `碰撞类型：${CATEGORY_LABELS[issue.category]}\n`
      content += `位置：${issue.location}\n`
      content += `标高：${issue.elevation} ${issue.elevationUnit}\n`
      content += `责任专业：${issue.responsibleDept}\n`
      content += `责任人：${issue.assignee}\n`
      content += `状态：${STATUS_LABELS[issue.status]}\n`
      content += `优先级：${issue.priority}\n`
      content += `问题描述：${issue.description}\n`

      if (issue.designReplies.length > 0) {
        content += `\n设计回复（共${issue.designReplies.length}条）：\n`
        issue.designReplies.forEach((reply, idx) => {
          content += `  回复 ${idx + 1}（${formatDate(reply.repliedAt)} - ${reply.repliedBy}）：\n`
          content += `    ${reply.content}\n`
          if (reply.attachments.length > 0) {
            content += `    回复附件：\n`
            reply.attachments.forEach((att) => {
              content += `      - ${att.name}（${ATTACHMENT_TYPE_LABELS[att.type]}, v${att.version}）\n`
            })
          }
        })
      }

      if (issue.attachments.length > 0) {
        content += `\n附件（共${issue.attachments.length}个）：\n`
        issue.attachments.forEach((att) => {
          content += `  - ${att.name}（${ATTACHMENT_TYPE_LABELS[att.type]}, v${att.version}, ${att.uploadedBy}）\n`
        })
      }

      if (issue.statusHistory.length > 1) {
        content += `\n状态变更历史（共${issue.statusHistory.length}条）：\n`
        issue.statusHistory.forEach((rec, idx) => {
          const from = rec.fromStatus ? STATUS_LABELS[rec.fromStatus] : '无'
          const to = STATUS_LABELS[rec.toStatus]
          content += `  ${idx + 1}. ${formatDate(rec.operateTime)} ${rec.operator}：${from} → ${to}${rec.remark ? ' — ' + rec.remark : ''}\n`
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
    addAttachmentToReply,
    addDesignReply,
    updateAssignee,
    submitIssue,
    returnForRevision,
    confirmCompleted,
    reopenIssue,
    cancelIssue,
    exportMeetingMinutes,
    downloadMinutes,
    resetToMockData,
  }
})
