import { r as registerInstance, d as createEvent, h } from './index-CGJi_we2.js';

const controversyModeCss = () => `:host{display:block}.cm-overlay{position:fixed;inset:0;background:rgba(0, 0, 0, 0.85);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}.cm-panel{width:90%;max-width:820px;background:var(--bg-secondary);border:2px solid var(--accent-yellow);box-shadow:0 0 40px rgba(255, 204, 0, 0.25);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;max-height:90vh}.cm-header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:var(--bg-tertiary);border-bottom:1px solid var(--border-color)}.cm-header h2{margin:0;font-size:18px;color:var(--accent-yellow)}.cm-close{background:var(--accent-red);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-family:var(--font-mono);cursor:pointer;font-weight:600}.cm-body{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;padding:20px 24px;overflow:auto}.cm-list{display:flex;flex-direction:column;gap:10px}.cm-empty{color:var(--text-muted);padding:40px;text-align:center;font-family:var(--font-mono)}.cm-item{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:14px 16px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;cursor:pointer;transition:all 0.15s ease}.cm-item:hover{border-color:var(--text-secondary)}.cm-item.active{border-color:var(--accent-yellow);background:rgba(255, 204, 0, 0.08);box-shadow:0 0 16px rgba(255, 204, 0, 0.2)}.cm-idx{font-family:var(--font-mono);font-weight:700;color:var(--text-muted);font-size:20px}.cm-main{display:flex;flex-direction:column;gap:4px}.cm-side{font-weight:600;font-size:16px;color:var(--text-primary)}.cm-type{font-family:var(--font-mono);color:var(--accent-green);font-size:13px}.cm-note{font-size:12px;color:var(--text-secondary)}.cm-time{font-family:var(--font-mono);font-size:13px;color:var(--text-muted)}.cm-annotate{display:flex;flex-direction:column;gap:10px}.cm-annotate label{font-size:14px;color:var(--text-secondary)}.cm-annotate textarea{background:var(--bg-card);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);padding:10px 12px;font-family:var(--font-sans);font-size:14px;resize:vertical;outline:none}.cm-annotate textarea:focus{border-color:var(--accent-yellow)}.cm-submit{background:var(--accent-yellow);color:#000;border:none;padding:10px;border-radius:6px;font-weight:700;cursor:pointer;font-family:var(--font-mono)}.cm-footer{padding:12px 24px;background:rgba(255, 59, 92, 0.08);border-top:1px solid var(--accent-red)}.cm-warn{color:var(--accent-red);font-family:var(--font-mono);font-size:13px;font-weight:600;animation:pulseWarn 1.5s infinite}`;

const ControversyMode = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.exitRequested = createEvent(this, "exitRequested", 7);
        this.annotationAdded = createEvent(this, "annotationAdded", 7);
        this.active = false;
        this.touches = [];
        this.maxLookback = 3;
        this.selectedIndex = 0;
        this.annotationText = '';
    }
    async resetSelection() {
        this.selectedIndex = 0;
        this.annotationText = '';
    }
    get recentTouches() {
        return [...this.touches].slice(-this.maxLookback).reverse();
    }
    selectTouch(idx) {
        if (idx >= 0 && idx < this.recentTouches.length) {
            this.selectedIndex = idx;
        }
    }
    submitAnnotation() {
        if (!this.annotationText.trim())
            return;
        const touch = this.recentTouches[this.selectedIndex];
        if (touch) {
            this.annotationAdded.emit({ touchId: touch.id, text: this.annotationText.trim() });
            this.annotationText = '';
        }
    }
    formatTs(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString('zh-CN', { hour12: false });
    }
    sideLabel(id) {
        return id === 'left' ? '左方' : '右方';
    }
    typeLabel(t) {
        const m = {
            valid: '有效刺',
            'off-target': '刺偏',
            simultaneous: '同时',
            'no-touch': '无',
        };
        return m[t] || t;
    }
    render() {
        if (!this.active)
            return null;
        const list = this.recentTouches;
        return (h("div", { class: "cm-overlay" }, h("div", { class: "cm-panel" }, h("div", { class: "cm-header" }, h("h2", null, "\u4E89\u8BAE\u56DE\u770B \u00B7 \u4EC5\u5141\u8BB8\u56DE\u770B\u6700\u8FD1 ", this.maxLookback, " \u5251"), h("button", { class: "cm-close", onClick: () => this.exitRequested.emit() }, "\u9000\u51FA (C)")), h("div", { class: "cm-body" }, h("div", { class: "cm-list" }, list.length === 0 && h("div", { class: "cm-empty" }, "\u65E0\u53EF\u56DE\u770B\u52A8\u4F5C"), list.map((t, i) => (h("div", { key: t.id, class: `cm-item ${this.selectedIndex === i ? 'active' : ''}`, onClick: () => this.selectTouch(i) }, h("div", { class: "cm-idx" }, "#", list.length - i), h("div", { class: "cm-main" }, h("div", { class: "cm-side" }, this.sideLabel(t.fencerId)), h("div", { class: "cm-type" }, this.typeLabel(t.type)), h("div", { class: "cm-note" }, t.note || '')), h("div", { class: "cm-time" }, this.formatTs(t.timestamp)))))), h("div", { class: "cm-annotate" }, h("label", null, "\u5BF9\u9009\u4E2D\u52A8\u4F5C\u9644\u6CE8\u8BF4\u660E\uFF1A"), h("textarea", { value: this.annotationText, onInput: (e) => { this.annotationText = e.target.value; }, placeholder: "\u8F93\u5165\u6539\u5224\u6216\u4E89\u8BAE\u8BF4\u660E...", rows: 4 }), h("button", { class: "cm-submit", onClick: () => this.submitAnnotation() }, "\u63D0\u4EA4\u9644\u6CE8"))), h("div", { class: "cm-footer" }, h("span", { class: "cm-warn" }, "\u26A0 \u5C4F\u5E55\u5DF2\u51BB\u7ED3\uFF0C\u9664\u56DE\u770B\u4E0E\u9644\u6CE8\u5916\u5176\u4F59\u64CD\u4F5C\u88AB\u7981\u7528")))));
    }
};
ControversyMode.style = controversyModeCss();

export { ControversyMode as C };
//# sourceMappingURL=controversy-mode-CfrsaW2O.js.map

//# sourceMappingURL=controversy-mode-CfrsaW2O.js.map