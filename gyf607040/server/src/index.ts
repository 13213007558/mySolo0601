import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { initDb } from './db';
import { recordsRouter } from './routes/records';
import { babiesRouter } from './routes/babies';
import { uploadRouter } from './routes/upload';
import { exportRouter } from './routes/export';

initDb();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use('/api/records', recordsRouter);
app.use('/api/babies', babiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/export', exportRouter);

app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`月子护理奶量交接服务已启动: http://localhost:${PORT}`);
});
