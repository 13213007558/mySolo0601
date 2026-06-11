import { r as registerInstance, d as createEvent, h } from './index-CGJi_we2.js';

const offlineCacheCss = () => `:host{display:block}.oc-root{padding:12px 16px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;font-family:var(--font-mono);font-size:13px}.oc-root.offline{border-color:var(--accent-yellow);background:rgba(255, 204, 0, 0.06)}.oc-status{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-weight:600}.oc-dot{width:10px;height:10px;border-radius:50%;background:var(--text-muted)}.oc-dot.green{background:var(--accent-green);box-shadow:0 0 8px var(--accent-green)}.oc-dot.red{background:var(--accent-red);box-shadow:0 0 8px var(--accent-red);animation:pulseWarn 1.2s infinite}.oc-meta{display:flex;gap:20px;color:var(--text-secondary)}.oc-warn{margin-top:8px;color:var(--accent-yellow);font-size:12px}.oc-sync{margin-top:8px}`;

const CACHE_KEY = 'fencing_bout_cache_v1';
const QUEUE_KEY = 'fencing_upload_queue_v1';
const OfflineCache = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.cachedLoaded = createEvent(this, "cachedLoaded", 7);
        this.syncComplete = createEvent(this, "syncComplete", 7);
        this.uploadEndpoint = '';
        this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
        this.cachedCount = 0;
        this.queueCount = 0;
    }
    componentWillLoad() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => { this.isOnline = false; });
        }
        this.refreshCounts();
    }
    refreshCounts() {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            this.cachedCount = Object.keys(cache).length;
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            this.queueCount = queue.length;
        }
        catch (_a) {
            this.cachedCount = 0;
            this.queueCount = 0;
        }
    }
    async handleOnline() {
        this.isOnline = true;
        await this.syncQueue();
    }
    async saveBout(boutId, state) {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            cache[boutId] = { state, savedAt: Date.now() };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            this.refreshCounts();
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async loadBout(boutId) {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            const entry = cache[boutId];
            return entry ? entry.state : null;
        }
        catch (_a) {
            return null;
        }
    }
    async removeBout(boutId) {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            delete cache[boutId];
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            this.refreshCounts();
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    async listBouts() {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
            return Object.entries(cache).map(([id, v]) => ({ id, savedAt: v.savedAt }));
        }
        catch (_a) {
            return [];
        }
    }
    async queueUpload(payload) {
        try {
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            queue.push({ payload, createdAt: Date.now(), id: Date.now().toString(36) });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            this.refreshCounts();
        }
        catch (_a) {
            /* noop */
        }
    }
    async syncQueue() {
        if (!this.isOnline || !this.uploadEndpoint) {
            return { success: 0, failed: 0 };
        }
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        let success = 0;
        let failed = 0;
        const remaining = [];
        for (const item of queue) {
            try {
                const res = await fetch(this.uploadEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.payload),
                });
                if (res.ok)
                    success++;
                else {
                    remaining.push(item);
                    failed++;
                }
            }
            catch (_a) {
                remaining.push(item);
                failed++;
            }
        }
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        this.refreshCounts();
        this.syncComplete.emit({ success, failed });
        return { success, failed };
    }
    async clearAll() {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(QUEUE_KEY);
        this.refreshCounts();
    }
    render() {
        return (h("div", { key: 'a18626958f3c3492d74b69130a3fe5de8d6efe67', class: `oc-root ${this.isOnline ? 'online' : 'offline'}` }, h("div", { key: '69176fd7420f27ee46834cf1c2252754fa787fb2', class: "oc-status" }, h("span", { key: '6f28c76a33f424fb23b2a354a58fd701cd693447', class: `oc-dot ${this.isOnline ? 'green' : 'red'}` }), h("span", { key: 'e2c001dafaa831bcee4a8ab0b0287ea0bc3178d2' }, this.isOnline ? '网络已连接' : '已离线 - 数据本地缓存')), h("div", { key: 'fcb985fa2b0e857a3fdb2d0cd6f9f19c2524f4af', class: "oc-meta" }, h("span", { key: '46a78169b1d39bf84c472a98d8accc28060be08b' }, "\u672C\u5730\u7F13\u5B58\uFF1A", this.cachedCount, " \u573A"), h("span", { key: 'c435d874b268c3645d1ce3856640989ef751c11a' }, "\u5F85\u4E0A\u4F20\uFF1A", this.queueCount)), !this.isOnline && (h("div", { key: 'fbcedb237d61fb465338cff4e34eaa8849b49000', class: "oc-warn" }, "\u65AD\u7F51\u671F\u95F4\u672C\u573A\u6570\u636E\u5DF2\u7F13\u5B58\uFF0C\u6062\u590D\u7F51\u7EDC\u540E\u81EA\u52A8\u8865\u4F20")), this.isOnline && this.queueCount > 0 && (h("button", { key: 'af1d93c0fd4809cf60d7fadc1951845a0b29ffca', class: "btn-flat btn-primary oc-sync", onClick: () => this.syncQueue() }, "\u7ACB\u5373\u540C\u6B65 ", this.queueCount, " \u6761"))));
    }
};
OfflineCache.style = offlineCacheCss();

export { OfflineCache as O };
//# sourceMappingURL=offline-cache-Bwv1JfzM.js.map

//# sourceMappingURL=offline-cache-Bwv1JfzM.js.map