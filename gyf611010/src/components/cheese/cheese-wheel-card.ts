import { LitElement, html, css } from 'lit';
import { property, customElement, eventOptions } from 'lit/decorators.js';
import type { CheeseWheel } from '../../types/index';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '../common/status-badge.js';

@customElement('cheese-wheel-card')
export class CheeseWheelCard extends LitElement {
  @property({ type: Object })
  wheel: CheeseWheel | null = null;

  @property({ type: Boolean })
  isSelected = false;

  static override styles = css`
    :host {
      display: block;
      cursor: pointer;
    }

    sl-card {
      --sl-color-neutral-0: var(--bg, #fff);
      overflow: hidden;
      border-radius: 8px;
      box-shadow: var(--shadow, rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px);
      transition: all 0.25s ease;
      border: 2px solid transparent;
    }

    :host([is-selected]) sl-card,
    sl-card:hover {
      border-color: var(--accent, #D4A574);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(212, 165, 116, 0.25);
    }

    .card-header {
      background: linear-gradient(135deg, #F5DEB3 0%, #D4A574 50%, #8B5A2B 100%);
      padding: 16px 20px;
      position: relative;
    }

    .card-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
        radial-gradient(circle at 60% 70%, rgba(139, 90, 43, 0.3) 3px, transparent 3px),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.25) 2px, transparent 2px),
        radial-gradient(circle at 40% 80%, rgba(139, 90, 43, 0.25) 2px, transparent 2px);
      background-size: 30px 30px, 40px 40px, 35px 35px, 28px 28px;
      pointer-events: none;
    }

    .header-content {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .wheel-number {
      font-size: 20px;
      font-weight: 600;
      color: #4A3728;
      font-family: var(--heading, system-ui);
      letter-spacing: 0.5px;
    }

    .card-body {
      padding: 16px 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 11px;
      color: var(--text, #6b6375);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 500;
    }

    .info-value {
      font-size: 14px;
      color: var(--text-h, #08060d);
      font-weight: 500;
    }

    .progress-section {
      margin-bottom: 14px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .progress-title {
      font-size: 12px;
      color: var(--text, #6b6375);
      font-weight: 500;
    }

    .progress-percent {
      font-size: 12px;
      color: var(--text-h, #08060d);
      font-weight: 600;
    }

    sl-progress-bar {
      --sl-color-primary-600: #D4A574;
      --height: 8px;
      --track-color: #F5E6D3;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid var(--border, #e5e4e7);
    }

    .temperature-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .temp-icon {
      width: 16px;
      height: 16px;
      color: #D4A574;
    }

    .current-temp {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-h, #08060d);
    }

    .temp-range {
      font-size: 12px;
      color: var(--text, #6b6375);
    }
  `;

  private calculateMaturationProgress(): number {
    if (!this.wheel) return 0;
    const entryTime = new Date(this.wheel.entryTime).getTime();
    const targetTime = new Date(this.wheel.targetMaturationTime).getTime();
    const now = Date.now();
    const totalHours = (targetTime - entryTime) / (1000 * 60 * 60);
    const elapsedHours = (now - entryTime) / (1000 * 60 * 60);
    if (totalHours <= 0) return 0;
    return Math.min(Math.max((elapsedHours / totalHours) * 100, 0), 100);
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getCurrentTemperature(): number | null {
    if (!this.wheel || !this.wheel.temperatureHistory || this.wheel.temperatureHistory.length === 0) {
      return null;
    }
    const sorted = [...this.wheel.temperatureHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted[0].temperature;
  }

  @eventOptions({ passive: true })
  private handleClick() {
    if (this.wheel) {
      this.dispatchEvent(
        new CustomEvent('wheel-selected', {
          detail: { wheel: this.wheel },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  override render() {
    if (!this.wheel) {
      return html`<sl-card>
        <div class="card-body" style="text-align: center; color: var(--text);">暂无数据</div>
      </sl-card>`;
    }

    const progress = this.calculateMaturationProgress();
    const currentTemp = this.getCurrentTemperature();
    const [minTemp, maxTemp] = this.wheel.targetTempRange;

    return html`
      <sl-card @click=${this.handleClick}>
        <div slot="header" class="card-header">
          <div class="header-content">
            <span class="wheel-number">${this.wheel.wheelNumber}</span>
            <status-badge status=${this.wheel.status}></status-badge>
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">窖位号</span>
              <span class="info-value">${this.wheel.cellarPositionId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">酵母批次</span>
              <span class="info-value">${this.wheel.yeastBatchId}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="info-label">入窖时间</span>
              <span class="info-value">${this.formatDate(this.wheel.entryTime)}</span>
            </div>
          </div>

          <div class="progress-section">
            <div class="progress-label">
              <span class="progress-title">熟成进度</span>
              <span class="progress-percent">${progress.toFixed(1)}%</span>
            </div>
            <sl-progress-bar value=${progress}></sl-progress-bar>
          </div>

          <div class="footer-row">
            <div class="temperature-info">
              <svg class="temp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
              </svg>
              ${currentTemp !== null
                ? html`<span class="current-temp">${currentTemp.toFixed(1)}°C</span>`
                : html`<span class="current-temp" style="color: var(--text);">--</span>`
              }
              <span class="temp-range">(${minTemp}°C ~ ${maxTemp}°C)</span>
            </div>
          </div>
        </div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cheese-wheel-card': CheeseWheelCard;
  }
}
