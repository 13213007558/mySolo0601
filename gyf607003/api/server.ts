/**
 * local server entry file, for local development
 */
import app from './app.js';
import { getDb } from './db/index.js';
import { compensationScheduler } from './services/compensation.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

console.log('Initializing database...');
getDb();
console.log('Database initialized.');

console.log('Starting compensation scheduler...');
compensationScheduler.start().then(() => {
  console.log('Compensation scheduler started.');
}).catch((err) => {
  console.error('Failed to start compensation scheduler:', err);
});

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

/**
 * graceful shutdown
 */
async function shutdown(signal: string) {
  console.log(`\n${signal} signal received, shutting down gracefully...`);
  compensationScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Force shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGUSR2', () => shutdown('SIGUSR2'));

export default app;