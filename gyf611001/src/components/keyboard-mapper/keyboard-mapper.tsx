import { Component, Prop, Event, EventEmitter, State, Listen, h } from '@stencil/core';
import { KeyboardAction, KeyboardMapping, DEFAULT_KEYBOARD_MAP } from '../../utils/types';

@Component({
  tag: 'keyboard-mapper',
  styleUrl: 'keyboard-mapper.css',
  shadow: true,
})
export class KeyboardMapper {
  @Prop() mapping: KeyboardMapping = DEFAULT_KEYBOARD_MAP;
  @Prop() disabled: boolean = false;
  @Event() actionFired: EventEmitter<KeyboardAction>;
  @State() lastKey: string = '';
  @State() lastAction: KeyboardAction | null = null;

  @Listen('keydown', { target: 'document' })
  handleKeyDown(ev: KeyboardEvent) {
    if (this.disabled) return;
    if (ev.repeat) return;
    const key = this.normalizeKey(ev);
    const action = this.mapping[key];
    if (action) {
      ev.preventDefault();
      ev.stopPropagation();
      this.lastKey = key;
      this.lastAction = action;
      this.actionFired.emit(action);
      setTimeout(() => {
        this.lastAction = null;
      }, 150);
    }
  }

  private normalizeKey(ev: KeyboardEvent): string {
    if (ev.key.startsWith('F') && /^F\d{1,2}$/.test(ev.key)) {
      return ev.key;
    }
    if (ev.code) {
      if (ev.code === 'Space') return 'Space';
      if (ev.code === 'Backspace') return 'Backspace';
      if (ev.code.startsWith('Key')) return ev.code;
    }
    return ev.key;
  }

  render() {
    return (
      <div class="km-wrapper">
        <div class="km-status" data-active={this.lastAction ? 'true' : 'false'}>
          <span class="km-key">{this.lastKey || '—'}</span>
          <span class="km-arrow">→</span>
          <span class="km-action">{this.lastAction || '等待按键...'}</span>
        </div>
        <div class="km-hint">
          <span>F1/F2 有效刺</span>
          <span>F3/F4 无效</span>
          <span>F5 同时</span>
          <span>F6 无</span>
          <span>F7/F8 黄牌</span>
          <span>F9/F10 红牌</span>
          <span>F11/F12 黑牌</span>
        </div>
      </div>
    );
  }
}
