import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('temperature-gauge')
export class TemperatureGauge extends LitElement {
  @property({ type: Number })
  currentTemperature: number = 0;

  @property({ type: Array })
  targetRange: [number, number] = [10, 14];

  @property({ type: Number })
  minTemp: number = 8;

  @property({ type: Number })
  maxTemp: number = 18;

  static override styles = css`
    :host {
      --primary: #D4A574;
      --success: #2E7D32;
      --danger: #C62828;
      --bg: #FFF8F0;
      --text: #4A3728;

      display: inline-block;
    }

    .gauge-container {
      position: relative;
      width: 280px;
      height: 160px;
      padding: 20px;
      background: var(--bg);
      border-radius: 20px;
      border: 3px solid var(--primary);
      box-shadow: 0 4px 20px rgba(74, 55, 40, 0.15);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .gauge-container.in-range {
      border-color: var(--success);
      box-shadow: 0 4px 20px rgba(46, 125, 50, 0.2);
    }

    .gauge-container.out-of-range {
      border-color: var(--danger);
      box-shadow: 0 4px 20px rgba(198, 40, 40, 0.2);
      animation: warningPulse 2s infinite;
    }

    .gauge-svg {
      width: 100%;
      height: 120px;
      overflow: visible;
    }

    .temp-display {
      text-align: center;
      margin-top: -10px;
    }

    .temp-value {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 42px;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
      transition: color 0.3s ease;
    }

    .in-range .temp-value {
      color: var(--success);
    }

    .out-of-range .temp-value {
      color: var(--danger);
    }

    .temp-unit {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 18px;
      color: #8B7355;
      font-weight: 500;
      margin-left: 4px;
    }

    .range-label {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 12px;
      color: #8B7355;
      text-align: center;
      margin-top: 4px;
    }

    @keyframes warningPulse {
      0%, 100% {
        box-shadow: 0 4px 20px rgba(198, 40, 40, 0.2);
      }
      50% {
        box-shadow: 0 4px 30px rgba(198, 40, 40, 0.4);
      }
    }
  `;

  private get isInRange(): boolean {
    return this.currentTemperature >= this.targetRange[0] &&
           this.currentTemperature <= this.targetRange[1];
  }

  private get containerClass(): string {
    if (this.isInRange) return 'in-range';
    return 'out-of-range';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private tempToAngle(temp: number): number {
    const clamped = this.clamp(temp, this.minTemp, this.maxTemp);
    const ratio = (clamped - this.minTemp) / (this.maxTemp - this.minTemp);
    return -180 + ratio * 180;
  }

  private polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  }

  private describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = this.polarToCartesian(cx, cy, r, endAngle);
    const end = this.polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  override render() {
    const cx = 120;
    const cy = 120;
    const outerRadius = 100;

    const startAngle = this.tempToAngle(this.targetRange[0]);
    const endAngle = this.tempToAngle(this.targetRange[1]);
    const needleAngle = this.tempToAngle(this.currentTemperature);

    const needleTip = this.polarToCartesian(cx, cy, outerRadius - 8, needleAngle);
    const needleBase1 = this.polarToCartesian(cx, cy, 10, needleAngle - 90);
    const needleBase2 = this.polarToCartesian(cx, cy, 10, needleAngle + 90);

    return html`
      <div class="gauge-container ${this.containerClass}">
        <svg class="gauge-svg" viewBox="0 0 240 130">
          <path
            d="${this.describeArc(cx, cy, outerRadius, -180, 0)}"
            fill="none"
            stroke="#E8D5C4"
            stroke-width="16"
            stroke-linecap="round"
          />

          <path
            d="${this.describeArc(cx, cy, outerRadius, startAngle, endAngle)}"
            fill="none"
            stroke="#2E7D32"
            stroke-width="16"
            stroke-linecap="round"
            opacity="0.8"
          />

          <g>
            ${[this.minTemp, this.targetRange[0], this.targetRange[1], this.maxTemp].map((temp) => {
              const angle = this.tempToAngle(temp);
              const tickOuter = this.polarToCartesian(cx, cy, outerRadius + 8, angle);
              const tickInner = this.polarToCartesian(cx, cy, outerRadius - 4, angle);
              const labelPos = this.polarToCartesian(cx, cy, outerRadius + 20, angle);
              return html`
                <line
                  x1="${tickOuter.x}"
                  y1="${tickOuter.y}"
                  x2="${tickInner.x}"
                  y2="${tickInner.y}"
                  stroke="#4A3728"
                  stroke-width="2"
                />
                <text
                  x="${labelPos.x}"
                  y="${labelPos.y}"
                  text-anchor="middle"
                  dominant-baseline="middle"
                  font-size="11"
                  font-family="system-ui, sans-serif"
                  fill="#4A3728"
                  font-weight="600"
                >
                  ${temp}℃
                </text>
              `;
            })}
          </g>

          <polygon
            points="${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}"
            fill="${this.isInRange ? '#2E7D32' : '#C62828'}"
            style="transform-origin: ${cx}px ${cy}px; transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);"
          />

          <circle
            cx="${cx}"
            cy="${cy}"
            r="12"
            fill="${this.isInRange ? '#2E7D32' : '#C62828'}"
          />
          <circle
            cx="${cx}"
            cy="${cy}"
            r="5"
            fill="#FFF8F0"
          />
        </svg>

        <div class="temp-display">
          <span class="temp-value">${this.currentTemperature.toFixed(1)}</span>
          <span class="temp-unit">℃</span>
        </div>
        <div class="range-label">
          目标区间: ${this.targetRange[0]}℃ ~ ${this.targetRange[1]}℃
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'temperature-gauge': TemperatureGauge;
  }
}
