import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  const chunks: any[] = [];
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  res.write = (chunk: any, ...args: any[]): any => { chunks.push(chunk); return originalWrite(chunk, ...args); };
  res.end = (chunk: any, ...args: any[]): any => {
    if (chunk) chunks.push(chunk);
    const duration = Date.now() - start;
    const bodyStr = Buffer.concat(chunks).toString('utf8');
    let logBody = bodyStr;
    try {
      const parsed = JSON.parse(bodyStr);
      if (parsed.data) {
        const masked: any = {};
        for (const [k, v] of Object.entries(parsed.data)) {
          if (k === 'babies' || k === 'baby') {
            masked[k] = Array.isArray(v) ? v.length + ' items' : '1 item';
          } else if (k === 'records') {
            masked[k] = Array.isArray(v) ? v.length + ' items' : 'record';
          } else {
            masked[k] = v;
          }
        }
        logBody = JSON.stringify({ ...parsed, data: masked });
      }
    } catch {}
    console.log(`[HTTP] ${req.method} ${req.url} ${res.statusCode} ${duration}ms ${req.headers['x-user-role'] || ''}`);
    return originalEnd(chunk, ...args);
  };
  next();
});

app.use('/api', routes);

app.use(express.static(path.join(__dirname, '../dist/client')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/client/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
