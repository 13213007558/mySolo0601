import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

@customElement('probe-guide-step')
export class ProbeGuideStep extends LitElement {
  @property({ type: Number })
  step: number = 1;

  @property({ type: String })
  title: string = '';

  @property({ type: String })
  description: string = '';

  @property({ type: Boolean })
  isActive: boolean = false;

  @property({ type: Boolean })
  isCompleted: boolean = false;

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .step-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: #ffffff;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .step-card:hover:not(.inactive) {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(74, 55, 40, 0.15);
    }

    .step-card.active {
      border-color: #D4A574;
      background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);
      box-shadow: 0 4px 20px rgba(212, 165, 116, 0.25);
    }

    .step-card.completed {
      border-color: rgba(34, 197, 94, 0.3);
      background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    }

    .step-card.inactive {
      opacity: 0.6;
      cursor: default;
    }

    .step-circle {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #e8dcc8;
      color: #8B7355;
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 18px;
      font-weight: 700;
      transition: all 0.3s ease;
    }

    .active .step-circle {
      background: #D4A574;
      color: #ffffff;
      box-shadow: 0 2px 12px rgba(212, 165, 116, 0.5);
      transform: scale(1.05);
    }

    .completed .step-circle {
      background: #22c55e;
      color: #ffffff;
      box-shadow: 0 2px 12px rgba(34, 197, 94, 0.4);
    }

    .step-circle sl-icon {
      font-size: 22px;
    }

    .step-content {
      flex: 1;
      min-width: 0;
    }

    .step-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 16px;
      font-weight: 600;
      color: #4A3728;
      margin: 0 0 6px 0;
      transition: color 0.3s ease;
    }

    .active .step-title {
      color: #8B5A2B;
    }

    .completed .step-title {
      color: #16a34a;
    }

    .step-description {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 14px;
      color: #8B7355;
      margin: 0;
      line-height: 1.5;
    }

    .step-status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 12px;
      font-weight: 500;
      color: #D4A574;
    }

    .active .step-status {
      color: #D4A574;
    }

    .completed .step-status {
      color: #22c55e;
    }

    .step-status sl-icon {
      font-size: 14px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #D4A574;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.5;
        transform: scale(1.2);
      }
    }

    .complete-button {
      margin-top: 12px;
      padding: 8px 16px;
      background: #D4A574;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .complete-button:hover {
      background: #C4956A;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(212, 165, 116, 0.4);
    }

    .complete-button:active {
      transform: translateY(0);
    }

    .completed .complete-button {
      display: none;
    }
  `;

  private handleClick() {
    if (this.isActive && !this.isCompleted) {
      this.dispatchEvent(new CustomEvent('step-complete', {
        bubbles: true,
        composed: true,
        detail: { step: this.step }
      }));
    }
  }

  render() {
    const cardClasses = [
      'step-card',
      this.isActive ? 'active' : '',
      this.isCompleted ? 'completed' : '',
      !this.isActive && !this.isCompleted ? 'inactive' : ''
    ].filter(Boolean).join(' ');

    return html`
      <div class=${cardClasses} @click=${this.handleClick}>
        <div class="step-circle">
          ${this.isCompleted
            ? html`<sl-icon name="check-lg"></sl-icon>`
            : html`<span>${this.step}</span>`
          }
        </div>

        <div class="step-content">
          <h4 class="step-title">${this.title}</h4>
          <p class="step-description">${this.description}</p>

          ${this.isActive && !this.isCompleted
            ? html`
                <div class="step-status">
                  <span class="pulse-dot"></span>
                  <span>进行中</span>
                </div>
                <button class="complete-button" type="button">
                  标记完成
                </button>
              `
            : this.isCompleted
              ? html`
                  <div class="step-status">
                    <sl-icon name="check-circle-fill"></sl-icon>
                    <span>已完成</span>
                  </div>
                `
              : ''
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'probe-guide-step': ProbeGuideStep;
  }

  interface ProbeGuideStepEventMap {
    'step-complete': CustomEvent<{ step: number }>;
  }

  interface HTMLElementEventMap extends ProbeGuideStepEventMap {}
}
