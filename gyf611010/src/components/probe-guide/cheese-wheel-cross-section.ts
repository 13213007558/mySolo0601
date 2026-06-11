import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import type { ProbeGuideState } from '../../types/index';

@customElement('cheese-wheel-cross-section')
export class CheeseWheelCrossSection extends LitElement {
  @property({ type: Number })
  currentDepth: ProbeGuideState['currentDepth'] = 0;

  @property({ type: Number })
  targetDepth: ProbeGuideState['targetDepth'] = 30;

  private readonly svgSize = 300;
  private readonly centerX = 150;
  private readonly centerY = 150;
  private readonly outerRadius = 130;
  private readonly innerRadius = 110;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
    }

    .container {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .probe {
      transition: transform 0.5s ease-in-out;
    }

    .probe-shaft {
      fill: url(#silverGradient);
    }

    .probe-tip {
      fill: #ffffff;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
    }

    .depth-label {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 10px;
      fill: #4A3728;
      font-weight: 500;
    }

    .zone-label {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 9px;
      fill: #ffffff;
      font-weight: 600;
      text-anchor: middle;
    }

    .zone-core {
      fill: rgba(34, 197, 94, 0.3);
    }

    .zone-middle {
      fill: rgba(212, 165, 116, 0.6);
    }

    .zone-rind {
      fill: rgba(139, 90, 43, 0.7);
    }

    .tick-mark {
      stroke: #4A3728;
      stroke-width: 1.5;
    }

    .tick-label {
      font-family: var(--sans, system-ui, sans-serif);
      font-size: 8px;
      fill: #4A3728;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    .probe-glow {
      animation: pulse 2s ease-in-out infinite;
    }
  `;

  private getProbeY(depth: number): number {
    const maxDepth = this.targetDepth || 30;
    const radius = this.outerRadius;
    const depthRatio = Math.min(depth / maxDepth, 1);
    return this.centerY - radius + depthRatio * radius * 2;
  }

  private getZoneBoundaries(): { rind: number; middle: number; core: number } {
    const radius = this.outerRadius - this.innerRadius;
    return {
      rind: this.innerRadius + radius * 0.25,
      middle: this.innerRadius + radius * 0.7,
      core: this.outerRadius
    };
  }

  private renderDepthTicks() {
    const ticks = [];
    const maxDepth = this.targetDepth || 30;
    const tickCount = 6;
    const radius = this.outerRadius;

    for (let i = 0; i <= tickCount; i++) {
      const ratio = i / tickCount;
      const y = this.centerY - radius + ratio * radius * 2;
      const depth = Math.round(ratio * maxDepth);
      const x1 = this.centerX + this.outerRadius + 10;
      const x2 = this.centerX + this.outerRadius + 20;

      ticks.push(html`
        <line
          class="tick-mark"
          x1=${x1}
          y1=${y}
          x2=${x2}
          y2=${y}
        />
        <text
          class="tick-label"
          x=${x2 + 5}
          y=${y + 3}
        >
          ${depth} cm
        </text>
      `);
    }

    return ticks;
  }

  private renderZones() {
    const boundaries = this.getZoneBoundaries();
    const startAngle = -90;
    const endAngle = 90;

    const createArcPath = (innerR: number, outerR: number, startA: number, endA: number) => {
      const startRad = (startA * Math.PI) / 180;
      const endRad = (endA * Math.PI) / 180;

      const x1 = this.centerX + innerR * Math.cos(startRad);
      const y1 = this.centerY + innerR * Math.sin(startRad);
      const x2 = this.centerX + outerR * Math.cos(startRad);
      const y2 = this.centerY + outerR * Math.sin(startRad);
      const x3 = this.centerX + outerR * Math.cos(endRad);
      const y3 = this.centerY + outerR * Math.sin(endRad);
      const x4 = this.centerX + innerR * Math.cos(endRad);
      const y4 = this.centerY + innerR * Math.sin(endRad);

      const largeArc = endA - startA > 180 ? 1 : 0;

      return `M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1} Z`;
    };

    return html`
      <path
        class="zone-rind"
        d=${createArcPath(this.innerRadius, boundaries.rind, startAngle, endAngle)}
      />
      <path
        class="zone-middle"
        d=${createArcPath(boundaries.rind, boundaries.middle, startAngle, endAngle)}
      />
      <path
        class="zone-core"
        d=${createArcPath(boundaries.middle, boundaries.core, startAngle, endAngle)}
      />

      <text class="zone-label" x=${this.centerX + 8} y=${this.centerY - (this.innerRadius + boundaries.rind) / 2 + 4}>
        表皮区
      </text>
      <text class="zone-label" x=${this.centerX + 8} y=${this.centerY - (boundaries.rind + boundaries.middle) / 2 + 4}>
        中层区
      </text>
      <text class="zone-label" x=${this.centerX + 8} y=${this.centerY - (boundaries.middle + boundaries.core) / 2 + 4}>
        核心区
      </text>
    `;
  }

  render() {
    const probeY = this.getProbeY(this.currentDepth);
    const progress = this.targetDepth > 0 ? (this.currentDepth / this.targetDepth) * 100 : 0;

    return html`
      <div class="container">
        <svg viewBox="0 0 ${this.svgSize} ${this.svgSize}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="cheeseGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#F5DEB3" />
              <stop offset="70%" stop-color="#D4A574" />
              <stop offset="100%" stop-color="#8B5A2B" />
            </radialGradient>
            <linearGradient id="silverGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#C0C0C0" />
              <stop offset="50%" stop-color="#E8E8E8" />
              <stop offset="100%" stop-color="#A0A0A0" />
            </linearGradient>
            <clipPath id="cheeseClip">
              <circle cx=${this.centerX} cy=${this.centerY} r=${this.outerRadius} />
            </clipPath>
          </defs>

          <circle
            cx=${this.centerX}
            cy=${this.centerY}
            r=${this.outerRadius}
            fill="url(#cheeseGradient)"
            stroke="#8B5A2B"
            stroke-width="3"
          />

          ${this.renderZones()}

          <line
            x1=${this.centerX}
            y1=${this.centerY - this.outerRadius}
            x2=${this.centerX}
            y2=${this.centerY + this.outerRadius}
            stroke="#4A3728"
            stroke-width="1"
            stroke-dasharray="4,4"
            opacity="0.5"
          />

          ${this.renderDepthTicks()}

          <g class="probe" style="transform: translateY(${probeY - this.centerY}px)">
            <g class="probe-glow">
              <ellipse
                cx=${this.centerX}
                cy=${this.centerY}
                rx="8"
                ry="8"
                fill="rgba(255, 255, 255, 0.3)"
              />
            </g>

            <rect
              class="probe-shaft"
              x=${this.centerX - 3}
              y=${this.centerY - 40}
              width="6"
              height="35"
              rx="2"
            />

            <polygon
              class="probe-tip"
              points="${this.centerX - 4},${this.centerY - 5} ${this.centerX + 4},${this.centerY - 5} ${this.centerX},${this.centerY + 8}"
            />

            <text
              class="depth-label"
              x=${this.centerX + 15}
              y=${this.centerY + 4}
            >
              ${this.currentDepth.toFixed(1)} cm
            </text>
          </g>

          <text
            class="depth-label"
            x=${this.centerX}
            y=${this.centerY + this.outerRadius + 25}
            text-anchor="middle"
            style="font-size: 12px; font-weight: 600;"
          >
            进度: ${progress.toFixed(0)}%
          </text>
        </svg>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cheese-wheel-cross-section': CheeseWheelCrossSection;
  }
}
