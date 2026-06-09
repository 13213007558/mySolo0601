/**
 * 异常任务补偿看板模块
 * 处理异常任务的展示、筛选、重试、人工介入等交互逻辑
 */

import { getState, subscribe, showToast } from '../state/store.js';
import { handleManualIntervention, scheduleAutoRetry, cancelAutoRetry, TaskStatus } from '../state/fl-state.js';
import { renderStatusBadge, renderStatusIndicator } from '../components/status-badge.js';
import { renderTimeline } from '../components/timeline.js';
import { formatDateTime, truncateText, getPriorityLabel, getPriorityClass } from '../utils/format.js';

let currentFilter = 'all';
let currentSearch = '';
let selectedTaskId = null;

export function initAnomalyBoard() {
  // 订阅状态变化
  subscribe('anomalyTasks', (newValue) => {
    renderAnomalyBoard();
    if (selectedTaskId) {
      renderTaskDetail(selectedTaskId);
    }
  });
  
  // 事件委托
  document.addEventListener('click', handleBoardClick);
  document.addEventListener('input', handleSearchInput);
  document.addEventListener('change', handleFilterChange);
  
  // 初始渲染
  renderAnomalyBoard();
}

function handleBoardClick(e) {
  // 任务行点击
  const taskRow = e.target.closest('[data-task-id]');
  if (taskRow) {
    const taskId = taskRow.dataset.taskId;
    openTaskDetail(taskId);
    return;
  }
  
  // 关闭详情
  if (e.target.closest('#close-detail')) {
    closeTaskDetail();
    return;
  }
  
  // 重试按钮
  if (e.target.closest('[data-action="retry"]')) {
    const taskId = e.target.closest('[data-action="retry"]').dataset.taskId;
    handleRetry(taskId);
    return;
  }
  
  // 终止按钮
  if (e.target.closest('[data-action="terminate"]')) {
    const taskId = e.target.closest('[data-action="terminate"]').dataset.taskId;
    handleTerminate(taskId);
    return;
  }
  
  // 强制重试按钮
  if (e.target.closest('[data-action="force-retry"]')) {
    const taskId = e.target.closest('[data-action="force-retry"]').dataset.taskId;
    handleForceRetry(taskId);
    return;
  }
  
  // 调整参数重试
  if (e.target.closest('[data-action="adjust-retry"]')) {
    const taskId = e.target.closest('[data-action="adjust-retry"]').dataset.taskId;
    openAdjustDialog(taskId);
    return;
  }
  
  // 标记恢复
  if (e.target.closest('[data-action="mark-recovered"]')) {
    const taskId = e.target.closest('[data-action="mark-recovered"]').dataset.taskId;
    handleMarkRecovered(taskId);
    return;
  }
  
  // 提交调整参数
  if (e.target.closest('[data-action="submit-adjust"]')) {
    const taskId = e.target.closest('[data-action="submit-adjust"]').dataset.taskId;
    submitAdjustParams(taskId);
    return;
  }
  
  // 取消调整
  if (e.target.closest('[data-action="cancel-adjust"]')) {
    closeAdjustDialog();
    return;
  }
}

function handleSearchInput(e) {
  if (e.target.id === 'anomaly-search') {
    currentSearch = e.target.value;
    renderAnomalyBoard();
  }
}

function handleFilterChange(e) {
  if (e.target.id === 'anomaly-filter') {
    currentFilter = e.target.value;
    renderAnomalyBoard();
  }
}

function getFilteredTasks() {
  const state = getState();
  let tasks = [...state.anomalyTasks];
  
  // 状态筛选
  if (currentFilter !== 'all') {
    tasks = tasks.filter(t => t.status === currentFilter);
  }
  
  // 搜索筛选
  if (currentSearch) {
    const search = currentSearch.toLowerCase();
    tasks = tasks.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.id.toLowerCase().includes(search) ||
      t.failedReason.toLowerCase().includes(search)
    );
  }
  
  return tasks;
}

export function renderAnomalyBoard() {
  const container = document.getElementById('anomaly-board-container');
  if (!container) return;
  
  const tasks = getFilteredTasks();
  const state = getState();
  
  // 统计数据
  const stats = {
    total: state.anomalyTasks.length,
    pending: state.anomalyTasks.filter(t => t.status === TaskStatus.RETRY_PENDING).length,
    manual: state.anomalyTasks.filter(t => t.status === TaskStatus.MANUAL_INTERVENTION).length,
    recovered: state.anomalyTasks.filter(t => t.status === TaskStatus.RECOVERED).length
  };
  
  container.innerHTML = `
    <div class="p-6 space-y-6">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-4 gap-4">
        <div class="metric-card">
          <div class="text-slate-400 text-sm">异常任务总数</div>
          <div class="text-2xl font-bold text-white mt-1">${stats.total}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">待自动重试</div>
          <div class="text-2xl font-bold text-amber-400 mt-1">${stats.pending}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">待人工介入</div>
          <div class="text-2xl font-bold text-red-400 mt-1">${stats.manual}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">已恢复</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">${stats.recovered}</div>
        </div>
      </div>
      
      <!-- 筛选和搜索 -->
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <input 
            type="text" 
            id="anomaly-search" 
            placeholder="搜索任务名称、ID、失败原因..." 
            class="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-bronze"
            value="${currentSearch}"
          />
        </div>
        <select id="anomaly-filter" class="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-bronze">
          <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>全部状态</option>
          <option value="${TaskStatus.RETRY_PENDING}" ${currentFilter === TaskStatus.RETRY_PENDING ? 'selected' : ''}>待重试</option>
          <option value="${TaskStatus.MANUAL_INTERVENTION}" ${currentFilter === TaskStatus.MANUAL_INTERVENTION ? 'selected' : ''}>待人工介入</option>
          <option value="${TaskStatus.TIMEOUT}" ${currentFilter === TaskStatus.TIMEOUT ? 'selected' : ''}>超时</option>
          <option value="${TaskStatus.FAILED}" ${currentFilter === TaskStatus.FAILED ? 'selected' : ''}>失败</option>
          <option value="${TaskStatus.RECOVERED}" ${currentFilter === TaskStatus.RECOVERED ? 'selected' : ''}>已恢复</option>
          <option value="${TaskStatus.TERMINATED}" ${currentFilter === TaskStatus.TERMINATED ? 'selected' : ''}>已终止</option>
        </select>
      </div>
      
      <!-- 任务列表 -->
      <div class="block-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-12"></th>
                <th>任务ID</th>
                <th>任务名称</th>
                <th>类型</th>
                <th>优先级</th>
                <th>敏感度</th>
                <th>状态</th>
                <th>重试次数</th>
                <th>失败原因</th>
                <th>创建时间</th>
                <th class="w-40">操作</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.length === 0 ? `
                <tr>
                  <td colspan="11" class="text-center py-12 text-slate-400">
                    暂无异常任务
                  </td>
                </tr>
              ` : tasks.map(task => `
                <tr data-task-id="${task.id}" class="cursor-pointer hover:bg-slate-700/30">
                  <td>${renderStatusIndicator(task.status)}</td>
                  <td class="font-mono text-xs text-slate-300">${task.id}</td>
                  <td class="font-medium text-white">${truncateText(task.name, 20)}</td>
                  <td class="text-slate-300">${getTypeLabel(task.type)}</td>
                  <td>
                    <span class="status-badge ${getPriorityClass(task.priority)}">${getPriorityLabel(task.priority)}</span>
                  </td>
                  <td>${renderStatusBadge(task.dataSensitivity, 'sensitivity')}</td>
                  <td>${renderStatusBadge(task.status)}</td>
                  <td class="text-slate-300">${task.retryCount}/${task.maxRetries}</td>
                  <td class="text-slate-400 text-sm max-w-[200px] truncate" title="${task.failedReason}">${task.failedReason}</td>
                  <td class="text-slate-400 text-sm">${formatDateTime(task.createdAt)}</td>
                  <td>
                    <div class="flex items-center gap-1">
                      ${task.status === TaskStatus.RETRY_PENDING ? `
                        <button class="btn btn-sm btn-success" data-action="retry" data-task-id="${task.id}" onclick="event.stopPropagation()">
                          重试
                        </button>
                        <button class="btn btn-sm btn-danger" data-action="terminate" data-task-id="${task.id}" onclick="event.stopPropagation()">
                          终止
                        </button>
                      ` : task.status === TaskStatus.MANUAL_INTERVENTION ? `
                        <button class="btn btn-sm btn-success" data-action="force-retry" data-task-id="${task.id}" onclick="event.stopPropagation()">
                          强制重试
                        </button>
                        <button class="btn btn-sm btn-secondary" data-action="adjust-retry" data-task-id="${task.id}" onclick="event.stopPropagation()">
                          调整参数
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- 任务详情抽屉 -->
    <div id="detail-overlay" class="drawer-overlay"></div>
    <div id="detail-drawer" class="drawer">
      <div id="detail-content"></div>
    </div>
    
    <!-- 调整参数对话框 -->
    <div id="adjust-dialog" class="hidden fixed inset-0 z-[150] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/70"></div>
      <div class="relative bg-slate-800 border border-slate-600 rounded-lg p-6 w-[480px] shadow-2xl">
        <h3 class="text-lg font-bold text-white mb-4">调整任务参数</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">分配节点</label>
            <select id="adjust-node" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
              <option value="节点-BJ-01">节点-BJ-01 (北京)</option>
              <option value="节点-SH-05">节点-SH-05 (上海)</option>
              <option value="节点-GZ-02">节点-GZ-02 (广州)</option>
              <option value="节点-XA-12">节点-XA-12 (西安)</option>
              <option value="节点-DH-08">节点-DH-08 (敦煌)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">超时时间（秒）</label>
            <input type="number" id="adjust-timeout" value="600" min="60" max="3600" 
              class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">备注说明</label>
            <textarea id="adjust-note" rows="3" placeholder="可选：调整原因说明..."
              class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white resize-none"></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn btn-secondary" data-action="cancel-adjust">取消</button>
          <button class="btn btn-primary" data-action="submit-adjust" id="submit-adjust-btn">确认调整并重试</button>
        </div>
      </div>
    </div>
  `;
}

function openTaskDetail(taskId) {
  selectedTaskId = taskId;
  renderTaskDetail(taskId);
  
  document.getElementById('detail-overlay').classList.add('open');
  document.getElementById('detail-drawer').classList.add('open');
}

function closeTaskDetail() {
  selectedTaskId = null;
  document.getElementById('detail-overlay').classList.remove('open');
  document.getElementById('detail-drawer').classList.remove('open');
}

function renderTaskDetail(taskId) {
  const task = getState().anomalyTasks.find(t => t.id === taskId);
  if (!task) return;
  
  const content = document.getElementById('detail-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="h-full flex flex-col">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-slate-700">
        <div>
          <h3 class="text-lg font-bold text-white">${task.name}</h3>
          <div class="text-sm text-slate-400 font-mono mt-1">${task.id}</div>
        </div>
        <button id="close-detail" class="btn btn-icon btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <!-- 内容区 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- 基本信息 -->
        <div>
          <h4 class="text-sm font-medium text-slate-400 mb-3">基本信息</h4>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-700/30 rounded-lg p-3">
              <div class="text-xs text-slate-400">任务类型</div>
              <div class="text-sm text-white mt-1">${getTypeLabel(task.type)}</div>
            </div>
            <div class="bg-slate-700/30 rounded-lg p-3">
              <div class="text-xs text-slate-400">优先级</div>
              <div class="mt-1">
                <span class="status-badge ${getPriorityClass(task.priority)}">${getPriorityLabel(task.priority)}</span>
              </div>
            </div>
            <div class="bg-slate-700/30 rounded-lg p-3">
              <div class="text-xs text-slate-400">数据敏感度</div>
              <div class="mt-1">${renderStatusBadge(task.dataSensitivity, 'sensitivity')}</div>
            </div>
            <div class="bg-slate-700/30 rounded-lg p-3">
              <div class="text-xs text-slate-400">当前状态</div>
              <div class="mt-1">${renderStatusBadge(task.status)}</div>
            </div>
            <div class="bg-slate-700/30 rounded-lg p-3">
              <div class="text-xs text-slate-400">重试次数</div>
              <div class="text-sm text-white mt-1">${task.retryCount} / ${task.maxRetries}</div>
            </div>
            <div class="bg-slate-700/30 rounded-lg p-3">
              <div class="text-xs text-slate-400">分配节点</div>
              <div class="text-sm text-white mt-1">${task.assignedNode || '-'}</div>
            </div>
          </div>
        </div>
        
        <!-- 失败原因 -->
        <div>
          <h4 class="text-sm font-medium text-slate-400 mb-3">失败原因</h4>
          <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p class="text-sm text-red-300">${task.failedReason}</p>
          </div>
        </div>
        
        <!-- 执行轨迹 -->
        <div>
          <h4 class="text-sm font-medium text-slate-400 mb-3">执行轨迹</h4>
          <div class="bg-slate-700/30 rounded-lg p-4">
            ${renderTimeline(task.executionTrace)}
          </div>
        </div>
      </div>
      
      <!-- 底部操作区 -->
      <div class="p-4 border-t border-slate-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-400">
            创建时间: ${formatDateTime(task.createdAt)}
          </div>
          <div class="flex gap-2">
            ${task.status === TaskStatus.RETRY_PENDING ? `
              <button class="btn btn-secondary" data-action="terminate" data-task-id="${task.id}">终止任务</button>
              <button class="btn btn-success" data-action="retry" data-task-id="${task.id}">立即重试</button>
            ` : task.status === TaskStatus.MANUAL_INTERVENTION ? `
              <button class="btn btn-secondary" data-action="mark-recovered" data-task-id="${task.id}">标记恢复</button>
              <button class="btn btn-danger" data-action="terminate" data-task-id="${task.id}">终止任务</button>
              <button class="btn btn-secondary" data-action="adjust-retry" data-task-id="${task.id}">调整参数</button>
              <button class="btn btn-success" data-action="force-retry" data-task-id="${task.id}">强制重试</button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 绑定提交按钮的 taskId
  const submitBtn = document.getElementById('submit-adjust-btn');
  if (submitBtn) {
    submitBtn.dataset.taskId = taskId;
  }
}

function handleRetry(taskId) {
  const task = getState().anomalyTasks.find(t => t.id === taskId);
  if (!task) return;
  
  cancelAutoRetry(taskId);
  scheduleAutoRetry(taskId, 1000);
  showToast(`已触发重试: ${task.name}`, 'success');
}

function handleTerminate(taskId) {
  const task = getState().anomalyTasks.find(t => t.id === taskId);
  if (!task) return;
  
  if (confirm(`确定要终止任务 "${task.name}" 吗？此操作不可撤销。`)) {
    cancelAutoRetry(taskId);
    handleManualIntervention(taskId, 'terminate', {
      reason: '操作员主动终止',
      operator: '当前操作员'
    });
  }
}

function handleForceRetry(taskId) {
  handleManualIntervention(taskId, 'force_retry', {
    operator: '当前操作员'
  });
}

function handleMarkRecovered(taskId) {
  handleManualIntervention(taskId, 'mark_recovered', {
    operator: '当前操作员',
    note: '问题已确认解决'
  });
}

function openAdjustDialog(taskId) {
  const dialog = document.getElementById('adjust-dialog');
  if (dialog) {
    dialog.classList.remove('hidden');
    dialog.dataset.taskId = taskId;
  }
}

function closeAdjustDialog() {
  const dialog = document.getElementById('adjust-dialog');
  if (dialog) {
    dialog.classList.add('hidden');
  }
}

function submitAdjustParams(taskId) {
  const newNode = document.getElementById('adjust-node').value;
  const newTimeout = parseInt(document.getElementById('adjust-timeout').value);
  const note = document.getElementById('adjust-note').value;
  
  handleManualIntervention(taskId, 'adjust_and_retry', {
    newNode,
    newTimeout,
    note,
    operator: '当前操作员'
  });
  
  closeAdjustDialog();
}

function getTypeLabel(type) {
  const labels = {
    'federated_training': '联邦训练',
    'inference': '推理任务',
    'data_processing': '数据处理',
    'model_aggregation': '模型聚合'
  };
  return labels[type] || type;
}
