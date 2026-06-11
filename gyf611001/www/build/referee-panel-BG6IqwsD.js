import { r as registerInstance, h, a as getElement } from './index-CGJi_we2.js';
import { u as uid, s as speakCard } from './helpers-ksbpMhqy.js';

const refereePanelCss = () => `:host{display:block;width:100%;min-height:100vh;background:var(--bg-primary);color:var(--text-primary)}.rp-root{display:flex;flex-direction:column;min-height:100vh;padding:16px 24px;gap:16px}.rp-root.sealed{border-top:3px solid var(--accent-red)}.rp-header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px}.rp-title{font-size:18px;font-weight:700;letter-spacing:0.08em;color:var(--text-primary)}.rp-meta{display:flex;gap:10px;font-family:var(--font-mono);font-size:13px;color:var(--text-secondary)}.rp-status{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:13px;font-weight:600}.rp-dot{width:10px;height:10px;border-radius:50%}.rp-dot.green{background:var(--accent-green);box-shadow:0 0 8px var(--accent-green)}.rp-dot.yellow{background:var(--accent-yellow);box-shadow:0 0 8px var(--accent-yellow);animation:pulseWarn 1.5s infinite}.rp-dot.blue{background:var(--accent-blue);box-shadow:0 0 8px var(--accent-blue)}.rp-main{display:flex;flex-direction:column;gap:16px;flex:1}.rp-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.rp-col{display:flex;flex-direction:column;gap:12px}.rp-controls{display:flex;flex-wrap:wrap;gap:10px;padding:12px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px}.rp-history{padding:14px 16px;display:flex;flex-direction:column;gap:10px}.rp-history-title{font-size:14px;font-weight:600;color:var(--text-primary);font-family:var(--font-mono)}.rp-history-list{display:flex;flex-direction:column;gap:6px;max-height:320px;overflow-y:auto}.rp-history-item{display:flex;align-items:center;gap:12px;padding:8px 10px;background:var(--bg-tertiary);border-radius:6px;font-family:var(--font-mono);font-size:13px}.rp-hi-idx{color:var(--text-muted);min-width:40px}.rp-hi-side.left{color:var(--accent-blue);font-weight:700}.rp-hi-side.right{color:var(--accent-red);font-weight:700}.rp-hi-type{padding:2px 8px;border-radius:4px;font-weight:600}.rp-hi-valid{background:rgba(0, 255, 136, 0.15);color:var(--accent-green)}.rp-hi-off-target{background:rgba(255, 255, 255, 0.08);color:var(--text-secondary)}.rp-hi-simultaneous{background:rgba(255, 204, 0, 0.1);color:var(--accent-yellow)}.rp-hi-no-touch{color:var(--text-muted)}.rp-hi-note{color:var(--accent-yellow);font-size:12px}.rp-history-empty{padding:30px;text-align:center;color:var(--text-muted);font-family:var(--font-mono);font-size:13px}.rp-edit{padding:14px 16px;display:flex;flex-wrap:wrap;gap:10px}.rp-edit-overlay{position:fixed;inset:0;background:rgba(0, 0, 0, 0.85);z-index:9000;display:flex;align-items:center;justify-content:center}.rp-edit-panel{width:90%;max-width:480px;padding:24px;display:flex;flex-direction:column;gap:16px}.rp-edit-panel h3{margin:0;font-size:18px}.rp-edit-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.rp-edit-row label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text-secondary);font-family:var(--font-mono)}.rp-edit-row input{padding:10px 12px;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);font-family:var(--font-mono);font-size:20px;text-align:center;outline:none}.rp-edit-row input:focus{border-color:var(--accent-green)}.rp-edit-actions{display:flex;justify-content:flex-end;gap:10px}.rp-edit-hint{margin:0;font-size:12px;color:var(--text-muted);font-family:var(--font-mono);padding:8px 0;border-top:1px solid var(--border-color)}.rp-seal-banner{position:fixed;bottom:0;left:0;right:0;padding:12px;background:rgba(255, 59, 92, 0.12);border-top:2px solid var(--accent-red);color:var(--accent-red);text-align:center;font-family:var(--font-mono);font-weight:700;z-index:500}`;

const DEFAULT_CONFIG = {
    id: uid(),
    competitionName: '示例锦标赛',
    event: '男子花剑个人',
    round: '决赛',
    stripNumber: 1,
    targetScore: 15,
    periodDuration: 180,
    breakDuration: 45,
    leftFencer: { id: 'L1', name: '选手 A', score: 0, redCards: 0, yellowCards: 0, blackCard: false },
    rightFencer: { id: 'R1', name: '选手 B', score: 0, redCards: 0, yellowCards: 0, blackCard: false },
    referee1Name: '主裁判',
    referee2Name: '副裁判',
};
const RefereePanel = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.state = {
            config: Object.assign({}, DEFAULT_CONFIG),
            currentPeriod: 1,
            periodTimeRemaining: DEFAULT_CONFIG.periodDuration,
            breakTimeRemaining: DEFAULT_CONFIG.breakDuration,
            isBreak: false,
            isPaused: true,
            isControversy: false,
            isSealed: false,
            touches: [],
            cards: [],
            annotations: [],
        };
        this.showBreakFullscreen = false;
        this.showPinDialog = false;
        this.pendingEditAction = null;
        this.showScoreEdit = false;
        this.editLeft = 0;
        this.editRight = 0;
        this.clockInterval = null;
    }
    componentWillLoad() {
        this.syncFromCache();
    }
    disconnectedCallback() {
        this.stopClock();
    }
    syncFromCache() {
        var _a;
        const cache = document.querySelector('offline-cache');
        if (cache && ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.id)) {
            cache.loadBout(this.state.config.id).then((s) => {
                if (s) {
                    this.state = s;
                    this.editLeft = this.state.config.leftFencer.score;
                    this.editRight = this.state.config.rightFencer.score;
                }
            });
        }
    }
    persistCache() {
        const cache = document.querySelector('offline-cache');
        if (cache) {
            cache.saveBout(this.state.config.id, this.state);
        }
    }
    startClock() {
        if (this.state.isBreak)
            return;
        if (this.clockInterval)
            return;
        this.state = Object.assign(Object.assign({}, this.state), { isPaused: false });
        this.clockInterval = setInterval(() => {
            if (this.state.periodTimeRemaining > 0) {
                this.state = Object.assign(Object.assign({}, this.state), { periodTimeRemaining: this.state.periodTimeRemaining - 1 });
            }
            else {
                this.stopClock();
                this.state = Object.assign(Object.assign({}, this.state), { isPaused: true });
            }
        }, 1000);
    }
    stopClock() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
    }
    togglePause() {
        if (this.state.isBreak)
            return;
        if (this.state.isPaused) {
            this.startClock();
        }
        else {
            this.stopClock();
            this.state = Object.assign(Object.assign({}, this.state), { isPaused: true });
        }
    }
    addTouch(side, type, light) {
        if (this.state.isControversy || this.state.isSealed || this.state.isBreak)
            return;
        const record = {
            id: uid(),
            timestamp: Date.now(),
            fencerId: side,
            type,
            lightColor: light,
        };
        const newState = Object.assign({}, this.state);
        newState.touches = [...this.state.touches, record];
        if (type === 'valid') {
            if (side === 'left') {
                newState.config = Object.assign(Object.assign({}, this.state.config), { leftFencer: Object.assign(Object.assign({}, this.state.config.leftFencer), { score: this.state.config.leftFencer.score + 1 }) });
            }
            else {
                newState.config = Object.assign(Object.assign({}, this.state.config), { rightFencer: Object.assign(Object.assign({}, this.state.config.rightFencer), { score: this.state.config.rightFencer.score + 1 }) });
            }
        }
        this.state = newState;
        this.editLeft = newState.config.leftFencer.score;
        this.editRight = newState.config.rightFencer.score;
        this.triggerFlash(side === 'left' ? 'left' : 'right');
        this.persistCache();
    }
    addCard(side, type) {
        if (this.state.isControversy || this.state.isSealed)
            return;
        const record = { id: uid(), timestamp: Date.now(), fencerId: side, type };
        const newState = Object.assign({}, this.state);
        newState.cards = [...this.state.cards, record];
        const key = type === 'yellow' ? 'yellowCards' : type === 'red' ? 'redCards' : 'blackCard';
        const fencer = side === 'left' ? Object.assign({}, this.state.config.leftFencer) : Object.assign({}, this.state.config.rightFencer);
        if (type === 'black') {
            fencer.blackCard = true;
        }
        else {
            fencer[key] = fencer[key] + 1;
        }
        if (side === 'left') {
            newState.config = Object.assign(Object.assign({}, this.state.config), { leftFencer: fencer });
        }
        else {
            newState.config = Object.assign(Object.assign({}, this.state.config), { rightFencer: fencer });
        }
        this.state = newState;
        this.applyCardUi(side, type);
        speakCard(type, side);
        this.persistCache();
    }
    undoLast() {
        if (this.state.isControversy || this.state.isSealed)
            return;
        if (this.state.touches.length === 0)
            return;
        const lastTouch = this.state.touches[this.state.touches.length - 1];
        const newState = Object.assign({}, this.state);
        newState.touches = this.state.touches.slice(0, -1);
        if (lastTouch.type === 'valid') {
            if (lastTouch.fencerId === 'left') {
                newState.config = Object.assign(Object.assign({}, this.state.config), { leftFencer: Object.assign(Object.assign({}, this.state.config.leftFencer), { score: Math.max(0, this.state.config.leftFencer.score - 1) }) });
            }
            else {
                newState.config = Object.assign(Object.assign({}, this.state.config), { rightFencer: Object.assign(Object.assign({}, this.state.config.rightFencer), { score: Math.max(0, this.state.config.rightFencer.score - 1) }) });
            }
        }
        this.state = newState;
        this.editLeft = newState.config.leftFencer.score;
        this.editRight = newState.config.rightFencer.score;
        this.persistCache();
    }
    triggerFlash(side) {
        var _a;
        const sd = (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('score-display');
        if (sd && sd.triggerFlash)
            sd.triggerFlash(side);
    }
    applyCardUi(side, type) {
        var _a;
        const sd = (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('score-display');
        if (sd && sd.applyCard)
            sd.applyCard(side, type);
    }
    onKeyboardAction(ev) {
        const action = ev.detail;
        if (this.state.isControversy && action !== 'CONTROVERSY_TOGGLE')
            return;
        switch (action) {
            case 'LEFT_VALID':
                this.addTouch('left', 'valid', 'green');
                break;
            case 'RIGHT_VALID':
                this.addTouch('right', 'valid', 'green');
                break;
            case 'LEFT_OFFTARGET':
                this.addTouch('left', 'off-target', 'white');
                break;
            case 'RIGHT_OFFTARGET':
                this.addTouch('right', 'off-target', 'white');
                break;
            case 'SIMULTANEOUS':
                this.addTouch('left', 'simultaneous', 'red');
                this.addTouch('right', 'simultaneous', 'red');
                break;
            case 'NO_TOUCH': break;
            case 'LEFT_YELLOW':
                this.addCard('left', 'yellow');
                break;
            case 'RIGHT_YELLOW':
                this.addCard('right', 'yellow');
                break;
            case 'LEFT_RED':
                this.addCard('left', 'red');
                break;
            case 'RIGHT_RED':
                this.addCard('right', 'red');
                break;
            case 'LEFT_BLACK':
                this.addCard('left', 'black');
                break;
            case 'RIGHT_BLACK':
                this.addCard('right', 'black');
                break;
            case 'UNDO_LAST':
                this.undoLast();
                break;
            case 'PAUSE_PERIOD':
                this.togglePause();
                break;
            case 'START_BREAK':
                this.startBreak();
                break;
            case 'CONTROVERSY_TOGGLE':
                this.state = Object.assign(Object.assign({}, this.state), { isControversy: !this.state.isControversy });
                break;
            case 'REQUEST_SCORE_EDIT':
                this.requestScoreEdit();
                break;
            case 'SEAL_BOUT':
                this.sealBout();
                break;
        }
    }
    startBreak() {
        var _a;
        this.showBreakFullscreen = true;
        this.state = Object.assign(Object.assign({}, this.state), { isBreak: true, isPaused: true });
        this.stopClock();
        const cd = (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('countdown-timer');
        if (cd)
            cd.start();
    }
    onBreakEnded() {
        this.showBreakFullscreen = false;
        this.state = Object.assign(Object.assign({}, this.state), { isBreak: false, currentPeriod: this.state.currentPeriod + 1, periodTimeRemaining: this.state.config.periodDuration, isPaused: true });
    }
    requestScoreEdit() {
        this.showScoreEdit = true;
    }
    onPinValidated() {
        this.showPinDialog = false;
        if (this.pendingEditAction) {
            this.pendingEditAction();
            this.pendingEditAction = null;
        }
    }
    confirmScoreEdit() {
        this.pendingEditAction = () => {
            const newState = Object.assign({}, this.state);
            newState.config = Object.assign(Object.assign({}, this.state.config), { leftFencer: Object.assign(Object.assign({}, this.state.config.leftFencer), { score: this.editLeft }), rightFencer: Object.assign(Object.assign({}, this.state.config.rightFencer), { score: this.editRight }) });
            this.state = newState;
            this.showScoreEdit = false;
            this.persistCache();
        };
        this.showPinDialog = true;
    }
    onAnnotationAdded(ev) {
        const newState = Object.assign({}, this.state);
        newState.annotations = [
            ...this.state.annotations,
            { touchId: ev.detail.touchId, text: ev.detail.text, by: '裁判组', at: Date.now() },
        ];
        const idx = newState.touches.findIndex(t => t.id === ev.detail.touchId);
        if (idx >= 0) {
            const t = Object.assign(Object.assign({}, newState.touches[idx]), { note: ev.detail.text, modified: true });
            newState.touches = [...newState.touches.slice(0, idx), t, ...newState.touches.slice(idx + 1)];
        }
        this.state = newState;
        this.persistCache();
    }
    sealBout() {
        this.pendingEditAction = () => {
            var _a;
            this.state = Object.assign(Object.assign({}, this.state), { isSealed: true, sealedAt: Date.now(), endedAt: Date.now() });
            this.stopClock();
            const oc = (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('offline-cache');
            if (oc && oc.queueUpload) {
                oc.queueUpload({ boutId: this.state.config.id, state: this.state, sealed: true });
            }
            this.persistCache();
        };
        this.showPinDialog = true;
    }
    onExportUpload() {
        var _a;
        const xe = (_a = this.el.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('xml-exporter');
        if (xe) {
            xe.boutState = this.state;
            xe.exportAndUpload();
        }
    }
    render() {
        const { config, touches, periodTimeRemaining, isBreak, isPaused, isControversy, isSealed, currentPeriod } = this.state;
        return (h("div", { key: '353af68d0f613419360e8a3fcd3db1efd2695203', class: `rp-root ${isSealed ? 'sealed' : ''}` }, h("header", { key: '51da0306c5e62b063b1684da119d8fcf2ba09a42', class: "rp-header" }, h("div", { key: '1c01e375a0ef1d2f35c94a8f8e90ae5f77ba27d7', class: "rp-title" }, "\u82B1\u5251\u88C1\u5224\u5224\u7F5A\u5E2D"), h("div", { key: '650bcdce3dcd2132e10d9d92545c5d581deae67f', class: "rp-meta" }, h("span", { key: 'f53fa2df018656eee812d8f62529ed6ea2247b9b' }, config.competitionName), h("span", { key: '5116592694184e1b7bbf006d2ddbd61467ee88be' }, "\u00B7"), h("span", { key: '691db838384b206e50339c2f10c52b82fd211ee6' }, config.event), h("span", { key: 'b2dc2e05af489ccaf39d2a5f458ab7707a725775' }, "\u00B7"), h("span", { key: 'de09f38a99773eedb5b4109ea2c8494dfc54f2f0' }, config.round), h("span", { key: 'c6c0a752c68878b215149564e0627abc71d33c98' }, "\u00B7"), h("span", { key: 'c3581c216a71249338323075e96fc6835a0ac279' }, "\u5251\u9053 ", config.stripNumber)), h("div", { key: 'a20c9fd3083d2f5d6acb47a788cda1fcf6529330', class: "rp-status" }, h("span", { key: '4da530da0d0855a60d8af5a4e87274b522ff215a', class: `rp-dot ${isPaused && !isBreak ? 'yellow' : isBreak ? 'blue' : 'green'}` }), h("span", { key: '8d68ded10b5d0c7f109a89325645b8465f32e132' }, isSealed ? '已封存' : isBreak ? '局间' : isPaused ? '已暂停' : '进行中'))), h("main", { key: 'd0ccfa5ca31d7919b9bcf55a0f003390b08df5a8', class: "rp-main" }, h("score-display", { key: '789d70ceaaaf17cfea5a24750f9b8494397629ad', leftName: config.leftFencer.name, rightName: config.rightFencer.name, leftScore: config.leftFencer.score, rightScore: config.rightFencer.score, leftPriority: config.leftFencer.priority, rightPriority: config.rightFencer.priority, targetScore: config.targetScore, period: currentPeriod, timeRemaining: periodTimeRemaining }), h("div", { key: '360430edeabc8219e5c8585b33aaaa010d8938f2', class: "rp-grid" }, h("div", { key: 'b5e3a1cac60e607a7e019370da101ef5572f9114', class: "rp-col" }, h("keyboard-mapper", { key: '933bda6d8f2dbb5ede7b8acbaffcd08f7ec9077a', disabled: isControversy || isSealed || isBreak }), h("div", { key: '27deaf3a39e83d630b5dff610d7d9687fc764f2c', class: "rp-controls" }, h("button", { key: '9e11e326ef036a9470f3f27c725f118d16bb88d1', class: `btn-flat ${isPaused ? 'btn-primary' : ''}`, onClick: () => this.togglePause() }, isPaused ? '开始计时 (空格)' : '暂停 (空格)'), h("button", { key: 'c63b8e20331ca05afde79add77640e5dd2f9beb1', class: "btn-flat", onClick: () => this.startBreak() }, "\u5C40\u95F4\u4F11\u606F (B)"), h("button", { key: '536c963ccba89c5ab8e04fbc204dcb421a8c1b53', class: "btn-flat", onClick: () => { this.state = Object.assign(Object.assign({}, this.state), { isControversy: !this.state.isControversy }); } }, isControversy ? '退出争议' : '争议回看 (C)'), h("button", { key: '42044035d7c2835fada7e623e8d3c1f2f23cb1e8', class: "btn-flat", onClick: () => this.undoLast() }, "\u64A4\u9500 (Backspace)")), h("offline-cache", { key: '880946df9adf18f1be43f925035ee541ad082d20', uploadEndpoint: "" })), h("div", { key: '8307f0ed632804e91b50b8afa10aa51ca5171ab6', class: "rp-col" }, h("div", { key: '17b30a4b693cd382b432fae664530fcea06f5d5c', class: "rp-history card" }, h("div", { key: '09e420b979c5384fd7b31505b4d2ffc54b1bc2db', class: "rp-history-title" }, "\u52A8\u4F5C\u8BB0\u5F55\uFF08\u6700\u8FD1 20 \u6761\uFF09"), h("div", { key: 'b35622a49fc9605b7de72405c29a4f3f58bfd5db', class: "rp-history-list" }, [...touches].slice(-20).reverse().map((t, i) => (h("div", { key: t.id, class: "rp-history-item" }, h("span", { class: "rp-hi-idx" }, "#", touches.length - i), h("span", { class: `rp-hi-side ${t.fencerId}` }, t.fencerId === 'left' ? '左' : '右'), h("span", { class: `rp-hi-type rp-hi-${t.type}` }, t.type === 'valid' ? '有效' : t.type === 'off-target' ? '偏' : t.type === 'simultaneous' ? '同' : '无'), t.modified && h("span", { class: "rp-hi-note" }, "\uFF08\u5DF2\u6539\uFF09")))), touches.length === 0 && h("div", { key: '47db4a25c5487c955232dbcb50ed6be3a443ea46', class: "rp-history-empty" }, "\u6682\u65E0\u8BB0\u5F55"))), h("div", { key: 'f78395a24605190b240b76760e891f27851ff379', class: "rp-edit card" }, h("button", { key: '7526cfebee98b975773a4ce1fb49d0e7043e2125', class: "btn-flat", onClick: () => this.requestScoreEdit(), disabled: isSealed }, "\u6539\u5206\uFF08\u9700\u53CCPIN\uFF09"), h("button", { key: 'f130ce786dfc7da72d39e04e9cf22292ee6b3608', class: "btn-flat", onClick: () => this.onExportUpload(), disabled: !isSealed }, "\u8D5B\u540E\u5BFC\u51FA XML"), h("button", { key: '086293af34ab37c2799a672f5d86f102b35a1233', class: "btn-flat btn-primary", onClick: () => this.sealBout(), disabled: isSealed }, "\u5C01\u5B58\u6BD4\u8D5B (S)"))))), this.showBreakFullscreen && (h("countdown-timer", { key: 'cb3eb0330f3e29c7df4de89f10ad388c65d57574', fullscreen: true, initialSeconds: config.breakDuration, autoStart: true, label: "\u5C40\u95F4\u4F11\u606F", onTimerEnded: () => this.onBreakEnded() })), !this.showBreakFullscreen && h("countdown-timer", { key: '08fecb5cf8cdff30db00ce4a5f4dc4a4cc954843', initialSeconds: config.breakDuration }), h("controversy-mode", { key: '61fe41d8b4cfe27a5841580814e2f01b1a8cb325', active: isControversy, touches: touches, onExitRequested: () => { this.state = Object.assign(Object.assign({}, this.state), { isControversy: false }); }, onAnnotationAdded: (e) => this.onAnnotationAdded(e) }), h("pin-validator", { key: 'c4d592d1d29240650fee0a96b9580df991276023', open: this.showPinDialog, onValidated: () => this.onPinValidated(), onCancelled: () => { this.showPinDialog = false; this.pendingEditAction = null; } }), this.showScoreEdit && (h("div", { key: '7e756cecf2ac401e14be75e8ea70abb1978a2543', class: "rp-edit-overlay" }, h("div", { key: '26a5a3aaec774c3dda25aba4bf1700f776305f9e', class: "rp-edit-panel card" }, h("h3", { key: 'd5a8c08d74ba4e5dffe994f82f09be18f9b226ad' }, "\u6539\u5206\u9762\u677F\uFF08\u63D0\u4EA4\u65F6\u89E6\u53D1\u53CCPIN\u9A8C\u8BC1\uFF09"), h("div", { key: '279988c8fe6aa4365d36045cec6487833c18dae7', class: "rp-edit-row" }, h("label", { key: 'd5d9b8c839203306f7c49abf6f69117001ee5e1f' }, "\u5DE6\u65B9\u5F97\u5206\uFF1A", h("input", { key: '245595694dcb9f878c401be624c52995a847b05f', type: "number", min: "0", value: this.editLeft, onInput: (e) => { this.editLeft = parseInt(e.target.value || '0', 10); } })), h("label", { key: '1098ede23be0eba85b9d5d3fd9ce73987847cd7d' }, "\u53F3\u65B9\u5F97\u5206\uFF1A", h("input", { key: '25c989d54c3bb2e0e18302d52036ca37a4a0f3da', type: "number", min: "0", value: this.editRight, onInput: (e) => { this.editRight = parseInt(e.target.value || '0', 10); } }))), h("div", { key: '006cc470f4827e1fb44dc53179948d636a091fe3', class: "rp-edit-actions" }, h("button", { key: '999c5ea6f47eae935037093e0ffa0935650f22d3', class: "btn-flat", onClick: () => { this.showScoreEdit = false; } }, "\u53D6\u6D88"), h("button", { key: '88bc855ac2a5a71ad9d13ce44645b9eec8c1d41e', class: "btn-flat btn-primary", onClick: () => this.confirmScoreEdit() }, "\u786E\u8BA4\u6539\u5206")), h("p", { key: '59343b8763404a2390783bf89b462f0d448d2005', class: "rp-edit-hint" }, "\u5DF2\u5C01\u5B58\u6BD4\u8D5B\u4E0D\u53EF\u5220\u9664\u8BB0\u5F55\uFF0C\u53EA\u80FD\u901A\u8FC7\u9644\u6CE8\u8BF4\u660E\u4E89\u8BAE\u3002")))), h("xml-exporter", { key: '2ce39be7ee4208417c7fef34f01f88c7885d8c4e', boutState: this.state }), isSealed && (h("div", { key: '07c3fc484dd07a9b862055ebecdedb21091fbaad', class: "rp-seal-banner" }, h("span", { key: '92d4fcb5a90484bf2a0dd411c5648e03608416d1' }, "\uD83D\uDD12 \u672C\u573A\u6BD4\u8D5B\u5DF2\u5C01\u5B58 \u00B7 \u8BB0\u5F55\u4E0D\u53EF\u5220\u9664\uFF0C\u4EC5\u53EF\u9644\u6CE8")))));
    }
    get el() { return getElement(this); }
};
RefereePanel.style = refereePanelCss();

export { RefereePanel as R };
//# sourceMappingURL=referee-panel-BG6IqwsD.js.map

//# sourceMappingURL=referee-panel-BG6IqwsD.js.map