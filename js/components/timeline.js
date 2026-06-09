/**
 * 时间轴组件
 */

import { formatDateTime } from '../utils/format.js';
import { renderAvatar } from './status-badge.js';

/**
 * 渲染时间轴
 * @param {Array} traces - 时间轴轨迹数据
 */
export function renderTimeline(traces) {
  if (!traces || traces.length === 0) {
    return '<p class="text-slate-500 text-sm">暂无活动记录</p>';
  }

  return `
    <div class="timeline">
      ${traces.map((trace, index) => renderTimelineItem(trace, index)).join('')}
    </div>
  `;
}

/**
 * 渲染单个时间轴项
 */
function renderTimelineItem(trace, index) {
  const statusClass = getTimelineDotClass(trace.action);
  
  return `
    <div class="timeline-item">
      <div class="timeline-dot ${statusClass}"></div>
      <div class="flex items-start gap-3">
        ${trace.userName ? renderAvatar({ name: trace.userName, avatar: trace.userName?.charAt(0) }, 'sm') : ''}
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            ${trace.userName ? `<span class="text-sm font-medium text-slate-200">${trace.userName}</span>` : ''}
            ${trace.userRole ? `<span class="text-xs text-slate-500">${trace.userRole}</span>` : ''}
          </div>
          <div class="text-sm text-slate-300">
            ${trace.action}
            ${trace.details ? `<span class="block text-xs text-slate-500 mt-1">${trace.details}</span>` : ''}
          </div>
          <div class="text-xs text-slate-500 mt-1">
            ${formatDateTime(trace.timestamp)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 根据动作获取时间轴点样式
 */
function getTimelineDotClass(action) {
  const actionPatterns = [
    { pattern: /创建|新增/, class: 'timeline-dot-info' },
    { pattern: /更新|编辑|修改/, class: 'timeline-dot-processing' },
    { pattern: /批准|通过|完成/, class: 'timeline-dot-success' },
    { pattern: /驳回|拒绝|失败|错误/, class: 'timeline-dot-failed' },
    { pattern: /提交|发送|请求/, class: 'timeline-dot-pending' },
    { pattern: /删除|移除/, class: 'timeline-dot-failed' }
  ];

  for (const { pattern, class: className } of actionPatterns) {
    if (pattern.test(action)) {
      return className;
    }
  }

  return 'timeline-dot-info';
}

/**
 * 渲染流程节点时间轴（用于全链路追踪）
 */
export function renderFlowNodes(nodes) {
  if (!nodes || nodes.length === 0) {
    return '';
  }

  return `
    <div class="space-y-3">
      ${nodes.map((node, index) => `
        <div class="flow-node ${node.status}">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            node.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
            node.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
            'bg-slate-700 text-slate-500'
          }">
            ${node.status === 'completed' ? '✓' : (node.icon || '○')}
          </div>
          <div class="flex-1">
            <div class="font-medium text-slate-200">${node.name}</div>
            ${node.operator ? `
              <div class="text-xs text-slate-400 mt-0.5">
                处理人：${node.operator.name}
              </div>
            ` : ''}
            ${node.duration ? `
              <div class="text-xs text-slate-500 mt-0.5">
                耗时：${node.duration} · ${node.dataSize || ''}
              </div>
            ` : ''}
          </div>
          ${node.status === 'active' ? `
            <div class="relative">
              <div class="w-3 h-3 rounded-full bg-blue-500 pulse-ring"></div>
              <div class="w-3 h-3 rounded-full bg-blue-500 absolute top-0 left-0"></div>
            </div>
          ` : ''}
          ${index < nodes.length - 1 ? `
            <div class="absolute left-8 top-full w-0.5 h-3 -translate-x-1/2 ${
              node.status === 'completed' || node.status === 'active' ? 'bg-blue-500' : 'bg-slate-600'
            }"></div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}
