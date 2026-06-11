import { LitElement, html, css, svg } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { type TemperaturePoint } from '../../types/index.js';
import { calculateTargetRangeBand, type BandConfig } from '../temperature/target-range-band.js';

export interface LineDataset {
  id: string;
  label: string;
  color: string;
  data: TemperaturePoint[];
}

interface ChartPoint {
  x: number;
  y: number;
  data: TemperaturePoint;
}

const LINE_COLORS = [
  '#D4A574',
  '#1565C0',
  '#2E7D32',
  '#FF8F00',
  '#7B1FA2',
  '#00838F',
];

@customElement('multi-line-chart')
export class MultiLineChart extends LitElement {
  @property({ type: Array })
  datasets: LineDataset[] = [];

  @property({ type: Array })
  targetRange: [number, number] = [10, 14];

  @property({ type: Number })
  width: number = 900;

  @property({ type: Number })
  height: number = 450;

  @state()
  private hiddenDatasets: Set<string> = new Set();

  @state()
  private hoveredTimestamp: number | null = null;

  @state()
  private hoverPosition: { x: number; y: number } = { x: 0, y: 0 };

  private readonly paddingTop = 40;
  private readonly paddingBottom = 60;
  private readonly paddingLeft = 60;
  private readonly paddingRight = 40;
  private readonly minTemp = 8;
  private readonly maxTemp = 18;

  static override styles = css`
    :host {
      --primary: #D4A574;
      --success: #2E7D32;
      --danger: #C62828;
      --bg: #FFF8F0;
      --text: #4A3728;

      display: block;
    }

    .chart-container {
      position: relative;
      background: var(--bg);
      border-radius: 16px;
      padding: 16px;
      border: 2px solid var(--primary);
      box-shadow: 0 4px 20px rgba(74, 55, 40, 0.1);
      font-family: var(--sans, system-ui, sans-serif);
    }

    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 12px 0;
      text-align: center;
    }

    .chart-wrapper {
      position: relative;
      overflow: hidden;
    }

    .chart-svg {
      display: block;
    }

    .tooltip {
      position: absolute;
      background: rgba(74, 55, 40, 0.95);
      color: #FFF8F0;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      pointer-events: none;
      z-index: 10;
      min-width: 200px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      transform: translate(-50%, -100%);
      transition: opacity 0.15s ease;
    }

    .tooltip.hidden {
      opacity: 0;
    }

    .tooltip-header {
      font-weight: 600;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 248, 240, 0.2);
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin: 4px 0;
    }

    .tooltip-label {
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0.9;
    }

    .tooltip-color {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .tooltip-value {
      font-weight: 600;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .tooltip-value.missing {
      opacity: 0.5;
      font-weight: 400;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 24px;
      margin-top: 16px;
      font-size: 13px;
      color: var(--text);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background-color 0.15s ease, opacity 0.15s ease;
      user-select: none;
    }

    .legend-item:hover {
      background-color: rgba(74, 55, 40, 0.08);
    }

    .legend-item.hidden {
      opacity: 0.4;
    }

    .legend-item.hidden .legend-checkbox {
      opacity: 0.5;
    }

    .legend-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 2px solid currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .legend-checkbox.checked::after {
      content: '✓';
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
    }

    .legend-line {
      width: 20px;
      height: 3px;
      border-radius: 2px;
      flex-shrink: 0;
    }
  `;

  private get innerWidth(): number {
    return this.width - this.paddingLeft - this.paddingRight;
  }

  private get innerHeight(): number {
    return this.height - this.paddingTop - this.paddingBottom;
  }

  private getVisibleDatasets(): LineDataset[] {
    return this.datasets
      .slice(0, 6)
      .map((ds, i) => ({
        ...ds,
        color: ds.color || LINE_COLORS[i % LINE_COLORS.length],
      }))
      .filter(ds => !this.hiddenDatasets.has(ds.id));
  }

  private getTimeRange(): { min: number; max: number } {
    const allPoints = this.datasets.flatMap(ds => ds.data);
    if (allPoints.length === 0) {
      const now = Date.now();
      return { min: now - 3600000, max: now };
    }
    const timestamps = allPoints.map(d => d.timestamp.getTime());
    return { min: Math.min(...timestamps), max: Math.max(...timestamps) };
  }

  private mapToChart(point: TemperaturePoint): ChartPoint {
    const timeRange = this.getTimeRange();
    const timeSpan = timeRange.max - timeRange.min || 1;

    const xRatio = (point.timestamp.getTime() - timeRange.min) / timeSpan;
    const yRatio = (this.maxTemp - point.temperature) / (this.maxTemp - this.minTemp);

    return {
      x: this.paddingLeft + xRatio * this.innerWidth,
      y: this.paddingTop + yRatio * this.innerHeight,
      data: point,
    };
  }

  private getYAxisTicks(): number[] {
    const ticks: number[] = [];
    for (let t = this.minTemp; t <= this.maxTemp; t += 2) {
      ticks.push(t);
    }
    return ticks;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getTimeAxisTicks(): Date[] {
    const timeRange = this.getTimeRange();
    const ticks: Date[] = [];
    const tickCount = 5;
    const span = timeRange.max - timeRange.min;

    for (let i = 0; i <= tickCount; i++) {
      ticks.push(new Date(timeRange.min + (span * i) / tickCount));
    }
    return ticks;
  }

  private toggleDataset(datasetId: string) {
    const newHidden = new Set(this.hiddenDatasets);
    if (newHidden.has(datasetId)) {
      newHidden.delete(datasetId);
    } else {
      newHidden.add(datasetId);
    }
    this.hiddenDatasets = newHidden;
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    this.hoverPosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const timeRange = this.getTimeRange();
    const timeSpan = timeRange.max - timeRange.min || 1;
    const ratio = (mouseX - this.paddingLeft) / this.innerWidth;
    const timestamp = timeRange.min + ratio * timeSpan;

    if (mouseX >= this.paddingLeft && mouseX <= this.width - this.paddingRight) {
      this.hoveredTimestamp = timestamp;
    } else {
      this.hoveredTimestamp = null;
    }
  }

  private handleMouseLeave() {
    this.hoveredTimestamp = null;
  }

  private findClosestPoint(data: TemperaturePoint[], timestamp: number): TemperaturePoint | null {
    if (data.length === 0) return null;

    let closest: TemperaturePoint | null = null;
    let minDiff = Infinity;
    const threshold = Math.max((this.getTimeRange().max - this.getTimeRange().min) * 0.02, 60000);

    for (const point of data) {
      const diff = Math.abs(point.timestamp.getTime() - timestamp);
      if (diff < minDiff && diff <= threshold) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }

  private renderGridLines() {
    const yTicks = this.getYAxisTicks();
    const lines: unknown[] = [];

    for (const temp of yTicks) {
      const yRatio = (this.maxTemp - temp) / (this.maxTemp - this.minTemp);
      const y = this.paddingTop + yRatio * this.innerHeight;

      lines.push(svg`
        <line
          x1="${this.paddingLeft}"
          y1="${y}"
          x2="${this.width - this.paddingRight}"
          y2="${y}"
          stroke="#E8D5C4"
          stroke-width="1"
          stroke-dasharray="3 3"
        />
      `);
    }

    return lines;
  }

  private renderYAxis() {
    const yTicks = this.getYAxisTicks();
    const elements: unknown[] = [];

    for (const temp of yTicks) {
      const yRatio = (this.maxTemp - temp) / (this.maxTemp - this.minTemp);
      const y = this.paddingTop + yRatio * this.innerHeight;

      elements.push(svg`
        <line
          x1="${this.paddingLeft - 5}"
          y1="${y}"
          x2="${this.paddingLeft}"
          y2="${y}"
          stroke="#4A3728"
          stroke-width="2"
        />
        <text
          x="${this.paddingLeft - 10}"
          y="${y}"
          text-anchor="end"
          dominant-baseline="middle"
          font-size="12"
          font-family="system-ui, sans-serif"
          fill="#4A3728"
          font-weight="500"
        >
          ${temp}℃
        </text>
      `);
    }

    elements.push(svg`
      <text
        x="16"
        y="${this.height / 2}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="13"
        font-family="system-ui, sans-serif"
        fill="#4A3728"
        font-weight="600"
        transform="rotate(-90 16 ${this.height / 2})"
      >
        温度 (℃)
      </text>
    `);

    return elements;
  }

  private renderXAxis() {
    const timeTicks = this.getTimeAxisTicks();
    const elements: unknown[] = [];

    const timeRange = this.getTimeRange();
    const timeSpan = timeRange.max - timeRange.min || 1;

    for (const time of timeTicks) {
      const xRatio = (time.getTime() - timeRange.min) / timeSpan;
      const x = this.paddingLeft + xRatio * this.innerWidth;
      const y = this.height - this.paddingBottom;

      elements.push(svg`
        <line
          x1="${x}"
          y1="${y}"
          x2="${x}"
          y2="${y + 5}"
          stroke="#4A3728"
          stroke-width="2"
        />
        <text
          x="${x}"
          y="${y + 18}"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="11"
          font-family="system-ui, sans-serif"
          fill="#4A3728"
        >
          ${this.formatTime(time)}
        </text>
      `);
    }

    elements.push(svg`
      <text
        x="${this.width / 2}"
        y="${this.height - 8}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="13"
        font-family="system-ui, sans-serif"
        fill="#4A3728"
        font-weight="600"
      >
        采集时间
      </text>
    `);

    return elements;
  }

  private renderAxes() {
    return svg`
      <line
        x1="${this.paddingLeft}"
        y1="${this.paddingTop}"
        x2="${this.paddingLeft}"
        y2="${this.height - this.paddingBottom}"
        stroke="#4A3728"
        stroke-width="2"
      />
      <line
        x1="${this.paddingLeft}"
        y1="${this.height - this.paddingBottom}"
        x2="${this.width - this.paddingRight}"
        y2="${this.height - this.paddingBottom}"
        stroke="#4A3728"
        stroke-width="2"
      />
    `;
  }

  private renderTargetBand() {
    const bandConfig: BandConfig = {
      targetRange: this.targetRange,
      minTemp: this.minTemp,
      maxTemp: this.maxTemp,
      chartWidth: this.width,
      chartHeight: this.height,
      paddingTop: this.paddingTop,
      paddingBottom: this.paddingBottom,
      paddingLeft: this.paddingLeft,
      paddingRight: this.paddingRight,
    };

    const band = calculateTargetRangeBand(bandConfig);

    return svg`
      <rect
        x="${band.x}"
        y="${band.y}"
        width="${band.width}"
        height="${band.height}"
        fill="#2E7D32"
        fill-opacity="0.12"
        stroke="#2E7D32"
        stroke-width="1"
        stroke-dasharray="4 4"
        stroke-opacity="0.5"
      />
      <text
        x="${band.x + band.width - 6}"
        y="${band.yStart + 16}"
        text-anchor="end"
        font-size="11"
        font-family="system-ui, sans-serif"
        fill="#2E7D32"
        font-weight="600"
        opacity="0.8"
      >
        目标区间 ${this.targetRange[0]}-${this.targetRange[1]}℃
      </text>
    `;
  }

  private renderLineSegments(dataset: LineDataset) {
    const points = dataset.data.map(p => this.mapToChart(p));
    if (points.length < 2) return [];

    const segments: unknown[] = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];

      const isInterrupted = prev.data.status === 'interrupted' || curr.data.status === 'interrupted';

      segments.push(svg`
        <line
          x1="${prev.x}"
          y1="${prev.y}"
          x2="${curr.x}"
          y2="${curr.y}"
          stroke="${dataset.color}"
          stroke-width="2.5"
          stroke-dasharray="${isInterrupted ? '6 4' : 'none'}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      `);
    }

    return segments;
  }

  private renderDataPoints(dataset: LineDataset) {
    const points = dataset.data.map(p => this.mapToChart(p));
    if (points.length === 0) return [];

    const pointElements: unknown[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const isForged = point.data.status === 'forged';
      const radius = isForged ? 5 : 3;

      pointElements.push(svg`
        <circle
          cx="${point.x}"
          cy="${point.y}"
          r="${radius}"
          fill="${isForged ? '#C62828' : dataset.color}"
          stroke="#FFF8F0"
          stroke-width="1.5"
          opacity="0.9"
        />
        ${isForged ? svg`
          <circle
            cx="${point.x}"
            cy="${point.y}"
            r="${radius + 3}"
            fill="none"
            stroke="#C62828"
            stroke-width="1"
            stroke-dasharray="2 2"
            opacity="0.7"
          />
        ` : ''}
      `);
    }

    return pointElements;
  }

  private renderHoverCrosshair() {
    if (this.hoveredTimestamp === null) return null;

    const timeRange = this.getTimeRange();
    const timeSpan = timeRange.max - timeRange.min || 1;
    const ratio = (this.hoveredTimestamp - timeRange.min) / timeSpan;
    const x = this.paddingLeft + ratio * this.innerWidth;

    const visibleDatasets = this.getVisibleDatasets();
    const dots: unknown[] = [];

    for (const ds of visibleDatasets) {
      const closest = this.findClosestPoint(ds.data, this.hoveredTimestamp);
      if (closest) {
        const point = this.mapToChart(closest);
        dots.push(svg`
          <circle
            cx="${point.x}"
            cy="${point.y}"
            r="6"
            fill="${ds.color}"
            stroke="#FFF8F0"
            stroke-width="2"
          />
        `);
      }
    }

    return svg`
      <line
        x1="${x}"
        y1="${this.paddingTop}"
        x2="${x}"
        y2="${this.height - this.paddingBottom}"
        stroke="#4A3728"
        stroke-width="1"
        stroke-dasharray="4 4"
        opacity="0.5"
      />
      ${dots}
    `;
  }

  private renderTooltip() {
    if (this.hoveredTimestamp === null) return null;

    const visibleDatasets = this.getVisibleDatasets();
    const hoverDate = new Date(this.hoveredTimestamp);

    const rows = visibleDatasets.map(ds => {
      const closest = this.findClosestPoint(ds.data, this.hoveredTimestamp);
      if (closest) {
        return html`
          <div class="tooltip-row">
            <span class="tooltip-label">
              <span class="tooltip-color" style="background: ${ds.color};"></span>
              ${ds.label}
            </span>
            <span class="tooltip-value">${closest.temperature.toFixed(2)}℃</span>
          </div>
        `;
      } else {
        return html`
          <div class="tooltip-row">
            <span class="tooltip-label">
              <span class="tooltip-color" style="background: ${ds.color};"></span>
              ${ds.label}
            </span>
            <span class="tooltip-value missing">--</span>
          </div>
        `;
      }
    });

    return html`
      <div
        class="tooltip"
        style="left: ${this.hoverPosition.x}px; top: ${this.hoverPosition.y - 10}px;"
      >
        <div class="tooltip-header">${this.formatDateTime(hoverDate)}</div>
        ${rows}
      </div>
    `;
  }

  private renderLegend() {
    const datasets = this.datasets.slice(0, 6).map((ds, i) => ({
      ...ds,
      color: ds.color || LINE_COLORS[i % LINE_COLORS.length],
    }));

    return html`
      <div class="legend">
        ${datasets.map(ds => {
          const isHidden = this.hiddenDatasets.has(ds.id);
          return html`
            <div
              class="legend-item ${isHidden ? 'hidden' : ''}"
              @click="${() => this.toggleDataset(ds.id)}"
              title="${isHidden ? '点击显示' : '点击隐藏'}"
            >
              <span
                class="legend-checkbox ${!isHidden ? 'checked' : ''}"
                style="color: ${ds.color};"
              ></span>
              <span class="legend-line" style="background: ${ds.color};"></span>
              <span>${ds.label}</span>
            </div>
          `;
        })}
      </div>
    `;
  }

  override render() {
    const visibleDatasets = this.getVisibleDatasets();
    const hasData = visibleDatasets.some(ds => ds.data.length > 0);

    return html`
      <div class="chart-container">
        <h3 class="chart-title">多轮温度曲线对比</h3>
        <div class="chart-wrapper">
          <svg
            class="chart-svg"
            viewBox="0 0 ${this.width} ${this.height}"
            style="width: 100%; height: auto;"
            @mousemove="${this.handleMouseMove}"
            @mouseleave="${this.handleMouseLeave}"
          >
            ${this.renderTargetBand()}
            ${this.renderGridLines()}
            ${this.renderAxes()}
            ${this.renderYAxis()}
            ${this.renderXAxis()}
            ${hasData ? visibleDatasets.map(ds => this.renderLineSegments(ds)) : ''}
            ${hasData ? visibleDatasets.map(ds => this.renderDataPoints(ds)) : ''}
            ${this.renderHoverCrosshair()}
          </svg>
          ${this.hoveredTimestamp !== null ? this.renderTooltip() : ''}
        </div>
        ${this.renderLegend()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'multi-line-chart': MultiLineChart;
  }
}
