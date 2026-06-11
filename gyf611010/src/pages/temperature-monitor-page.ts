import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context.js';
import { authContext, type AuthContextType } from '../context/auth-context.js';
import type { CheeseWheel, TemperaturePoint, User } from '../types/index.js';
import { temperatureService } from '../services/temperature-service.js';
import { alertService } from '../services/alert-service.js';
import { forgeryDetector } from '../services/forgery-detector.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '../components/temperature/realtime-chart.js';
import '../components/temperature/temperature-gauge.js';
import '../components/common/countdown-timer.js';
import '../components/common/status-badge.js';

type ProbeStatus = 'inserted' | 'removed';

@customElement('temperature-monitor-page')
export class TemperatureMonitorPage extends LitElement {
  @consume({ context: cheeseContext, subscribe: true })
  @property({ attribute: false })
  cheeseContextValue: CheeseContextType | undefined;

  @consume({ context: authContext, subscribe: true })
  @property({ attribute: false })
  authContextValue: AuthContextType | undefined;

  @state()
  private selectedWheel: CheeseWheel | null = null;

  @state()
  private temperatureData: TemperaturePoint[] = [];

  @state()
  private isMonitoring: boolean = false;

  @state()
  private probeStatus: ProbeStatus = 'inserted';

  @state()
  private stableMinutes: number = 0;

  @state()
  private canPrintLabel: boolean = false;

  @state()
  private countdownSeconds: number = 0;

  @state()
  private isCountdownRunning: boolean = false;

  @state()
  private showAlertDialog: boolean = false;

  @state()
  private alertMessage: string = '';

  @state()
  private alertType: 'warning' | 'danger' | 'info' = 'warning';

  @state()
  private showForgeryWarning: boolean = false;

  @state()
  private currentTemperature: number = 0;

  @state()
  private dataInterrupted: boolean = false;

  private readonly REQUIRED_STABLE_MINUTES = 10;
  private readonly COUNTDOWN_DURATION = 10 * 60;
  private readonly TARGET_STABLE_MS = this.REQUIRED_STABLE_MINUTES * 60 * 1000;

  private stableCheckTimer: number | null = null;

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
      max-width: 1400px;
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
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px 32px;
    }

    .wheel-info-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      border: 1px solid var(--border);
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
    }

    .wheel-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      align-items: center;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
    }

    .info-item.status-badge-item {
      align-items: flex-end;
    }

    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .chart-panel {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
    }

    .side-panels {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .gauge-panel {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .panel-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 16px 0;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-title sl-icon {
      color: var(--primary);
    }

    .probe-status-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-top: 16px;
      width: 100%;
      box-sizing: border-box;
    }

    .probe-status-indicator.inserted {
      background: rgba(46, 125, 50, 0.1);
      border: 1px solid rgba(46, 125, 50, 0.3);
    }

    .probe-status-indicator.removed {
      background: rgba(198, 40, 40, 0.1);
      border: 1px solid rgba(198, 40, 40, 0.3);
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-dot.inserted {
      background: var(--success);
      box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.2);
    }

    .status-dot.removed {
      background: var(--danger);
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .probe-status-text {
      font-size: 14px;
      font-weight: 600;
    }

    .probe-status-text.inserted { color: var(--success); }
    .probe-status-text.removed { color: var(--danger); }

    .countdown-panel {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
    }

    .countdown-warning {
      margin-top: 12px;
      padding: 12px;
      background: rgba(255, 143, 0, 0.1);
      border-radius: 8px;
      font-size: 13px;
      color: var(--warning);
      line-height: 1.5;
    }

    .stable-info {
      margin-top: 16px;
      padding: 12px 16px;
      background: var(--primary-light);
      border-radius: 10px;
    }

    .stable-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stable-value {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-top: 4px;
    }

    .stable-progress {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
    }

    .stable-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary) 0%, var(--success) 100%);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .controls-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px 24px;
      border: 1px solid var(--border);
    }

    .controls-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 16px 0;
    }

    .controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-primary::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #C4956A 100%);
      border: none;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 22px;
    }

    .btn-primary::part(base):hover:not(:disabled) {
      background: linear-gradient(135deg, #C4956A 0%, #B4855A 100%);
      transform: translateY(-1px);
    }

    .btn-success::part(base) {
      background: linear-gradient(135deg, #66BB6A 0%, #2E7D32 100%);
      border: none;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 22px;
    }

    .btn-success::part(base):hover:not(:disabled) {
      background: linear-gradient(135deg, #59A85D 0%, #256529 100%);
      transform: translateY(-1px);
    }

    .btn-success:disabled::part(base) {
      background: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .btn-secondary::part(base) {
      background: #ffffff;
      border: 2px solid var(--border);
      color: var(--text);
      font-weight: 600;
      padding: 10px 22px;
    }

    .btn-secondary::part(base):hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--text);
    }

    .btn-danger::part(base) {
      background: #ffffff;
      border: 2px solid var(--danger);
      color: var(--danger);
      font-weight: 600;
      padding: 10px 22px;
    }

    .btn-danger::part(base):hover:not(:disabled) {
      background: var(--danger);
      color: #ffffff;
    }

    .btn-print-label:disabled::part(base) {
      background: #e0e0e0;
      border-color: #e0e0e0;
      color: #999999;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .btn-group-label {
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
      margin-right: 8px;
    }

    .spacer {
      flex: 1;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: var(--text-secondary);
    }

    .empty-state sl-icon {
      font-size: 64px;
      color: var(--border);
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 15px;
      margin: 0 0 20px 0;
    }

    .alert-dialog-content {
      padding: 8px 0;
    }

    .alert-dialog-content p {
      font-size: 15px;
      line-height: 1.6;
      color: var(--text);
      margin: 0 0 12px 0;
    }

    .forgery-warning {
      padding: 16px;
      background: rgba(198, 40, 40, 0.1);
      border: 2px solid var(--danger);
      border-radius: 12px;
      margin-top: 16px;
    }

    .forgery-warning h4 {
      margin: 0 0 8px 0;
      color: var(--danger);
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .forgery-warning p {
      margin: 0;
      font-size: 13px;
      color: var(--text);
      line-height: 1.5;
    }

    @media (max-width: 1100px) {
      .main-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .page-content { padding: 16px; }
      .page-header { padding: 16px 20px; }
      .wheel-info-grid { grid-template-columns: 1fr 1fr; }
      .controls-row { flex-direction: column; align-items: stretch; }
    }
  `;

  private get currentUser(): User | null {
    return this.authContextValue?.currentUser || null;
  }

  private get targetRange(): [number, number] {
    return this.selectedWheel?.targetTempRange || [12, 14];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.selectedWheel = this.cheeseContextValue?.selectedCheeseWheel || null;
    if (this.selectedWheel) {
      this.temperatureData = [...this.selectedWheel.temperatureHistory];
      this.updateCurrentTemperature();
      this.checkStableTime();
      this.checkTemperatureSpike();
      this.checkForgery();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopMonitoring();
    this.stopStableCheck();
  }

  private handleBack() {
    this.stopMonitoring();
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { view: 'dashboard' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private updateCurrentTemperature() {
    if (this.temperatureData.length > 0) {
      this.currentTemperature = this.temperatureData[this.temperatureData.length - 1].temperature;
    }
  }

  private handleTemperaturePoint(point: TemperaturePoint, wheelId: string) {
    this.temperatureData = [...this.temperatureData, point];
    this.updateCurrentTemperature();

    if (this.cheeseContextValue && this.selectedWheel) {
      this.cheeseContextValue.updateTemperature(wheelId, point.temperature, point.probeDepth);
    }

    this.checkStableTime();
    this.checkTemperatureSpike();
    this.checkProbeRemoval();
    this.checkForgery();
  }

  private startMonitoring() {
    if (!this.selectedWheel || this.probeStatus !== 'inserted') return;

    this.isMonitoring = true;
    this.dataInterrupted = false;
    this.stopCountdown();
    temperatureService.startSampling(this.selectedWheel.id, this.handleTemperaturePoint.bind(this));
    this.startStableCheck();
  }

  private stopMonitoring() {
    this.isMonitoring = false;
    temperatureService.stopSampling();
    this.stopStableCheck();
  }

  private toggleMonitoring() {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }

  private startStableCheck() {
    this.stopStableCheck();
    this.stableCheckTimer = window.setInterval(() => {
      this.checkStableTime();
    }, 5000);
  }

  private stopStableCheck() {
    if (this.stableCheckTimer !== null) {
      clearInterval(this.stableCheckTimer);
      this.stableCheckTimer = null;
    }
  }

  private checkStableTime() {
    const result = temperatureService.calculateStableTime(
      this.temperatureData,
      this.targetRange
    );
    this.stableMinutes = Math.floor(result.stableDuration / 60000);
    this.canPrintLabel = result.stableDuration >= this.TARGET_STABLE_MS;
  }

  private checkTemperatureSpike() {
    const spikeResult = alertService.checkTemperatureSpike(this.temperatureData);
    if (spikeResult.hasSpike && this.selectedWheel) {
      const alert = alertService.createAlertFromSpike(this.selectedWheel.id, spikeResult);
      if (alert) {
        this.showAlert(
          `温度异常告警: ${spikeResult.maxIncrease.toFixed(1)}°C 升温`,
          `检测到温度异常升高 ${spikeResult.maxIncrease.toFixed(1)}°C，请检查设备和环境。`,
          'danger'
        );
      }
    }
  }

  private checkProbeRemoval() {
    const removalResult = temperatureService.detectProbeRemoval(this.temperatureData);
    if (removalResult.removed && this.probeStatus === 'inserted') {
      this.probeStatus = 'removed';
      this.stopMonitoring();
      this.startCountdown();
      this.showAlert(
        '探针已拔出',
        `检测到探针拔出（温度骤降 ${removalResult.dropMagnitude.toFixed(1)}°C）。请在10分钟内重新插入，否则将标记数据中断。`,
        'warning'
      );
    }
  }

  private checkForgery() {
    if (this.temperatureData.length < 10) return;

    const result = forgeryDetector.isForged(this.temperatureData);
    if (result.forged && this.currentUser) {
      this.showForgeryWarning = true;
      if (this.selectedWheel) {
        alertService.addAlert(
          this.selectedWheel.id,
          'forgery_detected',
          'critical'
        );
      }
      if (this.authContextValue) {
        this.authContextValue.lockUser(this.currentUser.id);
      }
      this.showAlert(
        '⚠️ 伪造数据检测警告',
        `检测到疑似伪造数据（置信度: ${result.confidence}%）。账号已被冻结，请联系管理员。\n原因: ${result.reasons.join('; ')}`,
        'danger'
      );
    }
  }

  private startCountdown() {
    this.countdownSeconds = this.COUNTDOWN_DURATION;
    this.isCountdownRunning = true;
  }

  private stopCountdown() {
    this.isCountdownRunning = false;
    this.countdownSeconds = 0;
  }

  private handleCountdownTimeout() {
    this.stopCountdown();
    this.markDataInterruption();
  }

  private markDataInterruption() {
    this.dataInterrupted = true;
    this.stopMonitoring();

    if (this.temperatureData.length > 0) {
      const lastPoint = this.temperatureData[this.temperatureData.length - 1];
      const interruptedPoint: TemperaturePoint = {
        ...lastPoint,
        timestamp: new Date(),
        status: 'interrupted',
      };
      this.temperatureData = [...this.temperatureData, interruptedPoint];
    }

    if (this.selectedWheel) {
      alertService.addAlert(
        this.selectedWheel.id,
        'data_interruption',
        'high'
      );
    }

    this.showAlert(
      '数据中断',
      '监测数据已标记为中断。请重新插入探针并开始新的测量。',
      'warning'
    );
  }

  private handleMarkInterruption() {
    if (!this.dataInterrupted) {
      this.stopCountdown();
      this.markDataInterruption();
    }
  }

  private handleReinsertProbe() {
    this.probeStatus = 'inserted';
    this.stopCountdown();
    this.showAlert(
      '探针重新插入',
      '请确认探针已正确插入核心区域，然后点击开始监测继续采集数据。',
      'info'
    );
  }

  private handlePrintLabel() {
    if (!this.canPrintLabel) return;
    this.showAlert(
      '出库标签',
      `正在为奶酪轮 ${this.selectedWheel?.wheelNumber} 生成并打印出库标签...`,
      'info'
    );
  }

  private showAlert(message: string, detail: string, type: 'warning' | 'danger' | 'info') {
    this.alertMessage = `${message}\n\n${detail}`;
    this.alertType = type;
    this.showAlertDialog = true;
  }

  private closeAlertDialog() {
    this.showAlertDialog = false;
  }

  private get stableProgressPercent(): number {
    return Math.min((this.stableMinutes / this.REQUIRED_STABLE_MINUTES) * 100, 100);
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  override render() {
    const wheel = this.selectedWheel;

    if (!wheel) {
      return html`
        <div class="page-header">
          <div class="header-row">
            <button class="back-btn" @click=${this.handleBack}>
              <sl-icon name="arrow-left"></sl-icon>
              返回仪表盘
            </button>
            <h1 class="page-title">温度实时监测</h1>
            <div style="width: 120px;"></div>
          </div>
        </div>
        <div class="page-content">
          <div class="empty-state">
            <sl-icon name="thermometer-snowflake"></sl-icon>
            <p>请先在仪表盘选择一个奶酪轮进行温度监测</p>
            <sl-button class="btn-primary" @click=${this.handleBack}>
              <sl-icon slot="prefix" name="arrow-left"></sl-icon>
              返回选择
            </sl-button>
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
          <h1 class="page-title">温度实时监测</h1>
          <sl-badge variant="${this.isMonitoring ? 'primary' : 'neutral'}" pulse="${this.isMonitoring}">
            ${this.isMonitoring ? '监测中' : '已暂停'}
          </sl-badge>
        </div>
      </div>

      <div class="page-content">
        <div class="wheel-info-card">
          <div class="wheel-info-grid">
            <div class="info-item">
              <span class="info-label">奶酪轮编号</span>
              <span class="info-value">${wheel.wheelNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">窖位</span>
              <span class="info-value">${wheel.cellarPositionId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">酵母批次</span>
              <span class="info-value">${wheel.yeastBatchId}</span>
            </div>
            <div class="info-item">
              <span class="info-label">目标温度区间</span>
              <span class="info-value">${wheel.targetTempRange[0]}°C ~ ${wheel.targetTempRange[1]}°C</span>
            </div>
            <div class="info-item">
              <span class="info-label">入窖时间</span>
              <span class="info-value">${this.formatDate(wheel.entryTime)}</span>
            </div>
            <div class="info-item status-badge-item">
              <status-badge status=${wheel.status}></status-badge>
            </div>
          </div>
        </div>

        <div class="main-grid">
          <div class="chart-panel">
            <h3 class="panel-title">
              <sl-icon name="graph-up"></sl-icon>
              实时温度曲线
            </h3>
            <realtime-chart
              .data=${this.temperatureData}
              .targetRange=${this.targetRange}
            ></realtime-chart>
          </div>

          <div class="side-panels">
            <div class="gauge-panel">
              <h3 class="panel-title">
                <sl-icon name="speedometer2"></sl-icon>
                当前温度
              </h3>
              <temperature-gauge
                .currentTemperature=${this.currentTemperature}
                .targetRange=${this.targetRange}
              ></temperature-gauge>

              <div class="probe-status-indicator ${this.probeStatus}">
                <div class="status-dot ${this.probeStatus}"></div>
                <span class="probe-status-text ${this.probeStatus}">
                  ${this.probeStatus === 'inserted' ? '探针已插入' : '探针已拔出'}
                </span>
              </div>

              <div class="stable-info">
                <div class="stable-label">稳定在目标区间时长</div>
                <div class="stable-value">
                  ${this.stableMinutes} 分钟 / ${this.REQUIRED_STABLE_MINUTES} 分钟
                </div>
                <div class="stable-progress">
                  <div
                    class="stable-progress-fill"
                    style="width: ${this.stableProgressPercent}%"
                  ></div>
                </div>
                ${this.canPrintLabel
                  ? html`
                      <sl-badge variant="success" style="margin-top: 10px;">
                        <sl-icon slot="prefix" name="check-circle-fill"></sl-icon>
                        达到出库标准
                      </sl-badge>
                    `
                  : html`
                      <span class="stable-label" style="margin-top: 10px; display: block;">
                        还需 ${Math.max(this.REQUIRED_STABLE_MINUTES - this.stableMinutes, 0)} 分钟可打印标签
                      </span>
                    `
                }
              </div>

              ${this.showForgeryWarning
                ? html`
                    <div class="forgery-warning">
                      <h4>
                        <sl-icon name="exclamation-triangle-fill"></sl-icon>
                        伪造数据检测告警
                      </h4>
                      <p>系统检测到疑似伪造数据，账号已被冻结。请立即联系主管人员处理。</p>
                    </div>
                  `
                : ''
              }
            </div>

            <div class="countdown-panel">
              <h3 class="panel-title">
                <sl-icon name="clock-history"></sl-icon>
                数据中断倒计时
              </h3>
              <countdown-timer
                .remainingSeconds=${this.countdownSeconds}
                .isRunning=${this.isCountdownRunning}
                @timeout=${this.handleCountdownTimeout}
              ></countdown-timer>
              ${this.isCountdownRunning
                ? html`
                    <div class="countdown-warning">
                      <sl-icon name="exclamation-triangle"></sl-icon>
                      探针已拔出，请在倒计时结束前重新插入，否则本次测量数据将被标记为中断。
                    </div>
                  `
                : html`
                    <div class="countdown-warning" style="background: rgba(46, 125, 50, 0.1); color: var(--success);">
                      <sl-icon name="check-circle"></sl-icon>
                      探针正常插入中
                    </div>
                  `
              }
              ${this.dataInterrupted
                ? html`
                    <div class="countdown-warning" style="background: rgba(198, 40, 40, 0.1); color: var(--danger); margin-top: 12px;">
                      <sl-icon name="x-circle-fill"></sl-icon>
                      数据已中断 - 请重新插入探针开始新测量
                    </div>
                  `
                : ''
              }
            </div>
          </div>
        </div>

        <div class="controls-card">
          <h3 class="controls-title">监测控制</h3>
          <div class="controls-row">
            <span class="btn-group-label">监测:</span>
            <sl-button
              class="btn-primary"
              @click=${this.toggleMonitoring}
              ?disabled=${this.probeStatus !== 'inserted' || this.dataInterrupted}
            >
              <sl-icon slot="prefix" name=${this.isMonitoring ? 'pause-fill' : 'play-fill'}></sl-icon>
              ${this.isMonitoring ? '暂停监测' : '开始监测'}
            </sl-button>

            <div class="spacer"></div>

            <span class="btn-group-label">操作:</span>
            <sl-button
              class="btn-print-label btn-success"
              @click=${this.handlePrintLabel}
              ?disabled=${!this.canPrintLabel}
              style="${!this.canPrintLabel ? 'cursor: not-allowed;' : ''}"
            >
              <sl-icon slot="prefix" name="printer"></sl-icon>
              打印出库标签
            </sl-button>

            <sl-button
              class="btn-secondary"
              @click=${this.handleMarkInterruption}
              ?disabled=${this.dataInterrupted || !this.isMonitoring}
            >
              <sl-icon slot="prefix" name="slash-circle"></sl-icon>
              标记数据中断
            </sl-button>

            <sl-button
              class="btn-danger"
              @click=${this.handleReinsertProbe}
              ?disabled=${this.probeStatus === 'inserted'}
            >
              <sl-icon slot="prefix" name="arrow-down-circle"></sl-icon>
              重新插入探针
            </sl-button>
          </div>
        </div>
      </div>

      <sl-dialog
        ?open=${this.showAlertDialog}
        label=${this.alertType === 'danger' ? '⚠️ 危险告警' : this.alertType === 'warning' ? '⚠️ 警告' : 'ℹ️ 提示'}
        @sl-request-close=${this.closeAlertDialog}
      >
        <div class="alert-dialog-content">
          ${this.alertMessage.split('\n').map(line => html`<p>${line}</p>`)}
        </div>
        <sl-button slot="footer" variant="primary" @click=${this.closeAlertDialog}>
          我知道了
        </sl-button>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'temperature-monitor-page': TemperatureMonitorPage;
  }
}
