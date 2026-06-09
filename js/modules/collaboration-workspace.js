/**
 * 多角色协同工作台模块
 * 实现任务看板、状态流转、可编辑表单等协作功能
 */

import { getState, subscribe, updateTaskStatus, createTask, updateTask, submitTaskForReview, reviewTask, showToast } from '../state/store.js';
import { formatDateTime, formatRelativeTime, getPriorityLabel, truncateText } from '../utils/format.js';
import { renderStatusBadge, renderAvatar, renderPriorityBadge, renderRoleBadge, renderTag } from '../components/status-badge.js';
import { renderTimeline } from '../components/timeline.js';
import { openDrawer, openModal, closeModal, confirmDialog } from '../components/modal.js';

let container = null;
let currentView = 'kanban'; // kanban | list
let currentStatusFilter = 'all';
let currentRoleFilter = 'all';
let currentPriorityFilter = 'all';

// 看板状态列配置
const kanbanColumns = [
  { id: 'draft', name: '草稿', color: 'slate' },
  { id: 'pending', name: '待处理', color: 'amber' },
  { id: 'review', name: '审核中', color: 'blue' },
  { id: 'approved', name: '已批准', color: 'emerald' },
  { id: 'processing', name: '处理中', color: 'cyan' },
  { id: 'completed', name: '已完成', color: 'green' },
  { id: 'rejected', name: '已驳回', color: 'red' }
];

/**
 * 初始化协同工作台模块
 */
export function initCollaborationWorkspace(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  // 订阅状态变化
  subscribe('tasks', () => render());
  
  if (container) {
    render();
  }
}

/**
 * 渲染协同工作台
 */
export function render(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  if (!container) return;
  
  const state = getState();
  const tasks = filterTasks(state.tasks);
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-100">多角色协同工作台</h2>
          <p class="text-slate-400 mt-1">跨角色协作任务管理，支持状态流转和实时编辑</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary btn-sm" onclick="window.switchView('kanban')">
            <span class="mr-1">▦</span> 看板
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.switchView('list')">
            <span class="mr-1">☰</span> 列表
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.showNewTaskForm()">
            <span class="mr-1">+</span> 新建任务
          </button>
        </div>
      </div>

      <!-- 筛选栏 -->
      <div class="card p-4">
        <div class="flex gap-3 flex-wrap items-center">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-400">状态：</span>
            <select id="task-status-filter" class="form-select w-32" onchange="window.filterWorkspaceTasks()">
              <option value="all">全部</option>
              ${kanbanColumns.map(col => `<option value="${col.id}">${col.name}</option>`).join('')}
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-400">角色：</span>
            <select id="task-role-filter" class="form-select w-40" onchange="window.filterWorkspaceTasks()">
              <option value="all">全部角色</option>
              ${state.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-400">优先级：</span>
            <select id="task-priority-filter" class="form-select w-32" onchange="window.filterWorkspaceTasks()">
              <option value="all">全部</option>
              <option value="high">紧急</option>
              <option value="medium">常规</option>
              <option value="low">低</option>
            </select>
          </div>
          <div class="flex-1"></div>
          <input 
            type="text" 
            id="task-search" 
            class="form-input w-60" 
            placeholder="搜索任务名称、项目..."
            oninput="window.filterWorkspaceTasks()"
          >
        </div>
      </div>

      <!-- 统计概览 -->
      <div class="grid grid-cols-7 gap-2">
        ${kanbanColumns.map(col => {
          const count = state.tasks.filter(t => t.status === col.id).length;
          const colorClasses = {
            slate: 'bg-slate-500/20 text-slate-400',
            amber: 'bg-amber-500/20 text-amber-400',
            blue: 'bg-blue-500/20 text-blue-400',
            emerald: 'bg-emerald-500/20 text-emerald-400',
            cyan: 'bg-cyan-500/20 text-cyan-400',
            green: 'bg-green-500/20 text-green-400',
            red: 'bg-red-500/20 text-red-400'
          };
          return `
            <div class="card p-3 text-center">
              <div class="text-2xl font-bold ${colorClasses[col.color] || 'text-slate-400'}">${count}</div>
              <div class="text-xs text-slate-500 mt-1">${col.name}</div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- 内容区域 -->
      <div id="workspace-content">
        ${currentView === 'kanban' ? renderKanbanView(tasks) : renderListView(tasks)}
      </div>
    </div>
  `;
}

/**
 * 筛选任务
 */
function filterTasks(tasks) {
  let filtered = [...tasks];
  
  if (currentStatusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === currentStatusFilter);
  }
  
  if (currentRoleFilter !== 'all') {
    filtered = filtered.filter(t => t.assignee?.role === currentRoleFilter);
  }
  
  if (currentPriorityFilter !== 'all') {
    filtered = filtered.filter(t => t.priority === currentPriorityFilter);
  }
  
  const searchText = document.getElementById('task-search')?.value?.toLowerCase() || '';
  if (searchText) {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchText) ||
      t.projectName.toLowerCase().includes(searchText) ||
      t.description?.toLowerCase().includes(searchText)
    );
  }
  
  return filtered;
}

/**
 * 渲染看板视图
 */
function renderKanbanView(tasks) {
  return `
    <div class="grid grid-cols-7 gap-4 overflow-x-auto pb-4">
      ${kanbanColumns.map(column => {
        const columnTasks = tasks.filter(t => t.status === column.id);
        return `
          <div class="kanban-column" data-status="${column.id}" 
               ondragover="event.preventDefault()" 
               ondrop="window.handleKanbanDrop(event, '${column.id}')">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-${column.color}-500"></span>
                <span class="font-medium text-slate-200">${column.name}</span>
                <span class="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">${columnTasks.length}</span>
              </div>
            </div>
            <div class="space-y-3 min-h-[100px]">
              ${columnTasks.map(task => renderKanbanCard(task)).join('')}
              ${columnTasks.length === 0 ? `
                <div class="text-center py-8 text-slate-600 text-sm border-2 border-dashed border-slate-700 rounded-lg">
                  暂无任务
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * 渲染看板卡片
 */
function renderKanbanCard(task) {
  const priority = getPriorityLabel(task.priority);
  
  return `
    <div class="kanban-card" 
         draggable="true" 
         data-task-id="${task.id}"
         ondragstart="window.handleKanbanDragStart(event, '${task.id}')"
         ondragend="window.handleKanbanDragEnd(event)"
         onclick="window.viewTaskDetail('${task.id}')">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <div class="font-medium text-slate-200 text-sm leading-tight">${truncateText(task.title, 30)}</div>
          <div class="text-xs text-slate-500 mt-0.5">${truncateText(task.projectName, 20)}</div>
        </div>
        ${renderPriorityBadge(task.priority, 'sm')}
      </div>
      
      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center gap-1">
          ${renderAvatar(task.assignee, 'sm')}
          ${task.comments > 0 ? `
            <span class="text-xs text-slate-500 flex items-center gap-1 ml-2">
              💬 ${task.comments}
            </span>
          ` : ''}
          ${task.attachments > 0 ? `
            <span class="text-xs text-slate-500 flex items-center gap-1 ml-1">
              📎 ${task.attachments}
            </span>
          ` : ''}
        </div>
        <span class="text-xs text-slate-500">${formatRelativeTime(task.updatedAt)}</span>
      </div>
      
      <!-- 子任务进度 -->
      ${task.subtasks && task.subtasks.length > 0 ? `
        <div class="mt-3">
          <div class="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>子任务</span>
            <span>${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(task.subtasks.filter(s => s.completed).length / task.subtasks.length * 100)}%"></div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 渲染列表视图
 */
function renderListView(tasks) {
  return `
    <div class="card">
      <div class="card-body p-0">
        <table class="data-table">
          <thead>
            <tr>
              <th>任务ID</th>
              <th>任务名称</th>
              <th>所属项目</th>
              <th>负责人</th>
              <th>优先级</th>
              <th>状态</th>
              <th>截止日期</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.length === 0 ? `
              <tr>
                <td colspan="9" class="text-center py-12 text-slate-500">
                  暂无任务
                </td>
              </tr>
            ` : tasks.map(task => `
              <tr class="cursor-pointer hover:bg-slate-800/50 transition-colors" onclick="window.viewTaskDetail('${task.id}')">
                <td class="font-mono text-xs text-blue-400">${task.id}</td>
                <td class="font-medium text-slate-200">${task.title}</td>
                <td class="text-slate-400">${truncateText(task.projectName, 25)}</td>
                <td>
                  <div class="flex items-center gap-2">
                    ${renderAvatar(task.assignee, 'sm')}
                    <div>
                      <div class="text-sm text-slate-300">${task.assignee?.name}</div>
                      <div class="text-xs text-slate-500">${getRoleLabel(task.assignee?.role)}</div>
                    </div>
                  </div>
                </td>
                <td>${renderPriorityBadge(task.priority, 'sm')}</td>
                <td>${renderStatusBadge(task.status, 'sm')}</td>
                <td class="text-slate-400 text-sm">${formatDate(task.dueDate)}</td>
                <td class="text-slate-400 text-xs">${formatRelativeTime(task.updatedAt)}</td>
                <td>
                  <div class="flex gap-1">
                    ${task.status === 'draft' || task.status === 'rejected' ? `
                      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.submitTaskReview('${task.id}')">
                        提交
                      </button>
                    ` : ''}
                    ${task.status === 'pending' || task.status === 'review' ? `
                      <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); window.reviewTaskAction('${task.id}', 'approve')">
                        通过
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); window.reviewTaskAction('${task.id}', 'reject')">
                        驳回
                      </button>
                    ` : ''}
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.editTask('${task.id}')">
                      编辑
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 切换视图
 */
export function switchView(view) {
  currentView = view;
  render();
}

/**
 * 筛选工作区任务
 */
export function filterWorkspaceTasks() {
  const state = getState();
  currentStatusFilter = document.getElementById('task-status-filter')?.value || 'all';
  currentRoleFilter = document.getElementById('task-role-filter')?.value || 'all';
  currentPriorityFilter = document.getElementById('task-priority-filter')?.value || 'all';
  
  const tasks = filterTasks(state.tasks);
  const content = document.getElementById('workspace-content');
  if (content) {
    content.innerHTML = currentView === 'kanban' ? renderKanbanView(tasks) : renderListView(tasks);
  }
}

// 拖拽相关变量
let draggedTaskId = null;

/**
 * 处理看板拖拽开始
 */
export function handleKanbanDragStart(event, taskId) {
  draggedTaskId = taskId;
  event.target.classList.add('dragging');
  event.dataTransfer.effectAllowed = 'move';
}

/**
 * 处理看板拖拽结束
 */
export function handleKanbanDragEnd(event) {
  event.target.classList.remove('dragging');
  draggedTaskId = null;
}

/**
 * 处理看板放置
 */
export function handleKanbanDrop(event, targetStatus) {
  event.preventDefault();
  
  if (!draggedTaskId) return;
  
  const state = getState();
  const task = state.tasks.find(t => t.id === draggedTaskId);
  
  if (!task) return;
  
  // 检查状态流转是否合法
  const currentStatusDef = state.taskStatuses.find(s => s.id === task.status);
  if (currentStatusDef && !currentStatusDef.transitions.includes(targetStatus)) {
    confirmDialog(
      `确定要将任务从「${currentStatusDef.name}」移动到「${getStatusName(targetStatus)}」吗？\n这可能不符合标准工作流程。`,
      {
        title: '强制状态变更',
        type: 'warning',
        confirmText: '确认移动'
      }
    ).then(confirmed => {
      if (confirmed) {
        updateTaskStatus(draggedTaskId, targetStatus);
      }
    });
    return;
  }
  
  updateTaskStatus(draggedTaskId, targetStatus);
}

/**
 * 查看任务详情
 */
export function viewTaskDetail(taskId) {
  const state = getState();
  const task = state.tasks.find(t => t.id === taskId);
  
  if (!task) {
    showToast('任务不存在', 'error');
    return;
  }

  const content = `
    <div class="space-y-6">
      <!-- 任务头部 -->
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-mono text-sm text-blue-400">${task.id}</span>
            ${renderStatusBadge(task.status)}
            ${renderPriorityBadge(task.priority)}
          </div>
          <h3 class="text-xl font-bold text-slate-100">${task.title}</h3>
          <div class="text-sm text-slate-400 mt-1">${task.projectName}</div>
        </div>
        <div class="flex gap-2">
          ${task.status === 'draft' || task.status === 'rejected' ? `
            <button class="btn btn-primary btn-sm" onclick="window.submitTaskReview('${task.id}'); window.closeDrawer();">
              提交审核
            </button>
          ` : ''}
          ${task.status === 'pending' || task.status === 'review' ? `
            <button class="btn btn-success btn-sm" onclick="window.reviewTaskAction('${task.id}', 'approve'); window.closeDrawer();">
              通过
            </button>
            <button class="btn btn-danger btn-sm" onclick="window.reviewTaskAction('${task.id}', 'reject'); window.closeDrawer();">
              驳回
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="window.editTask('${task.id}')">
            编辑
          </button>
        </div>
      </div>

      <!-- 任务描述 -->
      <div class="bg-slate-900/50 rounded-xl p-5">
        <h4 class="font-medium text-slate-200 mb-2">任务描述</h4>
        <p class="text-slate-300">${task.description}</p>
      </div>

      <!-- 任务信息 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-400">负责人</label>
          <div class="flex items-center gap-2 mt-1">
            ${renderAvatar(task.assignee, 'md')}
            <div>
              <div class="font-medium text-slate-200">${task.assignee?.name}</div>
              <div class="text-sm text-slate-500">${task.assignee?.department}</div>
            </div>
          </div>
        </div>
        <div>
          <label class="text-sm text-slate-400">创建人</label>
          <div class="flex items-center gap-2 mt-1">
            ${renderAvatar(task.assigner, 'md')}
            <div>
              <div class="font-medium text-slate-200">${task.assigner?.name}</div>
              <div class="text-sm text-slate-500">${task.assigner?.department}</div>
            </div>
          </div>
        </div>
        <div>
          <label class="text-sm text-slate-400">截止日期</label>
          <div class="text-slate-300 mt-1">${formatDateTime(task.dueDate)}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">创建时间</label>
          <div class="text-slate-300 mt-1">${formatDateTime(task.createdAt)}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">更新时间</label>
          <div class="text-slate-300 mt-1">${formatDateTime(task.updatedAt)}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">追踪ID</label>
          <div class="font-mono text-blue-400 mt-1 text-sm">${task.traceId}</div>
        </div>
      </div>

      <!-- 子任务 -->
      ${task.subtasks && task.subtasks.length > 0 ? `
        <div>
          <h4 class="font-medium text-slate-200 mb-3">子任务</h4>
          <div class="space-y-2">
            ${task.subtasks.map((subtask, index) => `
              <div class="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <input 
                  type="checkbox" 
                  ${subtask.completed ? 'checked' : ''} 
                  onchange="window.toggleSubtask('${task.id}', ${index})"
                  class="w-5 h-5 rounded cursor-pointer"
                >
                <span class="${subtask.completed ? 'line-through text-slate-500' : 'text-slate-300'}">${subtask.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- 活动日志 -->
      <div>
        <h4 class="font-medium text-slate-200 mb-4">活动日志</h4>
        ${renderTimeline(task.activityLog)}
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 pt-4 border-t border-slate-700">
        <button class="btn btn-secondary flex-1" onclick="window.closeDrawer()">
          关闭
        </button>
      </div>
    </div>
  `;

  openDrawer(content, {
    title: `任务详情 - ${task.title}`,
    width: 'max-w-3xl'
  });
}

/**
 * 切换子任务完成状态
 */
export function toggleSubtask(taskId, subtaskIndex) {
  const state = getState();
  const task = state.tasks.find(t => t.id === taskId);
  
  if (!task || !task.subtasks[subtaskIndex]) return;
  
  task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
  task.updatedAt = new Date().toISOString();
  
  // 添加活动日志
  task.activityLog.unshift({
    id: `log-${Date.now()}`,
    userId: state.currentUser.id,
    userName: state.currentUser.name,
    userRole: state.currentUser.role,
    action: task.subtasks[subtaskIndex].completed 
      ? `完成了子任务「${task.subtasks[subtaskIndex].title}」`
      : `重新打开了子任务「${task.subtasks[subtaskIndex].title}」`,
    timestamp: new Date().toISOString()
  });
  
  showToast('子任务状态已更新', 'success');
  render();
  
  // 如果抽屉打开着，刷新内容
  const drawer = document.getElementById('app-drawer');
  if (drawer) {
    viewTaskDetail(taskId);
  }
}

/**
 * 提交任务审核
 */
export function submitTaskReview(taskId) {
  submitTaskForReview(taskId);
  render();
}

/**
 * 审核任务操作
 */
export function reviewTaskAction(taskId, action) {
  if (action === 'reject') {
    // 弹出输入框让用户输入驳回原因
    const modalContent = `
      <form id="reject-form" class="space-y-4">
        <div>
          <label class="form-label">驳回原因 *</label>
          <textarea name="comment" class="form-textarea" rows="4" placeholder="请输入驳回原因..." required></textarea>
        </div>
        <div class="flex gap-3">
          <button type="button" class="btn btn-secondary flex-1" onclick="window.closeModal()">取消</button>
          <button type="submit" class="btn btn-danger flex-1">确认驳回</button>
        </div>
      </form>
    `;
    
    openModal(modalContent, {
      title: '驳回任务',
      width: 'max-w-lg',
      closable: false
    });
    
    setTimeout(() => {
      const form = document.getElementById('reject-form');
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          const comment = form.comment.value;
          closeModal();
          reviewTask(taskId, 'reject', comment);
          render();
        };
      }
    }, 100);
  } else {
    reviewTask(taskId, 'approve');
    render();
  }
}

/**
 * 显示新建任务表单
 */
export function showNewTaskForm() {
  const state = getState();
  
  const content = `
    <form id="new-task-form" class="space-y-4">
      <div>
        <label class="form-label">任务名称 *</label>
        <input type="text" name="title" class="form-input" placeholder="请输入任务名称" required>
      </div>
      
      <div>
        <label class="form-label">所属项目 *</label>
        <select name="projectId" class="form-select" required>
          <option value="">请选择项目</option>
          ${state.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">负责人 *</label>
          <select name="assigneeId" class="form-select" required>
            <option value="">请选择负责人</option>
            ${state.teamMembers.map(m => `
              <option value="${m.id}">${m.name} - ${getRoleLabel(m.role)}</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">优先级 *</label>
          <select name="priority" class="form-select" required>
            <option value="high">紧急</option>
            <option value="medium" selected>常规</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">截止日期 *</label>
        <input type="datetime-local" name="dueDate" class="form-input" required>
      </div>
      
      <div>
        <label class="form-label">任务描述 *</label>
        <textarea name="description" class="form-textarea" rows="4" placeholder="请详细描述任务内容..." required></textarea>
      </div>
      
      <div>
        <label class="form-label">子任务</label>
        <div id="subtasks-container" class="space-y-2">
          <div class="flex gap-2">
            <input type="text" name="subtask" class="form-input flex-1" placeholder="子任务名称">
            <button type="button" class="btn btn-secondary" onclick="window.addSubtask()">+</button>
          </div>
        </div>
      </div>
      
      <div class="flex gap-3 pt-4">
        <button type="button" class="btn btn-secondary flex-1" onclick="window.closeModal()">取消</button>
        <button type="submit" class="btn btn-primary flex-1">创建任务</button>
      </div>
    </form>
  `;

  openModal(content, {
    title: '新建任务',
    width: 'max-w-xl',
    closable: false
  });
  
  setTimeout(() => {
    const form = document.getElementById('new-task-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        handleNewTaskSubmit(form);
      };
    }
    
    // 设置默认截止日期为7天后
    const dueDateInput = form?.querySelector('[name="dueDate"]');
    if (dueDateInput) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      dueDateInput.value = defaultDate.toISOString().slice(0, 16);
    }
  }, 100);
}

/**
 * 添加子任务输入框
 */
export function addSubtask() {
  const container = document.getElementById('subtasks-container');
  if (!container) return;
  
  const newRow = document.createElement('div');
  newRow.className = 'flex gap-2';
  newRow.innerHTML = `
    <input type="text" name="subtask" class="form-input flex-1" placeholder="子任务名称">
    <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(newRow);
}

/**
 * 处理新建任务提交
 */
function handleNewTaskSubmit(form) {
  const formData = new FormData(form);
  const state = getState();
  
  const title = formData.get('title');
  const projectId = formData.get('projectId');
  const assigneeId = formData.get('assigneeId');
  const priority = formData.get('priority');
  const dueDate = formData.get('dueDate');
  const description = formData.get('description');
  const subtaskNames = formData.getAll('subtask').filter(s => s.trim());
  
  if (!title || !projectId || !assigneeId || !dueDate || !description) {
    showToast('请填写完整信息', 'warning');
    return;
  }
  
  const project = state.projects.find(p => p.id === projectId);
  const assignee = state.teamMembers.find(m => m.id === assigneeId);
  
  const newTask = {
    title,
    description,
    projectId,
    projectName: project?.name || '',
    priority,
    assignee,
    assigner: state.currentUser,
    dueDate: new Date(dueDate).toISOString(),
    type: 'custom',
    subtasks: subtaskNames.map((name, index) => ({
      id: `st${index + 1}`,
      title: name,
      completed: false
    }))
  };
  
  createTask(newTask);
  closeModal();
  render();
}

/**
 * 编辑任务
 */
export function editTask(taskId) {
  const state = getState();
  const task = state.tasks.find(t => t.id === taskId);
  
  if (!task) {
    showToast('任务不存在', 'error');
    return;
  }

  // 先关闭抽屉
  closeDrawer();

  const content = `
    <form id="edit-task-form" class="space-y-4">
      <div>
        <label class="form-label">任务名称 *</label>
        <input type="text" name="title" class="form-input" value="${task.title}" required>
      </div>
      
      <div>
        <label class="form-label">所属项目 *</label>
        <select name="projectId" class="form-select" required>
          ${state.projects.map(p => `
            <option value="${p.id}" ${p.id === task.projectId ? 'selected' : ''}>${p.name}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">负责人 *</label>
          <select name="assigneeId" class="form-select" required>
            ${state.teamMembers.map(m => `
              <option value="${m.id}" ${m.id === task.assignee?.id ? 'selected' : ''}>${m.name} - ${getRoleLabel(m.role)}</option>
            `).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">优先级 *</label>
          <select name="priority" class="form-select" required>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>紧急</option>
            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>常规</option>
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">状态 *</label>
        <select name="status" class="form-select" required>
          ${state.taskStatuses.map(s => `
            <option value="${s.id}" ${s.id === task.status ? 'selected' : ''}>${s.name}</option>
          `).join('')}
        </select>
      </div>
      
      <div>
        <label class="form-label">截止日期 *</label>
        <input type="datetime-local" name="dueDate" class="form-input" value="${task.dueDate?.slice(0, 16)}" required>
      </div>
      
      <div>
        <label class="form-label">任务描述 *</label>
        <textarea name="description" class="form-textarea" rows="4" required>${task.description}</textarea>
      </div>
      
      <div class="flex gap-3 pt-4">
        <button type="button" class="btn btn-secondary flex-1" onclick="window.closeModal()">取消</button>
        <button type="submit" class="btn btn-primary flex-1">保存修改</button>
      </div>
    </form>
  `;

  openModal(content, {
    title: '编辑任务',
    width: 'max-w-xl',
    closable: false
  });
  
  setTimeout(() => {
    const form = document.getElementById('edit-task-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        handleEditTaskSubmit(form, taskId);
      };
    }
  }, 100);
}

/**
 * 处理编辑任务提交
 */
function handleEditTaskSubmit(form, taskId) {
  const formData = new FormData(form);
  const state = getState();
  
  const title = formData.get('title');
  const projectId = formData.get('projectId');
  const assigneeId = formData.get('assigneeId');
  const priority = formData.get('priority');
  const status = formData.get('status');
  const dueDate = formData.get('dueDate');
  const description = formData.get('description');
  
  if (!title || !projectId || !assigneeId || !dueDate || !description) {
    showToast('请填写完整信息', 'warning');
    return;
  }
  
  const project = state.projects.find(p => p.id === projectId);
  const assignee = state.teamMembers.find(m => m.id === assigneeId);
  
  const updates = {
    title,
    description,
    projectId,
    projectName: project?.name || '',
    priority,
    status,
    assignee,
    dueDate: new Date(dueDate).toISOString()
  };
  
  updateTask(taskId, updates);
  closeModal();
  render();
}

/**
 * 格式化日期
 */
function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 获取状态名称
 */
function getStatusName(statusId) {
  const state = getState();
  const status = state.taskStatuses?.find(s => s.id === statusId);
  return status?.name || statusId;
}

/**
 * 获取角色名称
 */
function getRoleLabel(roleId) {
  const labels = {
    pi: '项目负责人',
    crc: '临床协调员',
    dm: '数据管理员',
    cra: '监查员',
    sa: '统计分析师'
  };
  return labels[roleId] || roleId;
}

// 暴露到全局
window.switchView = switchView;
window.filterWorkspaceTasks = filterWorkspaceTasks;
window.handleKanbanDragStart = handleKanbanDragStart;
window.handleKanbanDragEnd = handleKanbanDragEnd;
window.handleKanbanDrop = handleKanbanDrop;
window.viewTaskDetail = viewTaskDetail;
window.toggleSubtask = toggleSubtask;
window.submitTaskReview = submitTaskReview;
window.reviewTaskAction = reviewTaskAction;
window.showNewTaskForm = showNewTaskForm;
window.addSubtask = addSubtask;
window.editTask = editTask;
