import { h, t, clear } from './utils.js';
import { store } from '../store.js';
import { renderJudgeView } from './judge_view.js';
import { renderSupervisorView } from './supervisor_view.js';
import { renderBigscreenView } from './bigscreen_view.js';
import { renderReportView } from './report_view.js';
import { renderPinModal } from './pin_modal.js';
const NAV_ITEMS = [
    { id: 'judge', label: '评委席', icon: '🍷' },
    { id: 'supervisor', label: '监审后台', icon: '🛡️' },
    { id: 'bigscreen', label: '公众大屏', icon: '📺' },
    { id: 'report', label: '赛后报告', icon: '📊' },
];
export function createApp(root) {
    const shell = h('div', { class: 'app-shell' });
    const sidebar = h('aside', { class: 'sidebar' });
    const main = h('main', { class: 'main-content' });
    const modalRoot = h('div', { id: 'modal-root' });
    shell.appendChild(sidebar);
    shell.appendChild(main);
    root.appendChild(shell);
    root.appendChild(modalRoot);
    function renderSidebar(state) {
        clear(sidebar);
        const title = h('div', { class: 'sidebar-title' }, [t('品酒计数系统')]);
        const nav = h('nav', { class: 'sidebar-nav' });
        for (const item of NAV_ITEMS) {
            const btn = h('button', { class: `nav-btn${state.currentView === item.id ? ' active' : ''}` }, [
                h('span', { class: 'nav-icon' }, [t(item.icon)]),
                t(item.label),
            ]);
            btn.addEventListener('click', () => store.setView(item.id));
            nav.appendChild(btn);
        }
        const divider = h('div', {
            style: 'border-top:1px solid var(--border);margin:24px 20px 16px',
        });
        const rulesTitle = h('div', { class: 'sidebar-title' }, [t('赛规')]);
        const rules = h('div', {
            style: 'padding:0 20px;color:var(--text-muted);font-size:12px;line-height:1.7',
        }, [
            h('div', {}, [t(`· 每酒品鉴上限：${state.config.sipLimitPerWine} 口`)]),
            h('div', {}, [t(`· 每维度满分：${state.config.maxScorePerDimension} 分`)]),
            h('div', {}, [t(`· 口数达上限自动锁定评分`)]),
            h('div', {}, [t(`· 解锁须监审 PIN 留痕`)]),
            state.config.sensorEnabled
                ? h('div', {}, [t('· 液位传感器校验：开启')])
                : h('div', {}, [t('· 液位传感器校验：未启用')]),
        ]);
        sidebar.appendChild(title);
        sidebar.appendChild(nav);
        sidebar.appendChild(divider);
        sidebar.appendChild(rulesTitle);
        sidebar.appendChild(rules);
    }
    function renderMain(state) {
        clear(main);
        switch (state.currentView) {
            case 'judge':
                renderJudgeView(main, state);
                break;
            case 'supervisor':
                renderSupervisorView(main, state);
                break;
            case 'bigscreen':
                renderBigscreenView(main, state);
                break;
            case 'report':
                renderReportView(main, state);
                break;
        }
    }
    function render(state) {
        if (state.currentView === 'bigscreen') {
            clear(root);
            const bgRoot = h('div');
            root.appendChild(bgRoot);
            root.appendChild(modalRoot);
            renderBigscreenView(bgRoot, state);
        }
        else {
            clear(root);
            root.appendChild(shell);
            root.appendChild(modalRoot);
            renderSidebar(state);
            renderMain(state);
        }
        clear(modalRoot);
        renderPinModal(modalRoot, state);
    }
    const unsubscribe = store.subscribe(render);
    render(store.getState());
    return unsubscribe;
}
//# sourceMappingURL=app.js.map