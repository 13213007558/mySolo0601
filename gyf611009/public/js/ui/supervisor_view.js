import { h, t, clear, formatDateTime, actionLabel } from './utils.js';
import { store } from '../store.js';
export function renderSupervisorView(root, state) {
    clear(root);
    const header = h('div', { class: 'page-header' }, [
        h('h1', { class: 'page-title' }, [t('监审后台')]),
        h('p', { class: 'page-subtitle' }, [t('实时查看所有评委进度、操作日志及解锁记录')]),
    ]);
    const allWines = state.config.wines.length;
    let totalSips = 0;
    let totalLocked = 0;
    let totalScored = 0;
    let unlockCount = 0;
    for (const judge of state.judges.values()) {
        for (const ws of judge.wines.values()) {
            totalSips += ws.sipCount;
            if (ws.status === 'locked')
                totalLocked++;
            if (ws.totalScore !== null)
                totalScored++;
            if (ws.unlockedBySupervisor)
                unlockCount++;
        }
    }
    const totalCells = state.judges.size * allWines;
    const progressPct = totalCells > 0 ? Math.round((totalScored / totalCells) * 100) : 0;
    const stats = [
        { label: '总体评分进度', value: `${progressPct}%`, cls: 'good' },
        { label: '总吐酒口数', value: String(totalSips), cls: '' },
        { label: '已评分酒款', value: `${totalScored}/${totalCells}`, cls: 'good' },
        { label: '监审解锁次数', value: String(unlockCount), cls: unlockCount > 0 ? 'warn' : '' },
    ];
    const statCards = stats.map((s) => h('div', { class: 'stat-card' }, [
        h('div', { class: 'stat-label' }, [t(s.label)]),
        h('div', { class: `stat-value ${s.cls}` }, [t(s.value)]),
    ]));
    const statsGrid = h('div', { class: 'stats-grid' }, statCards);
    const title2 = h('h3', { style: 'font-size:16px;margin:8px 0 16px;color:var(--text-secondary);font-weight:600' }, [t('实时操作日志（最近 100 条）')]);
    const auditHeader = h('div', { class: 'audit-log-header' }, [
        h('div', {}, [t('时间')]),
        h('div', {}, [t('操作')]),
        h('div', {}, [t('操作人')]),
        h('div', {}, [t('详情')]),
    ]);
    const reversed = [...state.auditLog].reverse().slice(0, 100);
    const rows = reversed.map((entry) => {
        const actionCls = entry.action === 'SUPERVISOR_UNLOCK' || entry.action === 'SIP_LIMIT_EXCEEDED'
            ? 'unlock'
            : entry.action === 'WINE_LOCKED_AUTO'
                ? 'unlock'
                : 'normal';
        let operator = '系统';
        if (entry.supervisorId) {
            const sv = state.config.supervisors.find((s) => s.id === entry.supervisorId);
            operator = sv?.name ?? entry.supervisorId;
        }
        else if (entry.judgeId) {
            const j = state.judges.get(entry.judgeId);
            operator = j?.name ?? entry.judgeId;
        }
        return h('div', { class: 'audit-log-row' }, [
            h('div', { class: 'audit-time' }, [t(formatDateTime(entry.timestamp))]),
            h('div', { class: `audit-action ${actionCls}` }, [t(actionLabel(entry.action))]),
            h('div', { class: 'audit-operator' }, [t(operator)]),
            h('div', { class: 'audit-detail' }, [t(entry.detail || '—')]),
        ]);
    });
    const auditLog = h('div', { class: 'audit-log' }, [auditHeader, ...rows]);
    root.appendChild(header);
    root.appendChild(statsGrid);
    root.appendChild(title2);
    root.appendChild(auditLog);
    if (rows.length === 0) {
        const empty = h('div', { class: 'empty-state' }, [
            h('div', { class: 'empty-state-icon' }, [t('📋')]),
            h('div', { class: 'empty-state-text' }, [t('暂无操作记录')]),
        ]);
        root.appendChild(empty);
    }
    // Quick unlock area
    const unlockTitle = h('h3', { style: 'font-size:16px;margin:32px 0 16px;color:var(--text-secondary);font-weight:600' }, [t('快速解锁：评委 × 酒款')]);
    const judgeOptions = Array.from(state.judges.values()).map((j) => h('option', { value: j.id }, [t(`${j.seatNumber}号 · ${j.name}`)]));
    const wineOptions = state.config.wines.map((w) => h('option', { value: w.blindId }, [t(`${w.blindId} · ${w.realName} (${w.realVintage})`)]));
    const judgeSel = h('select', { class: 'select', style: 'flex:1' }, judgeOptions);
    const wineSel = h('select', { class: 'select', style: 'flex:1' }, wineOptions);
    const quickUnlockBtn = h('button', { class: 'btn btn-danger', style: 'flex:0 0 160px' }, [t('申请解锁')]);
    quickUnlockBtn.addEventListener('click', () => {
        const jid = judgeSel.value;
        const bid = wineSel.value;
        if (!jid || !bid)
            return;
        store.requestUnlock(jid, bid, `监审后台主动解锁`, () => {
            // refresh handled by store subscription
        });
    });
    const row = h('div', { style: 'display:flex;gap:12px;align-items:center' }, [judgeSel, wineSel, quickUnlockBtn]);
    // Wine mapping table
    const mappingTitle = h('h3', { style: 'font-size:16px;margin:32px 0 16px;color:var(--text-secondary);font-weight:600' }, [t('盲品序号 ↔ 真实酒款映射（后台可见）')]);
    const mapHeader = h('div', { class: 'audit-log-header' }, [
        h('div', {}, [t('盲品序号')]),
        h('div', {}, [t('酒款名称')]),
        h('div', {}, [t('酒庄')]),
        h('div', {}, [t('年份 / 口数上限')]),
    ]);
    const mapRows = state.config.wines.map((w) => h('div', { class: 'audit-log-row' }, [
        h('div', { style: 'color:var(--accent-amber);font-weight:700;font-size:16px' }, [t(w.blindId)]),
        h('div', {}, [t(w.realName)]),
        h('div', { class: 'audit-operator' }, [t(w.realProducer)]),
        h('div', { class: 'audit-detail' }, [t(`${w.realVintage} 年 · 上限 ${w.sipLimit} 口`)]),
    ]));
    const mappingTable = h('div', { class: 'audit-log' }, [mapHeader, ...mapRows]);
    root.appendChild(unlockTitle);
    root.appendChild(row);
    root.appendChild(mappingTitle);
    root.appendChild(mappingTable);
    void store;
}
//# sourceMappingURL=supervisor_view.js.map