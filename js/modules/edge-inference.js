/**
 * 低延迟边缘侧推理决策板模块
 * 处理边缘推理任务的状态流转、节点监控、调度决策等交互逻辑
 */

import { getState, subscribe, moveInferenceTask, showToast, addInferenceTask } from '../state/store.js';
import { renderStatusBadge, renderStatusIndicator } from '../components/status-badge.js';
import { formatLatency, formatNumber, truncateText, getPriorityLabel, getPriorityClass, getNodeStatusLabel, getNodeStatusClass } from '../utils/format.js';
import { generateInferenceTask } from '../state/mock-data.js';

let draggedTaskId = null;
let draggedFromQueue = null;

export function initEdgeInference() {
  subscribe('inferenceTasks', () => {
    renderEdgeInference();
  });
  
  subscribe('edgeNodes', () => {
    renderNodeMonitor();
  });
  
  document.addEventListener('click', handleInferenceClick);
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('drop', handleDrop);
  
  renderEdgeInference();
  startRealtimeSimulation();
}

function handleInferenceClick(e) {
  // 优先级提升
  if (e.target.closest('[data-action="priority-up"]')) {
    const taskId = e.target.closest('[data-action="priority-up"]').dataset.taskId;
    handlePriorityUp(taskId);
    return;
  }
  
  // 优先级降低
  if (e.target.closest('[data-action="priority-down"]')) {
    const taskId = e.target.closest('[data-action="priority-down"]').dataset.taskId;
    handlePriorityDown(taskId);
    return;
  }
  
  // 重新分配节点
  if (e.target.closest('[data-action="reassign"]')) {
    const taskId = e.target.closest('[data-action="reassign"]').dataset.taskId;
    handleReassignNode(taskId);
    return;
  }
  
  // 紧急插队
  if (e.target.closest('[data-action="urgent"]')) {
    const taskId = e.target.closest('[data-action="urgent"]').dataset.taskId;
    handleUrgentInsert(taskId);
    return;
  }
  
  // 新增推理任务
  if (e.target.closest('[data-action="add-task"]')) {
    handleAddTask();
    return;
  }
  
  // 暂停任务
  if (e.target.closest('[data-action="pause"]')) {
    const taskId = e.target.closest('[data-action="pause"]').dataset.taskId;
    handlePauseTask(taskId);
    return;
  }
  
  // 取消任务
  if (e.target.closest('[data-action="cancel"]')) {
    const taskId = e.target.closest('[data-action="cancel"]').dataset.taskId;
    handleCancelTask(taskId);
    return;
  }
}

function handleDragStart(e) {
  const card = e.target.closest('.kanban-card');
  if (!card) return;
  
  draggedTaskId = card.dataset.taskId;
  draggedFromQueue = card.dataset.queue;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  const card = e.target.closest('.kanban-card');
  if (card) {
    card.classList.remove('dragging');
  }
  draggedTaskId = null;
  draggedFromQueue = null;
}

function handleDragOver(e) {
  e.preventDefault();
  const column = e.target.closest('.kanban-column');
  if (column) {
    column.classList.add('ring-2', 'ring-sky-500/50');
  }
}

function handleDrop(e) {
  e.preventDefault();
  
  document.querySelectorAll('.kanban-column').forEach(col => {
    col.classList.remove('ring-2', 'ring-sky-500/50');
  });
  
  const column = e.target.closest('.kanban-column');
  if (!column || !draggedTaskId || !draggedFromQueue) return;
  
  const toQueue = column.dataset.queue;
  
  if (draggedFromQueue !== toQueue) {
    const success = moveInferenceTask(draggedTaskId, draggedFromQueue, toQueue);
    if (success) {
      showToast(`任务已移动到${getQueueLabel(toQueue)}`, 'success');
    } else {
      showToast('无法移动该任务', 'error');
    }
  }
}

function getQueueLabel(queue) {
  const labels = {
    queued: '排队队列',
    running: '执行中',
    completed: '已完成'
  };
  return labels[queue] || queue;
}

export function renderEdgeInference() {
  const container = document.getElementById('edge-inference-container');
  if (!container) return;
  
  const state = getState();
  const { inferenceTasks, edgeNodes, overview } = state;
  
  // 计算统计数据
  const stats = {
    total: inferenceTasks.queued.length + inferenceTasks.running.length + inferenceTasks.completed.length,
    queued: inferenceTasks.queued.length,
    running: inferenceTasks.running.length,
    completed: inferenceTasks.completed.length,
    avgLatency: overview.avgLatency
  };
  
  container.innerHTML = `
    <div class="p-6 space-y-6">
      <!-- 统计卡片 -->
      <div class="grid grid-cols-5 gap-4">
        <div class="metric-card">
          <div class="text-slate-400 text-sm">推理任务总数</div>
          <div class="text-2xl font-bold text-white mt-1">${stats.total}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">排队中</div>
          <div class="text-2xl font-bold text-amber-400 mt-1">${stats.queued}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">执行中</div>
          <div class="text-2xl font-bold text-sky-400 mt-1">${stats.running}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">已完成</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">${stats.completed}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">平均延迟</div>
          <div class="text-2xl font-bold text-white mt-1">${formatLatency(stats.avgLatency)}</div>
        </div>
      </div>
      
      <!-- 操作栏 -->
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-white">推理任务看板</h3>
        <div class="flex gap-2">
          <button class="btn btn-secondary" data-action="add-task">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            新增推理任务
          </button>
        </div>
      </div>
      
      <!-- 看板三列布局 -->
      <div class="grid grid-cols-3 gap-4">
        <!-- 排队队列 -->
        <div class="kanban-column" data-queue="queued">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="status-indicator warning"></div>
              <span class="font-medium text-slate-200">排队队列</span>
              <span class="status-badge warning">${inferenceTasks.queued.length}</span>
            </div>
          </div>
          
          ${inferenceTasks.queued.length === 0 ? `
            <div class="text-center py-8 text-slate-500 text-sm">
              暂无排队任务
            </div>
          ` : inferenceTasks.queued.map(task => `
            <div class="kanban-card" draggable="true" data-task-id="${task.id}" data-queue="queued">
              <div class="flex items-start justify-between mb-2">
                <div class="font-medium text-white text-sm">${truncateText(task.name, 15)}</div>
                <span class="status-badge ${getPriorityClass(task.priority)}">${getPriorityLabel(task.priority)}</span>
              </div>
              <div class="text-xs text-slate-400 mb-2 font-mono">${task.id}</div>
              <div class="flex items-center justify-between text-xs">
                <div class="text-slate-400">预计: ${task.eta}</div>
                ${renderStatusBadge(task.sensitivity, 'sensitivity')}
              </div>
              <div class="flex items-center gap-1 mt-3 pt-2 border-t border-slate-600/50">
                <button class="btn btn-icon btn-secondary text-xs" data-action="priority-up" data-task-id="${task.id}" title="提升优先级">
                  ↑
                </button>
                <button class="btn btn-icon btn-secondary text-xs" data-action="priority-down" data-task-id="${task.id}" title="降低优先级">
                  ↓
                </button>
                <button class="btn btn-icon btn-secondary text-xs" data-action="urgent" data-task-id="${task.id}" title="紧急插队">
                  ⚡
                </button>
                <button class="btn btn-icon btn-danger text-xs" data-action="cancel" data-task-id="${task.id}" title="取消任务">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- 执行中 -->
        <div class="kanban-column" data-queue="running">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="status-indicator healthy"></div>
              <span class="font-medium text-slate-200">执行中</span>
              <span class="status-badge info">${inferenceTasks.running.length}</span>
            </div>
          </div>
          
          ${inferenceTasks.running.length === 0 ? `
            <div class="text-center py-8 text-slate-500 text-sm">
              暂无执行中任务
            </div>
          ` : inferenceTasks.running.map(task => `
            <div class="kanban-card" draggable="true" data-task-id="${task.id}" data-queue="running">
              <div class="flex items-start justify-between mb-2">
                <div class="font-medium text-white text-sm">${truncateText(task.name, 15)}</div>
                <span class="status-badge info">运行中</span>
              </div>
              <div class="text-xs text-slate-400 mb-2 font-mono">${task.id}</div>
              <div class="flex items-center justify-between text-xs mb-2">
                <div class="text-slate-400">节点: ${task.node}</div>
                <div class="text-sky-400">${task.latency}</div>
              </div>
              <div class="progress-bar mb-1">
                <div class="progress-fill progress-animated bg-sky-500" style="width: ${task.progress}%"></div>
              </div>
              <div class="text-xs text-right text-slate-400">${task.progress}%</div>
              <div class="flex items-center gap-1 mt-3 pt-2 border-t border-slate-600/50">
                <button class="btn btn-icon btn-secondary text-xs" data-action="reassign" data-task-id="${task.id}" title="重新分配节点">
                  ↻
                </button>
                <button class="btn btn-icon btn-secondary text-xs" data-action="pause" data-task-id="${task.id}" title="暂停">
                  ⏸
                </button>
                <button class="btn btn-icon btn-danger text-xs" data-action="cancel" data-task-id="${task.id}" title="取消">
                  ✕
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- 已完成 -->
        <div class="kanban-column" data-queue="completed">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="status-indicator healthy"></div>
              <span class="font-medium text-slate-200">已完成</span>
              <span class="status-badge success">${inferenceTasks.completed.length}</span>
            </div>
          </div>
          
          ${inferenceTasks.completed.length === 0 ? `
            <div class="text-center py-8 text-slate-500 text-sm">
              暂无已完成任务
            </div>
          ` : inferenceTasks.completed.map(task => `
            <div class="kanban-card opacity-75" draggable="false" data-task-id="${task.id}" data-queue="completed">
              <div class="flex items-start justify-between mb-2">
                <div class="font-medium text-white text-sm">${truncateText(task.name, 15)}</div>
                <span class="status-badge ${task.success ? 'success' : 'danger'}">${task.success ? '成功' : '失败'}</span>
              </div>
              <div class="text-xs text-slate-400 mb-2 font-mono">${task.id}</div>
              <div class="flex items-center justify-between text-xs">
                <div class="text-slate-400">结果: ${task.result}</div>
                <div class="text-emerald-400">${task.duration}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- 边缘节点监控 -->
      <div id="node-monitor-section">
        <h3 class="text-lg font-bold text-white mb-4">边缘节点监控</h3>
        <div id="node-monitor-container"></div>
      </div>
    </div>
  `;
  
  renderNodeMonitor();
}

function renderNodeMonitor() {
  const container = document.getElementById('node-monitor-container');
  if (!container) return;
  
  const nodes = getState().edgeNodes;
  
  container.innerHTML = `
    <div class="grid grid-cols-4 gap-4">
      ${nodes.map(node => `
        <div class="block-card p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              ${renderStatusIndicator(node.status, 'node')}
              <span class="font-medium text-white text-sm">${truncateText(node.name, 10)}</span>
            </div>
            <span class="status-badge ${getNodeStatusClass(node.status)}">${getNodeStatusLabel(node.status)}</span>
          </div>
          
          <div class="space-y-3">
            <div>
              <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>负载</span>
                <span>${node.load}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill ${node.load > 80 ? 'bg-red-500' : node.load > 60 ? 'bg-amber-500' : 'bg-emerald-500'}" 
                     style="width: ${node.load}%"></div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-slate-400">延迟</div>
                <div class="text-white font-medium mt-1">${node.latency}ms</div>
              </div>
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-slate-400">吞吐量</div>
                <div class="text-white font-medium mt-1">${formatNumber(node.throughput)} req/s</div>
              </div>
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-slate-400">活动任务</div>
                <div class="text-white font-medium mt-1">${node.activeTasks}</div>
              </div>
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-slate-400">位置</div>
                <div class="text-white font-medium mt-1">${node.location}</div>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================================================
// 操作处理函数
// ==========================================================================

function handlePriorityUp(taskId) {
  const tasks = getState().inferenceTasks.queued;
  const index = tasks.findIndex(t => t.id === taskId);
  if (index > 0) {
    [tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]];
    showToast('优先级已提升', 'success');
    renderEdgeInference();
  }
}

function handlePriorityDown(taskId) {
  const tasks = getState().inferenceTasks.queued;
  const index = tasks.findIndex(t => t.id === taskId);
  if (index >= 0 && index < tasks.length - 1) {
    [tasks[index + 1], tasks[index]] = [tasks[index], tasks[index + 1]];
    showToast('优先级已降低', 'success');
    renderEdgeInference();
  }
}

function handleReassignNode(taskId) {
  const task = getState().inferenceTasks.running.find(t => t.id === taskId);
  if (!task) return;
  
  const nodes = getState().edgeNodes.filter(n => n.status === 'healthy');
  if (nodes.length === 0) {
    showToast('没有可用的健康节点', 'error');
    return;
  }
  
  const newNode = nodes[Math.floor(Math.random() * nodes.length)];
  task.node = newNode.name.split('边缘节点')[0] + '-' + String(Math.floor(Math.random() * 20 + 1)).padStart(2, '0');
  
  showToast(`任务已重新分配至 ${newNode.name}`, 'success');
  renderEdgeInference();
}

function handleUrgentInsert(taskId) {
  const tasks = getState().inferenceTasks.queued;
  const index = tasks.findIndex(t => t.id === taskId);
  if (index > 0) {
    const [task] = tasks.splice(index, 1);
    task.priority = 'critical';
    tasks.unshift(task);
    showToast('任务已紧急插队到队列最前', 'success');
    renderEdgeInference();
  }
}

function handleAddTask() {
  const newTask = generateInferenceTask('queued');
  newTask.priority = 'normal';
  addInferenceTask(newTask, 'queued');
  showToast(`已添加新推理任务: ${newTask.name}`, 'success');
}

function handlePauseTask(taskId) {
  const success = moveInferenceTask(taskId, 'running', 'queued');
  if (success) {
    showToast('任务已暂停，返回排队队列', 'info');
  }
}

function handleCancelTask(taskId) {
  const state = getState();
  
  for (const queue of ['queued', 'running', 'completed']) {
    const index = state.inferenceTasks[queue].findIndex(t => t.id === taskId);
    if (index !== -1) {
      if (confirm('确定要取消该任务吗？')) {
        state.inferenceTasks[queue].splice(index, 1);
        showToast('任务已取消', 'info');
        renderEdgeInference();
      }
      return;
    }
  }
}

// ==========================================================================
// 实时模拟
// ==========================================================================

function startRealtimeSimulation() {
  // 节点负载波动模拟
  setInterval(() => {
    const nodes = getState().edgeNodes;
    nodes.forEach(node => {
      const change = Math.floor(Math.random() * 10) - 5;
      node.load = Math.max(0, Math.min(100, node.load + change));
      node.latency = Math.max(5, node.latency + Math.floor(Math.random() * 6) - 3);
      node.status = node.load > 90 ? 'warning' : (node.load < 20 ? 'idle' : 'healthy');
    });
    renderNodeMonitor();
  }, 3000);
}
