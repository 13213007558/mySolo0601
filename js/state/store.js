/**
 * 全局状态管理
 * 基于 Proxy 实现响应式状态，支持订阅与局部更新
 */

import { generateInitialState, generateRandomEvent } from './mock-data.js';

// 状态变更回调注册表
const subscribers = new Map();

// 当前状态
let state = null;

// 状态代理（实现响应式）
let stateProxy = null;

// 初始化状态
export function initStore() {
  state = generateInitialState();
  
  stateProxy = new Proxy(state, {
    set(target, prop, value) {
      const oldValue = target[prop];
      target[prop] = value;
      
      if (oldValue !== value) {
        notifySubscribers(prop, value, oldValue);
      }
      
      return true;
    },
    
    get(target, prop) {
      if (prop === '_isProxy') return true;
      return target[prop];
    }
  });
  
  return stateProxy;
}

// 获取当前状态（只读）
export function getState() {
  return stateProxy || state;
}

// 订阅状态变化
export function subscribe(prop, callback) {
  if (!subscribers.has(prop)) {
    subscribers.set(prop, new Set());
  }
  subscribers.get(prop).add(callback);
  
  return () => {
    subscribers.get(prop)?.delete(callback);
  };
}

// 通知订阅者
function notifySubscribers(prop, newValue, oldValue) {
  subscribers.get(prop)?.forEach(callback => {
    try {
      callback(newValue, oldValue, prop);
    } catch (e) {
      console.error(`[Store] 订阅者执行错误 (${prop}):`, e);
    }
  });
  
  subscribers.get('*')?.forEach(callback => {
    try {
      callback(prop, newValue, oldValue);
    } catch (e) {
      console.error('[Store] 全局订阅者执行错误:', e);
    }
  });
}

// 更新状态（支持部分更新）
export function updateState(path, value) {
  const keys = path.split('.');
  let current = state;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  const lastKey = keys[keys.length - 1];
  const oldValue = current[lastKey];
  current[lastKey] = value;
  
  if (oldValue !== value) {
    notifySubscribers(path, value, oldValue);
  }
}

// 批量更新状态
export function batchUpdate(updates) {
  updates.forEach(({ path, value }) => {
    updateState(path, value);
  });
}

// 触发状态变化通知（用于数组/对象内部变更）
export function forceNotify(path) {
  const keys = path.split('.');
  let current = state;
  
  for (const key of keys) {
    if (current[key] === undefined) return;
    current = current[key];
  }
  
  notifySubscribers(path, current, current);
}

// ==========================================================================
// 异常任务相关操作
// ==========================================================================

export function updateTaskStatus(taskId, newStatus) {
  const task = state.anomalyTasks.find(t => t.id === taskId);
  if (task) {
    const oldStatus = task.status;
    task.status = newStatus;
    notifySubscribers('anomalyTasks', state.anomalyTasks, state.anomalyTasks);
    return task;
  }
  return null;
}

export function incrementRetryCount(taskId) {
  const task = state.anomalyTasks.find(t => t.id === taskId);
  if (task) {
    task.retryCount = Math.min(task.retryCount + 1, task.maxRetries);
    forceNotify('anomalyTasks');
    return task;
  }
  return null;
}

export function addExecutionTrace(taskId, trace) {
  const task = state.anomalyTasks.find(t => t.id === taskId);
  if (task) {
    task.executionTrace.push(trace);
    forceNotify('anomalyTasks');
    return task;
  }
  return null;
}

export function addAnomalyTask(task) {
  state.anomalyTasks.unshift(task);
  if (state.anomalyTasks.length > 50) {
    state.anomalyTasks.pop();
  }
  forceNotify('anomalyTasks');
  
  // 更新概览统计
  state.overview.totalTasks++;
  forceNotify('overview');
}

export function getTaskById(taskId) {
  return state.anomalyTasks.find(t => t.id === taskId);
}

// ==========================================================================
// 推理任务相关操作
// ==========================================================================

export function moveInferenceTask(taskId, fromQueue, toQueue) {
  const fromArr = state.inferenceTasks[fromQueue];
  const toArr = state.inferenceTasks[toQueue];
  
  if (!fromArr || !toArr) return false;
  
  const taskIndex = fromArr.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return false;
  
  const [task] = fromArr.splice(taskIndex, 1);
  
  if (toQueue === 'running') {
    task.progress = 0;
    task.node = '边缘-' + Math.floor(Math.random() * 20 + 1);
    task.latency = `${Math.floor(Math.random() * 30 + 10)}ms`;
  } else if (toQueue === 'completed') {
    task.result = `${(Math.random() * 20 + 75).toFixed(1)}% 置信度`;
    task.duration = `${(Math.random() * 5 + 1).toFixed(1)}s`;
    task.success = Math.random() > 0.1;
  }
  
  toArr.unshift(task);
  
  if (toArr.length > 20) {
    toArr.pop();
  }
  
  forceNotify('inferenceTasks');
  return true;
}

export function updateInferenceProgress(taskId, progress) {
  const task = state.inferenceTasks.running.find(t => t.id === taskId);
  if (task) {
    task.progress = progress;
    forceNotify('inferenceTasks');
    return task;
  }
  return null;
}

export function addInferenceTask(task, queue = 'queued') {
  state.inferenceTasks[queue].unshift(task);
  forceNotify('inferenceTasks');
}

// ==========================================================================
// RL 脑核心相关操作
// ==========================================================================

export function addRLDecision(decision) {
  state.rlBrain.recentDecisions.unshift(decision);
  if (state.rlBrain.recentDecisions.length > 10) {
    state.rlBrain.recentDecisions.pop();
  }
  
  // 更新奖励
  const rewardDelta = parseFloat(decision.reward) || 0;
  state.rlBrain.totalReward = Math.round((state.rlBrain.totalReward + rewardDelta) * 10) / 10;
  state.rlBrain.rewardHistory.push(state.rlBrain.totalReward);
  if (state.rlBrain.rewardHistory.length > 20) {
    state.rlBrain.rewardHistory.shift();
  }
  
  forceNotify('rlBrain');
}

export function updateRLPolicy(newPolicy) {
  state.rlBrain.currentPolicy = newPolicy;
  forceNotify('rlBrain');
}

export function updateResourceAllocation(resourceType, node, value) {
  if (state.rlBrain.resourceAllocation[resourceType]) {
    state.rlBrain.resourceAllocation[resourceType][node] = value;
    forceNotify('rlBrain');
  }
}

export function overrideRLDecision(decisionIndex, overrideAction) {
  if (state.rlBrain.recentDecisions[decisionIndex]) {
    state.rlBrain.recentDecisions[decisionIndex].overridden = true;
    state.rlBrain.recentDecisions[decisionIndex].overrideAction = overrideAction;
    forceNotify('rlBrain');
  }
}

// ==========================================================================
// 安全相关操作
// ==========================================================================

export function addSecurityAlert(alert) {
  state.security.recentAlerts.unshift(alert);
  if (state.security.recentAlerts.length > 15) {
    state.security.recentAlerts.pop();
  }
  
  // 更新统计
  state.security.accessAttempts++;
  if (alert.risk === 'high') {
    state.overview.securityAlerts++;
    forceNotify('overview');
  }
  
  forceNotify('security');
}

export function updateAlertStatus(alertId, newStatus) {
  const alert = state.security.recentAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = newStatus;
    if (newStatus === 'resolved' || newStatus === 'false_positive') {
      state.overview.securityAlerts = Math.max(0, state.overview.securityAlerts - 1);
      forceNotify('overview');
    }
    forceNotify('security');
    return alert;
  }
  return null;
}

// ==========================================================================
// 边缘节点相关操作
// ==========================================================================

export function updateNodeStatus(nodeId, newStatus) {
  const node = state.edgeNodes.find(n => n.id === nodeId);
  if (node) {
    node.status = newStatus;
    forceNotify('edgeNodes');
    return node;
  }
  return null;
}

export function updateNodeLoad(nodeId, load) {
  const node = state.edgeNodes.find(n => n.id === nodeId);
  if (node) {
    node.load = load;
    node.status = load > 90 ? 'warning' : (load < 20 ? 'idle' : 'healthy');
    forceNotify('edgeNodes');
    return node;
  }
  return null;
}

// ==========================================================================
// 实时模拟引擎
// ==========================================================================

let simulationInterval = null;
let inferenceProgressInterval = null;

export function startSimulation() {
  if (simulationInterval) return;
  
  // 随机事件模拟（每10-20秒）
  simulationInterval = setInterval(() => {
    if (Math.random() > 0.3) {
      const event = generateRandomEvent();
      handleSimulationEvent(event);
    }
  }, 8000);
  
  // 推理任务进度模拟（每秒）
  inferenceProgressInterval = setInterval(() => {
    simulateInferenceProgress();
  }, 1000);
  
  console.log('[Store] 实时模拟引擎已启动');
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  if (inferenceProgressInterval) {
    clearInterval(inferenceProgressInterval);
    inferenceProgressInterval = null;
  }
  console.log('[Store] 实时模拟引擎已停止');
}

function handleSimulationEvent(event) {
  console.log('[Store] 模拟事件:', event.type, event.data);
  
  switch (event.type) {
    case 'task_timeout':
      addAnomalyTask(event.data);
      showToast('任务超时，已加入异常补偿队列', 'warning');
      break;
      
    case 'task_recovered':
      // 标记某个任务为已恢复
      const pendingTasks = state.anomalyTasks.filter(t => 
        t.status === 'retry_pending' || t.status === 'timeout'
      );
      if (pendingTasks.length > 0) {
        const task = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
        updateTaskStatus(task.id, 'recovered');
        showToast(`${task.name} 已自动恢复`, 'success');
      }
      break;
      
    case 'new_alert':
      addSecurityAlert(event.data);
      if (event.data.risk === 'high') {
        showToast(`高风险安全告警: ${event.data.typeLabel}`, 'error');
      }
      break;
      
    case 'node_warning':
      const randomNode = state.edgeNodes[Math.floor(Math.random() * state.edgeNodes.length)];
      if (randomNode) {
        updateNodeLoad(randomNode.id, Math.floor(Math.random() * 20 + 85));
        showToast(`${randomNode.name} 负载告警`, 'warning');
      }
      break;
      
    case 'rl_decision':
      addRLDecision(event.data);
      break;
      
    case 'inference_completed':
      // 移动一个运行中的任务到完成
      if (state.inferenceTasks.running.length > 0) {
        const runningTask = state.inferenceTasks.running[
          Math.floor(Math.random() * state.inferenceTasks.running.length)
        ];
        moveInferenceTask(runningTask.id, 'running', 'completed');
      }
      // 移动一个排队任务到运行
      if (state.inferenceTasks.queued.length > 0) {
        const queuedTask = state.inferenceTasks.queued[0];
        moveInferenceTask(queuedTask.id, 'queued', 'running');
      }
      break;
  }
}

function simulateInferenceProgress() {
  state.inferenceTasks.running.forEach(task => {
    if (task.progress < 100) {
      const increment = Math.floor(Math.random() * 8) + 3;
      task.progress = Math.min(100, task.progress + increment);
      
      // 随机模拟失败
      if (task.progress > 50 && Math.random() < 0.02) {
        moveInferenceTask(task.id, 'running', 'queued');
        addAnomalyTask({
          ...task,
          status: 'timeout',
          retryCount: 0,
          maxRetries: 3,
          failedReason: '边缘推理执行超时',
          priority: task.priority,
          dataSensitivity: task.sensitivity,
          executionTrace: [
            { time: new Date().toLocaleTimeString(), action: '推理执行', node: task.node, status: 'timeout' }
          ]
        });
        return;
      }
      
      if (task.progress >= 100) {
        setTimeout(() => {
          moveInferenceTask(task.id, 'running', 'completed');
        }, 500);
      }
    }
  });
  
  forceNotify('inferenceTasks');
}

// ==========================================================================
// Toast 通知系统
// ==========================================================================

const toastQueue = [];

export function showToast(message, type = 'info', duration = 3000) {
  const toast = { id: Date.now(), message, type, duration };
  toastQueue.push(toast);
  
  renderToast(toast);
  
  setTimeout(() => {
    removeToast(toast.id);
  }, duration);
  
  return toast.id;
}

function renderToast(toast) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toastEl = document.createElement('div');
  toastEl.id = `toast-${toast.id}`;
  toastEl.className = `toast ${toast.type}`;
  toastEl.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-sm">${toast.message}</span>
      <button onclick="removeToast(${toast.id})" class="text-slate-400 hover:text-white ml-2">
        ×
      </button>
    </div>
  `;
  
  container.appendChild(toastEl);
}

export function removeToast(toastId) {
  const toastEl = document.getElementById(`toast-${toastId}`);
  if (toastEl) {
    toastEl.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => toastEl.remove(), 300);
  }
}

// 暴露到全局供 HTML 调用
window.removeToast = removeToast;
window.showToast = showToast;
