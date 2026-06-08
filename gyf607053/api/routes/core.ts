import { Router, type Request, type Response } from 'express'
import { db } from '../data/store.js'
import {
  applyPrivacyMask,
  applyPrivacyMaskToList,
  batchValidatePhones,
  generateId,
} from '../utils/privacy.js'
import type {
  Baby,
  BorrowReturnRecord,
  BorrowReturnAction,
  RecordSource,
  UserRole,
  ClassSummary,
} from '../../shared/types'

const router = Router()

function extractRoleHeader(req: Request): { role: UserRole; userId: string; userName: string } {
  const role = (req.header('x-user-role') as UserRole) || 'waiter'
  const userId = req.header('x-user-id') || 'u-waiter-01'
  const userName = req.header('x-user-name') || '李小芳'
  return { role, userId, userName }
}

router.get('/babies', (req: Request, res: Response) => {
  const { role, userId, userName } = extractRoleHeader(req)
  const babies = applyPrivacyMaskToList(
    db.getBabies() as unknown as Record<string, unknown>[],
    role,
    { userId, userName, isExport: false },
  ) as unknown as Baby[]
  res.json({ success: true, data: babies })
})

router.get('/babies/:id', (req: Request, res: Response) => {
  const { role, userId, userName } = extractRoleHeader(req)
  const baby = db.getBabyById(req.params.id)
  if (!baby) {
    res.status(404).json({ success: false, error: '宝宝不存在' })
    return
  }
  const masked = applyPrivacyMask(
    baby as unknown as Record<string, unknown>,
    role,
    { userId, userName, isExport: false },
  ) as unknown as Baby
  const records = db.getRecordsByBabyId(baby.id)
  res.json({ success: true, data: { baby: masked, records } })
})

router.get('/classes', (req: Request, res: Response) => {
  const babies = db.getBabies()
  const items = db.getItems()
  const records = db.getRecords()
  const classMap = new Map<string, ClassSummary>()
  babies.forEach((b) => {
    if (!classMap.has(b.className)) {
      classMap.set(b.className, {
        className: b.className,
        babyCount: 0,
        itemsInUse: 0,
        itemsClean: 0,
        itemsDirty: 0,
        itemsException: 0,
      })
    }
    classMap.get(b.className)!.babyCount++
  })
  items.forEach((item) => {
    const br = records.find((r) => r.itemId === item.id && r.action === 'borrow')
    const baby = br ? babies.find((b) => b.id === br.babyId) : null
    const cls = baby?.className
    if (!cls) return
    const summary = classMap.get(cls)
    if (!summary) return
    if (item.status === 'in_use') summary.itemsInUse++
    if (item.status === 'clean') summary.itemsClean++
    if (item.status === 'dirty') summary.itemsDirty++
    if (item.status === 'exception') summary.itemsException++
  })
  res.json({ success: true, data: Array.from(classMap.values()) })
})

router.get('/classes/:name', (req: Request, res: Response) => {
  const { role, userId, userName } = extractRoleHeader(req)
  const className = decodeURIComponent(req.params.name)
  const babies = applyPrivacyMaskToList(
    db.getBabies().filter((b) => b.className === className) as unknown as Record<string, unknown>[],
    role,
    { userId, userName, isExport: false },
  ) as unknown as Baby[]
  const records = db.getRecordsByClassName(className)
  res.json({ success: true, data: { className, babies, records } })
})

router.post('/babies/batch-import', (req: Request, res: Response) => {
  const { items } = req.body as { items: Array<{ name: string; className: string; parentPhone: string; parentName: string }> }
  const phones = items.map((i) => i.parentPhone)
  const validated = batchValidatePhones(phones)
  const successItems: Baby[] = []
  const failedItems: Array<{ id: string; reason: string }> = []
  const validMap = new Map(validated.valid.map((v) => [v.original, v.normalized]))
  items.forEach((it, idx) => {
    if (validMap.has(it.parentPhone)) {
      const baby: Baby = {
        id: generateId('b'),
        name: it.name,
        className: it.className,
        parentPhone: validMap.get(it.parentPhone)!,
        parentName: it.parentName,
        ageMonths: 24,
      }
      successItems.push(baby)
    } else {
      failedItems.push({
        id: `row-${idx}`,
        reason: `手机号 ${it.parentPhone || '[空]'} 格式错误`,
      })
    }
  })
  res.json({
    success: failedItems.length === 0,
    partialSuccess: successItems.length > 0 && failedItems.length > 0,
    data: { imported: successItems.length, total: items.length },
    failedItems,
  })
})

router.get('/items', (req: Request, res: Response) => {
  res.json({ success: true, data: db.getItems() })
})

router.post('/items/:id/clean', (req: Request, res: Response) => {
  const item = db.markItemClean(req.params.id)
  if (!item) {
    res.status(404).json({ success: false, error: '物品不存在' })
    return
  }
  res.json({ success: true, data: item })
})

router.get('/records', (req: Request, res: Response) => {
  const records = db.getRecords()
  const babyId = req.query.babyId as string
  const className = req.query.className as string
  const unresolvedOnly = req.query.unresolved === 'true'
  let result = records
  if (babyId) result = result.filter((r) => r.babyId === babyId)
  if (className) result = result.filter((r) => r.className === decodeURIComponent(className))
  if (unresolvedOnly) result = result.filter((r) => r.hasException && !r.exceptionResolved)
  res.json({ success: true, data: result })
})

router.post('/records', (req: Request, res: Response) => {
  const { userId, userName } = extractRoleHeader(req)
  const {
    itemId,
    babyId,
    action,
    source = 'scan' as RecordSource,
    hasException = false,
    exceptionType,
    exceptionNote,
    remark,
  } = req.body
  const item = db.getItemById(itemId)
  const baby = db.getBabyById(babyId)
  const user = db.getUserById(userId)
  if (!item || !baby || !user) {
    res.status(400).json({ success: false, error: '物品/宝宝/用户不存在' })
    return
  }
  const record: BorrowReturnRecord = {
    id: generateId('r'),
    itemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    babyId: baby.id,
    babyName: baby.name,
    className: baby.className,
    action: action as BorrowReturnAction,
    source,
    processorId: user.id,
    processorName: user.name,
    processorRole: user.role,
    storeId: user.storeId,
    handledAt: new Date().toISOString(),
    hasException,
    exceptionType: hasException ? exceptionType : undefined,
    exceptionNote: hasException ? exceptionNote : undefined,
    exceptionResolved: false,
    remark,
  }
  const saved = db.addRecord(record)
  res.json({ success: true, data: saved })
})

router.post('/records/:id/resolve-exception', (req: Request, res: Response) => {
  const { userId, userName } = extractRoleHeader(req)
  const { note } = req.body
  const record = db.resolveException(req.params.id, userId, userName, note || '已处理')
  if (!record) {
    res.status(404).json({ success: false, error: '记录不存在' })
    return
  }
  res.json({ success: true, data: record })
})

router.get('/records/export', (req: Request, res: Response) => {
  const { role, userId, userName } = extractRoleHeader(req)
  const isExport = true
  const records = applyPrivacyMaskToList(
    db.getRecords() as unknown as Record<string, unknown>[],
    role,
    { userId, userName, isExport },
  ) as unknown as BorrowReturnRecord[]
  const babies = applyPrivacyMaskToList(
    db.getBabies() as unknown as Record<string, unknown>[],
    role,
    { userId, userName, isExport },
  ) as unknown as Baby[]
  const lines: string[] = []
  lines.push('借还记录清单')
  lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(`导出人：${userName} (${role})`)
  lines.push('')
  lines.push('时间,物品编码,物品名称,宝宝姓名,班级,操作,处理人,处理人角色,来源,异常,异常类型,异常说明,是否已解决,解决人,解决时间,解决说明,备注')
  records.forEach((r) => {
    lines.push([
      r.handledAt,
      r.itemCode,
      r.itemName,
      r.babyName,
      r.className,
      r.action === 'borrow' ? '借出' : '归还',
      r.processorName,
      r.processorRole,
      r.source === 'scan' ? '扫码' : '手工补录',
      r.hasException ? '是' : '否',
      r.exceptionType || '',
      r.exceptionNote || '',
      r.exceptionResolved ? '是' : '否',
      r.resolvedByName || '',
      r.resolvedAt || '',
      r.resolvedNote || '',
      r.remark || '',
    ].join(','))
  })
  lines.push('')
  lines.push('宝宝信息')
  lines.push('姓名,班级,家长姓名,家长电话,月龄')
  babies.forEach((b) => {
    lines.push([b.name, b.className, b.parentName, b.parentPhone, b.ageMonths].join(','))
  })
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="disinfection-records-${Date.now()}.csv"`)
  res.send('\uFEFF' + lines.join('\n'))
})

router.get('/audit-logs', (req: Request, res: Response) => {
  const { role } = extractRoleHeader(req)
  if (role !== 'supervisor' && role !== 'manager') {
    res.status(403).json({ success: false, error: '无权限查看审计日志' })
    return
  }
  const exportOnly = req.query.export === 'true'
  const logs = exportOnly ? db.getAuditLogsByExportContext() : db.getAuditLogs()
  res.json({ success: true, data: logs })
})

export default router
