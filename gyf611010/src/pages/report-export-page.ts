import { LitElement, html, css, svg } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { CheeseWheel, CellarPosition, YeastBatch, AnomalyEvent, HACCPReport } from '../types/index';
import { consume as consumeCtx } from '@lit-labs/context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context';
import { authContext, type AuthContextType } from '../context/auth-context';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import { cellarPositions, yeastBatches } from '../utils/mock-data';
import {
  generateHACCPReportData,
  validateHACCPData,
  calculateCriticalControlPoints,
  type CriticalControlPoint
} from '../utils/haccp-generator';
import { exportHACCPReportToPDF, exportShippingLabel } from '../utils/pdf-export';

@customElement('report-export-page')
export class ReportExportPage extends LitElement {
  @consumeCtx({ context: cheeseContext })
  cheeseCtx!: CheeseContextType;

  @consumeCtx({ context: authContext })
  authCtx!: AuthContextType;

  @state()
  private selectedWheelId: string = '';

  @state()
  private generatedReport: HACCPReport | null = null;

  @state()
  private ccpList: CriticalControlPoint[] = [];

  @state()
  private validationIssues: string[] = [];

  static override styles = css`
    :host {
      display: block;
      padding: 24px;
      font-family: var(--sans, system-ui, sans-serif);
      color: var(--text, #4A3728);
      background: #FFF8F0;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #4A3728;
      margin: 0 0 8px 0;
      font-family: var(--heading, system-ui);
    }

    .page-subtitle {
      font-size: 14px;
      color: #8B7355;
      margin: 0;
    }

    .selector-section {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #E8D5C4;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
    }

    .selector-row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    sl-select {
      flex: 1;
      min-width: 300px;
    }

    sl-select::part(base),
    sl-button::part(base) {
      border-radius: 8px;
    }

    sl-button[variant="primary"]::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%);
      border-color: #8B5A2B;
    }

    sl-button[variant="primary"]::part(base):hover {
      background: linear-gradient(135deg, #C49464 0%, #7B4A1B 100%);
    }

    .report-container {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .report-container {
        grid-template-columns: 1fr;
      }
    }

    .preview-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    sl-card {
      --sl-color-neutral-0: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
    }

    sl-card::part(base) {
      border: 1px solid #E8D5C4;
    }

    sl-card::part(header) {
      background: linear-gradient(135deg, #FDF8F3 0%, #F5E6D3 100%);
      border-bottom: 1px solid #E8D5BC;
      font-size: 16px;
      font-weight: 600;
      color: #4A3728;
    }

    sl-card::part(body) {
      padding: 20px;
    }

    .preview-header {
      text-align: center;
      padding: 24px;
      background: linear-gradient(135deg, #F5DEB3 0%, #D4A574 50%, #8B5A2B 100%);
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .preview-title {
      font-size: 22px;
      font-weight: 700;
      color: #4A3728;
      margin: 0 0 8px 0;
    }

    .preview-meta {
      font-size: 13px;
      color: #5D4E37;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 20px;
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
      color: #8B7355;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 600;
    }

    .info-value {
      font-size: 14px;
      color: #4A3728;
      font-weight: 500;
    }

    .ccp-table {
      width: 100%;
      border-collapse: collapse;
    }

    .ccp-table th,
    .ccp-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #F5E6D3;
    }

    .ccp-table th {
      font-size: 12px;
      font-weight: 600;
      color: #8B7355;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #FDF8F3;
    }

    .ccp-table td {
      font-size: 13px;
      color: #4A3728;
    }

    .status-pass {
      color: #2E7D32;
      font-weight: 600;
    }

    .status-fail {
      color: #C62828;
      font-weight: 600;
    }

    .chart-thumbnail {
      width: 100%;
      height: 180px;
      background: #FDF8F3;
      border-radius: 8px;
      border: 1px solid #E8D5BC;
      overflow: hidden;
    }

    .integrity-score {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
      flex-shrink: 0;
    }

    .score-circle.excellent {
      background: conic-gradient(#2E7D32 calc(var(--score) * 1%), #E8D5BC 0);
      color: #2E7D32;
    }

    .score-circle.good {
      background: conic-gradient(#FF8F00 calc(var(--score) * 1%), #E8D5BC 0);
      color: #FF8F00;
    }

    .score-circle.poor {
      background: conic-gradient(#C62828 calc(var(--score) * 1%), #E8D5BC 0);
      color: #C62828;
    }

    .score-inner {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }

    .score-info {
      flex: 1;
    }

    .score-label {
      font-size: 18px;
      font-weight: 600;
      color: #4A3728;
      margin-bottom: 4px;
    }

    .score-desc {
      font-size: 13px;
      color: #8B7355;
      line-height: 1.5;
    }

    .anomaly-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .anomaly-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      background: #FDF8F3;
      border-radius: 6px;
      border-left: 3px solid transparent;
    }

    .anomaly-item.severity-low { border-left-color: #FF8F00; }
    .anomaly-item.severity-medium { border-left-color: #FF8F00; }
    .anomaly-item.severity-high { border-left-color: #C62828; }
    .anomaly-item.severity-critical { border-left-color: #C62828; background: rgba(198, 40, 40, 0.05); }

    .anomaly-content {
      flex: 1;
      min-width: 0;
    }

    .anomaly-title {
      font-size: 13px;
      font-weight: 600;
      color: #4A3728;
    }

    .anomaly-meta {
      font-size: 12px;
      color: #8B7355;
    }

    .no-anomalies {
      text-align: center;
      padding: 20px;
      color: #2E7D32;
      font-size: 14px;
      background: rgba(46, 125, 50, 0.08);
      border-radius: 8px;
    }

    .action-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .action-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #E8D5C4;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
    }

    .action-title {
      font-size: 15px;
      font-weight: 600;
      color: #4A3728;
      margin: 0 0 12px 0;
    }

    .action-desc {
      font-size: 12px;
      color: #8B7355;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    sl-button {
      width: 100%;
    }

    .empty-state {
      grid-column: 1 / -1;
      background: #fff;
      border-radius: 12px;
      border: 2px dashed #E8D5C4;
      padding: 60px 40px;
      text-align: center;
    }

    .empty-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      opacity: 0.4;
      color: #D4A574;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #4A3728;
      margin: 0 0 8px 0;
    }

    .empty-text {
      font-size: 14px;
      color: #8B7355;
      margin: 0;
    }
  `;

  private get mappedCellarPositions(): CellarPosition[] {
    return cellarPositions.map(p => ({
      id: p.id,
      positionCode: p.code,
      zone: p.row,
      shelf: String(p.shelf),
      ambientTemp: 12,
    }));
  }

  private get mappedYeastBatches(): YeastBatch[] {
    return yeastBatches.map(b => ({
      id: b.id,
      batchNumber: b.batchNumber,
      strain: b.strain,
      productionDate: b.productionDate,
      supplier: '',
    }));
  }

  private get selectedWheel(): CheeseWheel | undefined {
    return this.cheeseCtx.cheeseWheels.find(w => w.id === this.selectedWheelId);
  }

  private get dataIntegrityScore(): number {
    if (!this.generatedReport) return 0;
    const points = this.generatedReport.temperatureCurve;
    if (points.length === 0) return 0;
    const validCount = points.filter(p => p.status === 'valid').length;
    return Math.round((validCount / points.length) * 100);
  }

  private get anomalies(): AnomalyEvent[] {
    return this.generatedReport?.anomalies || [];
  }

  private get canPrintLabel(): boolean {
    if (!this.generatedReport || !this.selectedWheel) return false;
    const allCcpPass = this.ccpList.every(c => c.status === '通过');
    const wheelReady = this.selectedWheel.status === 'ready';
    return allCcpPass && wheelReady;
  }

  private get anomaliesForWheel(): AnomalyEvent[] {
    if (!this.selectedWheel) return [];
    const anomalies: AnomalyEvent[] = [];
    const history = this.selectedWheel.temperatureHistory;
    for (let i = 0; i < history.length; i++) {
      const point = history[i];
      if (point.status === 'forged') {
        anomalies.push({
          id: `anomaly-forged-${i}`,
          recordId: this.selectedWheel.id,
          type: 'forgery_detected',
          severity: 'high',
          timestamp: new Date(point.timestamp),
          acknowledged: false,
          acknowledgedBy: ''
        });
      } else if (point.status === 'interrupted') {
        anomalies.push({
          id: `anomaly-interrupted-${i}`,
          recordId: this.selectedWheel.id,
          type: 'data_interruption',
          severity: 'medium',
          timestamp: new Date(point.timestamp),
          acknowledged: false,
          acknowledgedBy: ''
        });
      } else if (point.status === 'valid') {
        const [minTemp, maxTemp] = this.selectedWheel.targetTempRange;
        if (point.temperature < minTemp - 2 || point.temperature > maxTemp + 2) {
          anomalies.push({
            id: `anomaly-temp-${i}`,
            recordId: this.selectedWheel.id,
            type: 'temperature_spike',
            severity: point.temperature < minTemp - 4 || point.temperature > maxTemp + 4 ? 'high' : 'medium',
            timestamp: new Date(point.timestamp),
            acknowledged: false,
            acknowledgedBy: ''
          });
        }
      }
    }
    return anomalies.slice(0, 10);
  }

  private handleWheelSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedWheelId = target.value;
    this.generateReport();
  }

  private generateReport() {
    if (!this.selectedWheel) {
      this.generatedReport = null;
      this.ccpList = [];
      this.validationIssues = [];
      return;
    }

    const operatorName = this.authCtx.currentUser?.username || '系统管理员';
    const report = generateHACCPReportData(
      this.selectedWheel.id,
      this.cheeseCtx.cheeseWheels,
      this.mappedCellarPositions,
      this.mappedYeastBatches,
      this.anomaliesForWheel,
      operatorName
    );

    const validation = validateHACCPData(report);
    this.validationIssues = validation.issues;
    this.generatedReport = report;
    this.ccpList = calculateCriticalControlPoints(report);
  }

  private async handleExportPDF() {
    if (!this.generatedReport) return;
    try {
      await exportHACCPReportToPDF(this.generatedReport);
    } catch (err) {
      console.error('导出PDF失败:', err);
    }
  }

  private async handlePrintLabel() {
    if (!this.selectedWheel || !this.canPrintLabel) return;
    try {
      await exportShippingLabel(this.selectedWheel);
    } catch (err) {
      console.error('打印标签失败:', err);
    }
  }

  private anomalyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      temperature_spike: '温度异常',
      forgery_detected: '数据伪造',
      data_interruption: '数据中断',
    };
    return labels[type] || type;
  }

  private severityLabel(severity: string): string {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '危急',
    };
    return labels[severity] || severity;
  }

  private formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private renderChartThumbnail() {
    if (!this.generatedReport) return null;
    const points = this.generatedReport.temperatureCurve;
    if (points.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = { top: 20, right: 20, bottom: 25, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const [minTarget, maxTarget] = this.generatedReport.targetRange;
    let minTemp = Infinity, maxTemp = -Infinity;
    for (const p of points) {
      if (p.temperature < minTemp) minTemp = p.temperature;
      if (p.temperature > maxTemp) maxTemp = p.temperature;
    }
    minTemp = Math.min(minTemp, minTarget) - 1;
    maxTemp = Math.max(maxTemp, maxTarget) + 1;
    const tempRange = maxTemp - minTemp || 1;

    const startTime = new Date(points[0].timestamp).getTime();
    const endTime = new Date(points[points.length - 1].timestamp).getTime();
    const timeRange = endTime - startTime || 1;

    const targetY1 = padding.top + chartH - ((maxTarget - minTemp) / tempRange) * chartH;
    const targetY2 = padding.top + chartH - ((minTarget - minTemp) / tempRange) * chartH;

    const mapX = (t: number) => padding.left + ((t - startTime) / timeRange) * chartW;
    const mapY = (temp: number) => padding.top + chartH - ((temp - minTemp) / tempRange) * chartH;

    const linePath = points.map((p, i) => {
      const x = mapX(new Date(p.timestamp).getTime());
      const y = mapY(p.temperature);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return svg`
      <svg class="chart-thumbnail" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <rect x="${padding.left}" y="${targetY1}" width="${chartW}" height="${targetY2 - targetY1}"
          fill="#2E7D32" fill-opacity="0.12" stroke="#2E7D32" stroke-width="1" stroke-dasharray="4 4"/>
        <path d="${linePath}" fill="none" stroke="#D4A574" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"
          stroke="#8B7355" stroke-width="1"/>
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"
          stroke="#8B7355" stroke-width="1"/>
        <text x="${padding.left - 5}" y="${mapY(minTarget)}" text-anchor="end" dominant-baseline="middle"
          font-size="10" fill="#8B7355">${minTarget}℃</text>
        <text x="${padding.left - 5}" y="${mapY(maxTarget)}" text-anchor="end" dominant-baseline="middle"
          font-size="10" fill="#8B7355">${maxTarget}℃</text>
      </svg>
    `;
  }

  override render() {
    const score = this.dataIntegrityScore;
    const scoreCategory = score >= 95 ? 'excellent' : score >= 80 ? 'good' : 'poor';
    const scoreLabel = score >= 98 ? '优秀 - 数据完整可信' : score >= 95 ? '良好 - 数据基本完整' : score >= 80 ? '一般 - 存在部分数据缺失' : '较差 - 数据完整性不足';

    return html`
      <div class="page-header">
        <h1 class="page-title">HACCP 报告导出</h1>
        <p class="page-subtitle">生成并导出奶酪轮熟成过程的 HACCP 合规报告和出库标签</p>
      </div>

      <div class="selector-section">
        <div class="selector-row">
          <sl-select
            placeholder="选择奶酪轮生成报告..."
            value=${this.selectedWheelId}
            @sl-change=${this.handleWheelSelect}
          >
            ${this.cheeseCtx.cheeseWheels.map(w => html`
              <sl-option value=${w.id}>${w.wheelNumber} - ${w.cellarPositionId}</sl-option>
            `)}
          </sl-select>
        </div>
      </div>

      ${this.validationIssues.length > 0 ? html`
        <sl-alert variant="warning" open style="margin-bottom: 24px;">
          <svg slot="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <strong>数据验证警告：</strong>
          <ul style="margin: 8px 0 0 20px; padding: 0;">
            ${this.validationIssues.map(issue => html`<li>${issue}</li>`)}
          </ul>
        </sl-alert>
      ` : ''}

      ${this.generatedReport ? html`
        <div class="report-container">
          <div class="preview-section">
            <sl-card>
              <div slot="header">报告预览</div>
              <div class="preview-header">
                <h2 class="preview-title">HACCP 合规报告</h2>
                <div class="preview-meta">
                  报告编号: HACCP-${this.generatedReport.wheelNumber}-${this.generatedReport.generatedAt.getTime()}
                  · 生成时间: ${this.formatDate(this.generatedReport.generatedAt)}
                </div>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">奶酪轮编号</span>
                  <span class="info-value">${this.generatedReport.wheelNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">操作员</span>
                  <span class="info-value">${this.generatedReport.operator}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">酒窖位置</span>
                  <span class="info-value">${this.generatedReport.cellarPosition}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">酵母批次</span>
                  <span class="info-value">${this.generatedReport.yeastBatch}</span>
                </div>
                <div class="info-item full-width">
                  <span class="info-label">目标温度范围</span>
                  <span class="info-value">${this.generatedReport.targetRange[0]}℃ ~ ${this.generatedReport.targetRange[1]}℃</span>
                </div>
              </div>
            </sl-card>

            <sl-card>
              <div slot="header">关键控制点 (CCP) 状态</div>
              <table class="ccp-table">
                <thead>
                  <tr>
                    <th>控制点</th>
                    <th>状态</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.ccpList.map(ccp => html`
                    <tr>
                      <td><strong>${ccp.point}</strong></td>
                      <td>
                        <span class="${ccp.status === '通过' ? 'status-pass' : 'status-fail'}">
                          ${ccp.status === '通过' ? '✓ ' : '✗ '}${ccp.status}
                        </span>
                      </td>
                      <td>${ccp.description}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </sl-card>

            <sl-card>
              <div slot="header">温度曲线</div>
              ${this.renderChartThumbnail()}
            </sl-card>

            <sl-card>
              <div slot="header">数据完整性评分</div>
              <div class="integrity-score">
                <div class="score-circle ${scoreCategory}" style="--score: ${score};">
                  <div class="score-inner">
                    <span>${score}</span>
                    <span style="font-size: 12px; font-weight: 500;">%</span>
                  </div>
                </div>
                <div class="score-info">
                  <div class="score-label">${scoreLabel}</div>
                  <div class="score-desc">
                    基于 ${this.generatedReport.temperatureCurve.length} 个温度数据点计算。
                    有效数据 ${this.generatedReport.temperatureCurve.filter(p => p.status === 'valid').length} 个，
                    中断 ${this.generatedReport.temperatureCurve.filter(p => p.status === 'interrupted').length} 个，
                    伪造 ${this.generatedReport.temperatureCurve.filter(p => p.status === 'forged').length} 个。
                  </div>
                </div>
              </div>
            </sl-card>

            <sl-card>
              <div slot="header">异常事件记录</div>
              ${this.anomalies.length > 0 ? html`
                <div class="anomaly-list">
                  ${this.anomalies.map(a => html`
                    <div class="anomaly-item severity-${a.severity}">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="${a.severity === 'high' || a.severity === 'critical' ? '#C62828' : '#FF8F00'}"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-top:2px;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      <div class="anomaly-content">
                        <div class="anomaly-title">
                          ${this.anomalyTypeLabel(a.type)}
                          <sl-badge variant="${a.severity === 'critical' ? 'danger' : a.severity === 'high' ? 'danger' : 'warning'}">
                            ${this.severityLabel(a.severity)}
                          </sl-badge>
                        </div>
                        <div class="anomaly-meta">
                          ${this.formatDate(a.timestamp)}
                          ${a.acknowledged ? ` · 已确认 (${a.acknowledgedBy})` : ' · 未确认'}
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              ` : html`
                <div class="no-anomalies">
                  ✓ 暂无异常事件记录，所有数据均在正常范围内
                </div>
              `}
            </sl-card>
          </div>

          <div class="action-sidebar">
            <div class="action-card">
              <h3 class="action-title">导出 HACCP 报告</h3>
              <p class="action-desc">
                生成包含完整温度曲线、CCP控制点验证、异常事件记录的数据完整性报告（PDF格式）。
              </p>
              <div class="action-buttons">
                <sl-button variant="primary" @click=${this.handleExportPDF}>
                  <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  导出 PDF 报告
                </sl-button>
              </div>
            </div>

            <div class="action-card">
              <h3 class="action-title">打印出库标签</h3>
              <p class="action-desc">
                ${this.canPrintLabel
                  ? '所有关键控制点已通过验证，奶酪轮已成熟，可以打印出库标签。'
                  : '需要满足以下条件才可打印：所有CCP控制点通过验证 + 奶酪轮状态为"已就绪"。'}
              </p>
              <div class="action-buttons">
                <sl-button
                  variant="${this.canPrintLabel ? 'primary' : 'default'}"
                  ?disabled=${!this.canPrintLabel}
                  @click=${this.handlePrintLabel}
                >
                  <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  打印出库标签
                </sl-button>
              </div>
              ${!this.canPrintLabel && this.selectedWheel ? html`
                <div style="margin-top: 12px; font-size: 12px; color: #8B7355;">
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="color: ${this.ccpList.every(c => c.status === '通过') ? '#2E7D32' : '#C62828'}">
                      ${this.ccpList.every(c => c.status === '通过') ? '✓' : '✗'}
                    </span>
                    CCP控制点全部通过
                  </div>
                  <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                    <span style="color: ${this.selectedWheel.status === 'ready' ? '#2E7D32' : '#C62828'}">
                      ${this.selectedWheel.status === 'ready' ? '✓' : '✗'}
                    </span>
                    奶酪轮已成熟 (当前: ${this.selectedWheel.status})
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      ` : html`
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <h3 class="empty-title">请选择奶酪轮</h3>
          <p class="empty-text">从上方下拉框中选择一个奶酪轮以生成 HACCP 合规报告</p>
        </div>
      `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'report-export-page': ReportExportPage;
  }
}
