import express from 'express';
import cors from 'cors';
import recordsRouter from './routes/records.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/records', recordsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`[server] Milk record API listening on http://localhost:${PORT}`);
});
