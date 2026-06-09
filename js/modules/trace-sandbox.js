/**
 * 全链路追踪沙箱模块
 * 实现数据全生命周期的无侵入式追踪
 */

import { getState, subscribe, advanceTrace, showToast } from '../state/store.js';
import { formatDateTime, formatRelativeTime, getSensitivityLabel, getStatusLabel } from '../utils/format.js';
import { renderFlowNodes } from '../components/timeline.js';
import { renderStatusBadge, renderAvatar, renderTag } from '../components/status-badge.js';
import { openDrawer } from '../components/modal.js';

let container = null;

/**
 * 初始化全链路追踪沙箱模块
 */
export function initTraceSandbox(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  // 订阅状态变化
  subscribe('traces', () => render());
  
  if (container) {
    render();
  }
}

/**
 * 渲染全链路追踪沙箱
 */
export function render(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  if (!container) return;
  
  const state = getState();
  const traces = state.traces;
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- 页面标题和筛选 -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-100">全链路追踪沙箱</h2>
          <p class="text-slate-400 mt-1">实时追踪数据从采集到归档的全生命周期，确保每一步都可追溯</p>
        </div>
        <div class="flex gap-3">
          <select id="trace-status-filter" class="form-select w-40" onchange="window.filterTraces()">
            <option value="all">全部状态</option>
            <option value="running">运行中</option>
            <option value="completed">已完成</option>
            <option value="paused">已暂停</option>
          </select>
          <select id="trace-type-filter" class="form-select w-40" onchange="window.filterTraces()">
            <option value="all">全部类型</option>
            <option value="CRF数据">CRF数据</option>
            <option value="医学影像">医学影像</option>
            <option value="实验室检验">实验室检验</option>
            <option value="电子日志">电子日志</option>
            <option value="音频记录">音频记录</option>
          </select>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-4 gap-4">
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
              🔄
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${traces.length}</div>
              <div class="text-sm text-slate-400">追踪任务总数</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${traces.filter(t => t.status === 'completed').length}</div>
              <div class="text-sm text-slate-400">已完成</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
              ⚡
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${traces.filter(t => t.status === 'running').length}</div>
              <div class="text-sm text-slate-400">进行中</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">
              ⏸️
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${traces.filter(t => t.status === 'paused').length}</div>
              <div class="text-sm text-slate-400">已暂停</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 追踪列表 -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-slate-100">追踪任务列表</h3>
          <div class="text-sm text-slate-400">点击任务查看详细追踪流程</div>
        </div>
        <div class="card-body p-0">
          <table class="data-table">
            <thead>
              <tr>
                <th>追踪ID</th>
                <th>任务名称</th>
                <th>数据类型</th>
                <th>所属项目</th>
                <th>当前阶段</th>
                <th>进度</th>
                <th>敏感度</th>
                <th>状态</th>
                <th>开始时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="trace-table-body">
              ${renderTraceTableRows(traces)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // 绑定事件
  bindEvents();
}

/**
 * 渲染追踪表格行
 */
function renderTraceTableRows(traces) {
  if (!traces || traces.length === 0) {
    return `
      <tr>
        <td colspan="10" class="text-center py-12 text-slate-500">
          暂无追踪任务
        </td>
      </tr>
    `;
  }

  return traces.map(trace => {
    const sensitivity = getSensitivityLabel(trace.sensitivity);
    const status = getStatusLabel(trace.status);
    
    return `
      <tr class="cursor-pointer hover:bg-slate-800/50 transition-colors" onclick="window.viewTraceDetail('${trace.id}')">
        <td class="font-mono text-xs text-blue-400">${trace.id}</td>
        <td class="font-medium text-slate-200">${trace.taskName}</td>
        <td>${renderTag(trace.dataType, 'cyan')}</td>
        <td class="text-slate-400 max-w-[200px] truncate" title="${trace.projectName}">${trace.projectName}</td>
        <td class="text-slate-300">${trace.currentStage}</td>
        <td class="w-32">
          <div class="flex items-center gap-2">
            <div class="flex-1 progress-bar">
              <div class="progress-fill" style="width: ${trace.progress}%"></div>
            </div>
            <span class="text-xs text-slate-400">${trace.progress}%</span>
          </div>
        </td>
        <td><span class="tag ${sensitivity.class}">${sensitivity.text}</span></td>
        <td>${renderStatusBadge(trace.status, 'sm')}</td>
        <td class="text-slate-400 text-xs">${formatRelativeTime(trace.startTime)}</td>
        <td>
          <div class="flex gap-2">
            ${trace.status === 'running' ? `
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.advanceTraceStage('${trace.id}')">
                推进
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.viewTraceDetail('${trace.id}')">
              详情
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 查看追踪详情
 */
export function viewTraceDetail(traceId) {
  const state = getState();
  const trace = state.traces.find(t => t.id === traceId);
  
  if (!trace) {
    showToast('追踪任务不存在', 'error');
    return;
  }

  const sensitivity = getSensitivityLabel(trace.sensitivity);
  const status = getStatusLabel(trace.status);

  const content = `
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-400">追踪ID</label>
          <div class="font-mono text-blue-400 mt-1">${trace.id}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">状态</label>
          <div class="mt-1">${renderStatusBadge(trace.status)}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">任务名称</label>
          <div class="font-medium text-slate-200 mt-1">${trace.taskName}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">数据类型</label>
          <div class="mt-1">${renderTag(trace.dataType, 'cyan')}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">所属项目</label>
          <div class="text-slate-300 mt-1">${trace.projectName}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">敏感度</label>
          <div class="mt-1"><span class="tag ${sensitivity.class}">${sensitivity.text}</span></div>
        </div>
        <div>
          <label class="text-sm text-slate-400">开始时间</label>
          <div class="text-slate-300 mt-1">${formatDateTime(trace.startTime)}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">当前阶段</label>
          <div class="text-slate-300 mt-1">${trace.currentStage}</div>
        </div>
      </div>

      <!-- 整体进度 -->
      <div class="bg-slate-900/50 rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400">整体进度</span>
          <span class="text-sm font-medium text-slate-200">${trace.progress}%</span>
        </div>
        <div class="progress-bar h-3">
          <div class="progress-fill" style="width: ${trace.progress}%"></div>
        </div>
      </div>

      <!-- 流程节点 -->
      <div>
        <h4 class="text-lg font-semibold text-slate-100 mb-4">追踪流程节点</h4>
        ${renderFlowNodes(trace.checkpoints)}
      </div>

      <!-- 事件日志 -->
      <div>
        <h4 class="text-lg font-semibold text-slate-100 mb-4">关键事件</h4>
        <div class="space-y-2">
          ${trace.events.map(event => {
            const eventColors = {
              info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
              success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
              warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
              error: 'bg-red-500/10 border-red-500/30 text-red-400'
            };
            const color = eventColors[event.type] || eventColors.info;
            
            return `
              <div class="flex items-start gap-3 p-3 rounded-lg border ${color}">
                <span class="text-lg">${event.type === 'success' ? '✓' : event.type === 'warning' ? '⚠' : event.type === 'error' ? '✕' : 'ℹ'}</span>
                <div class="flex-1">
                  <div class="text-sm">${event.message}</div>
                  <div class="text-xs opacity-70 mt-1">${formatDateTime(event.timestamp)}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 操作按钮 -->
      ${trace.status === 'running' ? `
        <div class="flex gap-3 pt-4 border-t border-slate-700">
          <button class="btn btn-primary flex-1" onclick="window.advanceTraceStage('${trace.id}'); window.closeDrawer();">
            推进到下一阶段
          </button>
          <button class="btn btn-secondary" onclick="window.closeDrawer()">
            关闭
          </button>
        </div>
      ` : `
        <div class="flex justify-end pt-4 border-t border-slate-700">
          <button class="btn btn-secondary" onclick="window.closeDrawer()">
            关闭
          </button>
        </div>
      `}
    </div>
  `;

  openDrawer(content, {
    title: `追踪详情 - ${trace.taskName}`,
    width: 'max-w-3xl'
  });
}

/**
 * 推进追踪阶段
 */
export function advanceTraceStage(traceId) {
  const result = advanceTrace(traceId);
  if (result) {
    // 如果抽屉打开着，刷新内容
    const drawer = document.getElementById('app-drawer');
    if (drawer) {
      viewTraceDetail(traceId);
    }
  }
}

/**
 * 筛选追踪任务
 */
export function filterTraces() {
  const state = getState();
  const statusFilter = document.getElementById('trace-status-filter')?.value || 'all';
  const typeFilter = document.getElementById('trace-type-filter')?.value || 'all';
  
  let filtered = [...state.traces];
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  
  if (typeFilter !== 'all') {
    filtered = filtered.filter(t => t.dataType === typeFilter);
  }
  
  const tbody = document.getElementById('trace-table-body');
  if (tbody) {
    tbody.innerHTML = renderTraceTableRows(filtered);
  }
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 事件已通过内联 onclick 绑定
}

// 暴露到全局
window.viewTraceDetail = viewTraceDetail;
window.advanceTraceStage = advanceTraceStage;
window.filterTraces = filterTraces;
