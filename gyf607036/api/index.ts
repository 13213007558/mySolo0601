import app from './app';
import { initSchema } from './db/init';
import { seedIfEmpty } from './db/seed';
import { addSystemEvent } from './repositories/authRepository';

const PORT = process.env.PORT || 4000;

initSchema();

const startupTag = Date.now();
(globalThis as any).__photoAuthStartup = startupTag;

try {
  seedIfEmpty();
} catch (e) {
  addSystemEvent(
    'data_recovery',
    '数据恢复 · 种子数据异常',
    `种子初始化异常：${e instanceof Error ? e.message : String(e)}。服务将继续运行，历史版本与现有数据均已保留。`,
  );
}

app.listen(PORT, () => {
  console.log(`[photo-auth] server listening on :${PORT}`);
});
