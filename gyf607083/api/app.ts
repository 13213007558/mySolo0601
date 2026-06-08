import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import { initDatabase } from './db/init.js'
import { privacyFilterMiddleware } from './middleware/privacyFilter.js'

import classRoutes from './routes/classes.js'
import babyRoutes from './routes/babies.js'
import supplyRecordRoutes from './routes/supplyRecords.js'
import auditRoutes from './routes/audit.js'
import exportRoutes from './routes/export.js'
import userRoutes from './routes/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['x-user-role']) {
    req.headers['x-user-role'] = 'customer_service'
  }
  if (!req.headers['x-user-id']) {
    req.headers['x-user-id'] = 'user3'
  }
  next()
})

app.use(privacyFilterMiddleware)

app.use('/api/auth', authRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/babies', babyRoutes)
app.use('/api/supply-records', supplyRecordRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/users', userRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
