import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SpotStatus, AlertType } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(isoString: string | null): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);

  if (diffHours > 0) {
    return `${diffHours}小时${diffMins}分钟`;
  }
  return `${diffMins}分钟`;
}

export function getStatusBgClass(status: SpotStatus): string {
  const classes: Record<SpotStatus, string> = {
    available: 'bg-green-500/20 border-green-500',
    occupied: 'bg-orange-500/20 border-orange-500',
    charging: 'bg-blue-500/20 border-blue-500',
    offline: 'bg-gray-500/20 border-gray-500',
    mismatch: 'bg-red-500/20 border-red-500',
  };
  return classes[status];
}

export function getStatusTextClass(status: SpotStatus): string {
  const classes: Record<SpotStatus, string> = {
    available: 'text-green-400',
    occupied: 'text-orange-400',
    charging: 'text-blue-400',
    offline: 'text-gray-400',
    mismatch: 'text-red-400',
  };
  return classes[status];
}

export function getAlertIcon(alertType: AlertType): string {
  const icons: Record<string, string> = {
    export_mismatch: '⚠️',
    long_occupation: '⏰',
    offline: '🔌',
  };
  return alertType ? icons[alertType] || '⚠️' : '';
}

export function getAlertLabel(alertType: AlertType): string {
  const labels: Record<string, string> = {
    export_mismatch: '数据不一致',
    long_occupation: '长时间占用',
    offline: '设备离线',
  };
  return alertType ? labels[alertType] || '异常' : '';
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function calculateOccupationHours(isoString: string | null): number {
  if (!isoString) return 0;
  const date = new Date(isoString);
  const now = new Date();
  return (now.getTime() - date.getTime()) / 3600000;
}
