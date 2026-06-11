import { Component, Prop, State, Event, EventEmitter, h, Method } from '@stencil/core';

export interface PinValidationResult {
  authorized: boolean;
  referee1Name?: string;
  referee2Name?: string;
  timestamp?: number;
}

interface RefereeAccount {
  pin: string;
  name: string;
}

const DEFAULT_ACCOUNTS: RefereeAccount[] = [
  { pin: '1111', name: '主裁判' },
  { pin: '2222', name: '副裁判' },
  { pin: '3333', name: '裁判长' },
];

@Component({
  tag: 'pin-validator',
  styleUrl: 'pin-validator.css',
  shadow: true,
})
export class PinValidator {
  @Prop() requiredReferees: number = 2;
  @Prop() panelTitle: string = '改分需双裁判 PIN 验证';
  @Prop() accounts: RefereeAccount[] = DEFAULT_ACCOUNTS;
  @Prop() open: boolean = false;
  @Event() validated: EventEmitter<PinValidationResult>;
  @Event() cancelled: EventEmitter<void>;
  @State() pin1: string = '';
  @State() pin2: string = '';
  @State() pin1Valid: boolean | null = null;
  @State() pin2Valid: boolean | null = null;
  @State() error: string = '';
  @State() focusedField: 1 | 2 = 1;

  @Method()
  async reset() {
    this.pin1 = '';
    this.pin2 = '';
    this.pin1Valid = null;
    this.pin2Valid = null;
    this.error = '';
    this.focusedField = 1;
  }

  private handlePinInput(field: 1 | 2, value: string) {
    const v = value.replace(/\D/g, '').slice(0, 6);
    if (field === 1) {
      this.pin1 = v;
      if (v.length >= 4) {
        const acc = this.accounts.find(a => a.pin === v);
        this.pin1Valid = !!acc;
        if (acc) this.focusedField = 2;
      } else {
        this.pin1Valid = null;
      }
    } else {
      this.pin2 = v;
      if (v.length >= 4) {
        const acc = this.accounts.find(a => a.pin === v);
        this.pin2Valid = !!acc;
      } else {
        this.pin2Valid = null;
      }
    }
    this.error = '';
  }

  private submit() {
    const acc1 = this.accounts.find(a => a.pin === this.pin1);
    const acc2 = this.accounts.find(a => a.pin === this.pin2);
    if (!acc1 || !acc2) {
      this.error = 'PIN 不正确，请重试';
      return;
    }
    if (this.requiredReferees >= 2 && this.pin1 === this.pin2) {
      this.error = '两名裁判需使用不同 PIN';
      return;
    }
    this.validated.emit({
      authorized: true,
      referee1Name: acc1.name,
      referee2Name: acc2.name,
      timestamp: Date.now(),
    });
  }

  private cancel() {
    this.cancelled.emit();
    this.reset();
  }

  render() {
    if (!this.open) return null;
    return (
      <div class="pv-overlay">
        <div class="pv-panel">
          <h3 class="pv-title">{this.panelTitle}</h3>
          <p class="pv-sub">需两名裁判各自输入 PIN 方可执行改分操作</p>

          <div class="pv-field-row">
            <div class={`pv-field ${this.focusedField === 1 ? 'focus' : ''} ${this.pin1Valid === true ? 'ok' : ''} ${this.pin1Valid === false ? 'err' : ''}`}>
              <label>裁判 1</label>
              <input
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                value={this.pin1}
                onInput={(e: any) => this.handlePinInput(1, e.target.value)}
                onFocus={() => { this.focusedField = 1; }}
                placeholder="请输入 PIN"
                maxlength={6}
                autoFocus
              />
              {this.pin1Valid === true && <span class="pv-ok">✓</span>}
              {this.pin1Valid === false && <span class="pv-err">✕</span>}
            </div>
            <div class={`pv-field ${this.focusedField === 2 ? 'focus' : ''} ${this.pin2Valid === true ? 'ok' : ''} ${this.pin2Valid === false ? 'err' : ''}`}>
              <label>裁判 2</label>
              <input
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                value={this.pin2}
                onInput={(e: any) => this.handlePinInput(2, e.target.value)}
                onFocus={() => { this.focusedField = 2; }}
                placeholder="请输入 PIN"
                maxlength={6}
              />
              {this.pin2Valid === true && <span class="pv-ok">✓</span>}
              {this.pin2Valid === false && <span class="pv-err">✕</span>}
            </div>
          </div>

          {this.error && <div class="pv-error">{this.error}</div>}

          <div class="pv-actions">
            <button class="btn-flat" onClick={() => this.cancel()}>取消</button>
            <button class="btn-flat btn-primary" onClick={() => this.submit()}>确认改分</button>
          </div>
        </div>
      </div>
    );
  }
}
