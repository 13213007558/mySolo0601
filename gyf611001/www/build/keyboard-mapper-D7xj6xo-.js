import { r as registerInstance, d as createEvent, h } from './index-CGJi_we2.js';

const DEFAULT_KEYBOARD_MAP = {
    F1: 'LEFT_VALID',
    F2: 'RIGHT_VALID',
    F3: 'LEFT_OFFTARGET',
    F4: 'RIGHT_OFFTARGET',
    F5: 'SIMULTANEOUS',
    F6: 'NO_TOUCH',
    F7: 'LEFT_YELLOW',
    F8: 'RIGHT_YELLOW',
    F9: 'LEFT_RED',
    F10: 'RIGHT_RED',
    F11: 'LEFT_BLACK',
    F12: 'RIGHT_BLACK',
    Backspace: 'UNDO_LAST',
    Space: 'PAUSE_PERIOD',
    KeyB: 'START_BREAK',
    KeyC: 'CONTROVERSY_TOGGLE',
    KeyE: 'REQUEST_SCORE_EDIT',
    KeyS: 'SEAL_BOUT',
};

const keyboardMapperCss = () => `:host{display:block;width:100%}.km-wrapper{padding:12px 16px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px}.km-status{display:flex;align-items:center;gap:12px;font-family:var(--font-mono);font-size:16px;padding:8px 12px;background:var(--bg-tertiary);border-radius:6px;border:1px solid transparent;transition:all 0.12s ease}.km-status[data-active='true']{border-color:var(--accent-green);box-shadow:var(--glow-green)}.km-key{color:var(--accent-green);font-weight:700;min-width:60px}.km-arrow{color:var(--text-muted)}.km-action{color:var(--text-primary);font-weight:600}.km-hint{margin-top:10px;display:flex;flex-wrap:wrap;gap:10px 16px;font-size:12px;color:var(--text-muted);font-family:var(--font-mono)}`;

const KeyboardMapper = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.actionFired = createEvent(this, "actionFired", 7);
        this.mapping = DEFAULT_KEYBOARD_MAP;
        this.disabled = false;
        this.lastKey = '';
        this.lastAction = null;
    }
    handleKeyDown(ev) {
        if (this.disabled)
            return;
        if (ev.repeat)
            return;
        const key = this.normalizeKey(ev);
        const action = this.mapping[key];
        if (action) {
            ev.preventDefault();
            ev.stopPropagation();
            this.lastKey = key;
            this.lastAction = action;
            this.actionFired.emit(action);
            setTimeout(() => {
                this.lastAction = null;
            }, 150);
        }
    }
    normalizeKey(ev) {
        if (ev.key.startsWith('F') && /^F\d{1,2}$/.test(ev.key)) {
            return ev.key;
        }
        if (ev.code) {
            if (ev.code === 'Space')
                return 'Space';
            if (ev.code === 'Backspace')
                return 'Backspace';
            if (ev.code.startsWith('Key'))
                return ev.code;
        }
        return ev.key;
    }
    render() {
        return (h("div", { key: '27273f980f2badb0223d76bf030ad1ce7e0b02b9', class: "km-wrapper" }, h("div", { key: '4a27cf791bd6a33f60f0e3f57123d4a0e89574af', class: "km-status", "data-active": this.lastAction ? 'true' : 'false' }, h("span", { key: 'd9e14e2f32eb09467379726a75310f61a7e8a228', class: "km-key" }, this.lastKey || '—'), h("span", { key: '6c5cbd1dbdbd94139c0042c8db1e0867349ec10e', class: "km-arrow" }, "\u2192"), h("span", { key: 'e6c10d92c428463e8530ba0287b742ae50f3a469', class: "km-action" }, this.lastAction || '等待按键...')), h("div", { key: '489fbc5a867d937164de97e8f90981435fca842f', class: "km-hint" }, h("span", { key: '9fbf9037c62db83ef60e75f802ce2b98c3f20bac' }, "F1/F2 \u6709\u6548\u523A"), h("span", { key: 'daed8b5f64be2b9bc1565aa01ca3856fc91fb957' }, "F3/F4 \u65E0\u6548"), h("span", { key: 'c93c06a482be3ce48ea3b076e44fdb143f990e45' }, "F5 \u540C\u65F6"), h("span", { key: '6d13be1cd0c759371a593826564397f20d1c20ba' }, "F6 \u65E0"), h("span", { key: '4c8fc4fbbd75b9cc7c9a5c95d7f91c74185589de' }, "F7/F8 \u9EC4\u724C"), h("span", { key: 'efe6641e1e452d0fdf0df348f15da5991ff163f3' }, "F9/F10 \u7EA2\u724C"), h("span", { key: '25980abfabe8853cc1ebf6600eadef2965abf5ef' }, "F11/F12 \u9ED1\u724C"))));
    }
};
KeyboardMapper.style = keyboardMapperCss();

export { DEFAULT_KEYBOARD_MAP as D, KeyboardMapper as K };
//# sourceMappingURL=keyboard-mapper-D7xj6xo-.js.map

//# sourceMappingURL=keyboard-mapper-D7xj6xo-.js.map