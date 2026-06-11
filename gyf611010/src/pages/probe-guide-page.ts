import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context.js';
import type { CheeseWheel } from '../types/index.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '../components/probe-guide/cheese-wheel-cross-section.js';
import '../components/probe-guide/depth-indicator.js';
import '../components/probe-guide/probe-guide-step.js';

interface GuideStep {
  step: number;
  title: string;
  description: string;
  minDepth: number;
  maxDepth: number;
  tips: string[];
}

@customElement('probe-guide-page')
export class ProbeGuidePage extends LitElement {
  @consume({ context: cheeseContext, subscribe: true })
  @property({ attribute: false })
  cheeseContextValue: CheeseContextType | undefined;

  @state()
  private selectedWheelId: string = '';

  @state()
  private currentStep: number = 1;

  @state()
  private currentDepth: number = 0;

  @state()
  private completedSteps: Set<number> = new Set();

  @state()
  private depthSimulationTimer: number | null = null;

  private readonly targetDepth: number = 30;

  private readonly guideSteps: GuideStep[] = [
    {
      step: 1,
      title: '表皮接触',
      description: '将探针尖端轻轻接触奶酪轮表皮，确保探头清洁且垂直于表面。等待2-3秒让温度读数稳定。',
      minDepth: 0,
      maxDepth: 5,
      tips: [
        '确保探针已消毒',
        '探头与表皮成90度角',
        '避免用力过猛导致表皮破损',
      ],
    },
    {
      step: 2,
      title: '中层插入',
      description: '缓慢匀速地将探针插入奶酪轮中层区域，保持稳定垂直的插入角度。注意观察温度变化趋势。',
      minDepth: 5,
      maxDepth: 20,
      tips: [
        '插入速度保持约1cm/秒',
        '避免突然用力或旋转探针',
        '若遇到阻力可轻微调整角度',
      ],
    },
    {
      step: 3,
      title: '核心定位',
      description: '继续将探针插入至奶酪轮核心区域（目标深度70%以上），确保温度传感器完全处于核心位置。',
      minDepth: 20,
      maxDepth: 30,
      tips: [
        '目标深度应≥21cm（70%）',
        '到达目标深度后保持静止',
        '等待温度读数稳定后开始监测',
      ],
    },
  ];

  static override styles = css`
    :host {
      --primary: #D4A574;
      --primary-light: #F5DEB3;
      --bg: #FFF8F0;
      --text: #4A3728;
      --text-secondary: #8B7355;
      --success: #2E7D32;
      --warning: #FF8F00;
      --danger: #C62828;
      --border: #E8D5C4;

      display: block;
      min-height: 100vh;
      background: var(--bg);
      font-family: var(--sans, system-ui, sans-serif);
    }

    .page-header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 20px 32px;
    }

    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .back-btn:hover {
      background: var(--primary-light);
      color: var(--text);
    }

    .page-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 24px;
      font-weight: 600;
      color: var(--text);
      margin: 0;
    }

    .page-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 32px;
    }

    .selection-section {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--border);
      margin-bottom: 24px;
    }

    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 12px;
      display: block;
    }

    .selection-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    sl-select {
      flex: 1;
      min-width: 300px;
      --sl-input-height-medium: 44px;
    }

    .guide-main {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .visual-panel {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--border);
    }

    .panel-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .panel-title sl-icon {
      color: var(--primary);
      font-size: 20px;
    }

    .cross-section-wrapper {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }

    .depth-indicator-wrapper {
      margin-top: 16px;
    }

    .steps-panel {
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .tips-card {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #FFF8F0 0%, #F5E6D3 100%);
      border-radius: 12px;
      border-left: 4px solid var(--primary);
    }

    .tips-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tips-title sl-icon {
      color: var(--warning);
    }

    .tips-list {
      margin: 0;
      padding-left: 20px;
    }

    .tips-list li {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 4px;
    }

    .controls-bar {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .controls-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .depth-display {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }

    .depth-value {
      color: var(--primary);
    }

    .controls-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-nav::part(base) {
      background: #ffffff;
      border: 2px solid var(--border);
      color: var(--text);
      font-weight: 600;
      padding: 10px 24px;
    }

    .btn-nav::part(base):hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--text);
    }

    .btn-nav:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-next::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #C4956A 100%);
      border: none;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 28px;
    }

    .btn-next::part(base):hover:not(:disabled) {
      background: linear-gradient(135deg, #C4956A 0%, #B4855A 100%);
      transform: translateY(-1px);
    }

    .btn-confirm::part(base) {
      background: linear-gradient(135deg, #66BB6A 0%, #2E7D32 100%);
      border: none;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 28px;
    }

    .btn-confirm::part(base):hover:not(:disabled) {
      background: linear-gradient(135deg, #59A85D 0%, #256529 100%);
      transform: translateY(-1px);
    }

    .btn-confirm:disabled::part(base) {
      background: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .simulate-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }

    .sim-btn::part(base) {
      background: var(--primary-light);
      border: none;
      color: var(--text);
      font-size: 13px;
      font-weight: 500;
      padding: 6px 14px;
    }

    .sim-btn::part(base):hover {
      background: var(--primary);
      color: #ffffff;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-secondary);
    }

    .empty-state sl-icon {
      font-size: 56px;
      color: var(--border);
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 15px;
      margin: 0;
    }

    @media (max-width: 900px) {
      .guide-main { grid-template-columns: 1fr; }
      .controls-bar { flex-direction: column; }
      .page-content { padding: 20px; }
      .page-header { padding: 16px 20px; }
    }
  `;

  private get cheeseWheels(): CheeseWheel[] {
    return this.cheeseContextValue?.cheeseWheels || [];
  }

  private get currentStepData(): GuideStep {
    return this.guideSteps[this.currentStep - 1] || this.guideSteps[0];
  }

  private get isAtTargetDepth(): boolean {
    const depthPercent = (this.currentDepth / this.targetDepth) * 100;
    return depthPercent >= 70;
  }

  private get canConfirm(): boolean {
    return this.isAtTargetDepth && this.selectedWheelId !== '';
  }

  private get canGoNext(): boolean {
    if (this.currentStep >= this.guideSteps.length) return false;
    const step = this.currentStepData;
    return this.currentDepth >= step.minDepth;
  }

  private get canGoPrev(): boolean {
    return this.currentStep > 1;
  }

  private handleWheelChange(e: Event) {
    const select = e.target as any;
    const wheelId = select.value;
    this.selectedWheelId = wheelId;
    if (this.cheeseContextValue && wheelId) {
      this.cheeseContextValue.selectCheeseWheel(wheelId);
    }
  }

  private handleBack() {
    this.stopDepthSimulation();
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { view: 'dashboard' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handlePrevStep() {
    if (this.canGoPrev) {
      this.currentStep--;
    }
  }

  private handleNextStep() {
    if (this.canGoNext) {
      this.completedSteps.add(this.currentStep);
      if (this.currentStep < this.guideSteps.length) {
        this.currentStep++;
      }
    }
  }

  private handleConfirm() {
    if (!this.canConfirm) return;
    this.stopDepthSimulation();
    this.completedSteps.add(this.currentStep);
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { view: 'temperature-monitor' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleStepComplete(e: CustomEvent) {
    const step = e.detail.step;
    if (step === this.currentStep && this.canGoNext) {
      this.handleNextStep();
    }
  }

  private startDepthSimulation(targetDepth: number) {
    this.stopDepthSimulation();
    this.depthSimulationTimer = window.setInterval(() => {
      if (this.currentDepth < targetDepth) {
        this.currentDepth = Math.min(this.currentDepth + 0.5, targetDepth);
      } else {
        this.stopDepthSimulation();
      }
    }, 100);
  }

  private stopDepthSimulation() {
    if (this.depthSimulationTimer !== null) {
      clearInterval(this.depthSimulationTimer);
      this.depthSimulationTimer = null;
    }
  }

  private handleSimulateInsert() {
    const step = this.currentStepData;
    this.startDepthSimulation(step.maxDepth);
  }

  private handleResetDepth() {
    this.stopDepthSimulation();
    this.currentDepth = 0;
    this.currentStep = 1;
    this.completedSteps.clear();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopDepthSimulation();
  }

  override render() {
    const wheels = this.cheeseWheels;
    const stepData = this.currentStepData;
    const progressPercent = (this.currentDepth / this.targetDepth) * 100;

    if (wheels.length === 0) {
      return html`
        <div class="page-header">
          <div class="header-row">
            <button class="back-btn" @click=${this.handleBack}>
              <sl-icon name="arrow-left"></sl-icon>
              返回仪表盘
            </button>
            <h1 class="page-title">探针插入引导</h1>
            <div style="width: 120px;"></div>
          </div>
        </div>
        <div class="page-content">
          <div class="empty-state">
            <sl-icon name="box"></sl-icon>
            <p>暂无奶酪轮数据，请先在管理页面添加奶酪轮</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="page-header">
        <div class="header-row">
          <button class="back-btn" @click=${this.handleBack}>
            <sl-icon name="arrow-left"></sl-icon>
            返回仪表盘
          </button>
          <h1 class="page-title">探针插入引导</h1>
          <div style="width: 120px;"></div>
        </div>
      </div>

      <div class="page-content">
        <div class="selection-section">
          <label class="section-label">选择奶酪轮</label>
          <div class="selection-row">
            <sl-select
              placeholder="请选择要测量的奶酪轮..."
              value=${this.selectedWheelId}
              @sl-change=${this.handleWheelChange}
            >
              ${wheels.map(
                wheel => html`
                  <sl-option value=${wheel.id}>
                    ${wheel.wheelNumber} - 窖位: ${wheel.cellarPositionId} | 状态: ${wheel.status}
                  </sl-option>
                `
              )}
            </sl-select>
            ${this.selectedWheelId
              ? html`
                  <sl-badge variant="primary">
                    目标区间: ${wheels.find(w => w.id === this.selectedWheelId)?.targetTempRange[0] || '--'}-${wheels.find(w => w.id === this.selectedWheelId)?.targetTempRange[1] || '--'}°C
                  </sl-badge>
                `
              : ''
            }
          </div>
        </div>

        <div class="guide-main">
          <div class="visual-panel">
            <h3 class="panel-title">
              <sl-icon name="eye"></sl-icon>
              探针位置示意
            </h3>
            <div class="cross-section-wrapper">
              <cheese-wheel-cross-section
                .currentDepth=${this.currentDepth}
                .targetDepth=${this.targetDepth}
              ></cheese-wheel-cross-section>
            </div>
            <div class="depth-indicator-wrapper">
              <depth-indicator
                .currentDepth=${this.currentDepth}
                .targetDepth=${this.targetDepth}
                .currentStep=${this.currentStep}
                .totalSteps=${this.guideSteps.length}
              ></depth-indicator>
            </div>
            <div class="simulate-controls">
              <sl-button class="sim-btn" @click=${this.handleSimulateInsert}>
                <sl-icon slot="prefix" name="play-fill"></sl-icon>
                模拟插入当前步骤
              </sl-button>
              <sl-button class="sim-btn" @click=${this.handleResetDepth}>
                <sl-icon slot="prefix" name="arrow-counterclockwise"></sl-icon>
                重置
              </sl-button>
            </div>
          </div>

          <div class="steps-panel">
            <h3 class="panel-title">
              <sl-icon name="list-check"></sl-icon>
              插入步骤引导
            </h3>
            <div class="steps-list" @step-complete=${this.handleStepComplete}>
              ${this.guideSteps.map(
                step => html`
                  <probe-guide-step
                    .step=${step.step}
                    .title=${step.title}
                    .description=${step.description}
                    .isActive=${this.currentStep === step.step}
                    .isCompleted=${this.completedSteps.has(step.step)}
                  ></probe-guide-step>
                `
              )}
            </div>

            <div class="tips-card">
              <h4 class="tips-title">
                <sl-icon name="lightbulb"></sl-icon>
                操作提示
              </h4>
              <ul class="tips-list">
                ${stepData.tips.map(tip => html`<li>${tip}</li>`)}
              </ul>
            </div>
          </div>
        </div>

        <div class="controls-bar">
          <div class="controls-left">
            <span class="depth-display">
              当前深度: <span class="depth-value">${this.currentDepth.toFixed(1)} cm</span>
              / ${this.targetDepth} cm (${progressPercent.toFixed(0)}%)
            </span>
            ${this.isAtTargetDepth
              ? html`
                  <sl-badge variant="success" pulse>
                    <sl-icon slot="prefix" name="check-circle-fill"></sl-icon>
                    已达到目标深度
                  </sl-badge>
                `
              : html`
                  <sl-badge variant="warning">
                    请插入至 ${Math.ceil(this.targetDepth * 0.7)}cm 以上
                  </sl-badge>
                `
            }
          </div>
          <div class="controls-right">
            <sl-button
              class="btn-nav"
              @click=${this.handlePrevStep}
              ?disabled=${!this.canGoPrev}
            >
              <sl-icon slot="prefix" name="chevron-left"></sl-icon>
              上一步
            </sl-button>
            ${this.currentStep < this.guideSteps.length
              ? html`
                  <sl-button
                    class="btn-next"
                    @click=${this.handleNextStep}
                    ?disabled=${!this.canGoNext}
                  >
                    下一步
                    <sl-icon slot="suffix" name="chevron-right"></sl-icon>
                  </sl-button>
                `
              : html`
                  <sl-button
                    class="btn-confirm"
                    @click=${this.handleConfirm}
                    ?disabled=${!this.canConfirm}
                  >
                    <sl-icon slot="prefix" name="check-lg"></sl-icon>
                    确认并开始监测
                  </sl-button>
                `
            }
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'probe-guide-page': ProbeGuidePage;
  }
}
