/**
 * 状态徽章组件
 */

import { getStatusLabel, getStatusClass } from '../state/fl-state.js';
import { 
  getPriorityLabel, getPriorityClass,
  getRiskLabel, getRiskClass,
  getSensitivityLabel, getSensitivityClass,
  getNodeStatusLabel, getNodeStatusClass,
  getTrainingStatusLabel, getTrainingStatusClass
} from '../utils/format.js';

export function createStatusBadge(status, type = 'task') {
  const span = document.createElement('span');
  
  let label, className;
  
  switch (type) {
    case 'task':
      label = getStatusLabel(status);
      className = getStatusClass(status);
      break;
    case 'priority':
      label = getPriorityLabel(status);
      className = getPriorityClass(status);
      break;
    case 'risk':
      label = getRiskLabel(status);
      className = getRiskClass(status);
      break;
    case 'sensitivity':
      label = getSensitivityLabel(status);
      className = getSensitivityClass(status);
      break;
    case 'node':
      label = getNodeStatusLabel(status);
      className = getNodeStatusClass(status);
      break;
    case 'training':
      label = getTrainingStatusLabel(status);
      className = getTrainingStatusClass(status);
      break;
    default:
      label = status;
      className = 'pending';
  }
  
  span.className = `status-badge ${className}`;
  span.textContent = label;
  
  return span;
}

export function createStatusIndicator(status, type = 'task') {
  const span = document.createElement('span');
  
  let className;
  switch (type) {
    case 'node':
      className = getNodeStatusClass(status) === 'success' ? 'healthy' :
                  getNodeStatusClass(status) === 'warning' ? 'warning' :
                  getNodeStatusClass(status) === 'danger' ? 'critical' : 'offline';
      break;
    default:
      className = getStatusClass(status) === 'success' ? 'healthy' :
                  getStatusClass(status) === 'warning' ? 'warning' :
                  getStatusClass(status) === 'danger' ? 'critical' : 'offline';
  }
  
  span.className = `status-indicator ${className}`;
  return span;
}

export function renderStatusBadge(status, type = 'task') {
  return createStatusBadge(status, type).outerHTML;
}

export function renderStatusIndicator(status, type = 'task') {
  return createStatusIndicator(status, type).outerHTML;
}
