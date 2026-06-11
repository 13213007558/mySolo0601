import { h, t, clear, formatDateTime } from './utils.js';
import { store } from '../store.js';
import { DIMENSION_LABELS, SCORE_DIMENSIONS } from '../types.js';
export function renderReportView(root, state) {
    clear(root);
    const header = h('div', { class: 'page-header' }, [
        h('h1', { class: 'page-title' }, [t('赛后报告')]),
        h('p', { class: 'page-subtitle' }, [t('每位评委的个体饮用/吐酒明细与评分汇总')]),
    ]);
    const judgeOptions = Array.from(state.judges.values()).map((j) => h('option', { value: j.id, selected: j.id === state.activeJudgeId }, [
        t(`${j.seatNumber}号 · ${j.name}`),
    ]));
    const select = h('select', { class: 'select' }, judgeOptions);
    select.addEventListener('change', () => store.setActiveJudge(select.value));
    const judgeSelector = h('div', { class: 'judge-selector' }, [
        h('span', { style: 'color:var(--text-secondary);font-size:14px' }, [t('查看评委：')]),
        select,
    ]);
    const judge = state.activeJudgeId ? state.judges.get(state.activeJudgeId) : null;
    if (!judge) {
        root.appendChild(header);
        root.appendChild(judgeSelector);
        return;
    }
    const rows = [];
    let totalSips = 0;
    let totalScore = 0;
    let completedCount = 0;
    let unlockCount = 0;
    for (const wine of state.config.wines) {
        const ws = judge.wines.get(wine.blindId);
        if (!ws)
            continue;
        totalSips += ws.sipCount;
        if (ws.unlockedBySupervisor)
            unlockCount++;
        if (ws.totalScore !== null) {
            totalScore += ws.totalScore;
            completedCount++;
        }
        const scoreCells = SCORE_DIMENSIONS.map((d) => {
            const v = ws.score?.[d];
            return h('td', { class: 'num' }, [t(v !== undefined ? String(v) : '—')]);
        });
        const spitTimes = ws.spitRecords
            .slice(-3)
            .map((r) => formatDateTime(r.timestamp).slice(11))
            .join(' · ');
        rows.push(h('tr', {}, [
            h('td', {}, [h('strong', { style: 'color:var(--accent-amber);font-size:16px' }, [t(wine.blindId)])]),
            h('td', {}, [
                t(state.currentView === 'supervisor' || state.currentView === 'report'
                    ? `${wine.realName} (${wine.realVintage})`
                    : wine.blindId),
            ]),
            h('td', { class: 'num' }, [t(`${ws.sipCount}/${wine.sipLimit}`)]),
            ...scoreCells,
            h('td', { class: 'num' }, [
                h('strong', {}, [t(ws.totalScore !== null ? String(ws.totalScore) : '—')]),
            ]),
            h('td', { class: 'num' }, [
                t(ws.unlockedBySupervisor ? '监审解锁' : ws.status === 'locked' ? '正常锁定' : '进行中'),
            ]),
            h('td', { style: 'color:var(--text-muted);font-size:12px' }, [t(spitTimes || '—')]),
        ]));
    }
    const headers = ['盲品号', '酒款', '口数', ...SCORE_DIMENSIONS.map((d) => DIMENSION_LABELS[d]), '总分', '状态', '最近吐酒时间'];
    const thead = h('thead', {}, [h('tr', {}, headers.map((hd) => h('th', {}, [t(hd)])))]);
    const tbody = h('tbody', {}, rows);
    const table = h('table', { class: 'report-table' }, [thead, tbody]);
    const avgScore = completedCount > 0 ? (totalScore / completedCount).toFixed(2) : '—';
    const summaryItems = [
        { label: '已完成评分', value: `${completedCount}/${state.config.wines.length}` },
        { label: '平均总分', value: avgScore },
        { label: '累计吐酒口数', value: String(totalSips) },
        { label: '监审解锁次数', value: String(unlockCount) },
    ];
    const summary = h('div', { class: 'report-summary' }, summaryItems.map((s) => h('div', {}, [
        h('div', { class: 'stat-label' }, [t(s.label)]),
        h('div', { class: 'stat-value' }, [t(s.value)]),
    ])));
    const card = h('div', { class: 'report-card' }, [
        h('div', { class: 'report-header' }, [
            h('div', { class: 'report-judge-name' }, [t(`${judge.seatNumber}号评委 · ${judge.name}`)]),
            h('div', { style: 'color:var(--text-muted);font-size:13px' }, [t(`报告生成时间 ${formatDateTime(Date.now())}`)]),
        ]),
        table,
        summary,
    ]);
    const exportBtn = h('button', { class: 'btn btn-secondary', style: 'max-width:240px' }, [
        t('导出 JSON 报告'),
    ]);
    exportBtn.addEventListener('click', () => {
        const data = Array.from(state.judges.values()).map((j) => ({
            id: j.id,
            name: j.name,
            seatNumber: j.seatNumber,
            wines: Array.from(j.wines.values()).map((ws) => ({
                blindId: ws.blindId,
                sipCount: ws.sipCount,
                totalScore: ws.totalScore,
                score: ws.score,
                status: ws.status,
                unlockedBySupervisor: ws.unlockedBySupervisor,
                spitRecords: ws.spitRecords.map((r) => ({
                    timestamp: r.timestamp,
                    sipNumber: r.sipNumber,
                    sensorLevelDelta: r.sensorLevelDelta,
                })),
            })),
        }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wine-competition-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
    root.appendChild(header);
    root.appendChild(judgeSelector);
    root.appendChild(card);
    root.appendChild(h('div', { style: 'margin-top:12px' }, [exportBtn]));
}
//# sourceMappingURL=report_view.js.map