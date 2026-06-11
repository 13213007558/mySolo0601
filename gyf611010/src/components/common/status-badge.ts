import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

type StatusType = 'valid' | 'interrupted' | 'forged' | 'maturing' | 'ready' | 'shipped';

const statusMap: Record<StatusType, { label: string; variant: string; color: string }> = {
  valid: { label: '有效', variant: 'success', color: 'var(--success)' },
  ready: { label: '就绪', variant: 'success', color: 'var(--success)' },
  maturing: { label: '成熟中', variant: 'primary', color: 'var(--info, #1565C0)' },
  interrupted: { label: '已中断', variant: 'warning', color: 'var(--warning)' },
  forged: { label: '已伪造', variant: 'danger', color: 'var(--danger)' },
  shipped: { label: '已发货', variant: 'neutral', color: 'var(--neutral, #6B7280)' },
};

@customElement('status-badge')
export class StatusBadge extends LitElement {
  @property({ type: String })
  status: StatusType = 'valid';

  static override styles = css`
    :host {
      --primary: #D4A574;
      --success: #2E7D32;
      --warning: #FF8F00;
      --danger: #C62828;

      display: inline-block;
    }

    sl-badge {
      --sl-color-primary-600: var(--info, #1565C0);
      --sl-color-success-600: var(--success);
      --sl-color-warning-600: var(--warning);
      --sl-color-danger-600: var(--danger);
      --sl-color-neutral-600: var(--neutral, #6B7280);
      font-size: 12px;
      font-weight: 500;
      text-transform: none;
    }
  `;

  private getStatusConfig() {
    return statusMap[this.status] || statusMap.valid;
  }

  override render() {
    const config = this.getStatusConfig();
    return html`
      <sl-badge variant="${config.variant}" pulse="${this.status === 'forged'}">
        ${config.label}
      </sl-badge>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'status-badge': StatusBadge;
  }
}
