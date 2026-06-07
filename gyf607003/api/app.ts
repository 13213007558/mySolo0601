import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { authMiddleware } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import statsRoutes from './routes/stats.js'
import recordsRoutes from './routes/records.js'
import exceptionsRoutes from './routes/exceptions.js'
import classesRoutes from './routes/classes.js'
import babiesRoutes from './routes/babies.js'
import auditRoutes from './routes/audit.js'
import exportRoutes from './routes/export.js'
import { sanitizeLogData } from '../shared/privacy.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(authMiddleware)

app.use((req, _res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const safe = sanitizeLogData(req.body);
    console.log('[REQ]', req.method, req.path, JSON.stringify(safe).slice(0, 200))
  }
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/exceptions', exceptionsRoutes)
app.use('/api/classes', classesRoutes)
app.use('/api/babies', babiesRoutes)
app.use('/api/audit-logs', auditRoutes)
app.use('/api/export', exportRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
