import { r as registerInstance, d as createEvent, h } from './index-CGJi_we2.js';
import { f as formatTime } from './helpers-ksbpMhqy.js';

const countdownTimerCss = () => `:host{display:block}.ct-root{background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:10px;padding:20px;text-align:center;transition:all 0.3s ease}.ct-root.fullscreen{position:fixed;inset:0;z-index:8888;border:none;border-radius:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;background:radial-gradient(ellipse at center, #1a1a1a 0%, #0a0a0a 100%)}.ct-label{font-size:24px;color:var(--text-secondary);font-weight:500;letter-spacing:0.3em;text-transform:uppercase}.ct-root.fullscreen .ct-label{font-size:48px;color:var(--accent-blue);letter-spacing:0.5em}.ct-time{font-size:72px;font-weight:800;color:var(--text-primary);letter-spacing:0.02em}.ct-root.fullscreen .ct-time{font-size:240px;color:var(--text-primary);text-shadow:0 0 60px rgba(59, 155, 255, 0.4)}.ct-root.urgent .ct-time{color:var(--accent-red);animation:pulseWarn 1s infinite}.ct-root.fullscreen.urgent .ct-time{text-shadow:0 0 80px rgba(255, 59, 92, 0.6)}.ct-controls{margin-top:16px;display:flex;justify-content:center;gap:12px}`;

const CountdownTimer = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.timerEnded = createEvent(this, "timerEnded", 7);
        this.timerTick = createEvent(this, "timerTick", 7);
        this.initialSeconds = 45;
        this.fullscreen = false;
        this.autoStart = false;
        this.label = '局间休息';
        this.remaining = 45;
        this.running = false;
        this.intervalId = null;
    }
    componentWillLoad() {
        this.remaining = this.initialSeconds;
        if (this.autoStart) {
            this.start();
        }
    }
    disconnectedCallback() {
        this.clearTimer();
    }
    onInitialChange(val) {
        if (!this.running) {
            this.remaining = val;
        }
    }
    async start() {
        if (this.running)
            return;
        this.running = true;
        this.clearTimer();
        this.intervalId = setInterval(() => {
            if (this.remaining > 0) {
                this.remaining--;
                this.timerTick.emit(this.remaining);
            }
            else {
                this.clearTimer();
                this.running = false;
                this.timerEnded.emit();
            }
        }, 1000);
    }
    async pause() {
        this.clearTimer();
        this.running = false;
    }
    async reset() {
        this.clearTimer();
        this.running = false;
        this.remaining = this.initialSeconds;
    }
    clearTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    render() {
        const isUrgent = this.remaining <= 10;
        return (h("div", { key: '98f5fe58ae305bfb1d014df6dfc27a73af2e33c4', class: `ct-root ${this.fullscreen ? 'fullscreen' : ''} ${isUrgent ? 'urgent' : ''}` }, h("div", { key: '3a25abb8e83244a7444d2c9e5fd88b6779b509f8', class: "ct-label" }, this.label), h("div", { key: '3fb4370386f5148f06cf3d85a645f6f439669d92', class: "ct-time score-digit" }, formatTime(this.remaining)), !this.fullscreen && (h("div", { key: '5ef5b47fbe67c7795ba410000646229f75f21499', class: "ct-controls" }, !this.running ? (h("button", { class: "btn-primary btn-flat", onClick: () => this.start() }, "\u5F00\u59CB")) : (h("button", { class: "btn-flat", onClick: () => this.pause() }, "\u6682\u505C")), h("button", { key: '997e7737d5845b85d137e1cd4f7c187ee6da6ce2', class: "btn-flat", onClick: () => this.reset() }, "\u91CD\u7F6E")))));
    }
    static get watchers() { return {
        "initialSeconds": [{
                "onInitialChange": 0
            }]
    }; }
};
CountdownTimer.style = countdownTimerCss();

export { CountdownTimer as C };
//# sourceMappingURL=countdown-timer-Ddc0TeSu.js.map

//# sourceMappingURL=countdown-timer-Ddc0TeSu.js.map