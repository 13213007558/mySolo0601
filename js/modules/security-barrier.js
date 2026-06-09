/**
 * 数据安全隔离屏障模块
 * 实现跨租户的数据安全隔离、权限矩阵管理和操作审计
 */

import { getState, subscribe, togglePermission, showToast } from '../state/store.js';
import { generatePermissionMatrix } from '../state/mock-data.js';
import { formatDateTime, formatRelativeTime, getRiskLabel, getRoleLabel } from '../utils/format.js';
import { renderStatusBadge, renderAvatar, renderRoleBadge, renderTag } from '../components/status-badge.js';
import { openDrawer, confirmDialog } from '../components/modal.js';

let container = null;
let currentTab = 'permissions';

/**
 * 初始化安全隔离屏障模块
 */
export function initSecurityBarrier(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  // 订阅状态变化
  subscribe('permissionMatrix', () => render());
  subscribe('auditLogs', () => render());
  
  if (container) {
    render();
  }
}

/**
 * 渲染安全隔离屏障
 */
export function render(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  if (!container) return;
  
  const state = getState();
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div>
        <h2 class="text-2xl font-bold text-slate-100">数据安全隔离屏障</h2>
        <p class="text-slate-400 mt-1">管理角色权限、监控操作行为、确保跨租户数据安全隔离</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-4 gap-4">
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${state.teamMembers.length}</div>
              <div class="text-sm text-slate-400">系统用户</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">
              🔐
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${state.roles.length}</div>
              <div class="text-sm text-slate-400">角色类型</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${state.auditLogs.length}</div>
              <div class="text-sm text-slate-400">审计记录</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <div class="text-2xl font-bold text-slate-100">${state.auditLogs.filter(l => l.status === 'denied').length}</div>
              <div class="text-sm text-slate-400">拒绝操作</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <div class="card">
        <div class="card-header">
          <div class="flex gap-1">
            <button 
              class="px-4 py-2 rounded-lg font-medium transition-all ${currentTab === 'permissions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
              onclick="window.switchSecurityTab('permissions')"
            >
              权限矩阵
            </button>
            <button 
              class="px-4 py-2 rounded-lg font-medium transition-all ${currentTab === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}"
              onclick="window.switchSecurityTab('audit')"
            >
              审计日志
            </button>
          </div>
        </div>
        <div class="card-body">
          ${currentTab === 'permissions' ? renderPermissionMatrix(state) : renderAuditLogs(state)}
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染权限矩阵
 */
function renderPermissionMatrix(state) {
  const { roles, resources, matrix } = state.permissionMatrix;
  
  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-400">点击单元格可切换权限状态，绿色表示允许，红色表示拒绝</p>
        <button class="btn btn-secondary btn-sm" onclick="window.resetPermissions()">
          重置默认权限
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/50 sticky left-0 z-10">
                资源 / 角色
              </th>
              ${roles.map(role => `
                <th class="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/50 min-w-[120px]">
                  <div class="flex flex-col items-center gap-1">
                    ${renderRoleBadge(role.id)}
                    <span class="text-[10px] text-slate-500 normal-case">${role.description}</span>
                  </div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${resources.map(resource => `
              <tr class="border-b border-slate-700/50 hover:bg-slate-800/30">
                <td class="px-4 py-3 sticky left-0 bg-slate-800/50 z-10">
                  <div class="font-medium text-slate-200">${resource.name}</div>
                  <div class="text-xs text-slate-500">${resource.id}</div>
                </td>
                ${roles.map(role => {
                  const allowed = matrix[role.id][resource.id];
                  return `
                    <td class="px-4 py-3 text-center">
                      <div 
                        class="permission-cell ${allowed ? 'permission-allowed' : 'permission-denied'} inline-block"
                        onclick="window.handleTogglePermission('${role.id}', '${resource.id}')"
                        title="点击${allowed ? '撤销' : '授予'}权限"
                      >
                        ${allowed ? '✓' : '✕'}
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 权限说明 -->
      <div class="mt-6 p-4 bg-slate-900/50 rounded-xl">
        <h4 class="font-medium text-slate-200 mb-3">角色说明</h4>
        <div class="grid grid-cols-2 gap-4">
          ${roles.map(role => `
            <div class="flex items-start gap-3">
              ${renderRoleBadge(role.id)}
              <div>
                <div class="font-medium text-slate-300">${role.name}</div>
                <div class="text-sm text-slate-500">${role.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染审计日志
 */
function renderAuditLogs(state) {
  const logs = state.auditLogs;
  
  return `
    <div class="space-y-4">
      <!-- 筛选 -->
      <div class="flex gap-3 flex-wrap">
        <select id="audit-risk-filter" class="form-select w-32" onchange="window.filterAuditLogs()">
          <option value="all">全部风险</option>
          <option value="high">高风险</option>
          <option value="medium">中风险</option>
          <option value="low">低风险</option>
        </select>
        <select id="audit-status-filter" class="form-select w-32" onchange="window.filterAuditLogs()">
          <option value="all">全部状态</option>
          <option value="success">成功</option>
          <option value="denied">被拒绝</option>
        </select>
        <select id="audit-role-filter" class="form-select w-40" onchange="window.filterAuditLogs()">
          <option value="all">全部角色</option>
          ${state.roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
        </select>
        <select id="audit-action-filter" class="form-select w-32" onchange="window.filterAuditLogs()">
          <option value="all">全部操作</option>
          <option value="view">查看</option>
          <option value="edit">编辑</option>
          <option value="delete">删除</option>
          <option value="export">导出</option>
          <option value="approve">审批</option>
          <option value="download">下载</option>
        </select>
        <input 
          type="text" 
          id="audit-search" 
          class="form-input w-60" 
          placeholder="搜索用户名、资源ID..."
          oninput="window.filterAuditLogs()"
        >
      </div>

      <!-- 日志列表 -->
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>角色</th>
              <th>操作</th>
              <th>风险等级</th>
              <th>资源类型</th>
              <th>资源ID</th>
              <th>IP地址</th>
              <th>状态</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody id="audit-table-body">
            ${renderAuditTableRows(logs)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * 渲染审计表格行
 */
function renderAuditTableRows(logs) {
  if (!logs || logs.length === 0) {
    return `
      <tr>
        <td colspan="10" class="text-center py-12 text-slate-500">
          暂无审计记录
        </td>
      </tr>
    `;
  }

  return logs.map(log => {
    const risk = getRiskLabel(log.riskLevel);
    const statusLabel = log.status === 'success' 
      ? { text: '成功', class: 'tag-green' }
      : { text: '被拒绝', class: 'tag-red' };
    
    return `
      <tr class="cursor-pointer hover:bg-slate-800/50 transition-colors" onclick="window.viewAuditDetail('${log.id}')">
        <td class="text-slate-400 text-xs whitespace-nowrap">${formatRelativeTime(log.timestamp)}</td>
        <td>
          <div class="flex items-center gap-2">
            ${renderAvatar({ name: log.userName, avatar: log.userName?.charAt(0) }, 'sm')}
            <span class="text-sm text-slate-300">${log.userName}</span>
          </div>
        </td>
        <td>${renderRoleBadge(log.userRole, 'sm')}</td>
        <td class="text-slate-300 font-medium">${log.actionName}</td>
        <td><span class="tag ${risk.class}">${risk.text}</span></td>
        <td>${renderTag(log.resourceName, 'blue')}</td>
        <td class="font-mono text-xs text-slate-400">${log.resourceId}</td>
        <td class="font-mono text-xs text-slate-500">${log.ipAddress}</td>
        <td><span class="tag ${statusLabel.class}">${statusLabel.text}</span></td>
        <td class="text-slate-400 text-sm max-w-[200px] truncate" title="${log.details}">${log.details || '-'}</td>
      </tr>
    `;
  }).join('');
}

/**
 * 切换标签页
 */
export function switchSecurityTab(tab) {
  currentTab = tab;
  render();
}

/**
 * 处理权限切换
 */
export function handleTogglePermission(roleId, resourceId) {
  const state = getState();
  const current = state.permissionMatrix.matrix[roleId][resourceId];
  const role = state.roles.find(r => r.id === roleId);
  const resource = state.permissionMatrix.resources.find(r => r.id === resourceId);
  
  confirmDialog(
    `确定要${current ? '撤销' : '授予'}「${role?.name}」对「${resource?.name}」的权限吗？`,
    {
      title: `${current ? '撤销' : '授予'}权限`,
      type: current ? 'warning' : 'info',
      confirmText: current ? '确认撤销' : '确认授予'
    }
  ).then(confirmed => {
    if (confirmed) {
      togglePermission(roleId, resourceId);
    }
  });
}

/**
 * 重置权限
 */
export function resetPermissions() {
  confirmDialog(
    '确定要重置所有角色的权限为默认值吗？此操作不可撤销。',
    {
      title: '重置权限',
      type: 'warning'
    }
  ).then(confirmed => {
    if (confirmed) {
      // 重新生成权限矩阵
      const state = getState();
      state.permissionMatrix = generatePermissionMatrix();
      showToast('权限已重置为默认值', 'success');
      render();
    }
  });
}

/**
 * 筛选审计日志
 */
export function filterAuditLogs() {
  const state = getState();
  const riskFilter = document.getElementById('audit-risk-filter')?.value || 'all';
  const statusFilter = document.getElementById('audit-status-filter')?.value || 'all';
  const roleFilter = document.getElementById('audit-role-filter')?.value || 'all';
  const actionFilter = document.getElementById('audit-action-filter')?.value || 'all';
  const searchText = document.getElementById('audit-search')?.value?.toLowerCase() || '';
  
  let filtered = [...state.auditLogs];
  
  if (riskFilter !== 'all') {
    filtered = filtered.filter(l => l.riskLevel === riskFilter);
  }
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(l => l.status === statusFilter);
  }
  
  if (roleFilter !== 'all') {
    filtered = filtered.filter(l => l.userRole === roleFilter);
  }
  
  if (actionFilter !== 'all') {
    filtered = filtered.filter(l => l.action === actionFilter);
  }
  
  if (searchText) {
    filtered = filtered.filter(l => 
      l.userName.toLowerCase().includes(searchText) ||
      l.resourceId.toLowerCase().includes(searchText) ||
      l.details?.toLowerCase().includes(searchText)
    );
  }
  
  const tbody = document.getElementById('audit-table-body');
  if (tbody) {
    tbody.innerHTML = renderAuditTableRows(filtered);
  }
}

/**
 * 查看审计详情
 */
export function viewAuditDetail(logId) {
  const state = getState();
  const log = state.auditLogs.find(l => l.id === logId);
  
  if (!log) {
    showToast('审计记录不存在', 'error');
    return;
  }

  const risk = getRiskLabel(log.riskLevel);
  const role = getRoleLabel(log.userRole);
  const statusLabel = log.status === 'success' 
    ? { text: '成功', class: 'tag-green' }
    : { text: '被拒绝', class: 'tag-red' };

  const content = `
    <div class="space-y-6">
      <!-- 操作信息 -->
      <div class="bg-slate-900/50 rounded-xl p-5">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-xl ${log.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'} flex items-center justify-center text-3xl">
            ${log.status === 'success' ? '✓' : '✕'}
          </div>
          <div>
            <div class="text-lg font-semibold text-slate-100">${log.actionName}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="tag ${statusLabel.class}">${statusLabel.text}</span>
              <span class="tag ${risk.class}">${risk.text}</span>
            </div>
          </div>
        </div>
        ${log.details ? `
          <div class="p-3 bg-slate-800/50 rounded-lg">
            <div class="text-sm text-slate-400 mb-1">操作详情</div>
            <div class="text-slate-200">${log.details}</div>
          </div>
        ` : ''}
      </div>

      <!-- 用户信息 -->
      <div>
        <h4 class="text-lg font-semibold text-slate-100 mb-4">操作人信息</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">用户名称</label>
            <div class="flex items-center gap-2 mt-1">
              ${renderAvatar({ name: log.userName, avatar: log.userName?.charAt(0) }, 'md')}
              <span class="font-medium text-slate-200">${log.userName}</span>
            </div>
          </div>
          <div>
            <label class="text-sm text-slate-400">用户角色</label>
            <div class="mt-1">${renderRoleBadge(log.userRole)}</div>
          </div>
          <div>
            <label class="text-sm text-slate-400">用户ID</label>
            <div class="font-mono text-slate-400 mt-1">${log.userId}</div>
          </div>
          <div>
            <label class="text-sm text-slate-400">会话ID</label>
            <div class="font-mono text-slate-400 mt-1 text-xs">${log.sessionId}</div>
          </div>
        </div>
      </div>

      <!-- 资源信息 -->
      <div>
        <h4 class="text-lg font-semibold text-slate-100 mb-4">资源信息</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">资源类型</label>
            <div class="mt-1">${renderTag(log.resourceName, 'blue')}</div>
          </div>
          <div>
            <label class="text-sm text-slate-400">资源ID</label>
            <div class="font-mono text-slate-400 mt-1">${log.resourceId}</div>
          </div>
        </div>
      </div>

      <!-- 技术信息 -->
      <div>
        <h4 class="text-lg font-semibold text-slate-100 mb-4">技术信息</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-400">操作时间</label>
            <div class="text-slate-300 mt-1">${formatDateTime(log.timestamp)}</div>
          </div>
          <div>
            <label class="text-sm text-slate-400">IP地址</label>
            <div class="font-mono text-slate-400 mt-1">${log.ipAddress}</div>
          </div>
          <div class="col-span-2">
            <label class="text-sm text-slate-400">浏览器信息</label>
            <div class="font-mono text-slate-500 mt-1 text-xs break-all">${log.userAgent}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end pt-4 border-t border-slate-700">
        <button class="btn btn-secondary" onclick="window.closeDrawer()">
          关闭
        </button>
      </div>
    </div>
  `;

  openDrawer(content, {
    title: `审计详情 - ${log.id}`,
    width: 'max-w-2xl'
  });
}

// 暴露到全局
window.switchSecurityTab = switchSecurityTab;
window.handleTogglePermission = handleTogglePermission;
window.resetPermissions = resetPermissions;
window.filterAuditLogs = filterAuditLogs;
window.viewAuditDetail = viewAuditDetail;
