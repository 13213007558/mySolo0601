import { Component, Prop, State, Event, EventEmitter, h, Method } from '@stencil/core';

const CACHE_KEY = 'fencing_bout_cache_v1';
const QUEUE_KEY = 'fencing_upload_queue_v1';

@Component({
  tag: 'offline-cache',
  styleUrl: 'offline-cache.css',
  shadow: true,
})
export class OfflineCache {
  @Prop() uploadEndpoint: string = '';
  @Event() cachedLoaded: EventEmitter<any>;
  @Event() syncComplete: EventEmitter<{ success: number; failed: number }>;
  @State() isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  @State() cachedCount: number = 0;
  @State() queueCount: number = 0;

  componentWillLoad() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => { this.isOnline = false; });
    }
    this.refreshCounts();
  }

  private refreshCounts() {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      this.cachedCount = Object.keys(cache).length;
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      this.queueCount = queue.length;
    } catch {
      this.cachedCount = 0;
      this.queueCount = 0;
    }
  }

  private async handleOnline() {
    this.isOnline = true;
    await this.syncQueue();
  }

  @Method()
  async saveBout(boutId: string, state: any): Promise<boolean> {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      cache[boutId] = { state, savedAt: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      this.refreshCounts();
      return true;
    } catch (e) {
      return false;
    }
  }

  @Method()
  async loadBout(boutId: string): Promise<any | null> {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const entry = cache[boutId];
      return entry ? entry.state : null;
    } catch {
      return null;
    }
  }

  @Method()
  async removeBout(boutId: string): Promise<boolean> {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      delete cache[boutId];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      this.refreshCounts();
      return true;
    } catch {
      return false;
    }
  }

  @Method()
  async listBouts(): Promise<Array<{ id: string; savedAt: number }>> {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return Object.entries(cache).map(([id, v]: [string, any]) => ({ id, savedAt: v.savedAt }));
    } catch {
      return [];
    }
  }

  @Method()
  async queueUpload(payload: any): Promise<void> {
    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      queue.push({ payload, createdAt: Date.now(), id: Date.now().toString(36) });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      this.refreshCounts();
    } catch {
      /* noop */
    }
  }

  @Method()
  async syncQueue(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline || !this.uploadEndpoint) {
      return { success: 0, failed: 0 };
    }
    const queue: any[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    let success = 0;
    let failed = 0;
    const remaining: any[] = [];
    for (const item of queue) {
      try {
        const res = await fetch(this.uploadEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) success++;
        else { remaining.push(item); failed++; }
      } catch {
        remaining.push(item);
        failed++;
      }
    }
    localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    this.refreshCounts();
    this.syncComplete.emit({ success, failed });
    return { success, failed };
  }

  @Method()
  async clearAll(): Promise<void> {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(QUEUE_KEY);
    this.refreshCounts();
  }

  render() {
    return (
      <div class={`oc-root ${this.isOnline ? 'online' : 'offline'}`}>
        <div class="oc-status">
          <span class={`oc-dot ${this.isOnline ? 'green' : 'red'}`} />
          <span>{this.isOnline ? '网络已连接' : '已离线 - 数据本地缓存'}</span>
        </div>
        <div class="oc-meta">
          <span>本地缓存：{this.cachedCount} 场</span>
          <span>待上传：{this.queueCount}</span>
        </div>
        {!this.isOnline && (
          <div class="oc-warn">断网期间本场数据已缓存，恢复网络后自动补传</div>
        )}
        {this.isOnline && this.queueCount > 0 && (
          <button class="btn-flat btn-primary oc-sync" onClick={() => this.syncQueue()}>立即同步 {this.queueCount} 条</button>
        )}
      </div>
    );
  }
}
