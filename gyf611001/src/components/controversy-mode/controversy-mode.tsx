import { Component, Prop, State, Event, EventEmitter, h, Method } from '@stencil/core';
import { TouchRecord } from '../../utils/types';

@Component({
  tag: 'controversy-mode',
  styleUrl: 'controversy-mode.css',
  shadow: true,
})
export class ControversyMode {
  @Prop() active: boolean = false;
  @Prop() touches: TouchRecord[] = [];
  @Prop() maxLookback: number = 3;
  @Event() exitRequested: EventEmitter<void>;
  @Event() annotationAdded: EventEmitter<{ touchId: string; text: string }>;
  @State() selectedIndex: number = 0;
  @State() annotationText: string = '';

  @Method()
  async resetSelection() {
    this.selectedIndex = 0;
    this.annotationText = '';
  }

  private get recentTouches(): TouchRecord[] {
    return [...this.touches].slice(-this.maxLookback).reverse();
  }

  private selectTouch(idx: number) {
    if (idx >= 0 && idx < this.recentTouches.length) {
      this.selectedIndex = idx;
    }
  }

  private submitAnnotation() {
    if (!this.annotationText.trim()) return;
    const touch = this.recentTouches[this.selectedIndex];
    if (touch) {
      this.annotationAdded.emit({ touchId: touch.id, text: this.annotationText.trim() });
      this.annotationText = '';
    }
  }

  private formatTs(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-CN', { hour12: false });
  }

  private sideLabel(id: 'left' | 'right'): string {
    return id === 'left' ? '左方' : '右方';
  }

  private typeLabel(t: string): string {
    const m: Record<string, string> = {
      valid: '有效刺',
      'off-target': '刺偏',
      simultaneous: '同时',
      'no-touch': '无',
    };
    return m[t] || t;
  }

  render() {
    if (!this.active) return null;
    const list = this.recentTouches;
    return (
      <div class="cm-overlay">
        <div class="cm-panel">
          <div class="cm-header">
            <h2>争议回看 · 仅允许回看最近 {this.maxLookback} 剑</h2>
            <button class="cm-close" onClick={() => this.exitRequested.emit()}>退出 (C)</button>
          </div>
          <div class="cm-body">
            <div class="cm-list">
              {list.length === 0 && <div class="cm-empty">无可回看动作</div>}
              {list.map((t, i) => (
                <div
                  key={t.id}
                  class={`cm-item ${this.selectedIndex === i ? 'active' : ''}`}
                  onClick={() => this.selectTouch(i)}
                >
                  <div class="cm-idx">#{list.length - i}</div>
                  <div class="cm-main">
                    <div class="cm-side">{this.sideLabel(t.fencerId)}</div>
                    <div class="cm-type">{this.typeLabel(t.type)}</div>
                    <div class="cm-note">{t.note || ''}</div>
                  </div>
                  <div class="cm-time">{this.formatTs(t.timestamp)}</div>
                </div>
              ))}
            </div>
            <div class="cm-annotate">
              <label>对选中动作附注说明：</label>
              <textarea
                value={this.annotationText}
                onInput={(e: any) => { this.annotationText = e.target.value; }}
                placeholder="输入改判或争议说明..."
                rows={4}
              />
              <button class="cm-submit" onClick={() => this.submitAnnotation()}>提交附注</button>
            </div>
          </div>
          <div class="cm-footer">
            <span class="cm-warn">⚠ 屏幕已冻结，除回看与附注外其余操作被禁用</span>
          </div>
        </div>
      </div>
    );
  }
}
