import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit-labs/context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context.js';
import { authContext, type AuthContextType } from '../context/auth-context.js';
import type { CheeseWheel, User } from '../types/index.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '../components/cheese/cheese-wheel-card.js';
import '../components/common/status-badge.js';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

@customElement('dashboard-page')
export class DashboardPage extends LitElement {
  @consume({ context: cheeseContext, subscribe: true })
  @property({ attribute: false })
  cheeseContextValue: CheeseContextType | undefined;

  @consume({ context: authContext, subscribe: true })
  @property({ attribute: false })
  authContextValue: AuthContextType | undefined;

  @state()
  private activeNav: string = 'dashboard';

  @state()
  private currentUser: User | null = null;

  private navItems: NavItem[] = [
    { id: 'dashboard', label: '仪表盘', icon: 'speedometer' },
    { id: 'probe-guide', label: '探针引导', icon: 'arrow-down-circle' },
    { id: 'temperature-monitor', label: '温度监测', icon: 'thermometer-half' },
    { id: 'cheese-management', label: '奶酪管理', icon: 'grid-3x3' },
    { id: 'comparison', label: '对比分析', icon: 'bar-chart' },
    { id: 'report', label: '报告导出', icon: 'file-earmark-text' },
    { id: 'settings', label: '系统设置', icon: 'gear' },
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

    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 240px;
      background: linear-gradient(180deg, #4A3728 0%, #6B4F3A 100%);
      padding: 24px 0;
      flex-shrink: 0;
    }

    .sidebar-logo {
      padding: 0 24px 24px;
      border-bottom: 1px solid rgba(255, 248, 240, 0.15);
      margin-bottom: 16px;
    }

    .logo-text {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 20px;
      font-weight: 700;
      color: #FFF8F0;
      letter-spacing: 0.5px;
    }

    .logo-subtitle {
      font-size: 11px;
      color: rgba(255, 248, 240, 0.6);
      margin-top: 2px;
    }

    .nav-menu {
      padding: 0 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      color: rgba(255, 248, 240, 0.75);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 4px;
    }

    .nav-item:hover {
      background: rgba(255, 248, 240, 0.08);
      color: #FFF8F0;
    }

    .nav-item.active {
      background: #D4A574;
      color: #4A3728;
      box-shadow: 0 4px 12px rgba(212, 165, 116, 0.4);
    }

    .nav-item sl-icon {
      font-size: 18px;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 32px;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
    }

    .top-bar-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 22px;
      font-weight: 600;
      color: var(--text);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFF8F0;
      font-weight: 600;
      font-size: 16px;
    }

    .user-details {
      text-align: right;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
    }

    .user-role {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .content-area {
      flex: 1;
      padding: 28px 32px;
      overflow-y: auto;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 28px;
    }

    .stat-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(74, 55, 40, 0.06);
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(74, 55, 40, 0.1);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .stat-label {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon sl-icon {
      font-size: 20px;
      color: #ffffff;
    }

    .stat-icon.blue { background: linear-gradient(135deg, #5C9EFF 0%, #2E7DD8 100%); }
    .stat-icon.orange { background: linear-gradient(135deg, #FFB55C 0%, #FF8F00 100%); }
    .stat-icon.green { background: linear-gradient(135deg, #66BB6A 0%, #2E7D32 100%); }
    .stat-icon.red { background: linear-gradient(135deg, #EF5350 0%, #C62828 100%); }

    .stat-value {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 32px;
      font-weight: 700;
      color: var(--text);
      line-height: 1;
    }

    .stat-change {
      margin-top: 8px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .stat-change.up { color: var(--success); }
    .stat-change.down { color: var(--danger); }

    .content-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 24px;
      margin-bottom: 28px;
    }

    .section-title {
      font-family: var(--heading, system-ui, sans-serif);
      font-size: 18px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 16px 0;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .action-btn sl-button::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #C4956A 100%);
      border: none;
      color: #ffffff;
      font-weight: 600;
      padding: 10px 20px;
    }

    .action-btn sl-button::part(base):hover {
      background: linear-gradient(135deg, #C4956A 0%, #B4855A 100%);
      transform: translateY(-1px);
    }

    .action-btn.secondary sl-button::part(base) {
      background: #ffffff;
      border: 2px solid #D4A574;
      color: #8B5A2B;
    }

    .action-btn.secondary sl-button::part(base):hover {
      background: #FFF8F0;
    }

    .activity-list {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s ease;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-item:hover {
      background: #FFF8F0;
    }

    .activity-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }

    .activity-dot.temp { background: var(--primary); }
    .activity-dot.anomaly { background: var(--danger); }
    .activity-dot.ready { background: var(--success); }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      margin: 0 0 4px 0;
    }

    .activity-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .activity-time {
      font-size: 11px;
      color: var(--text-secondary);
      opacity: 0.8;
      white-space: nowrap;
    }

    .cheese-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 18px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-secondary);
    }

    .empty-state sl-icon {
      font-size: 48px;
      color: var(--border);
      margin-bottom: 12px;
    }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .stats-grid { grid-template-columns: 1fr; }
      .content-area { padding: 20px; }
      .top-bar { padding: 12px 20px; }
    }
  `;

  private get cheeseWheels(): CheeseWheel[] {
    return this.cheeseContextValue?.cheeseWheels || [];
  }

  private getStatCounts() {
    const wheels = this.cheeseWheels;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMonitorCount = wheels.reduce((sum, w) => {
      const todayPoints = w.temperatureHistory.filter(
        p => new Date(p.timestamp) >= today
      ).length;
      return sum + todayPoints;
    }, 0);

    const maturingCount = wheels.filter(w => w.status === 'maturing').length;
    const readyCount = wheels.filter(w => w.status === 'ready').length;
    const anomalyCount = Math.floor(wheels.length * 0.15) + 1;

    return { todayMonitorCount, maturingCount, readyCount, anomalyCount };
  }

  private getRecentActivity() {
    const wheels = this.cheeseWheels;
    const activities: Array<{
      type: 'temp' | 'anomaly' | 'ready';
      title: string;
      desc: string;
      time: Date;
    }> = [];

    for (const wheel of wheels) {
      if (wheel.temperatureHistory.length > 0) {
        const lastPoint = wheel.temperatureHistory[wheel.temperatureHistory.length - 1];
        activities.push({
          type: 'temp',
          title: `温度记录 - ${wheel.wheelNumber}`,
          desc: `当前温度 ${lastPoint.temperature.toFixed(1)}°C，目标区间 ${wheel.targetTempRange[0]}-${wheel.targetTempRange[1]}°C`,
          time: new Date(lastPoint.timestamp),
        });
      }
      if (wheel.status === 'ready') {
        activities.push({
          type: 'ready',
          title: `奶酪就绪 - ${wheel.wheelNumber}`,
          desc: '已达到目标熟成度，可以出库',
          time: new Date(Date.now() - Math.random() * 3600000 * 24),
        });
      }
    }

    activities.push({
      type: 'anomaly',
      title: '异常告警: 温度骤升',
      desc: 'CW-2024-003 在15分钟内升温3.2°C',
      time: new Date(Date.now() - 1800000),
    });

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 8);
  }

  private formatTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }

  private handleNavClick(view: string) {
    this.activeNav = view;
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { view },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleWheelSelected(e: CustomEvent) {
    const wheel = e.detail.wheel as CheeseWheel;
    if (this.cheeseContextValue) {
      this.cheeseContextValue.selectCheeseWheel(wheel.id);
    }
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: { view: 'temperature-monitor' },
        bubbles: true,
        composed: true,
      })
    );
  }

  private getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  override connectedCallback() {
    super.connectedCallback();
    this.currentUser = this.authContextValue?.currentUser || null;
  }

  override render() {
    const stats = this.getStatCounts();
    const activities = this.getRecentActivity();
    const wheels = this.cheeseWheels;
    const user = this.currentUser;

    return html`
      <div class="app-layout">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <div class="logo-text">🧀 奶酪轮芯温探</div>
            <div class="logo-subtitle">温度监测系统</div>
          </div>
          <nav class="nav-menu">
            ${this.navItems.map(
              item => html`
                <div
                  class="nav-item ${this.activeNav === item.id ? 'active' : ''}"
                  @click=${() => this.handleNavClick(item.id)}
                >
                  <sl-icon name="${item.icon}"></sl-icon>
                  <span>${item.label}</span>
                </div>
              `
            )}
          </nav>
        </aside>

        <div class="main-content">
          <header class="top-bar">
            <h1 class="top-bar-title">奶酪轮芯温探台</h1>
            <div class="user-info">
              <div class="user-details">
                <div class="user-name">${user?.username || '未登录'}</div>
                <div class="user-role">${this.getRoleLabel(user?.role)}</div>
              </div>
              <div class="user-avatar">
                ${this.getInitials(user?.username || 'U')}
              </div>
            </div>
          </header>

          <main class="content-area">
            <section class="stats-grid">
              <div class="stat-card">
                <div class="stat-header">
                  <span class="stat-label">今日监测数</span>
                  <div class="stat-icon blue"><sl-icon name="thermometer"></sl-icon></div>
                </div>
                <div class="stat-value">${stats.todayMonitorCount}</div>
                <div class="stat-change up">↑ ${Math.floor(stats.todayMonitorCount * 0.15)} 较昨日</div>
              </div>

              <div class="stat-card">
                <div class="stat-header">
                  <span class="stat-label">熟成中数</span>
                  <div class="stat-icon orange"><sl-icon name="hourglass-split"></sl-icon></div>
                </div>
                <div class="stat-value">${stats.maturingCount}</div>
                <div class="stat-change">共 ${wheels.length} 个奶酪轮</div>
              </div>

              <div class="stat-card">
                <div class="stat-header">
                  <span class="stat-label">已就绪数</span>
                  <div class="stat-icon green"><sl-icon name="check-circle"></sl-icon></div>
                </div>
                <div class="stat-value">${stats.readyCount}</div>
                <div class="stat-change up">可出库</div>
              </div>

              <div class="stat-card">
                <div class="stat-header">
                  <span class="stat-label">异常告警数</span>
                  <div class="stat-icon red"><sl-icon name="exclamation-triangle"></sl-icon></div>
                </div>
                <div class="stat-value">${stats.anomalyCount}</div>
                <div class="stat-change down">需处理</div>
              </div>
            </section>

            <div class="content-row">
              <sl-card style="--padding: 20px; --border-color: var(--border);">
                <h2 class="section-title">快速操作</h2>
                <div class="quick-actions">
                  <div class="action-btn">
                    <sl-button @click=${() => this.handleNavClick('probe-guide')}>
                      <sl-icon slot="prefix" name="plus-circle"></sl-icon>
                      开始新测量
                    </sl-button>
                  </div>
                  <div class="action-btn secondary">
                    <sl-button @click=${() => this.handleNavClick('comparison')}>
                      <sl-icon slot="prefix" name="bar-chart"></sl-icon>
                      查看对比分析
                    </sl-button>
                  </div>
                  <div class="action-btn secondary">
                    <sl-button @click=${() => this.handleNavClick('report')}>
                      <sl-icon slot="prefix" name="download"></sl-icon>
                      导出报告
                    </sl-button>
                  </div>
                </div>
              </sl-card>
            </div>

            <div class="content-row">
              <div>
                <h2 class="section-title">最近活动</h2>
                <div class="activity-list">
                  ${activities.length === 0
                    ? html`
                        <div class="empty-state">
                          <sl-icon name="inbox"></sl-icon>
                          <p>暂无活动记录</p>
                        </div>
                      `
                    : activities.map(
                        activity => html`
                          <div class="activity-item">
                            <div class="activity-dot ${activity.type}"></div>
                            <div class="activity-content">
                              <p class="activity-title">${activity.title}</p>
                              <p class="activity-desc">${activity.desc}</p>
                            </div>
                            <div class="activity-time">${this.formatTime(activity.time)}</div>
                          </div>
                        `
                      )}
                </div>
              </div>
            </div>

            <section>
              <h2 class="section-title">奶酪轮状态概览</h2>
              <div class="cheese-grid" @wheel-selected=${this.handleWheelSelected}>
                ${wheels.length === 0
                  ? html`
                      <div class="empty-state" style="grid-column: 1 / -1;">
                        <sl-icon name="grid-3x3"></sl-icon>
                        <p>暂无奶酪轮数据</p>
                      </div>
                    `
                  : wheels.map(
                      wheel => html`
                        <cheese-wheel-card
                          .wheel=${wheel}
                          .isSelected=${this.cheeseContextValue?.selectedCheeseWheel?.id === wheel.id}
                        ></cheese-wheel-card>
                      `
                    )}
              </div>
            </section>
          </main>
        </div>
      </div>
    `;
  }

  private getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      technician: '技术员',
      manager: '经理',
      supervisor: '主管',
      admin: '管理员',
    };
    return labels[role || ''] || '未知角色';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dashboard-page': DashboardPage;
  }
}
