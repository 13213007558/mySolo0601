import { h, t, clear } from './utils.js';
import { store } from '../store.js';
import type { AppState, JudgeWineState, ScoreBreakdown } from '../types.js';
import { SCORE_DIMENSIONS, DIMENSION_LABELS } from '../types.js';

function scoreInputs(
  ws: JudgeWineState,
  maxScore: number,
): { container: HTMLElement; getValues: () => ScoreBreakdown | null } {
  const inputs: Record<string, HTMLInputElement> = {};
  const rows: HTMLElement[] = [];

  const totalLabel = h('div', { class: 'total-label' }, [t('总分')]);
  const totalValue = h('div', { class: 'total-value' }, [t('—')]);
  const totalScore = h('div', { class: 'total-score' }, [totalLabel, totalValue]);

  function updateTotal(): void {
    const vals = Object.values(inputs).map((i) => Number(i.value || 0));
    const sum = vals.reduce((a, b) => a + b, 0);
    const hasAny = vals.some((v) => v > 0);
    clear(totalValue);
    totalValue.appendChild(t(hasAny ? String(sum) : '—'));
    if (ws.status === 'locked' && ws.totalScore !== null) {
      totalValue.classList.add('locked');
    }
  }

  for (const dim of SCORE_DIMENSIONS) {
    const input = h('input', {
      class: 'score-input',
      type: 'number',
      min: '0',
      max: String(maxScore),
      step: '0.5',
      placeholder: `0-${maxScore}`,
      disabled: ws.status !== 'locked' || ws.totalScore !== null,
    }) as HTMLInputElement;
    if (ws.score) {
      input.value = String(ws.score[dim]);
    }
    inputs[dim] = input;
    input.addEventListener('input', updateTotal);
    const label = h('label', { class: 'score-label' }, [t(DIMENSION_LABELS[dim])]);
    const item = h('div', { class: 'score-item' }, [label, input]);
    rows.push(item);
  }

  if (ws.totalScore !== null) {
    clear(totalValue);
    totalValue.appendChild(t(String(ws.totalScore)));
    totalValue.classList.add('locked');
  }

  const scoreRow = h('div', { class: 'score-row' }, rows);
  const totalRow = h('div', { class: 'score-row' }, [totalScore]);
  const container = h('div', { class: 'score-section' }, [scoreRow, totalRow]);

  function getValues(): ScoreBreakdown | null {
    const out: Partial<ScoreBreakdown> = {};
    let ok = true;
    for (const dim of SCORE_DIMENSIONS) {
      const v = Number(inputs[dim]?.value);
      if (!Number.isFinite(v) || v < 0 || v > maxScore) {
        ok = false;
      }
      out[dim] = v;
    }
    if (!ok) return null;
    return out as ScoreBreakdown;
  }

  return { container, getValues };
}

export function renderJudgeView(root: HTMLElement, state: AppState): void {
  clear(root);

  const header = h('div', { class: 'page-header' }, [
    h('h1', { class: 'page-title' }, [t('评委席')]),
    h('p', { class: 'page-subtitle' }, [
      t(`每口品鉴后点击"吐酒"按钮计数，累计达 ${state.config.sipLimitPerWine} 口自动锁定该酒款评分`),
    ]),
  ]);

  const judgeOptions = Array.from(state.judges.values()).map((j) =>
    h('option', { value: j.id, selected: j.id === state.activeJudgeId }, [
      t(`${j.seatNumber}号 · ${j.name}`),
    ]),
  );
  const select = h('select', { class: 'select' }, judgeOptions) as HTMLSelectElement;
  select.addEventListener('change', () => store.setActiveJudge(select.value));
  const judgeSelector = h('div', { class: 'judge-selector' }, [
    h('span', { style: 'color:var(--text-secondary);font-size:14px' }, [t('当前评委：')]),
    select,
  ]);

  const judge = state.activeJudgeId ? state.judges.get(state.activeJudgeId) : null;

  if (!judge) {
    root.appendChild(header);
    root.appendChild(judgeSelector);
    root.appendChild(
      h('div', { class: 'empty-state' }, [
        h('div', { class: 'empty-state-icon' }, [t('🍷')]),
        h('div', { class: 'empty-state-text' }, [t('请选择评委')]),
      ]),
    );
    return;
  }

  const currentBlindId = judge.currentBlindId;
  const currentWine = currentBlindId ? store.getWineByBlindId(currentBlindId) : null;
  const currentState = currentBlindId ? judge.wines.get(currentBlindId) : null;

  if (!currentWine || !currentState) {
    root.appendChild(header);
    root.appendChild(judgeSelector);
    root.appendChild(
      h('div', { class: 'empty-state' }, [
        h('div', { class: 'empty-state-icon' }, [t('✅')]),
        h('div', { class: 'empty-state-text' }, [t('所有酒款已完成评分')]),
      ]),
    );
    return;
  }

  const statusBadge = (() => {
    const dot = h('span', { class: 'status-dot' }, []);
    const label =
      currentState.status === 'active' ? '品鉴中' : currentState.status === 'locked' ? '已锁定' : '待品鉴';
    const cls = `wine-status ${currentState.status}`;
    return h('span', { class: cls }, [dot, t(label)]);
  })();

  const sipLimit = state.config.sipLimitPerWine;
  const pct = Math.min(100, (currentState.sipCount / sipLimit) * 100);
  const progressFill = h('div', {
    class: 'sip-progress-fill',
    style: `width:${pct}%`,
  });
  const progressBar = h('div', { class: 'sip-progress-bar' }, [progressFill]);

  const spitBtn = h(
    'button',
    {
      class: 'spit-btn',
      disabled: currentState.status === 'locked',
    },
    [
      h('span', { class: 'spit-btn-inner' }, [
        t('吐酒'),
        h('span', { class: 'spit-btn-sub' }, [t('点击计数')]),
      ]),
    ],
  );
  spitBtn.addEventListener('click', () => {
    if (judge && currentBlindId) {
      store.recordSpit(judge.id, currentBlindId);
    }
  });

  const { container: scoreSection, getValues } = scoreInputs(
    currentState,
    state.config.maxScorePerDimension,
  );

  const submitBtn = h(
    'button',
    {
      class: 'btn btn-primary',
      disabled: currentState.status !== 'locked' || currentState.totalScore !== null,
    },
    [t('确认提交评分')],
  );
  submitBtn.addEventListener('click', () => {
    const vals = getValues();
    if (vals && judge && currentBlindId) {
      const ok = store.submitScore(judge.id, currentBlindId, vals);
      if (!ok) {
        alert('评分提交失败，请确认该酒款已锁定且尚未提交。');
      }
    } else {
      alert(`请完整填写 4 个维度（0 ~ ${state.config.maxScorePerDimension}）`);
    }
  });

  const unlockBtn = h('button', { class: 'btn btn-secondary' }, [t('监审解锁')]);
  unlockBtn.addEventListener('click', () => {
    if (!judge || !currentBlindId) return;
    store.requestUnlock(
      judge.id,
      currentBlindId,
      `评委${judge.name}申请解锁酒款 ${currentBlindId}`,
      () => {},
    );
  });

  const submitRow = h('div', { class: 'submit-row' }, [unlockBtn, submitBtn]);
  scoreSection.appendChild(submitRow);

  const wineCard = h('div', { class: 'current-wine-card' }, [
    h('div', { class: 'wine-header' }, [
      h('div', { class: 'wine-blind-id' }, [t(currentWine.blindId)]),
      statusBadge,
    ]),
    h('div', { class: 'sip-counter-section' }, [
      h('div', { class: 'sip-label' }, [t('已品鉴口数')]),
      h('div', { class: 'sip-numbers' }, [
        h('span', { class: 'sip-count' }, [t(String(currentState.sipCount))]),
        h('span', { class: 'sip-separator' }, [t('/')]),
        h('span', { class: 'sip-max' }, [t(String(sipLimit))]),
      ]),
      progressBar,
      spitBtn,
    ]),
    scoreSection,
  ]);

  const listTitle = h(
    'h3',
    { style: 'font-size:16px;margin:32px 0 16px;color:var(--text-secondary);font-weight:600' },
    [t('全部酒款进度')],
  );

  const wineCards = state.config.wines.map((w) => {
    const ws = judge.wines.get(w.blindId);
    if (!ws) return null;
    const isCurrent = w.blindId === currentBlindId;
    const scoreText = ws.totalScore !== null ? String(ws.totalScore) : '—';
    const cls = `wine-list-card${isCurrent ? ' current' : ''}`;
    const scoreCls = `wine-list-score${ws.status === 'locked' ? ' locked' : ''}`;
    const sipsLabel = `${ws.sipCount}/${sipLimit} 口`;
    const statusText =
      ws.status === 'active'
        ? '品鉴中'
        : ws.status === 'locked'
        ? ws.totalScore !== null
          ? '已评分'
          : '待评分'
        : '待品鉴';

    const card = h('div', { class: cls }, [
      h('div', { class: 'wine-list-left' }, [
        h('div', { class: 'wine-list-blind' }, [t(w.blindId)]),
        h('div', { class: 'wine-list-info' }, [
          h('div', { class: 'wine-list-name' }, [t(statusText)]),
          h('div', { class: 'wine-list-meta' }, [
            t(state.currentView === 'supervisor' ? `${w.realName} · ${w.realVintage}` : '盲品酒款'),
          ]),
        ]),
      ]),
      h('div', { class: 'wine-list-right' }, [
        h('div', { class: 'wine-list-sips' }, [t(sipsLabel)]),
        h('div', { class: scoreCls }, [t(scoreText)]),
      ]),
    ]);

    if (ws.status !== 'locked') {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => store.activateWine(judge.id, w.blindId));
    }

    return card;
  });

  const wineList = h('div', { class: 'wine-list' }, wineCards.filter(Boolean) as HTMLElement[]);

  root.appendChild(header);
  root.appendChild(judgeSelector);
  root.appendChild(wineCard);
  root.appendChild(listTitle);
  root.appendChild(wineList);
}
