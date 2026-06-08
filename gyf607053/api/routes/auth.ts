import { Router, type Request, type Response } from 'express'
import { db } from '../data/store.js'
import { applyPrivacyMask } from '../utils/privacy.js'
import type { User } from '../../shared/types'

const router = Router()

router.get('/users', (req: Request, res: Response) => {
  const users = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    storeId: u.storeId,
  }))
  res.json({ success: true, data: users })
})

router.post('/login', (req: Request, res: Response) => {
  const { userId } = req.body
  const user = db.getUserById(userId)
  if (!user) {
    res.status(401).json({ success: false, error: '用户不存在' })
    return
  }
  const maskedUser = applyPrivacyMask(
    user as unknown as Record<string, unknown>,
    user.role,
    { userId: user.id, userName: user.name, isExport: false },
  ) as unknown as User
  res.json({ success: true, data: maskedUser })
})

export default router
