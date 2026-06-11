import { r as registerInstance, d as createEvent, h } from './index-CGJi_we2.js';

const pinValidatorCss = () => `:host{display:block}.pv-overlay{position:fixed;inset:0;background:rgba(0, 0, 0, 0.88);display:flex;align-items:center;justify-content:center;z-index:10000;backdrop-filter:blur(6px)}.pv-panel{width:90%;max-width:520px;background:var(--bg-secondary);border:2px solid var(--accent-blue);border-radius:12px;padding:28px 32px;box-shadow:0 0 40px rgba(59, 155, 255, 0.25)}.pv-title{margin:0 0 6px 0;font-size:20px;color:var(--text-primary)}.pv-sub{margin:0 0 24px 0;font-size:13px;color:var(--text-secondary)}.pv-field-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.pv-field{position:relative;padding:14px 14px 12px 14px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;transition:all 0.2s ease}.pv-field.focus{border-color:var(--accent-blue);box-shadow:0 0 12px rgba(59, 155, 255, 0.3)}.pv-field.ok{border-color:var(--accent-green);box-shadow:0 0 12px rgba(0, 255, 136, 0.3)}.pv-field.err{border-color:var(--accent-red);box-shadow:0 0 12px rgba(255, 59, 92, 0.3)}.pv-field label{display:block;font-size:12px;color:var(--text-secondary);margin-bottom:6px;font-family:var(--font-mono);letter-spacing:0.05em}.pv-field input{width:100%;background:transparent;border:none;outline:none;color:var(--text-primary);font-family:var(--font-mono);font-size:22px;letter-spacing:0.3em;padding:0}.pv-ok,.pv-err{position:absolute;top:14px;right:14px;font-size:18px;font-weight:700}.pv-ok{color:var(--accent-green)}.pv-err{color:var(--accent-red)}.pv-error{background:rgba(255, 59, 92, 0.1);color:var(--accent-red);padding:8px 12px;border-radius:6px;font-size:13px;margin-bottom:16px;font-family:var(--font-mono)}.pv-actions{display:flex;justify-content:flex-end;gap:10px}`;

const DEFAULT_ACCOUNTS = [
    { pin: '1111', name: '主裁判' },
    { pin: '2222', name: '副裁判' },
    { pin: '3333', name: '裁判长' },
];
const PinValidator = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.validated = createEvent(this, "validated", 7);
        this.cancelled = createEvent(this, "cancelled", 7);
        this.requiredReferees = 2;
        this.panelTitle = '改分需双裁判 PIN 验证';
        this.accounts = DEFAULT_ACCOUNTS;
        this.open = false;
        this.pin1 = '';
        this.pin2 = '';
        this.pin1Valid = null;
        this.pin2Valid = null;
        this.error = '';
        this.focusedField = 1;
    }
    async reset() {
        this.pin1 = '';
        this.pin2 = '';
        this.pin1Valid = null;
        this.pin2Valid = null;
        this.error = '';
        this.focusedField = 1;
    }
    handlePinInput(field, value) {
        const v = value.replace(/\D/g, '').slice(0, 6);
        if (field === 1) {
            this.pin1 = v;
            if (v.length >= 4) {
                const acc = this.accounts.find(a => a.pin === v);
                this.pin1Valid = !!acc;
                if (acc)
                    this.focusedField = 2;
            }
            else {
                this.pin1Valid = null;
            }
        }
        else {
            this.pin2 = v;
            if (v.length >= 4) {
                const acc = this.accounts.find(a => a.pin === v);
                this.pin2Valid = !!acc;
            }
            else {
                this.pin2Valid = null;
            }
        }
        this.error = '';
    }
    submit() {
        const acc1 = this.accounts.find(a => a.pin === this.pin1);
        const acc2 = this.accounts.find(a => a.pin === this.pin2);
        if (!acc1 || !acc2) {
            this.error = 'PIN 不正确，请重试';
            return;
        }
        if (this.requiredReferees >= 2 && this.pin1 === this.pin2) {
            this.error = '两名裁判需使用不同 PIN';
            return;
        }
        this.validated.emit({
            authorized: true,
            referee1Name: acc1.name,
            referee2Name: acc2.name,
            timestamp: Date.now(),
        });
    }
    cancel() {
        this.cancelled.emit();
        this.reset();
    }
    render() {
        if (!this.open)
            return null;
        return (h("div", { class: "pv-overlay" }, h("div", { class: "pv-panel" }, h("h3", { class: "pv-title" }, this.panelTitle), h("p", { class: "pv-sub" }, "\u9700\u4E24\u540D\u88C1\u5224\u5404\u81EA\u8F93\u5165 PIN \u65B9\u53EF\u6267\u884C\u6539\u5206\u64CD\u4F5C"), h("div", { class: "pv-field-row" }, h("div", { class: `pv-field ${this.focusedField === 1 ? 'focus' : ''} ${this.pin1Valid === true ? 'ok' : ''} ${this.pin1Valid === false ? 'err' : ''}` }, h("label", null, "\u88C1\u5224 1"), h("input", { type: "password", inputmode: "numeric", pattern: "[0-9]*", value: this.pin1, onInput: (e) => this.handlePinInput(1, e.target.value), onFocus: () => { this.focusedField = 1; }, placeholder: "\u8BF7\u8F93\u5165 PIN", maxlength: 6, autoFocus: true }), this.pin1Valid === true && h("span", { class: "pv-ok" }, "\u2713"), this.pin1Valid === false && h("span", { class: "pv-err" }, "\u2715")), h("div", { class: `pv-field ${this.focusedField === 2 ? 'focus' : ''} ${this.pin2Valid === true ? 'ok' : ''} ${this.pin2Valid === false ? 'err' : ''}` }, h("label", null, "\u88C1\u5224 2"), h("input", { type: "password", inputmode: "numeric", pattern: "[0-9]*", value: this.pin2, onInput: (e) => this.handlePinInput(2, e.target.value), onFocus: () => { this.focusedField = 2; }, placeholder: "\u8BF7\u8F93\u5165 PIN", maxlength: 6 }), this.pin2Valid === true && h("span", { class: "pv-ok" }, "\u2713"), this.pin2Valid === false && h("span", { class: "pv-err" }, "\u2715"))), this.error && h("div", { class: "pv-error" }, this.error), h("div", { class: "pv-actions" }, h("button", { class: "btn-flat", onClick: () => this.cancel() }, "\u53D6\u6D88"), h("button", { class: "btn-flat btn-primary", onClick: () => this.submit() }, "\u786E\u8BA4\u6539\u5206")))));
    }
};
PinValidator.style = pinValidatorCss();

export { PinValidator as P };
//# sourceMappingURL=pin-validator-DvXAJVRG.js.map

//# sourceMappingURL=pin-validator-DvXAJVRG.js.map