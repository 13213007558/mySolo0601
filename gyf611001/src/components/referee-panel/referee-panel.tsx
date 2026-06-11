import { Component, State, h, Element, Listen } from '@stencil/core';
import { BoutState, BoutConfig, TouchRecord, CardRecord, KeyboardAction } from '../../utils/types';
import { uid, speakCard } from '../../utils/helpers';

const DEFAULT_CONFIG: BoutConfig = {
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

@Component({
  tag: 'referee-panel',
  styleUrl: 'referee-panel.css',
  shadow: true,
})
export class RefereePanel {
  @Element() el: HTMLElement;

  @State() state: BoutState = {
    config: { ...DEFAULT_CONFIG },
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

  @State() showBreakFullscreen: boolean = false;
  @State() showPinDialog: boolean = false;
  @State() pendingEditAction: (() => void) | null = null;
  @State() showScoreEdit: boolean = false;
  @State() editLeft: number = 0;
  @State() editRight: number = 0;

  private clockInterval: any = null;

  componentWillLoad() {
    this.syncFromCache();
  }

  disconnectedCallback() {
    this.stopClock();
  }

  private syncFromCache() {
    const cache = document.querySelector('offline-cache');
    if (cache && this.state.config?.id) {
      (cache as any).loadBout(this.state.config.id).then((s: any) => {
        if (s) {
          this.state = s;
          this.editLeft = this.state.config.leftFencer.score;
          this.editRight = this.state.config.rightFencer.score;
        }
      });
    }
  }

  private persistCache() {
    const cache = document.querySelector('offline-cache');
    if (cache) {
      (cache as any).saveBout(this.state.config.id, this.state);
    }
  }

  private startClock() {
    if (this.state.isBreak) return;
    if (this.clockInterval) return;
    this.state = { ...this.state, isPaused: false };
    this.clockInterval = setInterval(() => {
      if (this.state.periodTimeRemaining > 0) {
        this.state = { ...this.state, periodTimeRemaining: this.state.periodTimeRemaining - 1 };
      } else {
        this.stopClock();
        this.state = { ...this.state, isPaused: true };
      }
    }, 1000);
  }

  private stopClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  private togglePause() {
    if (this.state.isBreak) return;
    if (this.state.isPaused) {
      this.startClock();
    } else {
      this.stopClock();
      this.state = { ...this.state, isPaused: true };
    }
  }

  private addTouch(side: 'left' | 'right', type: TouchRecord['type'], light: TouchRecord['lightColor']) {
    if (this.state.isControversy || this.state.isSealed || this.state.isBreak) return;
    const record: TouchRecord = {
      id: uid(),
      timestamp: Date.now(),
      fencerId: side,
      type,
      lightColor: light,
    };
    const newState = { ...this.state };
    newState.touches = [...this.state.touches, record];
    if (type === 'valid') {
      if (side === 'left') {
        newState.config = {
          ...this.state.config,
          leftFencer: { ...this.state.config.leftFencer, score: this.state.config.leftFencer.score + 1 },
        };
      } else {
        newState.config = {
          ...this.state.config,
          rightFencer: { ...this.state.config.rightFencer, score: this.state.config.rightFencer.score + 1 },
        };
      }
    }
    this.state = newState;
    this.editLeft = newState.config.leftFencer.score;
    this.editRight = newState.config.rightFencer.score;
    this.triggerFlash(side === 'left' ? 'left' : 'right');
    this.persistCache();
  }

  private addCard(side: 'left' | 'right', type: CardRecord['type']) {
    if (this.state.isControversy || this.state.isSealed) return;
    const record: CardRecord = { id: uid(), timestamp: Date.now(), fencerId: side, type };
    const newState = { ...this.state };
    newState.cards = [...this.state.cards, record];
    const key = type === 'yellow' ? 'yellowCards' : type === 'red' ? 'redCards' : 'blackCard';
    const fencer = side === 'left' ? { ...this.state.config.leftFencer } : { ...this.state.config.rightFencer };
    if (type === 'black') {
      (fencer as any).blackCard = true;
    } else {
      (fencer as any)[key] = (fencer as any)[key] + 1;
    }
    if (side === 'left') {
      newState.config = { ...this.state.config, leftFencer: fencer };
    } else {
      newState.config = { ...this.state.config, rightFencer: fencer };
    }
    this.state = newState;
    this.applyCardUi(side, type);
    speakCard(type, side);
    this.persistCache();
  }

  private undoLast() {
    if (this.state.isControversy || this.state.isSealed) return;
    if (this.state.touches.length === 0) return;
    const lastTouch = this.state.touches[this.state.touches.length - 1];
    const newState = { ...this.state };
    newState.touches = this.state.touches.slice(0, -1);
    if (lastTouch.type === 'valid') {
      if (lastTouch.fencerId === 'left') {
        newState.config = {
          ...this.state.config,
          leftFencer: { ...this.state.config.leftFencer, score: Math.max(0, this.state.config.leftFencer.score - 1) },
        };
      } else {
        newState.config = {
          ...this.state.config,
          rightFencer: { ...this.state.config.rightFencer, score: Math.max(0, this.state.config.rightFencer.score - 1) },
        };
      }
    }
    this.state = newState;
    this.editLeft = newState.config.leftFencer.score;
    this.editRight = newState.config.rightFencer.score;
    this.persistCache();
  }

  private triggerFlash(side: 'left' | 'right' | 'both') {
    const sd = this.el.shadowRoot?.querySelector('score-display') as any;
    if (sd && sd.triggerFlash) sd.triggerFlash(side);
  }

  private applyCardUi(side: 'left' | 'right', type: 'yellow' | 'red' | 'black') {
    const sd = this.el.shadowRoot?.querySelector('score-display') as any;
    if (sd && sd.applyCard) sd.applyCard(side, type);
  }

  @Listen('actionFired')
  onKeyboardAction(ev: CustomEvent<KeyboardAction>) {
    const action = ev.detail;
    if (this.state.isControversy && action !== 'CONTROVERSY_TOGGLE') return;
    switch (action) {
      case 'LEFT_VALID': this.addTouch('left', 'valid', 'green'); break;
      case 'RIGHT_VALID': this.addTouch('right', 'valid', 'green'); break;
      case 'LEFT_OFFTARGET': this.addTouch('left', 'off-target', 'white'); break;
      case 'RIGHT_OFFTARGET': this.addTouch('right', 'off-target', 'white'); break;
      case 'SIMULTANEOUS':
        this.addTouch('left', 'simultaneous', 'red');
        this.addTouch('right', 'simultaneous', 'red');
        break;
      case 'NO_TOUCH': break;
      case 'LEFT_YELLOW': this.addCard('left', 'yellow'); break;
      case 'RIGHT_YELLOW': this.addCard('right', 'yellow'); break;
      case 'LEFT_RED': this.addCard('left', 'red'); break;
      case 'RIGHT_RED': this.addCard('right', 'red'); break;
      case 'LEFT_BLACK': this.addCard('left', 'black'); break;
      case 'RIGHT_BLACK': this.addCard('right', 'black'); break;
      case 'UNDO_LAST': this.undoLast(); break;
      case 'PAUSE_PERIOD': this.togglePause(); break;
      case 'START_BREAK': this.startBreak(); break;
      case 'CONTROVERSY_TOGGLE':
        this.state = { ...this.state, isControversy: !this.state.isControversy };
        break;
      case 'REQUEST_SCORE_EDIT': this.requestScoreEdit(); break;
      case 'SEAL_BOUT': this.sealBout(); break;
    }
  }

  private startBreak() {
    this.showBreakFullscreen = true;
    this.state = { ...this.state, isBreak: true, isPaused: true };
    this.stopClock();
    const cd = this.el.shadowRoot?.querySelector('countdown-timer') as any;
    if (cd) cd.start();
  }

  private onBreakEnded() {
    this.showBreakFullscreen = false;
    this.state = {
      ...this.state,
      isBreak: false,
      currentPeriod: this.state.currentPeriod + 1,
      periodTimeRemaining: this.state.config.periodDuration,
      isPaused: true,
    };
  }

  private requestScoreEdit() {
    this.showScoreEdit = true;
  }

  private onPinValidated() {
    this.showPinDialog = false;
    if (this.pendingEditAction) {
      this.pendingEditAction();
      this.pendingEditAction = null;
    }
  }

  private confirmScoreEdit() {
    this.pendingEditAction = () => {
      const newState = { ...this.state };
      newState.config = {
        ...this.state.config,
        leftFencer: { ...this.state.config.leftFencer, score: this.editLeft },
        rightFencer: { ...this.state.config.rightFencer, score: this.editRight },
      };
      this.state = newState;
      this.showScoreEdit = false;
      this.persistCache();
    };
    this.showPinDialog = true;
  }

  private onAnnotationAdded(ev: CustomEvent<{ touchId: string; text: string }>) {
    const newState = { ...this.state };
    newState.annotations = [
      ...this.state.annotations,
      { touchId: ev.detail.touchId, text: ev.detail.text, by: '裁判组', at: Date.now() },
    ];
    const idx = newState.touches.findIndex(t => t.id === ev.detail.touchId);
    if (idx >= 0) {
      const t = { ...newState.touches[idx], note: ev.detail.text, modified: true };
      newState.touches = [...newState.touches.slice(0, idx), t, ...newState.touches.slice(idx + 1)];
    }
    this.state = newState;
    this.persistCache();
  }

  private sealBout() {
    this.pendingEditAction = () => {
      this.state = { ...this.state, isSealed: true, sealedAt: Date.now(), endedAt: Date.now() };
      this.stopClock();
      const oc = this.el.shadowRoot?.querySelector('offline-cache') as any;
      if (oc && oc.queueUpload) {
        oc.queueUpload({ boutId: this.state.config.id, state: this.state, sealed: true });
      }
      this.persistCache();
    };
    this.showPinDialog = true;
  }

  private onExportUpload() {
    const xe = this.el.shadowRoot?.querySelector('xml-exporter') as any;
    if (xe) {
      xe.boutState = this.state;
      xe.exportAndUpload();
    }
  }

  render() {
    const { config, touches, periodTimeRemaining, isBreak, isPaused, isControversy, isSealed, currentPeriod } = this.state;
    return (
      <div class={`rp-root ${isSealed ? 'sealed' : ''}`}>
        <header class="rp-header">
          <div class="rp-title">花剑裁判判罚席</div>
          <div class="rp-meta">
            <span>{config.competitionName}</span>
            <span>·</span>
            <span>{config.event}</span>
            <span>·</span>
            <span>{config.round}</span>
            <span>·</span>
            <span>剑道 {config.stripNumber}</span>
          </div>
          <div class="rp-status">
            <span class={`rp-dot ${isPaused && !isBreak ? 'yellow' : isBreak ? 'blue' : 'green'}`} />
            <span>{isSealed ? '已封存' : isBreak ? '局间' : isPaused ? '已暂停' : '进行中'}</span>
          </div>
        </header>

        <main class="rp-main">
          <score-display
            leftName={config.leftFencer.name}
            rightName={config.rightFencer.name}
            leftScore={config.leftFencer.score}
            rightScore={config.rightFencer.score}
            leftPriority={config.leftFencer.priority}
            rightPriority={config.rightFencer.priority}
            targetScore={config.targetScore}
            period={currentPeriod}
            timeRemaining={periodTimeRemaining}
          />

          <div class="rp-grid">
            <div class="rp-col">
              <keyboard-mapper disabled={isControversy || isSealed || isBreak} />
              <div class="rp-controls">
                <button class={`btn-flat ${isPaused ? 'btn-primary' : ''}`} onClick={() => this.togglePause()}>
                  {isPaused ? '开始计时 (空格)' : '暂停 (空格)'}
                </button>
                <button class="btn-flat" onClick={() => this.startBreak()}>局间休息 (B)</button>
                <button class="btn-flat" onClick={() => { this.state = { ...this.state, isControversy: !this.state.isControversy }; }}>
                  {isControversy ? '退出争议' : '争议回看 (C)'}
                </button>
                <button class="btn-flat" onClick={() => this.undoLast()}>撤销 (Backspace)</button>
              </div>
              <offline-cache uploadEndpoint="" />
            </div>

            <div class="rp-col">
              <div class="rp-history card">
                <div class="rp-history-title">动作记录（最近 20 条）</div>
                <div class="rp-history-list">
                  {[...touches].slice(-20).reverse().map((t, i) => (
                    <div key={t.id} class="rp-history-item">
                      <span class="rp-hi-idx">#{touches.length - i}</span>
                      <span class={`rp-hi-side ${t.fencerId}`}>{t.fencerId === 'left' ? '左' : '右'}</span>
                      <span class={`rp-hi-type rp-hi-${t.type}`}>
                        {t.type === 'valid' ? '有效' : t.type === 'off-target' ? '偏' : t.type === 'simultaneous' ? '同' : '无'}
                      </span>
                      {t.modified && <span class="rp-hi-note">（已改）</span>}
                    </div>
                  ))}
                  {touches.length === 0 && <div class="rp-history-empty">暂无记录</div>}
                </div>
              </div>

              <div class="rp-edit card">
                <button class="btn-flat" onClick={() => this.requestScoreEdit()} disabled={isSealed}>改分（需双PIN）</button>
                <button class="btn-flat" onClick={() => this.onExportUpload()} disabled={!isSealed}>赛后导出 XML</button>
                <button class="btn-flat btn-primary" onClick={() => this.sealBout()} disabled={isSealed}>封存比赛 (S)</button>
              </div>
            </div>
          </div>
        </main>

        {this.showBreakFullscreen && (
          <countdown-timer
            fullscreen
            initialSeconds={config.breakDuration}
            autoStart
            label="局间休息"
            onTimerEnded={() => this.onBreakEnded()}
          />
        )}
        {!this.showBreakFullscreen && <countdown-timer initialSeconds={config.breakDuration} />}

        <controversy-mode
          active={isControversy}
          touches={touches}
          onExitRequested={() => { this.state = { ...this.state, isControversy: false }; }}
          onAnnotationAdded={(e: any) => this.onAnnotationAdded(e)}
        />

        <pin-validator
          open={this.showPinDialog}
          onValidated={() => this.onPinValidated()}
          onCancelled={() => { this.showPinDialog = false; this.pendingEditAction = null; }}
        />

        {this.showScoreEdit && (
          <div class="rp-edit-overlay">
            <div class="rp-edit-panel card">
              <h3>改分面板（提交时触发双PIN验证）</h3>
              <div class="rp-edit-row">
                <label>左方得分：
                  <input type="number" min="0" value={this.editLeft}
                    onInput={(e: any) => { this.editLeft = parseInt(e.target.value || '0', 10); }} />
                </label>
                <label>右方得分：
                  <input type="number" min="0" value={this.editRight}
                    onInput={(e: any) => { this.editRight = parseInt(e.target.value || '0', 10); }} />
                </label>
              </div>
              <div class="rp-edit-actions">
                <button class="btn-flat" onClick={() => { this.showScoreEdit = false; }}>取消</button>
                <button class="btn-flat btn-primary" onClick={() => this.confirmScoreEdit()}>确认改分</button>
              </div>
              <p class="rp-edit-hint">已封存比赛不可删除记录，只能通过附注说明争议。</p>
            </div>
          </div>
        )}

        <xml-exporter boutState={this.state} />

        {isSealed && (
          <div class="rp-seal-banner">
            <span>🔒 本场比赛已封存 · 记录不可删除，仅可附注</span>
          </div>
        )}
      </div>
    );
  }
}
