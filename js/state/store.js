/**
 * 全局状态管理 - 基于 Proxy 实现响应式更新
 * 支持本地存储持久化，模拟完整的前端状态机
 */

import { generateInitialState, generateRandomEvent } from './mock-data.js';

// 全局状态实例
let state = null;
let stateProxy = null;

// 订阅者列表
const subscribers = new Map();

// 本地存储键
const STORAGE_KEY = 'clinical-trial-workspace';

/**
 * 初始化状态管理
 */
export function initStore() {
  // 尝试从本地存储加载状态
  const savedState = localStorage.getItem(STORAGE_KEY);
  
  if (savedState) {
    try {
      state = JSON.parse(savedState);
      console.log('[Store] 从本地存储恢复状态');
    } catch (e) {
      console.warn('[Store] 本地存储状态解析失败，使用初始状态');
      state = generateInitialState();
    }
  } else {
    state = generateInitialState();
    console.log('[Store] 使用初始状态');
  }

  // 创建响应式代理
  stateProxy = new Proxy(state, {
    set(target, prop, value) {
      const oldValue = target[prop];
      target[prop] = value;
      
      // 只有值真正变化时才通知订阅者
      if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
        notifySubscribers(prop, value, oldValue);
        saveToStorage();
      }
      
      return true;
    },
    
    get(target, prop) {
      if (typeof target[prop] === 'object' && target[prop] !== null) {
        return new Proxy(target[prop], {
          set(obj, key, value) {
            const oldValue = obj[key];
            obj[key] = value;
            
            if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
              notifySubscribers(`${prop}.${key}`, value, oldValue);
              saveToStorage();
            }
            
            return true;
          },
          
          deleteProperty(obj, key) {
            delete obj[key];
            notifySubscribers(`${prop}`, state[prop], null);
            saveToStorage();
            return true;
          }
        });
      }
      return target[prop];
    }
  });

  return stateProxy;
}

/**
 * 获取状态实例
 */
export function getState() {
  return stateProxy;
}

/**
 * 订阅状态变化
 */
export function subscribe(path, callback) {
  if (!subscribers.has(path)) {
    subscribers.set(path, new Set());
  }
  subscribers.get(path).add(callback);
  
  // 返回取消订阅函数
  return () => {
    subscribers.get(path)?.delete(callback);
  };
}

/**
 * 通知订阅者
 */
function notifySubscribers(changedPath, newValue, oldValue) {
  // 通知精确路径的订阅者
  if (subscribers.has(changedPath)) {
    subscribers.get(changedPath).forEach(callback => {
      callback(newValue, oldValue, changedPath);
    });
  }

  // 通知父路径的订阅者（通配符）
  const pathParts = changedPath.split('.');
  for (let i = pathParts.length; i > 0; i--) {
    const parentPath = pathParts.slice(0, i).join('.');
    if (subscribers.has(parentPath)) {
      subscribers.get(parentPath).forEach(callback => {
        callback(newValue, oldValue, changedPath);
      });
    }
  }

  // 通知全局订阅者
  if (subscribers.has('*')) {
    subscribers.get('*').forEach(callback => {
      callback(newValue, oldValue, changedPath);
    });
  }
}

/**
 * 保存到本地存储
 */
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[Store] 保存到本地存储失败:', e);
  }
}

/**
 * 清除本地存储
 */
export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  state = generateInitialState();
  stateProxy = new Proxy(state, { /* 同上 */ });
  notifySubscribers('*', state, null);
}

// ==================== 任务操作 API ====================

/**
 * 更新任务状态
 */
export function updateTaskStatus(taskId, newStatus) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) {
    showToast('任务不存在', 'error');
    return false;
  }

  const statusDef = state.taskStatuses.find(s => s.id === newStatus);
  if (!statusDef) {
    showToast('无效的状态', 'error');
    return false;
  }

  const oldStatus = task.status;
  task.status = newStatus;
  task.updatedAt = new Date().toISOString();

  // 添加活动日志
  task.activityLog.unshift({
    id: `log-${Date.now()}`,
    userId: state.currentUser.id,
    userName: state.currentUser.name,
    userRole: state.currentUser.role,
    action: `状态从【${getStatusName(oldStatus)}】更新为【${statusDef.name}】`,
    timestamp: new Date().toISOString()
  });

  // 更新统计数据
  updateStats();

  showToast(`任务状态已更新为「${statusDef.name}」`, 'success');
  notifySubscribers('tasks', state.tasks, null);
  return true;
}

/**
 * 创建新任务
 */
export function createTask(taskData) {
  const newTask = {
    id: `task-${String(state.tasks.length + 1).padStart(4, '0')}`,
    ...taskData,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: 0,
    attachments: 0,
    traceId: `trace-${String(Date.now()).padStart(6, '0')}`,
    subtasks: taskData.subtasks || [],
    activityLog: [{
      id: `log-${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: '创建了任务',
      timestamp: new Date().toISOString()
    }]
  };

  state.tasks.unshift(newTask);
  updateStats();
  showToast('任务创建成功', 'success');
  notifySubscribers('tasks', state.tasks, null);
  return newTask;
}

/**
 * 更新任务
 */
export function updateTask(taskId, updates) {
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    showToast('任务不存在', 'error');
    return false;
  }

  state.tasks[taskIndex] = {
    ...state.tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // 添加活动日志
  state.tasks[taskIndex].activityLog.unshift({
    id: `log-${Date.now()}`,
    userId: state.currentUser.id,
    userName: state.currentUser.name,
    userRole: state.currentUser.role,
    action: '更新了任务信息',
    timestamp: new Date().toISOString()
  });

  showToast('任务已更新', 'success');
  notifySubscribers('tasks', state.tasks, null);
  return true;
}

/**
 * 提交任务审核
 */
export function submitTaskForReview(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return false;

  if (task.status !== 'draft' && task.status !== 'rejected') {
    showToast('当前状态无法提交审核', 'warning');
    return false;
  }

  task.status = 'pending';
  task.updatedAt = new Date().toISOString();
  task.activityLog.unshift({
    id: `log-${Date.now()}`,
    userId: state.currentUser.id,
    userName: state.currentUser.name,
    userRole: state.currentUser.role,
    action: '提交审核',
    timestamp: new Date().toISOString()
  });

  updateStats();
  showToast('任务已提交审核', 'success');
  notifySubscribers('tasks', state.tasks, null);
  return true;
}

/**
 * 审核任务
 */
export function reviewTask(taskId, action, comment = '') {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return false;

  if (task.status !== 'pending' && task.status !== 'review') {
    showToast('当前状态无法审核', 'warning');
    return false;
  }

  if (action === 'approve') {
    task.status = 'approved';
    showToast('任务已批准', 'success');
  } else if (action === 'reject') {
    task.status = 'rejected';
    showToast('任务已驳回', 'warning');
  } else {
    return false;
  }

  task.updatedAt = new Date().toISOString();
  task.activityLog.unshift({
    id: `log-${Date.now()}`,
    userId: state.currentUser.id,
    userName: state.currentUser.name,
    userRole: state.currentUser.role,
    action: action === 'approve' ? '批准了任务' : '驳回了任务',
    timestamp: new Date().toISOString(),
    details: comment
  });

  updateStats();
  notifySubscribers('tasks', state.tasks, null);
  return true;
}

// ==================== 转码任务 API ====================

/**
 * 更新转码任务进度
 */
export function updateTranscodingProgress() {
  state.transcodingTasks.forEach(task => {
    if (task.status === 'processing') {
      const increment = Math.floor(Math.random() * 5) + 1;
      task.progress = Math.min(100, task.progress + increment);
      
      if (task.progress >= 100) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        showToast(`「${task.name}」转码完成`, 'success');
      }
    }
  });
  
  notifySubscribers('transcodingTasks', state.transcodingTasks, null);
}

/**
 * 启动转码任务
 */
export function startTranscoding(taskId) {
  const task = state.transcodingTasks.find(t => t.id === taskId);
  if (!task) return false;

  if (task.status !== 'queued' && task.status !== 'paused') {
    showToast('当前状态无法启动', 'warning');
    return false;
  }

  task.status = 'processing';
  task.startedAt = new Date().toISOString();
  task.progress = 0;
  
  showToast(`「${task.name}」开始转码`, 'info');
  notifySubscribers('transcodingTasks', state.transcodingTasks, null);
  return true;
}

/**
 * 暂停转码任务
 */
export function pauseTranscoding(taskId) {
  const task = state.transcodingTasks.find(t => t.id === taskId);
  if (!task || task.status !== 'processing') {
    showToast('只能暂停处理中的任务', 'warning');
    return false;
  }

  task.status = 'paused';
  showToast(`「${task.name}」已暂停`, 'info');
  notifySubscribers('transcodingTasks', state.transcodingTasks, null);
  return true;
}

/**
 * 重试转码任务
 */
export function retryTranscoding(taskId) {
  const task = state.transcodingTasks.find(t => t.id === taskId);
  if (!task || task.status !== 'failed') {
    showToast('只能重试失败的任务', 'warning');
    return false;
  }

  task.status = 'queued';
  task.progress = 0;
  task.error = null;
  
  showToast(`「${task.name}」已重新排队`, 'info');
  notifySubscribers('transcodingTasks', state.transcodingTasks, null);
  return true;
}

// ==================== 追踪沙箱 API ====================

/**
 * 推进追踪流程
 */
export function advanceTrace(traceId) {
  const trace = state.traces.find(t => t.id === traceId);
  if (!trace) return false;

  const currentNodeIndex = trace.checkpoints.findIndex(n => n.status === 'active');
  const nextNodeIndex = currentNodeIndex + 1;

  if (nextNodeIndex >= trace.checkpoints.length) {
    trace.status = 'completed';
    trace.progress = 100;
    showToast('全流程已完成', 'success');
  } else {
    // 标记当前节点为完成
    trace.checkpoints[currentNodeIndex].status = 'completed';
    trace.checkpoints[currentNodeIndex].endTime = new Date().toISOString();
    
    // 激活下一个节点
    trace.checkpoints[nextNodeIndex].status = 'active';
    trace.checkpoints[nextNodeIndex].startTime = new Date().toISOString();
    trace.currentStage = trace.checkpoints[nextNodeIndex].name;
    
    // 更新进度
    const completedCount = trace.checkpoints.filter(n => n.status === 'completed').length;
    trace.progress = Math.round(completedCount / trace.checkpoints.length * 100);
    
    showToast(`进入「${trace.checkpoints[nextNodeIndex].name}」阶段`, 'info');
  }

  notifySubscribers('traces', state.traces, null);
  return true;
}

// ==================== 权限矩阵 API ====================

/**
 * 切换权限
 */
export function togglePermission(roleId, resourceId) {
  const current = state.permissionMatrix.matrix[roleId][resourceId];
  state.permissionMatrix.matrix[roleId][resourceId] = !current;
  
  showToast(`${current ? '已撤销' : '已授予'}权限`, 'success');
  notifySubscribers('permissionMatrix', state.permissionMatrix, null);
  return true;
}

// ==================== 工具函数 ====================

/**
 * 获取状态名称
 */
export function getStatusName(statusId) {
  const status = state.taskStatuses?.find(s => s.id === statusId);
  return status?.name || statusId;
}

/**
 * 获取角色名称
 */
export function getRoleName(roleId) {
  const role = state.roles?.find(r => r.id === roleId);
  return role?.name || roleId;
}

/**
 * 更新统计数据
 */
function updateStats() {
  state.stats.pendingTasks = state.tasks.filter(t => 
    t.status === 'pending' || t.status === 'review'
  ).length;
  state.stats.completedTasks = state.tasks.filter(t => 
    t.status === 'completed'
  ).length;
}

// ==================== Toast 通知系统 ====================

let toastContainer = null;

/**
 * 显示 Toast 通知
 */
export function showToast(message, type = 'info', duration = 3000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type] || 'ℹ';

  toast.innerHTML = `
    <span class="text-lg">${icon}</span>
    <span class="flex-1">${message}</span>
    <button class="text-white/80 hover:text-white ml-2" onclick="this.parentElement.remove()">✕</button>
  `;

  toastContainer.appendChild(toast);

  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // 自动移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================== 模拟引擎 ====================

let simulationInterval = null;

/**
 * 启动实时模拟引擎
 */
export function startSimulation() {
  if (simulationInterval) return;

  console.log('[Store] 启动实时模拟引擎');

  simulationInterval = setInterval(() => {
    // 更新转码进度
    updateTranscodingProgress();

    // 随机生成事件（30%概率）
    if (Math.random() < 0.3) {
      const event = generateRandomEvent();
      
      // 根据事件类型执行操作
      if (event.type === 'trace' && event.action === 'stage_complete') {
        const runningTraces = state.traces.filter(t => t.status === 'running');
        if (runningTraces.length > 0) {
          const randomTrace = runningTraces[Math.floor(Math.random() * runningTraces.length)];
          advanceTrace(randomTrace.id);
        }
      }
    }
  }, 5000); // 每5秒更新一次
}

/**
 * 停止模拟引擎
 */
export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('[Store] 停止实时模拟引擎');
  }
}

// 导出到全局（便于调试）
window.store = {
  getState,
  updateTaskStatus,
  createTask,
  updateTask,
  submitTaskForReview,
  reviewTask,
  showToast,
  clearStorage
};
