/**
 * 状态徽章组件
 */

import { getStatusLabel, getRoleLabel, getPriorityLabel } from '../utils/format.js';

/**
 * 渲染状态徽章
 */
export function renderStatusBadge(status, size = 'normal') {
  const label = getStatusLabel(status);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  
  return `<span class="status-badge ${label.class} ${sizeClass}">${label.text}</span>`;
}

/**
 * 渲染角色徽章
 */
export function renderRoleBadge(role, size = 'normal') {
  const label = getRoleLabel(role);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs';
  
  return `<span class="role-badge ${label.class} ${sizeClass}">${label.text}</span>`;
}

/**
 * 渲染优先级徽章
 */
export function renderPriorityBadge(priority, size = 'normal') {
  const label = getPriorityLabel(priority);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  
  return `<span class="status-badge ${label.class} ${sizeClass}">${label.text}</span>`;
}

/**
 * 渲染用户头像
 */
export function renderAvatar(user, size = 'md') {
  if (!user) return '';
  
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };
  
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  
  const colorIndex = (user.name?.charCodeAt(0) || 0) % colors.length;
  
  return `
    <div class="inline-flex items-center justify-center ${sizes[size]} rounded-full ${colors[colorIndex]} text-white font-medium">
      ${user.avatar || user.name?.charAt(0) || '?'}
    </div>
  `;
}

/**
 * 渲染标签
 */
export function renderTag(text, type = 'blue') {
  return `<span class="tag tag-${type}">${text}</span>`;
}
