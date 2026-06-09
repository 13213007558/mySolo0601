import type { BatchData, DiffItem } from '@/types';

export const getMismatchItems = (batch: BatchData): DiffItem[] => {
  if (!batch.hasMismatch || !batch.mismatchDetail) {
    return [];
  }
  return batch.mismatchDetail.diffItems;
};

export const getMismatchReason = (batch: BatchData): string => {
  if (!batch.hasMismatch || !batch.mismatchDetail) {
    return '';
  }
  return batch.mismatchDetail.reason;
};

export const hasAnyAbnormal = (batches: BatchData[]): boolean => {
  return batches.some(b => b.hasMismatch || b.hasDuplicateStation || !b.hiddenPhone);
};

export const getAbnormalCount = (batches: BatchData[]): number => {
  return batches.filter(b => b.hasMismatch || b.hasDuplicateStation || !b.hiddenPhone).length;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    error: '异常',
  };
  return labels[status] || status;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCount = (count: number): string => {
  return new Intl.NumberFormat('zh-CN').format(count);
};

export const hidePhone = (phone: string): string => {
  if (!phone) return '';
  if (phone.length === 11) {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return phone;
};

export const getBatchAbnormalTypes = (batch: BatchData): string[] => {
  const types: string[] = [];
  if (batch.hasMismatch) types.push('mismatch');
  if (batch.hasDuplicateStation) types.push('duplicate');
  if (!batch.hiddenPhone) types.push('phone-leak');
  return types;
};

export const getAbnormalTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    mismatch: '导出数据不一致',
    duplicate: '站点同名串站',
    'phone-leak': '手机号泄露',
  };
  return labels[type] || type;
};
