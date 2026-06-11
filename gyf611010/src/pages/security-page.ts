import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { User } from '../types/index';
import { consume as consumeCtx } from '@lit-labs/context';
import { authContext, type AuthContextType } from '../context/auth-context';
import { cheeseContext, type CheeseContextType } from '../context/cheese-context';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import { users as mockUsers } from '../utils/mock-data';

interface ForgeryLog {
  id: string;
  timestamp: Date;
  username: string;
  wheelNumber: string;
  result: 'pass' | 'fail' | 'suspicious';
  details: string;
}

interface SmsRecipient {
  id: string;
  name: string;
  phone: string;
  enabled: boolean;
}

@customElement('security-page')
export class SecurityPage extends LitElement {
  @consumeCtx({ context: authContext })
  authCtx!: AuthContextType;

  @consumeCtx({ context: cheeseContext })
  cheeseCtx!: CheeseContextType;

  @state()
  private users: User[] = [];

  @state()
  private forgeryLogs: ForgeryLog[] = [];

  @state()
  private tempSpikeThreshold = 3;

  @state()
  private dataInterruptionTimeout = 600;

  @state()
  private smsRecipients: SmsRecipient[] = [];

  @state()
  private lockDialogOpen = false;

  @state()
  private selectedUser: User | null = null;

  @state()
  private newRecipientName = '';

  @state()
  private newRecipientPhone = '';

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

    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
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
      padding: 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .data-table th {
      background: #FDF8F3;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #4A3728;
      border-bottom: 1px solid #E8D5BC;
      font-size: 13px;
    }

    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #F0E6D8;
      color: #4A3728;
      vertical-align: middle;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tbody tr:hover {
      background: #FDF8F3;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    sl-button::part(base) {
      border-radius: 6px;
      font-size: 13px;
    }

    sl-button[variant="primary"]::part(base) {
      background: linear-gradient(135deg, #D4A574 0%, #8B5A2B 100%);
      border-color: #8B5A2B;
    }

    sl-button[variant="primary"]::part(base):hover {
      background: linear-gradient(135deg, #C49464 0%, #7B4A1B 100%);
    }

    sl-input::part(base),
    sl-switch::part(base) {
      border-radius: 6px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.active {
      background: #2E7D32;
      box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
    }

    .status-dot.locked {
      background: #C62828;
      box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.15);
    }

    .forgery-result {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .forgery-result.pass {
      color: #2E7D32;
    }

    .forgery-result.fail {
      color: #C62828;
    }

    .forgery-result.suspicious {
      color: #FF8F00;
    }

    .card-body-padding {
      padding: 20px;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #F5E6D3;
    }

    .setting-row:last-child {
      border-bottom: none;
    }

    .setting-info {
      flex: 1;
    }

    .setting-label {
      font-size: 14px;
      font-weight: 600;
      color: #4A3728;
      margin-bottom: 4px;
    }

    .setting-desc {
      font-size: 12px;
      color: #8B7355;
    }

    .setting-control {
      min-width: 200px;
    }

    .recipients-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .recipient-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #FDF8F3;
      border-radius: 8px;
      border: 1px solid #E8D5BC;
    }

    .recipient-info {
      flex: 1;
    }

    .recipient-name {
      font-size: 14px;
      font-weight: 600;
      color: #4A3728;
    }

    .recipient-phone {
      font-size: 13px;
      color: #8B7355;
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .add-recipient-form {
      display: flex;
      gap: 10px;
      padding-top: 16px;
      border-top: 1px solid #F5E6D3;
    }

    .add-recipient-form sl-input {
      flex: 1;
    }

    .role-badge {
      font-size: 12px;
      padding: 2px 10px;
      border-radius: 12px;
      font-weight: 500;
      display: inline-block;
    }

    .role-badge.technician {
      background: rgba(33, 150, 243, 0.15);
      color: #1565C0;
    }

    .role-badge.manager {
      background: rgba(156, 39, 176, 0.15);
      color: #7B1FA2;
    }

    .role-badge.supervisor {
      background: rgba(46, 125, 50, 0.15);
      color: #2E7D32;
    }

    .role-badge.admin {
      background: rgba(198, 40, 40, 0.15);
      color: #C62828;
    }

    .role-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #8B7355;
      font-weight: 600;
    }

    .user-name-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mono-text {
      font-family: var(--mono, ui-monospace, Consolas, monospace);
    }

    .card-header-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `;

  private get mappedUsers(): User[] {
    if (this.users.length > 0) return this.users;
    return mockUsers.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role as User['role'],
      phone: '13800138000',
      isLocked: !u.isActive,
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));
  }

  private generateForgeryLogs(): ForgeryLog[] {
    const logs: ForgeryLog[] = [];
    const results: ForgeryLog['result'][] = ['pass', 'pass', 'pass', 'suspicious', 'fail'];
    const details: Record<string, string> = {
      pass: '数据一致性验证通过，未发现异常',
      suspicious: '检测到轻微数据波动，建议人工复核',
      fail: '检测到数据伪造特征，哈希校验失败',
    };

    for (let i = 0; i < 8; i++) {
      const result = results[Math.floor(Math.random() * results.length)];
      const wheelIndex = i % Math.max(1, this.cheeseCtx?.cheeseWheels?.length || 6);
      const userIndex = i % this.mappedUsers.length;
      logs.push({
        id: `LOG-${String(i + 1).padStart(4, '0')}`,
        timestamp: new Date(Date.now() - (i + 1) * 3600 * 1000 * (2 + Math.random() * 4)),
        username: this.mappedUsers[userIndex].username,
        wheelNumber: this.cheeseCtx?.cheeseWheels?.[wheelIndex]?.wheelNumber || `CHS-${wheelIndex + 1}`,
        result,
        details: details[result],
      });
    }
    return logs;
  }

  connectedCallback() {
    super.connectedCallback();
    this.users = this.mappedUsers;
    this.forgeryLogs = this.generateForgeryLogs();
    this.smsRecipients = [
      { id: '1', name: '张明', phone: '13800138001', enabled: true },
      { id: '2', name: '李华', phone: '13800138002', enabled: true },
      { id: '3', name: '王芳', phone: '13800138003', enabled: false },
    ];
  }

  private roleLabel(role: string): string {
    const labels: Record<string, string> = {
      technician: '技术员',
      manager: '经理',
      supervisor: '主管',
      admin: '管理员',
    };
    return labels[role] || role;
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private handleLockUser(user: User) {
    this.selectedUser = user;
    this.lockDialogOpen = true;
  }

  private async confirmLockUser() {
    if (!this.selectedUser) return;
    if (this.selectedUser.isLocked) {
      this.authCtx.unlockUser(this.selectedUser.id);
    } else {
      this.authCtx.lockUser(this.selectedUser.id);
    }
    this.users = this.users.map(u =>
      u.id === this.selectedUser!.id ? { ...u, isLocked: !u.isLocked } : u
    );
    this.lockDialogOpen = false;
    this.selectedUser = null;
  }

  private handleThresholdChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.tempSpikeThreshold = parseFloat(target.value) || 0;
  }

  private handleTimeoutChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.dataInterruptionTimeout = parseInt(target.value) || 0;
  }

  private handleRecipientToggle(id: string, checked: boolean) {
    this.smsRecipients = this.smsRecipients.map(r =>
      r.id === id ? { ...r, enabled: checked } : r
    );
  }

  private handleRemoveRecipient(id: string) {
    this.smsRecipients = this.smsRecipients.filter(r => r.id !== id);
  }

  private handleAddRecipient() {
    if (!this.newRecipientName || !this.newRecipientPhone) return;
    const newRecipient: SmsRecipient = {
      id: String(Date.now()),
      name: this.newRecipientName,
      phone: this.newRecipientPhone,
      enabled: true,
    };
    this.smsRecipients = [...this.smsRecipients, newRecipient];
    this.newRecipientName = '';
    this.newRecipientPhone = '';
  }

  override render() {
    return html`
      <div class="page-header">
        <h1 class="page-title">系统安全与告警配置</h1>
        <p class="page-subtitle">管理用户账号、伪造检测日志和告警规则配置</p>
      </div>

      <div class="content-grid">
        <sl-card>
          <div slot="header" class="card-header-inner">
            <span>用户管理</span>
            <sl-tag size="small" variant="neutral">共 ${this.mappedUsers.length} 个用户</sl-tag>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>角色</th>
                <th>状态</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${this.mappedUsers.map(u => html`
                <tr>
                  <td>
                    <div class="user-name-cell">
                      <strong>${u.username}</strong>
                      <span class="role-label">ID: ${u.id}</span>
                    </div>
                  </td>
                  <td><span class="role-badge ${u.role}">${this.roleLabel(u.role)}</span></td>
                  <td>
                    <span class="status-badge">
                      <span class="status-dot ${u.isLocked ? 'locked' : 'active'}"></span>
                      <span>${u.isLocked ? '已锁定' : '正常'}</span>
                    </span>
                  </td>
                  <td>${this.formatDate(u.lastLogin)}</td>
                  <td>
                    <div class="action-buttons">
                      <sl-button
                        size="small"
                        variant="${u.isLocked ? 'primary' : 'danger'}"
                        @click=${() => this.handleLockUser(u)}
                      >
                        ${u.isLocked ? '解锁' : '冻结'}
                      </sl-button>
                    </div>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </sl-card>

        <sl-card>
          <div slot="header" class="card-header-inner">
            <span>伪造数据检测日志</span>
            <sl-tag size="small" variant="warning">近24小时记录</sl-tag>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>用户</th>
                <th>奶酪轮</th>
                <th>检测结果</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              ${this.forgeryLogs.map(log => html`
                <tr>
                  <td>${this.formatDate(log.timestamp)}</td>
                  <td>${log.username}</td>
                  <td><span class="mono-text">${log.wheelNumber}</span></td>
                  <td>
                    <span class="forgery-result ${log.result}">
                      ${log.result === 'pass' ? '✓ 通过' : log.result === 'fail' ? '✗ 失败' : '⚠ 可疑'}
                    </span>
                  </td>
                  <td style="color: #8B7355; font-size: 13px;">${log.details}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </sl-card>

        <sl-card>
          <div slot="header">告警规则配置</div>
          <div class="card-body-padding">
            <div class="settings-section">
              <div class="setting-row">
                <div class="setting-info">
                  <div class="setting-label">异常升温阈值</div>
                  <div class="setting-desc">当温度在短时间内上升超过此阈值时触发告警（单位：℃）</div>
                </div>
                <div class="setting-control">
                  <sl-input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value=${this.tempSpikeThreshold}
                    @sl-change=${this.handleThresholdChange}
                    suffix="℃"
                  ></sl-input>
                </div>
              </div>

              <div class="setting-row">
                <div class="setting-info">
                  <div class="setting-label">数据中断超时时间</div>
                  <div class="setting-desc">温度数据采集中断超过此时间后触发告警（单位：秒）</div>
                </div>
                <div class="setting-control">
                  <sl-input
                    type="number"
                    min="60"
                    max="3600"
                    step="60"
                    value=${this.dataInterruptionTimeout}
                    @sl-change=${this.handleTimeoutChange}
                    suffix="秒"
                  ></sl-input>
                </div>
              </div>

              <sl-divider style="--spacing: 8px;"></sl-divider>

              <div>
                <div class="setting-label" style="margin-bottom: 16px;">短信通知接收人</div>
                <div class="recipients-list">
                  ${this.smsRecipients.map(r => html`
                    <div class="recipient-item">
                      <sl-switch
                        ?checked=${r.enabled}
                        @sl-change=${(e: Event) => this.handleRecipientToggle(r.id, (e.target as HTMLInputElement).checked)}
                      ></sl-switch>
                      <div class="recipient-info">
                        <div class="recipient-name">${r.name}</div>
                        <div class="recipient-phone">${r.phone}</div>
                      </div>
                      <sl-button
                        size="small"
                        variant="default"
                        @click=${() => this.handleRemoveRecipient(r.id)}
                      >
                        删除
                      </sl-button>
                    </div>
                  `)}
                </div>
                <div class="add-recipient-form">
                  <sl-input
                    placeholder="姓名"
                    value=${this.newRecipientName}
                    @sl-input=${(e: Event) => this.newRecipientName = (e.target as HTMLInputElement).value}
                  ></sl-input>
                  <sl-input
                    placeholder="手机号码"
                    value=${this.newRecipientPhone}
                    @sl-input=${(e: Event) => this.newRecipientPhone = (e.target as HTMLInputElement).value}
                  ></sl-input>
                  <sl-button
                    variant="primary"
                    @click=${this.handleAddRecipient}
                    ?disabled=${!this.newRecipientName || !this.newRecipientPhone}
                  >
                    添加
                  </sl-button>
                </div>
              </div>
            </div>
          </div>
        </sl-card>
      </div>

      <sl-dialog
        label="${this.selectedUser?.isLocked ? '解锁用户' : '冻结用户'}"
        ?open=${this.lockDialogOpen}
        @sl-after-hide=${() => { this.lockDialogOpen = false; this.selectedUser = null; }}
      >
        <p style="margin: 0;">
          确定要${this.selectedUser?.isLocked ? '解锁' : '冻结'}用户
          <strong style="color: ${this.selectedUser?.isLocked ? '#2E7D32' : '#C62828'};">
            ${this.selectedUser?.username}
          </strong>
          吗？
        </p>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #8B7355;">
          ${this.selectedUser?.isLocked
            ? '解锁后该用户将可以正常登录系统。'
            : '冻结后该用户将无法登录系统，直到被解锁。'}
        </p>
        <sl-button slot="footer" variant="default" @click=${() => { this.lockDialogOpen = false; this.selectedUser = null; }}>
          取消
        </sl-button>
        <sl-button slot="footer" variant="${this.selectedUser?.isLocked ? 'primary' : 'danger'}" @click=${this.confirmLockUser}>
          确认${this.selectedUser?.isLocked ? '解锁' : '冻结'}
        </sl-button>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'security-page': SecurityPage;
  }
}
