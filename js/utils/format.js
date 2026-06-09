/**
 * 格式化工具函数集合
 */

/**
 * 格式化日期时间
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return '-';
  
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  
  return formatDateTime(isoString);
}

/**
 * 格式化日期（仅日期）
 */
export function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * 格式化数字千分位
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化百分比
 */
export function formatPercent(value, total = 100) {
  if (value === null || value === undefined) return '-';
  const percent = (value / total) * 100;
  return `${percent.toFixed(1)}%`;
}

/**
 * 优先级标签映射
 */
export function getPriorityLabel(priority) {
  const labels = {
    high: { text: '紧急', class: 'priority-high' },
    medium: { text: '常规', class: 'priority-medium' },
    low: { text: '低', class: 'priority-low' }
  };
  return labels[priority] || { text: priority, class: '' };
}

/**
 * 风险等级标签映射
 */
export function getRiskLabel(risk) {
  const labels = {
    low: { text: '低风险', class: 'tag-green' },
    medium: { text: '中风险', class: 'tag-amber' },
    high: { text: '高风险', class: 'tag-red' }
  };
  return labels[risk] || { text: risk, class: '' };
}

/**
 * 敏感度标签映射
 */
export function getSensitivityLabel(sensitivity) {
  const labels = {
    public: { text: '公开', class: 'tag-green' },
    internal: { text: '内部', class: 'tag-blue' },
    confidential: { text: '机密', class: 'tag-amber' },
    restricted: { text: '限制', class: 'tag-red' }
  };
  return labels[sensitivity] || { text: sensitivity, class: '' };
}

/**
 * 状态标签映射
 */
export function getStatusLabel(status) {
  const labels = {
    draft: { text: '草稿', class: 'status-draft' },
    pending: { text: '待处理', class: 'status-pending' },
    review: { text: '审核中', class: 'status-review' },
    approved: { text: '已批准', class: 'status-approved' },
    rejected: { text: '已驳回', class: 'status-rejected' },
    processing: { text: '处理中', class: 'status-processing' },
    completed: { text: '已完成', class: 'status-completed' },
    failed: { text: '失败', class: 'status-failed' },
    running: { text: '运行中', class: 'status-running' },
    paused: { text: '已暂停', class: 'status-paused' },
    queued: { text: '排队中', class: 'status-draft' },
    timeout: { text: '超时', class: 'status-timeout' }
  };
  return labels[status] || { text: status, class: '' };
}

/**
 * 角色标签映射
 */
export function getRoleLabel(role) {
  const labels = {
    pi: { text: '项目负责人', class: 'role-pi' },
    crc: { text: '临床协调员', class: 'role-crc' },
    dm: { text: '数据管理员', class: 'role-dm' },
    cra: { text: '监查员', class: 'role-cra' },
    sa: { text: '统计分析师', class: 'role-sa' }
  };
  return labels[role] || { text: role, class: '' };
}

/**
 * 截断文本
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}
