import { r as registerInstance, h } from './index-CGJi_we2.js';
import { a as speakScore } from './helpers-ksbpMhqy.js';

const scoreDisplayCss = () => `:host{display:block;width:100%}.sd-root{background:linear-gradient(180deg, var(--bg-secondary), var(--bg-primary));border:1px solid var(--border-color);border-radius:12px;padding:20px 28px}.sd-topbar{display:flex;align-items:center;justify-content:space-between;font-family:var(--font-mono);font-size:14px;color:var(--text-secondary);margin-bottom:16px}.sd-clock{font-size:28px;color:var(--text-primary);font-weight:700;padding:4px 16px;background:var(--bg-tertiary);border-radius:6px;letter-spacing:0.05em}.sd-scorerow{display:grid;grid-template-columns:1fr auto 1fr;gap:24px;align-items:center}.sd-side{background:var(--bg-card);border:2px solid var(--border-color);border-radius:10px;padding:20px;text-align:center;transition:all 0.3s ease}.sd-side.flash{border-color:var(--accent-green);box-shadow:var(--glow-green);animation:hitFlash 0.3s ease-out}.sd-side.right{text-align:center}.sd-name{font-size:20px;font-weight:600;margin-bottom:12px;color:var(--text-primary);display:flex;justify-content:center;align-items:center;gap:8px}.sd-prio{color:var(--accent-red);font-size:14px}.sd-score{font-size:96px;line-height:1;font-weight:800;color:var(--text-primary);margin-bottom:16px}.sd-vs{font-size:32px;color:var(--text-muted);font-weight:700}.sd-cards{display:flex;justify-content:center;gap:8px}.sd-cards span{width:28px;height:28px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:transparent;background:var(--bg-tertiary);border:1px solid var(--border-color);transition:all 0.2s ease}.card-yellow.on{background:var(--accent-yellow);color:#000;box-shadow:var(--glow-yellow)}.card-red.on{background:var(--accent-red);color:#fff;box-shadow:var(--glow-red)}.card-black.on{background:#000;color:#fff;border-color:var(--text-primary)}@keyframes hitFlash{0%{box-shadow:0 0 40px rgba(0, 255, 136, 0.8), 0 0 80px rgba(0, 255, 136, 0.4);border-color:var(--accent-green)}100%{box-shadow:none;border-color:var(--accent-green-dim)}}`;

const ScoreDisplay = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
        this.leftName = '左方';
        this.rightName = '右方';
        this.leftScore = 0;
        this.rightScore = 0;
        this.targetScore = 15;
        this.period = 1;
        this.timeRemaining = 180;
        this.leftPriority = false;
        this.rightPriority = false;
        this.flashLeft = false;
        this.flashRight = false;
        this.cardLeftYellow = 0;
        this.cardLeftRed = 0;
        this.cardLeftBlack = false;
        this.cardRightYellow = 0;
        this.cardRightRed = 0;
        this.cardRightBlack = false;
        this.prevLeft = 0;
        this.prevRight = 0;
    }
    componentWillLoad() {
        this.prevLeft = this.leftScore;
        this.prevRight = this.rightScore;
    }
    onLeftChange(newVal, oldVal) {
        if (newVal > oldVal) {
            this.triggerFlash('left');
        }
        this.prevLeft = newVal;
    }
    onRightChange(newVal, oldVal) {
        if (newVal > oldVal) {
            this.triggerFlash('right');
        }
        this.prevRight = newVal;
    }
    async triggerFlash(side) {
        if (side === 'left' || side === 'both') {
            this.flashLeft = true;
            setTimeout(() => { this.flashLeft = false; }, 300);
        }
        if (side === 'right' || side === 'both') {
            this.flashRight = true;
            setTimeout(() => { this.flashRight = false; }, 300);
        }
        speakScore(this.leftScore, this.rightScore);
    }
    async applyCard(side, type) {
        if (side === 'left') {
            if (type === 'yellow')
                this.cardLeftYellow++;
            else if (type === 'red')
                this.cardLeftRed++;
            else
                this.cardLeftBlack = true;
        }
        else {
            if (type === 'yellow')
                this.cardRightYellow++;
            else if (type === 'red')
                this.cardRightRed++;
            else
                this.cardRightBlack = true;
        }
    }
    formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    render() {
        return (h("div", { key: 'b29ade015e53f7b11c3c3ca254a0f7557c88d567', class: "sd-root" }, h("div", { key: '69acb952c8191aa67eb2b48ee0ca39ef2ee9658f', class: "sd-topbar" }, h("div", { key: 'c186220add16b25f9960bdd53e1ee4301d2f2e48', class: "sd-period" }, "\u7B2C ", this.period, " \u5C40"), h("div", { key: 'b35192aa144c0513d1d67e414dab93ddde5fc5f1', class: "sd-clock score-digit" }, this.formatTime(this.timeRemaining)), h("div", { key: 'ba001219ded14fdd25c25953e29d69c14ca0a576', class: "sd-target" }, "\u76EE\u6807 ", this.targetScore)), h("div", { key: '9a657a11a97d1e71762c7be13f6fad0e849a7d63', class: "sd-scorerow" }, h("div", { key: '91c3be5702a7de8e43b7804f32a4e04bbe0f803c', class: `sd-side left ${this.flashLeft ? 'flash' : ''}` }, h("div", { key: 'b19c66449043b4083855d9784b5e236f335e5c3b', class: "sd-name" }, this.leftName, this.leftPriority && h("span", { key: 'fcb4c7a722da0de2ed541d9830a61039771606b4', class: "sd-prio" }, "\u25CF")), h("div", { key: '045568ffda2cc684d25de56f2dc117c1c19b1acd', class: "sd-score score-digit" }, this.leftScore), h("div", { key: '171fdef827da2ff1edd4bdda2e64e080019b53fe', class: "sd-cards" }, h("span", { key: '121f42bf8c6830fda09e38a0818d9b6ab1c88a12', class: `card-yellow ${this.cardLeftYellow > 0 ? 'on' : ''}` }, this.cardLeftYellow || ''), h("span", { key: 'e028c4b303ae2454413b1a310490d9ca4353b402', class: `card-red ${this.cardLeftRed > 0 ? 'on' : ''}` }, this.cardLeftRed || ''), h("span", { key: '3525cd1269a3e36e1a0b13da7893c8fbdd216e64', class: `card-black ${this.cardLeftBlack ? 'on' : ''}` }, this.cardLeftBlack ? '✕' : ''))), h("div", { key: '5644adc184ab54c9d6899dd2ad44e5fbd04448ba', class: "sd-vs score-digit" }, "VS"), h("div", { key: '3dc2f2a58654a86f27ebcd8de9ae40e505dc6461', class: `sd-side right ${this.flashRight ? 'flash' : ''}` }, h("div", { key: '3e2e65e870927b5caa0985e668a171265da951e7', class: "sd-name" }, this.rightPriority && h("span", { key: '718b20aaacc9dda154d9f527d927ad404c781ae1', class: "sd-prio" }, "\u25CF"), this.rightName), h("div", { key: '0c901b3dfec44b817514310e8f54d77a593d318c', class: "sd-score score-digit" }, this.rightScore), h("div", { key: 'affa1ac8b894643f411babe95982584f5d0cd7bf', class: "sd-cards" }, h("span", { key: '858a976f1f0c753d85b2cdf06cbbc22940a5055d', class: `card-yellow ${this.cardRightYellow > 0 ? 'on' : ''}` }, this.cardRightYellow || ''), h("span", { key: '672780ed86ac76246a1395544cf418f222bed9a6', class: `card-red ${this.cardRightRed > 0 ? 'on' : ''}` }, this.cardRightRed || ''), h("span", { key: '020bc4ab473fc5b8f91fe9189c85fb99638a3743', class: `card-black ${this.cardRightBlack ? 'on' : ''}` }, this.cardRightBlack ? '✕' : ''))))));
    }
    static get watchers() { return {
        "leftScore": [{
                "onLeftChange": 0
            }],
        "rightScore": [{
                "onRightChange": 0
            }]
    }; }
};
ScoreDisplay.style = scoreDisplayCss();

export { ScoreDisplay as S };
//# sourceMappingURL=score-display-CrzNZk8v.js.map

//# sourceMappingURL=score-display-CrzNZk8v.js.map