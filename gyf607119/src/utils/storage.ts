import { GateInspection, STORAGE_KEY } from '../types';

export const saveToStorage = (gates: GateInspection[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gates));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
};

export const loadFromStorage = (): GateInspection[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('读取数据失败:', error);
    return null;
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除数据失败:', error);
  }
};

export const validateGateData = (data: unknown): data is GateInspection[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => 
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'gateNo' in item &&
    'location' in item &&
    'status' in item &&
    'inspectionTime' in item &&
    'amount' in item
  );
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const maskPhoneNumber = (text: string): string => {
  return text.replace(/(\d{3})\d{4}(\d{4})/g, '$1****$2');
};
