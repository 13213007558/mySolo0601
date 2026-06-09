/**
 * 时间轴组件
 * 用于展示任务执行轨迹
 */

export function createTimeline(traces, containerId = null) {
  const timeline = document.createElement('div');
  timeline.className = 'space-y-1';
  
  traces.forEach((trace, index) => {
    const isLast = index === traces.length - 1;
    const item = document.createElement('div');
    item.className = `timeline-item ${trace.status || 'info'} ${isLast ? 'pb-0 border-l-0' : ''}`;
    
    const header = document.createElement('div');
    header.className = 'flex items-start justify-between gap-2';
    
    const left = document.createElement('div');
    left.className = 'flex-1';
    
    const time = document.createElement('div');
    time.className = 'text-xs text-slate-400 mb-1';
    time.textContent = trace.time;
    
    const action = document.createElement('div');
    action.className = 'text-sm text-slate-200 font-medium';
    action.textContent = trace.action;
    
    const details = document.createElement('div');
    details.className = 'text-xs text-slate-400 mt-1 space-y-0.5';
    
    if (trace.node) {
      const node = document.createElement('div');
      node.textContent = `节点: ${trace.node}`;
      details.appendChild(node);
    }
    
    if (trace.operator) {
      const operator = document.createElement('div');
      operator.textContent = `操作员: ${trace.operator}`;
      details.appendChild(operator);
    }
    
    if (trace.reason) {
      const reason = document.createElement('div');
      reason.textContent = `原因: ${trace.reason}`;
      details.appendChild(reason);
    }
    
    if (trace.newNode) {
      const newNode = document.createElement('div');
      newNode.textContent = `新节点: ${trace.newNode}`;
      details.appendChild(newNode);
    }
    
    if (trace.newTimeout) {
      const newTimeout = document.createElement('div');
      newTimeout.textContent = `超时设置: ${trace.newTimeout}`;
      details.appendChild(newTimeout);
    }
    
    if (trace.note) {
      const note = document.createElement('div');
      note.textContent = `备注: ${trace.note}`;
      details.appendChild(note);
    }
    
    left.appendChild(time);
    left.appendChild(action);
    if (details.children.length > 0) {
      left.appendChild(details);
    }
    
    const right = document.createElement('div');
    right.className = 'flex-shrink-0';
    
    const statusClass = trace.status === 'success' ? 'success' :
                        trace.status === 'timeout' || trace.status === 'failed' ? 'danger' :
                        trace.status === 'pending' ? 'warning' : 'info';
    
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${statusClass}`;
    statusBadge.textContent = trace.status === 'success' ? '成功' :
                             trace.status === 'timeout' ? '超时' :
                             trace.status === 'failed' ? '失败' :
                             trace.status === 'pending' ? '等待中' : '执行中';
    
    right.appendChild(statusBadge);
    
    header.appendChild(left);
    header.appendChild(right);
    
    item.appendChild(header);
    timeline.appendChild(item);
  });
  
  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
      container.appendChild(timeline);
    }
  }
  
  return timeline;
}

export function renderTimeline(traces) {
  return traces.map((trace, index) => {
    const isLast = index === traces.length - 1;
    const statusClass = trace.status === 'success' ? 'success' :
                        trace.status === 'timeout' || trace.status === 'failed' ? 'danger' :
                        trace.status === 'pending' ? 'warning' : 'info';
    const statusText = trace.status === 'success' ? '成功' :
                       trace.status === 'timeout' ? '超时' :
                       trace.status === 'failed' ? '失败' :
                       trace.status === 'pending' ? '等待中' : '执行中';
    
    let details = '';
    if (trace.node) details += `<div>节点: ${trace.node}</div>`;
    if (trace.operator) details += `<div>操作员: ${trace.operator}</div>`;
    if (trace.reason) details += `<div>原因: ${trace.reason}</div>`;
    if (trace.newNode) details += `<div>新节点: ${trace.newNode}</div>`;
    if (trace.newTimeout) details += `<div>超时设置: ${trace.newTimeout}</div>`;
    if (trace.note) details += `<div>备注: ${trace.note}</div>`;
    
    return `
      <div class="timeline-item ${statusClass} ${isLast ? 'pb-0 border-l-0' : ''}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <div class="text-xs text-slate-400 mb-1">${trace.time}</div>
            <div class="text-sm text-slate-200 font-medium">${trace.action}</div>
            ${details ? `<div class="text-xs text-slate-400 mt-1 space-y-0.5">${details}</div>` : ''}
          </div>
          <div class="flex-shrink-0">
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
