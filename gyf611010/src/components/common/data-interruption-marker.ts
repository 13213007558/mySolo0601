import { LitElement, html, css } from 'lit';
import { property, customElement, eventOptions } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('data-interruption-marker')
export class DataInterruptionMarker extends LitElement {
  @property({ type: Date })
  startTime: Date = new Date();

  @property({ type: Date })
  endTime: Date | null = null;

  @property({ type: Boolean })
  isResolved = false;

  static override styles = css`
    :host {
      --primary: #D4A574;
      --success: #2E7D32;
      --warning: #FF8F00;
      --danger: #C62828;

      display: block;
    }

    .marker {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--code-bg, #f4f3ec);
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .marker.unresolved {
      border-color: var(--danger);
      background: rgba(198, 40, 40, 0.1);
    }

    .marker.resolved {
      border-color: var(--success);
      background: rgba(46, 125, 50, 0.1);
    }

    .icon-wrapper {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--warning);
    }

    .marker.resolved .icon-wrapper {
      background: var(--success);
    }

    sl-icon {
      font-size: 24px;
      color: white;
    }

    .marker.unresolved sl-icon {
      animation: pulse 1.5s infinite;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .title {
      font-weight: 600;
      color: var(--text-h, #08060d);
      margin-bottom: 4px;
    }

    .marker.unresolved .title {
      color: var(--danger);
    }

    .marker.resolved .title {
      color: var(--success);
    }

    .time-range {
      font-size: 14px;
      color: var(--text, #6b6375);
      margin-bottom: 4px;
    }

    .duration {
      font-size: 13px;
      color: var(--text, #6b6375);
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .actions {
      flex-shrink: 0;
    }

    sl-button {
      --sl-color-primary-600: var(--success);
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }
  `;

  private formatDate(date: Date): string {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private calculateDuration(): string {
    const end = this.endTime || new Date();
    const diffMs = end.getTime() - this.startTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`);

    return parts.join('');
  }

  private handleResolve() {
    if (!this.isResolved) {
      this.dispatchEvent(new CustomEvent('resolve', {
        bubbles: true,
        composed: true,
        detail: {
          startTime: this.startTime,
          endTime: new Date(),
        },
      }));
    }
  }

  @eventOptions({ passive: true })
  override render() {
    const iconName = this.isResolved ? 'check-circle' : 'exclamation-triangle';
    const title = this.isResolved ? '数据中断已解决' : '数据中断警告';
    const endTimeStr = this.endTime ? this.formatDate(this.endTime) : '进行中';

    return html`
      <div class="marker ${this.isResolved ? 'resolved' : 'unresolved'}">
        <div class="icon-wrapper">
          <sl-icon name="${iconName}"></sl-icon>
        </div>
        <div class="content">
          <div class="title">${title}</div>
          <div class="time-range">
            ${this.formatDate(this.startTime)} → ${endTimeStr}
          </div>
          <div class="duration">
            持续时长: ${this.calculateDuration()}
          </div>
        </div>
        ${!this.isResolved ? html`
          <div class="actions">
            <sl-button variant="primary" size="small" @click="${this.handleResolve}">
              标记为已解决
            </sl-button>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-interruption-marker': DataInterruptionMarker;
  }
}
