/**
 * 格式化工具函数
 */

// 格式化日期时间
export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

// 格式化相对时间
export function formatRelativeTime(isoString) {
  if (!isoString) return '-';
  const now = Date.now();
  const date = new Date(isoString).getTime();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return `${seconds}秒前`;
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return formatDateTime(isoString);
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (typeof bytes === 'string') return bytes;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// 格式化数字（千分位）
export function formatNumber(num) {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString('zh-CN');
}

// 格式化百分比
export function formatPercent(value, decimals = 1) {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(decimals)}%`;
}

// 格式化延迟
export function formatLatency(ms) {
  if (ms === undefined || ms === null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// 截断文本
export function truncateText(text, maxLength = 20) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 优先级标签
export function getPriorityLabel(priority) {
  const labels = {
    critical: '紧急',
    high: '高',
    normal: '普通',
    low: '低'
  };
  return labels[priority] || priority;
}

// 优先级样式类
export function getPriorityClass(priority) {
  const classes = {
    critical: 'danger',
    high: 'warning',
    normal: 'info',
    low: 'pending'
  };
  return classes[priority] || 'pending';
}

// 风险等级标签
export function getRiskLabel(risk) {
  const labels = {
    high: '高风险',
    medium: '中风险',
    low: '低风险'
  };
  return labels[risk] || risk;
}

// 风险等级样式类
export function getRiskClass(risk) {
  const classes = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  };
  return classes[risk] || 'pending';
}

// 敏感度等级标签
export function getSensitivityLabel(sensitivity) {
  const labels = {
    '绝密': '绝密',
    '机密': '机密',
    '秘密': '秘密',
    '内部': '内部'
  };
  return labels[sensitivity] || sensitivity;
}

// 敏感度样式类
export function getSensitivityClass(sensitivity) {
  const classes = {
    '绝密': 'danger',
    '机密': 'warning',
    '秘密': 'info',
    '内部': 'pending'
  };
  return classes[sensitivity] || 'pending';
}

// 策略名称映射
export function getPolicyLabel(policy) {
  const labels = {
    optimize_latency: '延迟优先',
    optimize_throughput: '吞吐量优先',
    balance_load: '负载均衡',
    minimize_cost: '成本优先'
  };
  return labels[policy] || policy;
}

// 节点状态标签
export function getNodeStatusLabel(status) {
  const labels = {
    healthy: '正常',
    warning: '告警',
    critical: '异常',
    offline: '离线',
    idle: '空闲'
  };
  return labels[status] || status;
}

// 节点状态样式类
export function getNodeStatusClass(status) {
  const classes = {
    healthy: 'success',
    warning: 'warning',
    critical: 'danger',
    offline: 'pending',
    idle: 'info'
  };
  return classes[status] || 'pending';
}

// 加密状态标签
export function getEncryptionStatusLabel(status) {
  const labels = {
    active: '加密中',
    inactive: '未加密',
    error: '加密异常'
  };
  return labels[status] || status;
}

// 训练任务状态标签
export function getTrainingStatusLabel(status) {
  const labels = {
    training: '训练中',
    paused: '已暂停',
    completed: '已完成',
    failed: '失败'
  };
  return labels[status] || status;
}

// 训练任务状态样式类
export function getTrainingStatusClass(status) {
  const classes = {
    training: 'info',
    paused: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return classes[status] || 'pending';
}
