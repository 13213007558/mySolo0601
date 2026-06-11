import { Component, Prop, State, Watch, h, Method } from '@stencil/core';
import { speakScore } from '../../utils/helpers';

@Component({
  tag: 'score-display',
  styleUrl: 'score-display.css',
  shadow: true,
})
export class ScoreDisplay {
  @Prop() leftName: string = '左方';
  @Prop() rightName: string = '右方';
  @Prop() leftScore: number = 0;
  @Prop() rightScore: number = 0;
  @Prop() targetScore: number = 15;
  @Prop() period: number = 1;
  @Prop() timeRemaining: number = 180;
  @Prop() leftPriority: boolean = false;
  @Prop() rightPriority: boolean = false;

  @State() flashLeft: boolean = false;
  @State() flashRight: boolean = false;
  @State() cardLeftYellow: number = 0;
  @State() cardLeftRed: number = 0;
  @State() cardLeftBlack: boolean = false;
  @State() cardRightYellow: number = 0;
  @State() cardRightRed: number = 0;
  @State() cardRightBlack: boolean = false;

  private prevLeft: number = 0;
  private prevRight: number = 0;

  componentWillLoad() {
    this.prevLeft = this.leftScore;
    this.prevRight = this.rightScore;
  }

  @Watch('leftScore')
  onLeftChange(newVal: number, oldVal: number) {
    if (newVal > oldVal) {
      this.triggerFlash('left');
    }
    this.prevLeft = newVal;
  }

  @Watch('rightScore')
  onRightChange(newVal: number, oldVal: number) {
    if (newVal > oldVal) {
      this.triggerFlash('right');
    }
    this.prevRight = newVal;
  }

  @Method()
  async triggerFlash(side: 'left' | 'right' | 'both') {
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

  @Method()
  async applyCard(side: 'left' | 'right', type: 'yellow' | 'red' | 'black') {
    if (side === 'left') {
      if (type === 'yellow') this.cardLeftYellow++;
      else if (type === 'red') this.cardLeftRed++;
      else this.cardLeftBlack = true;
    } else {
      if (type === 'yellow') this.cardRightYellow++;
      else if (type === 'red') this.cardRightRed++;
      else this.cardRightBlack = true;
    }
  }

  private formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  render() {
    return (
      <div class="sd-root">
        <div class="sd-topbar">
          <div class="sd-period">第 {this.period} 局</div>
          <div class="sd-clock score-digit">{this.formatTime(this.timeRemaining)}</div>
          <div class="sd-target">目标 {this.targetScore}</div>
        </div>

        <div class="sd-scorerow">
          <div class={`sd-side left ${this.flashLeft ? 'flash' : ''}`}>
            <div class="sd-name">
              {this.leftName}
              {this.leftPriority && <span class="sd-prio">●</span>}
            </div>
            <div class="sd-score score-digit">{this.leftScore}</div>
            <div class="sd-cards">
              <span class={`card-yellow ${this.cardLeftYellow > 0 ? 'on' : ''}`}>{this.cardLeftYellow || ''}</span>
              <span class={`card-red ${this.cardLeftRed > 0 ? 'on' : ''}`}>{this.cardLeftRed || ''}</span>
              <span class={`card-black ${this.cardLeftBlack ? 'on' : ''}`}>{this.cardLeftBlack ? '✕' : ''}</span>
            </div>
          </div>

          <div class="sd-vs score-digit">VS</div>

          <div class={`sd-side right ${this.flashRight ? 'flash' : ''}`}>
            <div class="sd-name">
              {this.rightPriority && <span class="sd-prio">●</span>}
              {this.rightName}
            </div>
            <div class="sd-score score-digit">{this.rightScore}</div>
            <div class="sd-cards">
              <span class={`card-yellow ${this.cardRightYellow > 0 ? 'on' : ''}`}>{this.cardRightYellow || ''}</span>
              <span class={`card-red ${this.cardRightRed > 0 ? 'on' : ''}`}>{this.cardRightRed || ''}</span>
              <span class={`card-black ${this.cardRightBlack ? 'on' : ''}`}>{this.cardRightBlack ? '✕' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
