import {
  getNextCompensationTask,
  updateCompensationTaskStatus,
  processCompensationTask,
  listCompensationTasks,
} from './audit.js';
import type { CompensationTask } from '../../shared/types.js';
import { COMPENSATION_CONFIG } from '../../shared/types.js';

const SYSTEM_USER = {
  id: 'u_admin',
  name: '系统补偿',
  role: 'admin' as const,
};

export class CompensationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private pollIntervalMs = 5 * 1000;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    console.log('[COMPENSATION] scheduler starting...');

    const pending = listCompensationTasks();
    console.log(`[COMPENSATION] loaded ${pending.length} tasks on startup`);

    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.pollIntervalMs);

    void this.runOnce();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[COMPENSATION] scheduler stopped');
  }

  private async runOnce(): Promise<void> {
    if (!this.running) return;

    let task: CompensationTask | null;
    while ((task = getNextCompensationTask()) !== null) {
      await this.processTask(task);
    }
  }

  private async processTask(task: CompensationTask): Promise<void> {
    console.log(`[COMPENSATION] processing task ${task.id} (attempt ${task.retryCount + 1}/${task.maxRetries})`);

    try {
      updateCompensationTaskStatus(task.id, 'processing');
      const result = processCompensationTask(task, SYSTEM_USER);

      if (result.success) {
        updateCompensationTaskStatus(task.id, 'success');
        console.log(`[COMPENSATION] task ${task.id} completed successfully`);
      } else {
        const newRetryCount = task.retryCount + 1;
        if (newRetryCount >= task.maxRetries) {
          updateCompensationTaskStatus(task.id, 'failed', { error: result.error, incrementRetry: true });
          console.error(`[COMPENSATION] task ${task.id} exceeded max retries (${task.maxRetries}), marked failed`);
        } else {
          updateCompensationTaskStatus(task.id, 'failed', { error: result.error, incrementRetry: true });
          console.warn(`[COMPENSATION] task ${task.id} failed, will retry (${newRetryCount}/${task.maxRetries})`);
        }
      }
    } catch (e) {
      const error = (e as Error).message;
      const newRetryCount = task.retryCount + 1;
      if (newRetryCount >= task.maxRetries) {
        updateCompensationTaskStatus(task.id, 'failed', { error, incrementRetry: true });
        console.error(`[COMPENSATION] task ${task.id} crashed, exceeded max retries: ${error}`);
      } else {
        updateCompensationTaskStatus(task.id, 'failed', { error, incrementRetry: true });
        console.warn(`[COMPENSATION] task ${task.id} crashed, will retry: ${error}`);
      }
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getStatus(): {
    running: boolean;
    pollIntervalMs: number;
    maxRetries: number;
    retryIntervalMs: number;
  } {
    return {
      running: this.running,
      pollIntervalMs: this.pollIntervalMs,
      maxRetries: COMPENSATION_CONFIG.MAX_RETRIES,
      retryIntervalMs: COMPENSATION_CONFIG.RETRY_INTERVAL_MS,
    };
  }
}

export const compensationScheduler = new CompensationScheduler();
