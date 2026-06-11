import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { CheeseWheel, TemperaturePoint } from '../types/index';
import { consume as consumeCtx } from '@lit-labs/context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context';
import { authContext, type AuthContextType } from '../context/auth-context';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '../components/comparison/multi-line-chart.js';
import '../components/comparison/similarity-score.js';
import type { LineDataset } from '../components/comparison/multi-line-chart.js';
import type { SimilarityScoreItem, DeviationPoint } from '../components/comparison/similarity-score.js';

const LINE_COLORS = [
  '#D4A574',
  '#1565C0',
  '#2E7D32',
  '#FF8F00',
  '#7B1FA2',
  '#00838F',
];

@customElement('comparison-page')
export class ComparisonPage extends LitElement {
  @consumeCtx({ context: cheeseContext })
  cheeseCtx!: CheeseContextType;

  @consumeCtx({ context: authContext })
  authCtx!: AuthContextType;

  @state()
  private selectedWheelIds: string[] = [];

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

    .selection-section {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #E8D5C4;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
    }

    .selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .selection-title {
      font-size: 16px;
      font-weight: 600;
      color: #4A3728;
    }

    .selection-hint {
      font-size: 12px;
      color: #8B7355;
    }

    .selection-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    sl-select {
      flex: 1;
      min-width: 250px;
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

    .selected-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    sl-tag::part(base) {
      border-radius: 20px;
      padding: 4px 8px;
      font-size: 13px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: linear-gradient(135deg, #FDF8F3 0%, #F5E6D3 100%);
      border-radius: 12px;
      padding: 20px 24px;
      border: 1px solid #E8D5BC;
    }

    .stat-label {
      font-size: 12px;
      color: #8B5A2B;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #4A3728;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .stat-unit {
      font-size: 16px;
      font-weight: 500;
      color: #8B5A2B;
      margin-left: 4px;
    }

    .stat-sub {
      font-size: 12px;
      color: #8B7355;
      margin-top: 4px;
    }

    .chart-section {
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #4A3728;
    }

    .empty-state {
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

  private get selectedWheels(): CheeseWheel[] {
    return this.cheeseCtx.cheeseWheels.filter(w => this.selectedWheelIds.includes(w.id));
  }

  private get datasets(): LineDataset[] {
    return this.selectedWheels.map((wheel, index) => ({
      id: wheel.id,
      label: wheel.wheelNumber,
      color: LINE_COLORS[index % LINE_COLORS.length],
      data: wheel.temperatureHistory,
    }));
  }

  private get targetRange(): [number, number] {
    if (this.selectedWheels.length === 0) return [10, 14];
    const minTemps = this.selectedWheels.map(w => w.targetTempRange[0]);
    const maxTemps = this.selectedWheels.map(w => w.targetTempRange[1]);
    return [Math.min(...minTemps), Math.max(...maxTemps)];
  }

  private get averageTemperature(): number {
    if (this.selectedWheels.length === 0) return 0;
    let totalTemp = 0;
    let totalPoints = 0;
    for (const wheel of this.selectedWheels) {
      const validPoints = wheel.temperatureHistory.filter(p => p.status === 'valid');
      for (const p of validPoints) {
        totalTemp += p.temperature;
        totalPoints++;
      }
    }
    return totalPoints > 0 ? totalTemp / totalPoints : 0;
  }

  private get averageDeviation(): number {
    if (this.selectedWheels.length === 0) return 0;
    const avgTemp = this.averageTemperature;
    let totalDeviation = 0;
    let totalPoints = 0;
    for (const wheel of this.selectedWheels) {
      const validPoints = wheel.temperatureHistory.filter(p => p.status === 'valid');
      for (const p of validPoints) {
        totalDeviation += Math.abs(p.temperature - avgTemp);
        totalPoints++;
      }
    }
    return totalPoints > 0 ? totalDeviation / totalPoints : 0;
  }

  private get consistencyScore(): number {
    if (this.selectedWheels.length < 2) return 0;
    const scores = this.getSimilarityScores();
    if (scores.length === 0) return 0;
    const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    return avgScore;
  }

  private handleWheelSelect(event: Event) {
    const target = event.target as HTMLSelectElement;
    const wheelId = target.value;
    if (wheelId && !this.selectedWheelIds.includes(wheelId) && this.selectedWheelIds.length < 6) {
      this.selectedWheelIds = [...this.selectedWheelIds, wheelId];
    }
    target.value = '';
  }

  private handleRemoveWheel(wheelId: string) {
    this.selectedWheelIds = this.selectedWheelIds.filter(id => id !== wheelId);
  }

  private handleClearAll() {
    this.selectedWheelIds = [];
  }

  private getSimilarityScores(): SimilarityScoreItem[] {
    if (this.selectedWheels.length < 2) return [];
    const referenceWheel = this.selectedWheels[0];
    const refValid = referenceWheel.temperatureHistory.filter(p => p.status === 'valid');
    if (refValid.length === 0) return [];

    return this.selectedWheels.slice(1).map(wheel => {
      const wheelValid = wheel.temperatureHistory.filter(p => p.status === 'valid');
      const deviations: DeviationPoint[] = [];

      for (const refPoint of refValid) {
        const refTime = new Date(refPoint.timestamp).getTime();
        let closest: TemperaturePoint | null = null;
        let minDiff = Infinity;

        for (const wheelPoint of wheelValid) {
          const wheelTime = new Date(wheelPoint.timestamp).getTime();
          const diff = Math.abs(wheelTime - refTime);
          if (diff < minDiff && diff < 3600000) {
            minDiff = diff;
            closest = wheelPoint;
          }
        }

        if (closest) {
          deviations.push({
            timestamp: new Date(refPoint.timestamp),
            tempDiff: closest.temperature - refPoint.temperature,
          });
        }
      }

      const avgAbsDev = deviations.length > 0
        ? deviations.reduce((sum, d) => sum + Math.abs(d.tempDiff), 0) / deviations.length
        : 0;

      const score = Math.max(0, Math.min(100, 100 - avgAbsDev * 25));

      return {
        wheelId: wheel.id,
        wheelNumber: wheel.wheelNumber,
        score,
        deviations,
      };
    });
  }

  private handleExportCSV() {
    if (this.selectedWheels.length === 0) return;

    const headers = ['时间戳', ...this.selectedWheels.map(w => w.wheelNumber + '(℃)')];
    const rows: string[][] = [];

    const allTimestamps = new Set<number>();
    for (const wheel of this.selectedWheels) {
      for (const point of wheel.temperatureHistory) {
        allTimestamps.add(new Date(point.timestamp).getTime());
      }
    }
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    for (const ts of sortedTimestamps) {
      const row: string[] = [new Date(ts).toISOString()];
      for (const wheel of this.selectedWheels) {
        const point = wheel.temperatureHistory.find(
          p => new Date(p.timestamp).getTime() === ts
        );
        row.push(point ? point.temperature.toFixed(2) : '');
      }
      rows.push(row);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `温度对比报告_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  override render() {
    const similarityScores = this.getSimilarityScores();
    const hasSelection = this.selectedWheelIds.length > 0;

    return html`
      <div class="page-header">
        <h1 class="page-title">多轮对比分析</h1>
        <p class="page-subtitle">对比多个奶酪轮的温度曲线和熟成相似度，最多支持6轮同时对比</p>
      </div>

      <div class="selection-section">
        <div class="selection-header">
          <span class="selection-title">选择要对比的奶酪轮</span>
          <span class="selection-hint">已选择 ${this.selectedWheelIds.length}/6</span>
        </div>
        <div class="selection-row">
          <sl-select
            placeholder="选择奶酪轮添加到对比..."
            @sl-change=${this.handleWheelSelect}
            ?disabled=${this.selectedWheelIds.length >= 6}
          >
            ${this.cheeseCtx.cheeseWheels
              .filter(w => !this.selectedWheelIds.includes(w.id))
              .map(w => html`
                <sl-option value=${w.id}>${w.wheelNumber} - ${w.cellarPositionId}</sl-option>
              `)
            }
          </sl-select>
          <sl-button
            variant="default"
            @click=${this.handleExportCSV}
            ?disabled=${this.selectedWheelIds.length < 2}
          >
            <svg slot="prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            导出CSV报告
          </sl-button>
          ${this.selectedWheelIds.length > 0 ? html`
            <sl-button variant="default" @click=${this.handleClearAll}>清空选择</sl-button>
          ` : ''}
        </div>
        ${this.selectedWheelIds.length > 0 ? html`
          <div class="selected-tags">
            ${this.selectedWheels.map((wheel, index) => html`
              <sl-tag variant="neutral" removable @sl-remove=${() => this.handleRemoveWheel(wheel.id)}>
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${LINE_COLORS[index % LINE_COLORS.length]}; margin-right: 6px;"></span>
                ${wheel.wheelNumber}
              </sl-tag>
            `)}
          </div>
        ` : ''}
      </div>

      ${hasSelection ? html`
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-label">平均温度</div>
            <div class="stat-value">${this.averageTemperature.toFixed(2)}<span class="stat-unit">℃</span></div>
            <div class="stat-sub">基于 ${this.selectedWheelIds.length} 轮有效数据计算</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">平均偏差</div>
            <div class="stat-value">±${this.averageDeviation.toFixed(3)}<span class="stat-unit">℃</span></div>
            <div class="stat-sub">相对于平均值的温度波动</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">一致性评分</div>
            <div class="stat-value">${this.consistencyScore.toFixed(1)}<span class="stat-unit">/100</span></div>
            <div class="stat-sub">${this.consistencyScore >= 90 ? '优秀' : this.consistencyScore >= 75 ? '良好' : '待改进'}</div>
          </div>
        </div>

        <div class="chart-section">
          <div class="section-header">
            <span class="section-title">温度曲线对比</span>
          </div>
          <multi-line-chart
            .datasets=${this.datasets}
            .targetRange=${this.targetRange}
          ></multi-line-chart>
        </div>

        <div class="chart-section">
          <div class="section-header">
            <span class="section-title">相似度评分</span>
          </div>
          ${similarityScores.length > 0
            ? html`<similarity-score .scores=${similarityScores}></similarity-score>`
            : html`
              <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                <h3 class="empty-title">需要至少2轮对比</h3>
                <p class="empty-text">请添加更多奶酪轮以计算相似度评分</p>
              </div>
            `
          }
        </div>
      ` : html`
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <h3 class="empty-title">请选择奶酪轮开始对比</h3>
          <p class="empty-text">从上方下拉框中选择2-6个奶酪轮进行温度曲线和相似度对比分析</p>
        </div>
      `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comparison-page': ComparisonPage;
  }
}
