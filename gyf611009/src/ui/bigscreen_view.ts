import { h, t, clear, formatTime } from './utils.js';
import type { AppState } from '../types.js';

export function renderBigscreenView(root: HTMLElement, state: AppState): void {
  clear(root);

  const clockEl = h('div', { class: 'bigscreen-clock' }, [t(formatTime(Date.now()))]);
  setInterval(() => {
    clear(clockEl);
    clockEl.appendChild(t(formatTime(Date.now())));
  }, 1000);

  const header = h('div', { class: 'bigscreen-header' }, [
    h('div', { class: 'bigscreen-title' }, [t(state.config.competitionName)]),
    h('div', { class: 'bigscreen-live' }, [
      h('span', { class: 'bigscreen-live-dot' }, []),
      t('LIVE 公众监督'),
    ]),
    clockEl,
  ]);

  const sipLimit = state.config.sipLimitPerWine;
  const cards: HTMLElement[] = [];

  for (const judge of state.judges.values()) {
    const blindId = judge.currentBlindId;
    const ws = blindId ? judge.wines.get(blindId) : null;
    const sipCount = ws?.sipCount ?? 0;
    const pct = Math.min(100, (sipCount / sipLimit) * 100);
    const statusText =
      ws?.status === 'locked'
        ? '已锁定'
        : ws?.status === 'active'
        ? '品鉴中'
        : '待品鉴';
    const statusCls = `wine-status ${ws?.status ?? 'pending'}`;
    const dot = h('span', { class: 'status-dot' }, []);
    const isCurrent = state.bigscreenJudgeId === null || state.bigscreenJudgeId === judge.id;

    const card = h('div', { class: `judge-bigscreen-card${isCurrent ? ' current' : ''}` }, [
      h('div', { class: 'judge-bigscreen-name' }, [t(`${judge.seatNumber}号 · ${judge.name}`)]),
      h('div', { class: 'judge-bigscreen-wine' }, [
        t(blindId ? `当前酒款 ${blindId}` : '未开始'),
      ]),
      h('div', { class: 'judge-bigscreen-sips' }, [
        h('span', { class: 'judge-bigscreen-sip-num' }, [t(String(sipCount))]),
        h('span', { class: 'judge-bigscreen-sip-max' }, [t(`/ ${sipLimit}`)]),
      ]),
      h('div', { class: 'judge-bigscreen-bar' }, [
        h('div', {
          class: 'judge-bigscreen-bar-fill',
          style: `width:${pct}%`,
        }),
      ]),
      h('span', { class: statusCls }, [dot, t(statusText)]),
    ]);
    cards.push(card);
  }

  const grid = h('div', { class: 'bigscreen-grid' }, cards);

  const footer = h(
    'div',
    {
      style:
        'margin-top:48px;padding-top:24px;border-top:1px solid var(--border);text-align:center;color:var(--text-muted);font-size:14px;letter-spacing:0.1em',
    },
    [
      t(
        '本大屏为只读监督模式 · 评委每口品鉴后必须点击吐酒计数 · 达上限自动锁定 · 解锁须监审 PIN 留痕',
      ),
    ],
  );

  const wrapper = h('div', { class: 'bigscreen' }, [header, grid, footer]);
  root.appendChild(wrapper);
}
