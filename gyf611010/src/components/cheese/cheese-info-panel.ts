import { LitElement, html, css } from 'lit';
import { property, customElement, eventOptions, state } from 'lit/decorators.js';
import type { CheeseWheel, CellarPosition, YeastBatch, AnomalyEvent, TemperaturePoint } from '../../types/index';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '../common/status-badge.js';

@customElement('cheese-info-panel')
export class CheeseInfoPanel extends LitElement {
  @property({ type: Object })
  wheel: CheeseWheel | null = null;

  @property({ type: Array })
  cellarPositions: CellarPosition[] = [];

  @property({ type: Array })
  yeastBatches: YeastBatch[] = [];

  @state()
  private selectedCellarPositionId: string = '';

  @state()
  private selectedYeastBatchId: string = '';

  static override styles = css`
    :host {
      display: block;
    }

    sl-card {
      --sl-color-neutral-0: var(--bg, #fff);
      border-radius: 8px;
      box-shadow: var(--shadow, rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px);
    }

    .card-header {
      background: linear-gradient(135deg, #F5DEB3 0%, #D4A574 50%, #8B5A2B 100%);
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title {
      font-size: 22px;
      font-weight: 600;
      color: #4A3728;
      font-family: var(--heading, system-ui);
      letter-spacing: 0.5px;
    }

    .card-body {
      padding: 24px;
    }

    .empty-state {
      padding: 60px 24px;
      text-align: center;
      color: var(--text, #6b6375);
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      opacity: 0.4;
      color: #D4A574;
    }

    .empty-text {
      font-size: 16px;
      color: var(--text, #6b6375);
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-h, #08060d);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding-bottom: 8px;
      border-bottom: 2px solid #F5E6D3;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-label {
      font-size: 11px;
      color: var(--text, #6b6375);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 500;
    }

    .info-value {
      font-size: 15px;
      color: var(--text-h, #08060d);
      font-weight: 500;
    }

    sl-select {
      --sl-color-primary-600: #D4A574;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: linear-gradient(135deg, #FDF8F3 0%, #F5E6D3 100%);
      border-radius: 8px;
      padding: 14px 16px;
      text-align: center;
      border: 1px solid #E8D5BC;
    }

    .stat-label {
      font-size: 11px;
      color: #8B5A2B;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 500;
      margin-bottom: 6px;
    }

    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #4A3728;
    }

    .stat-unit {
      font-size: 14px;
      font-weight: 500;
      color: #8B5A2B;
    }

    .anomaly-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .anomaly-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--code-bg, #f4f3ec);
      border-radius: 6px;
      border-left: 3px solid var(--danger, #C62828);
    }

    .anomaly-item.severity-low {
      border-left-color: var(--warning, #FF8F00);
    }

    .anomaly-item.severity-medium {
      border-left-color: #FF8F00;
    }

    .anomaly-item.severity-high {
      border-left-color: #C62828;
    }

    .anomaly-item.severity-critical {
      border-left-color: #C62828;
      background: rgba(198, 40, 40, 0.08);
    }

    .anomaly-icon {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      margin-top: 2px;
    }

    .anomaly-icon.severity-low,
    .anomaly-icon.severity-medium {
      color: #FF8F00;
    }

    .anomaly-icon.severity-high,
    .anomaly-icon.severity-critical {
      color: #C62828;
    }

    .anomaly-content {
      flex: 1;
      min-width: 0;
    }

    .anomaly-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-h, #08060d);
      margin-bottom: 2px;
    }

    .anomaly-meta {
      font-size: 12px;
      color: var(--text, #6b6375);
    }

    .anomaly-badge {
      flex-shrink: 0;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .anomaly-badge.severity-low {
      background: rgba(255, 143, 0, 0.15);
      color: #FF8F00;
    }

    .anomaly-badge.severity-medium {
      background: rgba(255, 143, 0, 0.2);
      color: #FF8F00;
    }

    .anomaly-badge.severity-high {
      background: rgba(198, 40, 40, 0.15);
      color: #C62828;
    }

    .anomaly-badge.severity-critical {
      background: rgba(198, 40, 40, 0.25);
      color: #C62828;
    }

    .no-anomalies {
      padding: 20px;
      text-align: center;
      color: var(--text, #6b6375);
      font-size: 14px;
      background: var(--code-bg, #f4f3ec);
      border-radius: 6px;
    }

    .actions {
      display: flex;
      gap: 12px;
      padding-top: 8px;
    }

    sl-button {
      flex: 1;
    }

    sl-button::part(base) {
      border-radius: 6px;
      font-weight: 500;
    }

    sl-button[variant="primary"]::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%);
      border-color: #8B5A2B;
    }

    sl-button[variant="primary"]::part(base):hover {
      background: linear-gradient(135deg, #C49464 0%, #7B4A1B 100%);
    }
  `;

  private anomalyTypeLabels: Record<string, string> = {
    temperature_spike: '温度骤升',
    forgery_detected: '检测到伪造',
    data_interruption: '数据中断'
  };

  private severityLabels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '危急'
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.wheel) {
      this.selectedCellarPositionId = this.wheel.cellarPositionId;
      this.selectedYeastBatchId = this.wheel.yeastBatchId;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('wheel') && this.wheel) {
      this.selectedCellarPositionId = this.wheel.cellarPositionId;
      this.selectedYeastBatchId = this.wheel.yeastBatchId;
    }
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

  private getTemperatureStats(): { max: number; min: number; avg: number } | null {
    if (!this.wheel || !this.wheel.temperatureHistory || this.wheel.temperatureHistory.length === 0) {
      return null;
    }
    const temps = this.wheel.temperatureHistory
      .filter((p: TemperaturePoint) => p.status === 'valid')
      .map((p: TemperaturePoint) => p.temperature);
    if (temps.length === 0) return null;
    const max = Math.max(...temps);
    const min = Math.min(...temps);
    const avg = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
    return { max, min, avg };
  }

  private detectAnomalies(): AnomalyEvent[] {
    if (!this.wheel || !this.wheel.temperatureHistory) return [];
    const anomalies: AnomalyEvent[] = [];
    const history = this.wheel.temperatureHistory;

    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      if (point.status === 'forged') {
        anomalies.push({
          id: `anomaly-forged-${i}`,
          recordId: this.wheel.id,
          type: 'forgery_detected',
          severity: 'high',
          timestamp: new Date(point.timestamp),
          acknowledged: false,
          acknowledgedBy: ''
        });
      } else if (point.status === 'interrupted') {
        anomalies.push({
          id: `anomaly-interrupted-${i}`,
          recordId: this.wheel.id,
          type: 'data_interruption',
          severity: 'medium',
          timestamp: new Date(point.timestamp),
          acknowledged: false,
          acknowledgedBy: ''
        });
      } else if (point.status === 'valid') {
        const [minTemp, maxTemp] = this.wheel.targetTempRange;
        if (point.temperature < minTemp - 2 || point.temperature > maxTemp + 2) {
          const isSpike = point.temperature > maxTemp + 2;
          const severity = point.temperature < minTemp - 4 || point.temperature > maxTemp + 4 ? 'high' : 'medium';
          anomalies.push({
            id: `anomaly-temp-${i}`,
            recordId: this.wheel.id,
            type: 'temperature_spike',
            severity,
            timestamp: new Date(point.timestamp),
            acknowledged: false,
            acknowledgedBy: ''
          });
          if (isSpike) {
            i += 5;
          }
        }
      }
    }
    return anomalies.slice(0, 10);
  }

  @eventOptions({ passive: true })
  private handleCellarPositionChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.selectedCellarPositionId = target.value;
    this.dispatchEvent(
      new CustomEvent('cellar-position-changed', {
        detail: { positionId: target.value },
        bubbles: true,
        composed: true
      })
    );
  }

  @eventOptions({ passive: true })
  private handleYeastBatchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.selectedYeastBatchId = target.value;
    this.dispatchEvent(
      new CustomEvent('yeast-batch-changed', {
        detail: { batchId: target.value },
        bubbles: true,
        composed: true
      })
    );
  }

  @eventOptions({ passive: true })
  private handleStartMeasurement() {
    if (this.wheel) {
      this.dispatchEvent(
        new CustomEvent('start-measurement', {
          detail: { wheel: this.wheel },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  @eventOptions({ passive: true })
  private handleExportReport() {
    if (this.wheel) {
      this.dispatchEvent(
        new CustomEvent('export-report', {
          detail: { wheel: this.wheel },
          bubbles: true,
          composed: true
        })
      );
    }
  }

  private renderEmptyState() {
    return html`
      <sl-card>
        <div class="card-body">
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 6v6l4 2"></path>
            </svg>
            <p class="empty-text">请选择一个奶酪轮查看详细信息</p>
          </div>
        </div>
      </sl-card>
    `;
  }

  override render() {
    if (!this.wheel) {
      return this.renderEmptyState();
    }

    const stats = this.getTemperatureStats();
    const anomalies = this.detectAnomalies();

    return html`
      <sl-card>
        <div slot="header" class="card-header">
          <span class="header-title">${this.wheel.wheelNumber}</span>
          <status-badge status=${this.wheel.status}></status-badge>
        </div>

        <div class="card-body">
          <div class="section">
            <div class="section-title">基本信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">奶酪轮编号</span>
                <span class="info-value">${this.wheel.wheelNumber}</span>
              </div>
              <div class="info-item">
                <span class="info-label">入窖时间</span>
                <span class="info-value">${this.formatDate(this.wheel.entryTime)}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">目标熟成时间</span>
                <span class="info-value">${this.formatDate(this.wheel.targetMaturationTime)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">窖位号</span>
                <sl-select
                  value=${this.selectedCellarPositionId}
                  @sl-change=${this.handleCellarPositionChange}
                >
                  ${this.cellarPositions.map(p => html`
                    <sl-option value=${p.id}>
                      ${p.positionCode} - ${p.zone}${p.shelf}
                    </sl-option>
                  `)}
                </sl-select>
              </div>
              <div class="info-item">
                <span class="info-label">酵母批次</span>
                <sl-select
                  value=${this.selectedYeastBatchId}
                  @sl-change=${this.handleYeastBatchChange}
                >
                  ${this.yeastBatches.map(b => html`
                    <sl-option value=${b.id}>
                      ${b.batchNumber} - ${b.strain}
                    </sl-option>
                  `)}
                </sl-select>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">温度历史摘要</div>
            ${stats
              ? html`
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-label">最高温度</div>
                    <div class="stat-value">${stats.max.toFixed(1)}<span class="stat-unit">°C</span></div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">最低温度</div>
                    <div class="stat-value">${stats.min.toFixed(1)}<span class="stat-unit">°C</span></div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-label">平均温度</div>
                    <div class="stat-value">${stats.avg.toFixed(1)}<span class="stat-unit">°C</span></div>
                  </div>
                </div>
              `
              : html`<div class="no-anomalies">暂无温度数据</div>`
            }
          </div>

          <div class="section">
            <div class="section-title">异常事件</div>
            ${anomalies.length > 0
              ? html`
                <div class="anomaly-list">
                  ${anomalies.map(a => html`
                    <div class="anomaly-item severity-${a.severity}">
                      <svg class="anomaly-icon severity-${a.severity}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <div class="anomaly-content">
                        <div class="anomaly-title">${this.anomalyTypeLabels[a.type] || a.type}</div>
                        <div class="anomaly-meta">${this.formatDate(a.timestamp)}</div>
                      </div>
                      <span class="anomaly-badge severity-${a.severity}">${this.severityLabels[a.severity]}</span>
                    </div>
                  `)}
                </div>
              `
              : html`<div class="no-anomalies">暂无异常事件</div>`
            }
          </div>

          <div class="actions">
            <sl-button variant="primary" @click=${this.handleStartMeasurement}>
              <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
              </svg>
              开始测量
            </sl-button>
            <sl-button variant="default" @click=${this.handleExportReport}>
              <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              导出报告
            </sl-button>
          </div>
        </div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cheese-info-panel': CheeseInfoPanel;
  }
}
