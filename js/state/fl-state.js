/**
 * 联邦学习状态机
 * 管理异常任务补偿、边缘推理调度、RL资源分配的状态流转
 */

import { 
  updateTaskStatus, 
  incrementRetryCount, 
  addExecutionTrace,
  getTaskById,
  showToast
} from './store.js';

// 任务状态枚举
export const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  RETRY_PENDING: 'retry_pending',
  MANUAL_INTERVENTION: 'manual_intervention_required',
  RECOVERED: 'recovered',
  TERMINATED: 'terminated'
};

// 状态流转规则
const stateTransitions = {
  [TaskStatus.PENDING]: {
    allowed: [TaskStatus.RUNNING, TaskStatus.TERMINATED]
  },
  [TaskStatus.RUNNING]: {
    allowed: [TaskStatus.SUCCESS, TaskStatus.FAILED, TaskStatus.TIMEOUT]
  },
  [TaskStatus.FAILED]: {
    allowed: [TaskStatus.RETRY_PENDING, TaskStatus.MANUAL_INTERVENTION, TaskStatus.TERMINATED]
  },
  [TaskStatus.TIMEOUT]: {
    allowed: [TaskStatus.RETRY_PENDING, TaskStatus.MANUAL_INTERVENTION, TaskStatus.TERMINATED]
  },
  [TaskStatus.RETRY_PENDING]: {
    allowed: [TaskStatus.RUNNING, TaskStatus.MANUAL_INTERVENTION, TaskStatus.TERMINATED]
  },
  [TaskStatus.MANUAL_INTERVENTION]: {
    allowed: [TaskStatus.RETRY_PENDING, TaskStatus.RECOVERED, TaskStatus.TERMINATED]
  },
  [TaskStatus.RECOVERED]: {
    allowed: [TaskStatus.RUNNING, TaskStatus.SUCCESS]
  },
  [TaskStatus.SUCCESS]: {
    allowed: []
  },
  [TaskStatus.TERMINATED]: {
    allowed: []
  }
};

// 校验状态流转是否合法
export function canTransition(fromStatus, toStatus) {
  const transitions = stateTransitions[fromStatus];
  return transitions ? transitions.allowed.includes(toStatus) : false;
}

// 执行状态流转
export function transitionTask(taskId, toStatus, options = {}) {
  const task = getTaskById(taskId);
  if (!task) {
    console.error('[FL-State] 任务不存在:', taskId);
    return false;
  }
  
  if (!canTransition(task.status, toStatus)) {
    console.error(`[FL-State] 非法状态流转: ${task.status} -> ${toStatus}`);
    showToast(`无法从 ${getStatusLabel(task.status)} 转为 ${getStatusLabel(toStatus)}`, 'error');
    return false;
  }
  
  // 记录执行轨迹
  if (options.trace) {
    addExecutionTrace(taskId, {
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      ...options.trace
    });
  }
  
  // 执行状态变更
  updateTaskStatus(taskId, toStatus);
  
  // 触发后置处理
  handlePostTransition(taskId, toStatus, options);
  
  return true;
}

// 状态流转后置处理
function handlePostTransition(taskId, toStatus, options) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  switch (toStatus) {
    case TaskStatus.RETRY_PENDING:
      // 安排自动重试
      scheduleAutoRetry(taskId, options.delay);
      break;
      
    case TaskStatus.RUNNING:
      // 启动超时检测
      startTimeoutMonitor(taskId, task.timeoutAt || options.timeout);
      break;
      
    case TaskStatus.MANUAL_INTERVENTION:
      // 通知待人工介入
      showToast(`任务 ${task.name} 需要人工介入处理`, 'warning');
      break;
      
    case TaskStatus.RECOVERED:
      showToast(`任务 ${task.name} 已恢复执行`, 'success');
      break;
      
    case TaskStatus.TERMINATED:
      showToast(`任务 ${task.name} 已终止`, 'info');
      break;
      
    case TaskStatus.SUCCESS:
      showToast(`任务 ${task.name} 执行成功`, 'success');
      break;
  }
}

// ==========================================================================
// 自动重试调度
// ==========================================================================

const retrySchedulers = new Map();

export function scheduleAutoRetry(taskId, delay = null) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  // 清除已有调度
  if (retrySchedulers.has(taskId)) {
    clearTimeout(retrySchedulers.get(taskId));
  }
  
  const retryDelay = delay || (3000 + Math.random() * 2000);
  
  const schedulerId = setTimeout(() => {
    executeAutoRetry(taskId);
  }, retryDelay);
  
  retrySchedulers.set(taskId, schedulerId);
  
  addExecutionTrace(taskId, {
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    action: `等待自动重试 (${Math.round(retryDelay / 1000)}秒后)`,
    status: 'pending'
  });
}

function executeAutoRetry(taskId) {
  const task = getTaskById(taskId);
  if (!task || task.status !== TaskStatus.RETRY_PENDING) {
    retrySchedulers.delete(taskId);
    return;
  }
  
  // 模拟重试结果：60% 成功率
  const success = Math.random() > 0.4;
  
  if (success) {
    incrementRetryCount(taskId);
    
    transitionTask(taskId, TaskStatus.RUNNING, {
      trace: {
        action: `自动重试第${task.retryCount}次`,
        node: selectOptimalNode(),
        status: 'success'
      }
    });
    
    // 模拟执行成功
    setTimeout(() => {
      if (getTaskById(taskId)?.status === TaskStatus.RUNNING) {
        transitionTask(taskId, TaskStatus.SUCCESS, {
          trace: {
            action: '执行完成',
            status: 'success'
          }
        });
      }
    }, 3000 + Math.random() * 2000);
    
  } else if (task.retryCount < task.maxRetries) {
    incrementRetryCount(taskId);
    
    addExecutionTrace(taskId, {
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      action: `自动重试第${task.retryCount}次`,
      node: selectOptimalNode(),
      status: 'timeout'
    });
    
    // 继续重试
    transitionTask(taskId, TaskStatus.RETRY_PENDING, {
      trace: {
        action: '准备下一次重试',
        status: 'pending'
      }
    });
    
  } else {
    // 达到最大重试次数，升级为人工介入
    transitionTask(taskId, TaskStatus.MANUAL_INTERVENTION, {
      trace: {
        action: '达到最大重试次数',
        reason: '自动重试失败，需人工介入',
        status: 'pending'
      }
    });
  }
  
  retrySchedulers.delete(taskId);
}

export function cancelAutoRetry(taskId) {
  if (retrySchedulers.has(taskId)) {
    clearTimeout(retrySchedulers.get(taskId));
    retrySchedulers.delete(taskId);
    return true;
  }
  return false;
}

// ==========================================================================
// 超时检测
// ==========================================================================

const timeoutMonitors = new Map();

export function startTimeoutMonitor(taskId, timeoutAt) {
  if (!timeoutAt) return;
  
  // 清除已有监控
  if (timeoutMonitors.has(taskId)) {
    clearInterval(timeoutMonitors.get(taskId));
  }
  
  const monitorId = setInterval(() => {
    const task = getTaskById(taskId);
    if (!task || task.status !== TaskStatus.RUNNING) {
      clearInterval(monitorId);
      timeoutMonitors.delete(taskId);
      return;
    }
    
    const now = Date.now();
    const timeoutTime = new Date(timeoutAt).getTime();
    
    if (now > timeoutTime) {
      handleTaskTimeout(taskId);
      clearInterval(monitorId);
      timeoutMonitors.delete(taskId);
    }
  }, 1000);
  
  timeoutMonitors.set(taskId, monitorId);
}

function handleTaskTimeout(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  transitionTask(taskId, TaskStatus.TIMEOUT, {
    trace: {
      action: '执行超时',
      reason: '任务执行超过预设时间限制',
      status: 'timeout'
    }
  });
  
  // 自动进入重试流程
  if (task.retryCount < task.maxRetries) {
    transitionTask(taskId, TaskStatus.RETRY_PENDING, {
      trace: {
        action: '进入自动重试队列',
        status: 'pending'
      }
    });
  } else {
    transitionTask(taskId, TaskStatus.MANUAL_INTERVENTION, {
      trace: {
        action: '超时且重试次数耗尽',
        status: 'pending'
      }
    });
  }
}

export function stopTimeoutMonitor(taskId) {
  if (timeoutMonitors.has(taskId)) {
    clearInterval(timeoutMonitors.get(taskId));
    timeoutMonitors.delete(taskId);
    return true;
  }
  return false;
}

// ==========================================================================
// 人工介入处理
// ==========================================================================

export function handleManualIntervention(taskId, action, params = {}) {
  const task = getTaskById(taskId);
  if (!task) {
    showToast('任务不存在', 'error');
    return false;
  }
  
  if (task.status !== TaskStatus.MANUAL_INTERVENTION) {
    showToast('该任务不处于人工介入状态', 'warning');
    return false;
  }
  
  cancelAutoRetry(taskId);
  stopTimeoutMonitor(taskId);
  
  const operator = params.operator || '当前操作员';
  
  switch (action) {
    case 'force_retry':
      // 强制重试：重置重试计数
      task.retryCount = 0;
      transitionTask(taskId, TaskStatus.RETRY_PENDING, {
        trace: {
          action: '人工强制重试',
          operator: operator,
          status: 'pending'
        }
      });
      showToast(`已发起强制重试: ${task.name}`, 'success');
      return true;
      
    case 'terminate':
      // 终止任务
      transitionTask(taskId, TaskStatus.TERMINATED, {
        trace: {
          action: '人工终止任务',
          operator: operator,
          reason: params.reason || '操作员主动终止',
          status: 'completed'
        }
      });
      return true;
      
    case 'adjust_and_retry':
      // 调整参数后重试
      task.retryCount = 0;
      if (params.newNode) {
        task.assignedNode = params.newNode;
      }
      if (params.newTimeout) {
        const newTimeout = new Date(Date.now() + params.newTimeout * 1000).toISOString();
        task.timeoutAt = newTimeout;
      }
      
      transitionTask(taskId, TaskStatus.RETRY_PENDING, {
        trace: {
          action: '调整参数后重试',
          operator: operator,
          newNode: params.newNode,
          newTimeout: params.newTimeout ? `${params.newTimeout}s` : undefined,
          status: 'pending'
        },
        delay: params.delay || 2000
      });
      showToast(`参数已调整，任务将重新执行: ${task.name}`, 'success');
      return true;
      
    case 'mark_recovered':
      // 标记为已恢复（问题已解决）
      transitionTask(taskId, TaskStatus.RECOVERED, {
        trace: {
          action: '人工标记为已恢复',
          operator: operator,
          note: params.note,
          status: 'success'
        }
      });
      showToast(`任务已标记为恢复: ${task.name}`, 'success');
      return true;
      
    default:
      showToast('未知的操作类型', 'error');
      return false;
  }
}

// ==========================================================================
// 工具函数
// ==========================================================================

// 选择最优节点（模拟）
const availableNodes = [
  '节点-BJ-01', '节点-BJ-02', '节点-BJ-03',
  '节点-SH-05', '节点-SH-06', '节点-SH-07',
  '节点-GZ-01', '节点-GZ-02', '节点-GZ-03',
  '节点-XA-10', '节点-XA-11', '节点-XA-12',
  '节点-DH-08', '节点-DH-09'
];

export function selectOptimalNode() {
  return availableNodes[Math.floor(Math.random() * availableNodes.length)];
}

// 获取状态显示标签
export function getStatusLabel(status) {
  const labels = {
    [TaskStatus.PENDING]: '等待中',
    [TaskStatus.RUNNING]: '执行中',
    [TaskStatus.SUCCESS]: '成功',
    [TaskStatus.FAILED]: '失败',
    [TaskStatus.TIMEOUT]: '超时',
    [TaskStatus.RETRY_PENDING]: '待重试',
    [TaskStatus.MANUAL_INTERVENTION]: '待人工介入',
    [TaskStatus.RECOVERED]: '已恢复',
    [TaskStatus.TERMINATED]: '已终止'
  };
  return labels[status] || status;
}

// 获取状态对应的样式类
export function getStatusClass(status) {
  const classes = {
    [TaskStatus.PENDING]: 'pending',
    [TaskStatus.RUNNING]: 'info',
    [TaskStatus.SUCCESS]: 'success',
    [TaskStatus.FAILED]: 'danger',
    [TaskStatus.TIMEOUT]: 'warning',
    [TaskStatus.RETRY_PENDING]: 'warning',
    [TaskStatus.MANUAL_INTERVENTION]: 'danger',
    [TaskStatus.RECOVERED]: 'success',
    [TaskStatus.TERMINATED]: 'pending'
  };
  return classes[status] || 'pending';
}

// 状态指示器颜色
export function getStatusIndicatorClass(status) {
  const classes = {
    [TaskStatus.PENDING]: 'offline',
    [TaskStatus.RUNNING]: 'healthy',
    [TaskStatus.SUCCESS]: 'healthy',
    [TaskStatus.FAILED]: 'critical',
    [TaskStatus.TIMEOUT]: 'warning',
    [TaskStatus.RETRY_PENDING]: 'warning',
    [TaskStatus.MANUAL_INTERVENTION]: 'critical',
    [TaskStatus.RECOVERED]: 'healthy',
    [TaskStatus.TERMINATED]: 'offline'
  };
  return classes[status] || 'offline';
}

// 清理所有定时器（页面卸载时调用）
export function cleanupAll() {
  retrySchedulers.forEach(id => clearTimeout(id));
  retrySchedulers.clear();
  
  timeoutMonitors.forEach(id => clearInterval(id));
  timeoutMonitors.clear();
}
