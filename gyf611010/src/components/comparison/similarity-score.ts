import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

export interface DeviationPoint {
  timestamp: Date;
  tempDiff: number;
}

export interface SimilarityScoreItem {
  wheelId: string;
  wheelNumber: string;
  score: number;
  deviations: DeviationPoint[];
}

@customElement('similarity-score')
export class SimilarityScore extends LitElement {
  @property({ type: Array })
  scores: SimilarityScoreItem[] = [];

  static override styles = css`
    :host {
      --primary: #D4A574;
      --success: #2E7D32;
      --warning: #FF8F00;
      --danger: #C62828;
      --bg: #FFF8F0;
      --text: #4A3728;
      --border: #E8D5C4;

      display: block;
      font-family: var(--sans, system-ui, sans-serif);
    }

    .container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .score-card {
      background: var(--bg);
      border-radius: 12px;
      border: 2px solid var(--border);
      overflow: hidden;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .score-card:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 16px rgba(74, 55, 40, 0.1);
    }

    sl-details {
      --header-spacing: var(--sl-spacing-medium);
      --body-spacing: var(--sl-spacing-medium);
    }

    sl-details::part(base) {
      border: none;
      background: transparent;
    }

    sl-details::part(header) {
      padding: 16px 20px;
      font-size: 14px;
    }

    sl-details::part(content) {
      padding: 0 20px 20px 20px;
      border-top: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.5);
    }

    .score-header {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .wheel-info {
      display: flex;
      flex-direction: column;
      min-width: 100px;
    }

    .wheel-number {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .wheel-id {
      font-size: 11px;
      color: #8B7355;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .progress-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    sl-progress-bar {
      flex: 1;
      --height: 14px;
      --track-color: #F5E6D3;
    }

    sl-progress-bar::part(base) {
      border-radius: 7px;
    }

    .score-value {
      font-size: 20px;
      font-weight: 700;
      min-width: 50px;
      text-align: right;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .score-value.excellent {
      color: var(--success);
    }

    .score-value.good {
      color: var(--warning);
    }

    .score-value.poor {
      color: var(--danger);
    }

    .score-label {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .score-label.excellent {
      background: rgba(46, 125, 50, 0.15);
      color: var(--success);
    }

    .score-label.good {
      background: rgba(255, 143, 0, 0.15);
      color: var(--warning);
    }

    .score-label.poor {
      background: rgba(198, 40, 40, 0.15);
      color: var(--danger);
    }

    .deviation-summary {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-label {
      font-size: 11px;
      color: #8B7355;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 18px;
      font-weight: 700;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .summary-value.positive {
      color: var(--danger);
    }

    .summary-value.negative {
      color: #1565C0;
    }

    .summary-value.neutral {
      color: var(--success);
    }

    .deviation-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 240px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .deviation-list::-webkit-scrollbar {
      width: 6px;
    }

    .deviation-list::-webkit-scrollbar-track {
      background: #F5E6D3;
      border-radius: 3px;
    }

    .deviation-list::-webkit-scrollbar-thumb {
      background: var(--primary);
      border-radius: 3px;
    }

    .deviation-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 6px;
      border-left: 3px solid transparent;
      transition: background-color 0.15s ease;
    }

    .deviation-item:hover {
      background: rgba(255, 255, 255, 0.95);
    }

    .deviation-item.positive {
      border-left-color: var(--danger);
    }

    .deviation-item.negative {
      border-left-color: #1565C0;
    }

    .deviation-item.neutral {
      border-left-color: var(--success);
    }

    .deviation-time {
      font-size: 12px;
      color: #6B5B4E;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .deviation-diff {
      font-size: 13px;
      font-weight: 600;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .deviation-diff.positive {
      color: var(--danger);
    }

    .deviation-diff.negative {
      color: #1565C0;
    }

    .deviation-diff.neutral {
      color: var(--success);
    }

    .empty-state {
      text-align: center;
      padding: 24px;
      color: #8B7355;
      font-size: 13px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `;

  private getScoreCategory(score: number): 'excellent' | 'good' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    return 'poor';
  }

  private getScoreLabel(score: number): string {
    if (score >= 90) return '优秀';
    if (score >= 75) return '良好';
    return '待改进';
  }

  private getGradientColor(score: number): string {
    const category = this.getScoreCategory(score);
    if (category === 'excellent') {
      return 'linear-gradient(90deg, #66BB6A 0%, #2E7D32 100%)';
    }
    if (category === 'good') {
      return 'linear-gradient(90deg, #FFB74D 0%, #FF8F00 100%)';
    }
    return 'linear-gradient(90deg, #EF5350 0%, #C62828 100%)';
  }

  private getDeviationCategory(tempDiff: number): 'positive' | 'negative' | 'neutral' {
    if (tempDiff > 0.1) return 'positive';
    if (tempDiff < -0.1) return 'negative';
    return 'neutral';
  }

  private formatDeviation(diff: number): string {
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(2)}℃`;
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private getAverageDeviation(deviations: DeviationPoint[]): number {
    if (deviations.length === 0) return 0;
    const sum = deviations.reduce((acc, d) => acc + Math.abs(d.tempDiff), 0);
    return sum / deviations.length;
  }

  private getMaxDeviation(deviations: DeviationPoint[]): number {
    if (deviations.length === 0) return 0;
    return deviations.reduce((max, d) => Math.max(max, Math.abs(d.tempDiff)), 0);
  }

  private renderDeviationList(deviations: DeviationPoint[]) {
    if (deviations.length === 0) {
      return html`<div class="empty-state">暂无偏差数据</div>`;
    }

    const sortedDeviations = [...deviations].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return html`
      <div class="deviation-list">
        ${sortedDeviations.map(d => {
          const category = this.getDeviationCategory(d.tempDiff);
          return html`
            <div class="deviation-item ${category}">
              <span class="deviation-time">${this.formatTime(d.timestamp)}</span>
              <span class="deviation-diff ${category}">${this.formatDeviation(d.tempDiff)}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  override render() {
    if (this.scores.length === 0) {
      return html`<div class="empty-state">暂无相似度评分数据</div>`;
    }

    return html`
      <div class="container">
        ${this.scores.map(item => {
          const category = this.getScoreCategory(item.score);
          const avgDev = this.getAverageDeviation(item.deviations);
          const maxDev = this.getMaxDeviation(item.deviations);
          const avgCategory = this.getDeviationCategory(avgDev);
          const maxCategory = this.getDeviationCategory(maxDev);

          return html`
            <div class="score-card">
              <sl-details>
                <div slot="summary" class="score-header">
                  <div class="wheel-info">
                    <span class="wheel-number">${item.wheelNumber}</span>
                    <span class="wheel-id">${item.wheelId}</span>
                  </div>
                  <div class="progress-wrapper">
                    <sl-progress-bar
                      value="${item.score}"
                      min="0"
                      max="100"
                      style="--indicator-color: ${this.getGradientColor(item.score)};"
                    ></sl-progress-bar>
                    <span class="score-label ${category}">${this.getScoreLabel(item.score)}</span>
                  </div>
                  <span class="score-value ${category}">${item.score.toFixed(1)}</span>
                </div>

                <div class="deviation-summary">
                  <div class="summary-item">
                    <span class="summary-label">偏差点数量</span>
                    <span class="summary-value neutral">${item.deviations.length}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">平均偏差</span>
                    <span class="summary-value ${avgCategory}">±${avgDev.toFixed(2)}℃</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">最大偏差</span>
                    <span class="summary-value ${maxCategory}">±${maxDev.toFixed(2)}℃</span>
                  </div>
                </div>

                <h4 class="section-title">偏差详情</h4>
                ${this.renderDeviationList(item.deviations)}
              </sl-details>
            </div>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'similarity-score': SimilarityScore;
  }
}
