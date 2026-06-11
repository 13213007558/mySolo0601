import { h, t, clear } from './utils.js';
import { store } from '../store.js';
import { verifyPin } from '../config.js';
import type { AppState } from '../types.js';

const PIN_LENGTH = 4;

export function renderPinModal(root: HTMLElement, state: AppState): void {
  if (!state.pinModalOpen || !state.pinModalContext) {
    return;
  }

  const ctx = state.pinModalContext;
  const judge = state.judges.get(ctx.judgeId);
  const judgeName = judge?.name ?? '未知评委';

  const digits: HTMLElement[] = [];
  for (let i = 0; i < PIN_LENGTH; i++) {
    digits.push(h('div', { class: 'pin-digit' }, []));
  }
  const pinDisplay = h('div', { class: 'pin-display' }, digits);

  const errorEl = h('div', { class: 'pin-error' }, []);

  let input = '';
  let supervisorId = state.config.supervisors[0]?.id ?? '';

  function renderDigits(): void {
    for (let i = 0; i < PIN_LENGTH; i++) {
      const d = digits[i];
      if (!d) continue;
      clear(d);
      if (i < input.length) {
        d.appendChild(t('•'));
        d.classList.add('filled');
      } else {
        d.classList.remove('filled');
      }
    }
  }

  function showError(msg: string): void {
    clear(errorEl);
    errorEl.appendChild(t(msg));
    input = '';
    renderDigits();
  }

  function trySubmit(): void {
    if (input.length !== PIN_LENGTH) return;
    if (!verifyPin(supervisorId, input)) {
      showError('PIN 错误，请重试');
      return;
    }
    clear(errorEl);
    const ok = store.supervisorUnlock(supervisorId, ctx.judgeId, ctx.blindId, ctx.reason);
    if (ok) {
      ctx.onSuccess?.();
      store.closePinModal();
    } else {
      showError('解锁操作失败');
    }
  }

  const keypadBtns: HTMLElement[] = [];
  for (let n = 1; n <= 9; n++) {
    const b = h('button', { class: 'keypad-btn' }, [t(String(n))]);
    b.addEventListener('click', () => {
      if (input.length < PIN_LENGTH) {
        input += String(n);
        renderDigits();
        if (input.length === PIN_LENGTH) {
          setTimeout(trySubmit, 120);
        }
      }
    });
    keypadBtns.push(b);
  }
  const clearBtn = h('button', { class: 'keypad-btn action' }, [t('清除')]);
  clearBtn.addEventListener('click', () => {
    input = '';
    renderDigits();
    clear(errorEl);
  });
  const zeroBtn = h('button', { class: 'keypad-btn' }, [t('0')]);
  zeroBtn.addEventListener('click', () => {
    if (input.length < PIN_LENGTH) {
      input += '0';
      renderDigits();
      if (input.length === PIN_LENGTH) {
        setTimeout(trySubmit, 120);
      }
    }
  });
  const delBtn = h('button', { class: 'keypad-btn action' }, [t('删除')]);
  delBtn.addEventListener('click', () => {
    input = input.slice(0, -1);
    renderDigits();
    clear(errorEl);
  });

  keypadBtns.push(clearBtn, zeroBtn, delBtn);
  const keypad = h('div', { class: 'keypad' }, keypadBtns);

  const svOptions = state.config.supervisors.map((s) =>
    h('option', { value: s.id, selected: s.id === supervisorId }, [t(s.name)]),
  );
  const svSelect = h('select', { class: 'select', style: 'width:100%;margin-bottom:16px' }, svOptions) as HTMLSelectElement;
  svSelect.addEventListener('change', () => {
    supervisorId = svSelect.value;
    input = '';
    renderDigits();
    clear(errorEl);
  });

  const cancelBtn = h('button', { class: 'btn btn-secondary' }, [t('取消')]);
  cancelBtn.addEventListener('click', () => store.closePinModal());
  const confirmBtn = h('button', { class: 'btn btn-primary' }, [t('确认解锁')]);
  confirmBtn.addEventListener('click', trySubmit);

  const modal = h('div', { class: 'modal' }, [
    h('h2', { class: 'modal-title' }, [t('监审解锁')]),
    h('p', { class: 'modal-subtitle' }, [
      t(`${judgeName} · 酒款 ${ctx.blindId} · ${ctx.reason}`),
    ]),
    svSelect,
    pinDisplay,
    errorEl,
    keypad,
    h('div', { class: 'modal-actions' }, [cancelBtn, confirmBtn]),
  ]);

  const overlay = h('div', { class: 'modal-overlay' }, [modal]);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) store.closePinModal();
  });

  document.addEventListener('keydown', keyHandler);
  function keyHandler(e: KeyboardEvent): void {
    if (!state.pinModalOpen) {
      document.removeEventListener('keydown', keyHandler);
      return;
    }
    if (/^[0-9]$/.test(e.key)) {
      if (input.length < PIN_LENGTH) {
        input += e.key;
        renderDigits();
        if (input.length === PIN_LENGTH) setTimeout(trySubmit, 120);
      }
    } else if (e.key === 'Backspace') {
      input = input.slice(0, -1);
      renderDigits();
      clear(errorEl);
    } else if (e.key === 'Escape') {
      store.closePinModal();
    }
  }

  clear(root);
  root.appendChild(overlay);
}
