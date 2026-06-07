export async function fetchAPI(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `请求失败 (${res.status})`);
  }
  return res.json();
}

export function getStatusText(status) {
  const map = {
    PENDING: '待接单',
    ACCEPTED: '已接单',
    PREPARING: '冲奶中',
    READY: '奶已备好',
    DELIVERED: '已送达',
    CLOSED: '已完成',
    REJECTED: '已驳回',
    CANCELLED: '已取消'
  };
  return map[status] || status;
}

export function getStatusColor(status) {
  const map = {
    PENDING: '#faad14',
    ACCEPTED: '#1890ff',
    PREPARING: '#722ed1',
    READY: '#52c41a',
    DELIVERED: '#13c2c2',
    CLOSED: '#8c8c8c',
    REJECTED: '#ff4d4f',
    CANCELLED: '#bfbfbf'
  };
  return map[status] || '#1677ff';
}

export function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getNextStatuses(currentStatus) {
  const flow = {
    PENDING: [
      { status: 'ACCEPTED', label: '接单', type: 'primary' },
      { status: 'REJECTED', label: '驳回', type: 'danger' },
      { status: 'CANCELLED', label: '取消', type: 'default' }
    ],
    ACCEPTED: [
      { status: 'PREPARING', label: '开始冲奶', type: 'primary' },
      { status: 'REJECTED', label: '驳回', type: 'danger' }
    ],
    PREPARING: [
      { status: 'READY', label: '奶已备好', type: 'primary' },
      { status: 'REJECTED', label: '无法制作', type: 'danger' }
    ],
    READY: [
      { status: 'DELIVERED', label: '已送到桌', type: 'primary' }
    ],
    DELIVERED: [
      { status: 'CLOSED', label: '确认完成', type: 'primary' }
    ]
  };
  return flow[currentStatus] || [];
}
