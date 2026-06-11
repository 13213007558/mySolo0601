import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

@customElement('countdown-timer')
export class CountdownTimer extends LitElement {
  @property({ type: Number })
  accessor remainingSeconds = 0;

  @property({ type: Boolean })
  accessor isRunning = false;

  @property({ type: Number })
  accessor warningThreshold = 60;

  private timer: number | null = null;

  static override styles = css`
    :host {
      --primary: #D4A574;
      --success: #2E7D32;
      --warning: #FF8F00;
      --danger: #C62828;

      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
      font-size: 18px;
      color: var(--text-h, #08060d);
    }

    .timer-display {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 4px;
      background: var(--code-bg, #f4f3ec);
      transition: all 0.3s ease;
    }

    .timer-display.warning {
      color: var(--danger);
      animation: blink 1s infinite;
    }

    sl-icon {
      font-size: 20px;
      color: var(--primary);
    }

    .timer-display.warning sl-icon {
      color: var(--danger);
    }

    .time-text {
      min-width: 60px;
      text-align: center;
    }

    @keyframes blink {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    if (this.isRunning) {
      this.startTimer();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('isRunning')) {
      if (this.isRunning) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timer = window.setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        this.stopTimer();
        this.dispatchEvent(new CustomEvent('timeout', {
          bubbles: true,
          composed: true,
        }));
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  override render() {
    const isWarning = this.remainingSeconds <= this.warningThreshold;
    return html`
      <div class="timer-display ${isWarning ? 'warning' : ''}">
        <sl-icon name="clock"></sl-icon>
        <span class="time-text">${this.formatTime(this.remainingSeconds)}</span>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'countdown-timer': CountdownTimer;
  }
}
