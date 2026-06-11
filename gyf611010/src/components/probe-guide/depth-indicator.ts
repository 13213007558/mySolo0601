import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import type { ProbeGuideState } from '../../types/index';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

@customElement('depth-indicator')
export class DepthIndicator extends LitElement {
  @property({ type: Number })
  currentDepth: ProbeGuideState['currentDepth'] = 0;

  @property({ type: Number })
  targetDepth: ProbeGuideState['targetDepth'] = 30;

  @property({ type: Number })
  currentStep: ProbeGuideState['currentStep'] = 1;

  @property({ type: Number })
  totalSteps: ProbeGuideState['totalSteps'] = 5;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 280px;
      margin: 0 auto;
    }

    .container {
      background: linear-gradient(135deg, #fff8f0 0%, #f5e6d3 100%);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(74, 55, 40, 0.15);
      border: 1px solid rgba(212, 165, 116, 0.3);
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
    }

    .title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 18px;
      font-weight: 600;
      color: #4A3728;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 13px;
      color: #8B7355;
      margin: 0;
    }

    .depth-display {
      display: flex;
      justify-content: center;
      align-items: baseline;
      gap: 8px;
      margin: 16px 0;
    }

    .current-depth {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 48px;
      font-weight: 700;
      color: #D4A574;
      line-height: 1;
      transition: color 0.3s ease;
    }

    .target-depth {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 16px;
      color: #8B7355;
    }

    .unit {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 20px;
      color: #8B7355;
      font-weight: 500;
    }

    .progress-container {
      margin: 20px 0;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(212, 165, 116, 0.3);
    }

    .step-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #D4A574;
      color: #ffffff;
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(212, 165, 116, 0.4);
    }

    .step-text {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 14px;
      color: #4A3728;
      font-weight: 500;
    }

    .step-total {
      color: #8B7355;
      font-weight: 400;
    }

    .confirmation-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 20px;
      background: rgba(34, 197, 94, 0.15);
      border: 2px solid #22c55e;
      border-radius: 12px;
      color: #16a34a;
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 14px;
      font-weight: 600;
    }

    .confirmation-badge sl-icon {
      font-size: 20px;
    }

    @keyframes confirmPulse {
      0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
      }
      70% {
        transform: scale(1.02);
        box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
      }
      100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
      }
    }

    .completed .current-depth {
      color: #22c55e;
    }

    .completed .confirmation-badge {
      animation: confirmPulse 0.8s ease-out;
    }

    sl-progress-bar::part(base) {
      height: 12px;
      border-radius: 6px;
      background: rgba(74, 55, 40, 0.1);
    }

    sl-progress-bar::part(indicator) {
      border-radius: 6px;
      background: linear-gradient(90deg, #D4A574 0%, #C4956A 100%);
      transition: width 0.5s ease-in-out;
    }

    .completed sl-progress-bar::part(indicator) {
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
    }
  `;

  private get progressPercentage(): number {
    if (this.targetDepth <= 0) return 0;
    return Math.min((this.currentDepth / this.targetDepth) * 100, 100);
  }

  private get isCompleted(): boolean {
    return this.currentDepth >= this.targetDepth && this.targetDepth > 0;
  }

  render() {
    const percentage = this.progressPercentage;
    const completed = this.isCompleted;

    return html`
      <div class="container ${completed ? 'completed' : ''}">
        <div class="header">
          <h3 class="title">探针深度</h3>
          <p class="subtitle">实时监控插入深度</p>
        </div>

        <div class="depth-display">
          <span class="current-depth">${this.currentDepth.toFixed(1)}</span>
          <span class="unit">cm</span>
          <span class="target-depth">/ ${this.targetDepth} cm</span>
        </div>

        <div class="progress-container">
          <sl-progress-bar
            value=${percentage}
            label="深度进度"
          >
            <span slot="label">${percentage.toFixed(0)}%</span>
          </sl-progress-bar>
        </div>

        <div class="step-indicator">
          <div class="step-badge">${this.currentStep}</div>
          <span class="step-text">
            步骤 <span class="step-total">/ ${this.totalSteps}</span>
          </span>
        </div>

        ${completed
          ? html`
              <div class="confirmation-badge">
                <sl-icon name="check-circle-fill"></sl-icon>
                <span>已达到目标深度</span>
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'depth-indicator': DepthIndicator;
  }
}
