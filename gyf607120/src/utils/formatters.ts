export const formatAmount = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr || dateStr === '-') return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'normal':
    case 'completed':
    case 'available':
      return 'text-emerald-400 bg-emerald-500/10';
    case 'anomaly':
    case 'failed':
    case 'maintenance':
      return 'text-red-400 bg-red-500/10';
    case 'pending':
    case 'occupied':
    case 'waiting':
      return 'text-amber-400 bg-amber-500/10';
    case 'refunded':
      return 'text-purple-400 bg-purple-500/10';
    case 'charging':
      return 'text-cyan-400 bg-cyan-500/10';
    case 'cancelled':
      return 'text-gray-400 bg-gray-500/10';
    default:
      return 'text-gray-400 bg-gray-500/10';
  }
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    normal: '正常',
    anomaly: '异常',
    pending: '待处理',
    completed: '已完成',
    failed: '失败',
    refunded: '已退款',
    available: '空闲',
    occupied: '使用中',
    maintenance: '维护中',
    waiting: '等待中',
    charging: '充电中',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

export const getPaymentStatusText = (status: string): string => {
  const map: Record<string, string> = {
    completed: '支付完成',
    pending: '待支付',
    failed: '支付失败',
    refunded: '已退款'
  };
  return map[status] || status;
};
