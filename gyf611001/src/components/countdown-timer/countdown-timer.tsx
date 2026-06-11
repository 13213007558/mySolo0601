import { Component, Prop, State, Event, EventEmitter, h, Method, Watch } from '@stencil/core';
import { formatTime } from '../../utils/helpers';

@Component({
  tag: 'countdown-timer',
  styleUrl: 'countdown-timer.css',
  shadow: true,
})
export class CountdownTimer {
  @Prop() initialSeconds: number = 45;
  @Prop() fullscreen: boolean = false;
  @Prop() autoStart: boolean = false;
  @Prop() label: string = '局间休息';
  @Event() timerEnded: EventEmitter<void>;
  @Event() timerTick: EventEmitter<number>;
  @State() remaining: number = 45;
  @State() running: boolean = false;
  private intervalId: any = null;

  componentWillLoad() {
    this.remaining = this.initialSeconds;
    if (this.autoStart) {
      this.start();
    }
  }

  disconnectedCallback() {
    this.clearTimer();
  }

  @Watch('initialSeconds')
  onInitialChange(val: number) {
    if (!this.running) {
      this.remaining = val;
    }
  }

  @Method()
  async start() {
    if (this.running) return;
    this.running = true;
    this.clearTimer();
    this.intervalId = setInterval(() => {
      if (this.remaining > 0) {
        this.remaining--;
        this.timerTick.emit(this.remaining);
      } else {
        this.clearTimer();
        this.running = false;
        this.timerEnded.emit();
      }
    }, 1000);
  }

  @Method()
  async pause() {
    this.clearTimer();
    this.running = false;
  }

  @Method()
  async reset() {
    this.clearTimer();
    this.running = false;
    this.remaining = this.initialSeconds;
  }

  private clearTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  render() {
    const isUrgent = this.remaining <= 10;
    return (
      <div class={`ct-root ${this.fullscreen ? 'fullscreen' : ''} ${isUrgent ? 'urgent' : ''}`}>
        <div class="ct-label">{this.label}</div>
        <div class="ct-time score-digit">{formatTime(this.remaining)}</div>
        {!this.fullscreen && (
          <div class="ct-controls">
            {!this.running ? (
              <button class="btn-primary btn-flat" onClick={() => this.start()}>开始</button>
            ) : (
              <button class="btn-flat" onClick={() => this.pause()}>暂停</button>
            )}
            <button class="btn-flat" onClick={() => this.reset()}>重置</button>
          </div>
        )}
      </div>
    );
  }
}
