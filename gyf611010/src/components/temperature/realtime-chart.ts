import { LitElement, html, css, svg } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { type TemperaturePoint } from '../../types/index.js';
import { calculateTargetRangeBand, type BandConfig } from './target-range-band.js';

interface ChartPoint {
  x: number;
  y: number;
  data: TemperaturePoint;
  index: number;
}

@customElement('realtime-chart')
export class RealtimeChart extends LitElement {
  @property({ type: Array })
  data: TemperaturePoint[] = [];

  @property({ type: Array })
  targetRange: [number, number] = [10, 14];

  @property({ type: Number })
  width: number = 800;

  @property({ type: Number })
  height: number = 400;

  @state()
  private animationProgress: number = 0;

  @state()
  private hoveredPoint: ChartPoint | null = null;

  @state()
  private hoverPosition: { x: number; y: number } = { x: 0, y: 0 };

  private animationFrame: number | null = null;

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
      min-width: 160px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      transform: translate(-50%, -100%);
      transition: opacity 0.15s ease;
    }

    .tooltip.hidden {
      opacity: 0;
    }

    .tooltip-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin: 3px 0;
    }

    .tooltip-label {
      opacity: 0.8;
    }

    .tooltip-value {
      font-weight: 600;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .tooltip-status {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 248, 240, 0.2);
      font-size: 12px;
    }

    .tooltip-status.forged {
      color: #FF8A80;
    }

    .tooltip-status.interrupted {
      color: #FFD54F;
    }

    .tooltip-status.valid {
      color: #A5D6A7;
    }

    .legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--text);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-swatch {
      width: 16px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-line {
      width: 20px;
      height: 2px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.startAnimation();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('data')) {
      this.animationProgress = 0;
      this.startAnimation();
    }
  }

  private startAnimation() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      this.animationProgress = Math.min(elapsed / duration, 1);

      if (this.animationProgress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private get innerWidth(): number {
    return this.width - this.paddingLeft - this.paddingRight;
  }

  private get innerHeight(): number {
    return this.height - this.paddingTop - this.paddingBottom;
  }

  private getTimeRange(): { min: number; max: number } {
    if (this.data.length === 0) {
      const now = Date.now();
      return { min: now - 3600000, max: now };
    }
    const timestamps = this.data.map(d => d.timestamp.getTime());
    return { min: Math.min(...timestamps), max: Math.max(...timestamps) };
  }

  private mapToChart(point: TemperaturePoint, index: number): ChartPoint {
    const timeRange = this.getTimeRange();
    const timeSpan = timeRange.max - timeRange.min || 1;

    const xRatio = (point.timestamp.getTime() - timeRange.min) / timeSpan;
    const yRatio = (this.maxTemp - point.temperature) / (this.maxTemp - this.minTemp);

    return {
      x: this.paddingLeft + xRatio * this.innerWidth,
      y: this.paddingTop + yRatio * this.innerHeight,
      data: point,
      index,
    };
  }

  private getVisiblePoints(): ChartPoint[] {
    if (this.data.length === 0) return [];

    const visibleCount = Math.ceil(this.data.length * this.easeOutCubic(this.animationProgress));
    const visibleData = this.data.slice(0, visibleCount);

    return visibleData.map((point, index) => this.mapToChart(point, index));
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

  private handleMouseMove(e: MouseEvent) {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    this.hoverPosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const points = this.getVisiblePoints();
    let closestPoint: ChartPoint | null = null;
    let closestDist = Infinity;

    for (const point of points) {
      const dist = Math.sqrt(Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2));
      if (dist < closestDist && dist < 30) {
        closestDist = dist;
        closestPoint = point;
      }
    }

    this.hoveredPoint = closestPoint;
  }

  private handleMouseLeave() {
    this.hoveredPoint = null;
  }

  private getStatusLabel(status: TemperaturePoint['status']): string {
    const labels: Record<TemperaturePoint['status'], string> = {
      valid: '有效数据',
      interrupted: '数据中断',
      forged: '伪造数据',
    };
    return labels[status];
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

  private renderLineSegments() {
    const points = this.getVisiblePoints();
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
          stroke="#D4A574"
          stroke-width="2.5"
          stroke-dasharray="${isInterrupted ? '6 4' : 'none'}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      `);
    }

    return segments;
  }

  private renderDataPoints() {
    const points = this.getVisiblePoints();
    if (points.length === 0) return [];

    const pointElements: unknown[] = [];
    const lastIndex = points.length - 1;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const isForged = point.data.status === 'forged';
      const isLast = i === lastIndex;
      const isHovered = this.hoveredPoint?.index === point.index;

      const radius = isLast ? 8 : (isHovered ? 7 : (isForged ? 6 : 4));

      let fillColor = '#D4A574';
      if (isForged) fillColor = '#C62828';
      if (isLast) fillColor = '#2E7D32';

      pointElements.push(svg`
        <circle
          cx="${point.x}"
          cy="${point.y}"
          r="${radius}"
          fill="${fillColor}"
          stroke="#FFF8F0"
          stroke-width="2"
          style="cursor: pointer; transition: r 0.15s ease;"
        />
        ${isForged ? svg`
          <circle
            cx="${point.x}"
            cy="${point.y}"
            r="${radius + 4}"
            fill="none"
            stroke="#C62828"
            stroke-width="1.5"
            stroke-dasharray="3 2"
            opacity="0.8"
          />
        ` : ''}
        ${isLast ? svg`
          <g>
            <rect
              x="${point.x - 32}"
              y="${point.y - 36}"
              width="64"
              height="24"
              rx="6"
              fill="#2E7D32"
            />
            <text
              x="${point.x}"
              y="${point.y - 20}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="13"
              font-family="system-ui, sans-serif"
              fill="#FFF8F0"
              font-weight="700"
            >
              ${point.data.temperature.toFixed(1)}℃
            </text>
            <polygon
              points="${point.x - 5},${point.y - 12} ${point.x + 5},${point.y - 12} ${point.x},${point.y - 5}"
              fill="#2E7D32"
            />
          </g>
        ` : ''}
      `);
    }

    return pointElements;
  }

  private renderHoverCrosshair() {
    if (!this.hoveredPoint) return null;

    return svg`
      <line
        x1="${this.hoveredPoint.x}"
        y1="${this.paddingTop}"
        x2="${this.hoveredPoint.x}"
        y2="${this.height - this.paddingBottom}"
        stroke="#4A3728"
        stroke-width="1"
        stroke-dasharray="4 4"
        opacity="0.4"
      />
      <line
        x1="${this.paddingLeft}"
        y1="${this.hoveredPoint.y}"
        x2="${this.width - this.paddingRight}"
        y2="${this.hoveredPoint.y}"
        stroke="#4A3728"
        stroke-width="1"
        stroke-dasharray="4 4"
        opacity="0.4"
      />
    `;
  }

  private renderTooltip() {
    if (!this.hoveredPoint) return null;

    const point = this.hoveredPoint;
    const status = point.data.status;

    return html`
      <div
        class="tooltip ${this.hoveredPoint ? '' : 'hidden'}"
        style="left: ${this.hoverPosition.x}px; top: ${this.hoverPosition.y - 10}px;"
      >
        <div class="tooltip-row">
          <span class="tooltip-label">温度:</span>
          <span class="tooltip-value">${point.data.temperature.toFixed(2)}℃</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">时间:</span>
          <span class="tooltip-value">${this.formatTime(point.data.timestamp)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">深度:</span>
          <span class="tooltip-value">${point.data.probeDepth}cm</span>
        </div>
        <div class="tooltip-status ${status}">
          ● ${this.getStatusLabel(status)}
        </div>
      </div>
    `;
  }

  override render() {
    const hasData = this.data.length > 0;

    return html`
      <div class="chart-container">
        <h3 class="chart-title">实时温度曲线</h3>
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
            ${hasData ? this.renderLineSegments() : ''}
            ${hasData ? this.renderDataPoints() : ''}
            ${this.renderHoverCrosshair()}
          </svg>
          ${this.renderTooltip()}
        </div>
        <div class="legend">
          <div class="legend-item">
            <span class="legend-line" style="background: #D4A574;"></span>
            <span>温度曲线</span>
          </div>
          <div class="legend-item">
            <span class="legend-line" style="background: #D4A574; background-image: repeating-linear-gradient(90deg, #D4A574, #D4A574 6px, transparent 6px, transparent 10px);"></span>
            <span>中断区间</span>
          </div>
          <div class="legend-item">
            <span class="legend-swatch" style="background: rgba(46, 125, 50, 0.12); border: 1px dashed #2E7D32;"></span>
            <span>目标区间</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #C62828;"></span>
            <span>异常数据</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #2E7D32;"></span>
            <span>最新值</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'realtime-chart': RealtimeChart;
  }
}
