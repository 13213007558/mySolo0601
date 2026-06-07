import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import schedulesRoutes from './routes/schedules.js';
import classesRoutes from './routes/classes.js';
import babiesRoutes from './routes/babies.js';
import auditRoutes from './routes/audit.js';
import exportRoutes from './routes/export.js';
import scanRecordsRoutes from './routes/scanRecords.js';

import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
import { privacyMiddleware } from './middleware/privacy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(optionalAuthMiddleware);
app.use(privacyMiddleware);

app.use('/api/auth', authRoutes);

app.use('/api/schedules', authMiddleware, schedulesRoutes);
app.use('/api/classes', authMiddleware, classesRoutes);
app.use('/api/babies', authMiddleware, babiesRoutes);
app.use('/api/audit-logs', authMiddleware, auditRoutes);
app.use('/api/export', authMiddleware, exportRoutes);
app.use('/api/scan-records', authMiddleware, scanRecordsRoutes);

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
    });
  },
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
  });
});

export default app;
