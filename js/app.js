import { initStore, getState, subscribe, startSimulation } from './state/store.js';
import { formatDateTime, formatRelativeTime, formatNumber } from './utils/format.js';
import { renderStatusBadge, renderRoleBadge, renderAvatar, renderTag } from './components/status-badge.js';
import { renderTimeline, renderFlowNodes } from './components/timeline.js';
import { openModal, closeModal, openDrawer, closeDrawer, confirmDialog } from './components/modal.js';

import { initTraceSandbox, render as renderTraceSandbox } from './modules/trace-sandbox.js';
import { initTranscodingPipeline, render as renderTranscodingPipeline } from './modules/transcoding-pipeline.js';
import { initSecurityBarrier, render as renderSecurityBarrier } from './modules/security-barrier.js';
import { initCollaborationWorkspace, render as renderCollaborationWorkspace } from './modules/collaboration-workspace.js';

const pageConfig = {
  dashboard: {
    title: '项目总览',
    subtitle: '实时监控临床试验项目进度和团队协作状态',
    render: renderDashboard
  },
  collaboration: {
    title: '多角色协同工作台',
    subtitle: '跨团队协作任务管理，支持拖拽式看板和状态机流转',
    render: renderCollaborationWorkspace
  },
  trace: {
    title: '全链路追踪沙箱',
    subtitle: '无侵入式数据全生命周期追踪，从采集到归档完整可追溯',
    render: renderTraceSandbox
  },
  transcoding: {
    title: '多模态音视频转码流水线',
    subtitle: '6阶段秒级转码处理，支持多种格式转换和加密分发',
    render: renderTranscodingPipeline
  },
  security: {
    title: '跨租户数据安全隔离屏障',
    subtitle: '细粒度权限矩阵配置，完整操作审计日志追踪',
    render: renderSecurityBarrier
  },
  roles: {
    title: '角色管理',
    subtitle: '管理系统角色和权限配置，支持多租户隔离',
    render: renderRolesManagement
  }
};

let currentPage = 'dashboard';

window.closeModal = closeModal;
window.closeDrawer = closeDrawer;
window.confirmDialog = confirmDialog;

export function getCurrentPage() {
  return currentPage;
}

function initApp() {
  initStore();
  
  initTraceSandbox();
  initTranscodingPipeline();
  initSecurityBarrier();
  initCollaborationWorkspace();
  
  startSimulation();
  
  updateCurrentUserDisplay();
  bindNavigationEvents();
  navigateTo('dashboard');
  
  subscribe('currentUser', () => {
    updateCurrentUserDisplay();
  });
}

function updateCurrentUserDisplay() {
  const state = getState();
  const user = state.currentUser;
  
  if (!user) return;
  
  const avatarEl = document.getElementById('current-user-avatar');
  const nameEl = document.getElementById('current-user-name');
  const roleEl = document.getElementById('current-user-role');
  
  if (avatarEl) {
    avatarEl.textContent = user.name.charAt(0);
    const colors = ['from-blue-400 to-blue-600', 'from-emerald-400 to-emerald-600', 'from-amber-400 to-amber-600', 'from-rose-400 to-rose-600', 'from-purple-400 to-purple-600'];
    const colorIndex = state.roles.findIndex(r => r.id === user.role);
    avatarEl.className = `w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIndex] || colors[0]} flex items-center justify-center font-semibold`;
  }
  
  if (nameEl) {
    nameEl.textContent = user.name;
  }
  
  if (roleEl) {
    const role = state.roles.find(r => r.id === user.role);
    roleEl.textContent = role ? role.name : '未知角色';
  }
}

function bindNavigationEvents() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        navigateTo(page);
      }
    });
  });
}

function navigateTo(page) {
  if (!pageConfig[page]) return;
  
  currentPage = page;
  
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active', 'bg-blue-500/20', 'text-white');
    item.classList.add('text-slate-400', 'hover:bg-slate-800/50', 'hover:text-white');
    
    if (item.dataset.page === page) {
      item.classList.add('active', 'bg-blue-500/20', 'text-white');
      item.classList.remove('text-slate-400', 'hover:bg-slate-800/50', 'hover:text-white');
    }
  });
  
  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  if (titleEl) titleEl.textContent = pageConfig[page].title;
  if (subtitleEl) subtitleEl.textContent = pageConfig[page].subtitle;
  
  const contentEl = document.getElementById('main-content');
  if (contentEl) {
    contentEl.innerHTML = '';
    pageConfig[page].render(contentEl);
  }
}

function renderDashboard(container) {
  const state = getState();
  
  const stats = {
    totalProjects: state.projects.length,
    activeProjects: state.projects.filter(p => p.status === 'active').length,
    totalTasks: state.tasks.length,
    completedTasks: state.tasks.filter(t => t.status === 'completed').length,
    pendingTasks: state.tasks.filter(t => t.status === 'pending' || t.status === 'review').length,
    teamMembers: state.teamMembers.length,
    activeTraces: state.traces.filter(t => t.status === 'running').length,
    transcodingTasks: state.transcodingTasks.filter(t => t.status === 'processing').length,
    securityEvents: state.auditLogs.filter(l => l.riskLevel === 'high').length
  };
  
  const taskCompletionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  
  const containerHtml = `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <span class="text-sm text-blue-200">进行中 ${stats.activeProjects}/${stats.totalProjects}</span>
          </div>
          <div class="text-3xl font-bold mb-1">${formatNumber(stats.totalProjects)}</div>
          <div class="text-sm text-blue-200">临床试验项目</div>
        </div>
        
        <div class="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <span class="text-sm text-emerald-200">完成率 ${taskCompletionRate}%</span>
          </div>
          <div class="text-3xl font-bold mb-1">${formatNumber(stats.completedTasks)}</div>
          <div class="text-sm text-emerald-200">已完成任务</div>
        </div>
        
        <div class="bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-sm text-amber-200">待处理 ${stats.pendingTasks}</span>
          </div>
          <div class="text-3xl font-bold mb-1">${formatNumber(stats.totalTasks)}</div>
          <div class="text-sm text-amber-200">协作任务总数</div>
        </div>
        
        <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <span class="text-sm text-purple-200">5种角色</span>
          </div>
          <div class="text-3xl font-bold mb-1">${formatNumber(stats.teamMembers)}</div>
          <div class="text-sm text-purple-200">团队成员</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold">项目进度概览</h3>
              <button class="text-sm text-blue-400 hover:text-blue-300 transition-colors" onclick="navigateTo('collaboration')">
                查看全部 →
              </button>
            </div>
            <div class="space-y-4">
              ${state.projects.slice(0, 5).map(project => {
                const projectTasks = state.tasks.filter(t => t.projectId === project.id);
                const completedProjectTasks = projectTasks.filter(t => t.status === 'completed').length;
                const progress = projectTasks.length > 0 ? Math.round((completedProjectTasks / projectTasks.length) * 100) : 0;
                
                return `
                  <div class="group">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${project.color} flex items-center justify-center text-white font-semibold text-sm">
                          ${project.code}
                        </div>
                        <div>
                          <div class="font-medium group-hover:text-blue-400 transition-colors cursor-pointer" onclick="navigateTo('collaboration')">
                            ${project.name}
                          </div>
                          <div class="text-xs text-slate-400">${project.sponsor} · ${project.phase}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-semibold">${progress}%</div>
                        <div class="text-xs text-slate-400">${completedProjectTasks}/${projectTasks.length} 任务</div>
                      </div>
                    </div>
                    <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg font-semibold">系统运行状态</h3>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span class="text-sm text-green-400">系统正常</span>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                  <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <span class="text-2xl font-bold text-emerald-400">${stats.activeTraces}</span>
                </div>
                <div class="text-sm text-slate-400">活跃追踪任务</div>
              </div>
              
              <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                  <div class="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </div>
                  <span class="text-2xl font-bold text-amber-400">${stats.transcodingTasks}</span>
                </div>
                <div class="text-sm text-slate-400">转码处理中</div>
              </div>
              
              <div class="bg-slate-800/50 rounded-xl p-4 text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                  <div class="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                  </div>
                  <span class="text-2xl font-bold text-rose-400">${stats.securityEvents}</span>
                </div>
                <div class="text-sm text-slate-400">高风险事件</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <h3 class="text-lg font-semibold mb-4">快捷操作</h3>
            <div class="space-y-3">
              <button class="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left" onclick="navigateTo('collaboration'); setTimeout(() => document.querySelector('[data-action=\"new-task\"]')?.click(), 300);">
                <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium">新建协作任务</div>
                  <div class="text-xs text-slate-400">创建任务并分配给团队成员</div>
                </div>
              </button>
              
              <button class="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left" onclick="navigateTo('transcoding'); setTimeout(() => document.querySelector('[data-action=\"new-transcoding\"]')?.click(), 300);">
                <div class="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium">发起音视频转码</div>
                  <div class="text-xs text-slate-400">上传媒体文件并启动转码流水线</div>
                </div>
              </button>
              
              <button class="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left" onclick="navigateTo('trace')">
                <div class="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium">数据追踪查询</div>
                  <div class="text-xs text-slate-400">追溯数据从采集到归档的完整链路</div>
                </div>
              </button>
              
              <button class="w-full flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-left" onclick="navigateTo('security')">
                <div class="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <div class="font-medium">安全审计日志</div>
                  <div class="text-xs text-slate-400">查看所有操作记录和安全事件</div>
                </div>
              </button>
            </div>
          </div>
          
          <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold">团队成员</h3>
              <button class="text-sm text-blue-400 hover:text-blue-300 transition-colors" onclick="navigateTo('roles')">
                管理 →
              </button>
            </div>
            <div class="space-y-3">
              ${state.teamMembers.slice(0, 6).map(member => {
                const role = state.roles.find(r => r.id === member.role);
                return `
                  <div class="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                    ${renderAvatar(member)}
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-sm truncate">${member.name}</div>
                      <div class="text-xs text-slate-400 truncate">${role ? role.name : '未知角色'}</div>
                    </div>
                    <div class="w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}"></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
            <h3 class="text-lg font-semibold mb-4">最近活动</h3>
            <div class="space-y-4">
              ${state.auditLogs.slice(0, 5).map(log => {
                const user = state.teamMembers.find(m => m.id === log.userId);
                return `
                  <div class="flex gap-3">
                    <div class="flex-shrink-0 mt-0.5">
                      ${renderAvatar(user || { name: '未知', color: 'from-slate-400 to-slate-600' })}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm">
                        <span class="font-medium">${user ? user.name : '未知用户'}</span>
                        <span class="text-slate-400"> ${log.action}</span>
                      </div>
                      <div class="text-xs text-slate-500 mt-0.5">${formatRelativeTime(log.timestamp)}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = containerHtml;
}

function renderRolesManagement(container) {
  const state = getState();
  
  const containerHtml = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-semibold">系统角色定义</h3>
          <p class="text-sm text-slate-400 mt-1">临床试验协作平台共定义5种核心角色，每种角色拥有不同的权限范围</p>
        </div>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          新增角色
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${state.roles.map(role => {
          const membersInRole = state.teamMembers.filter(m => m.role === role.id);
          return `
            <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-colors">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br ${role.id === 'pi' ? 'from-blue-500 to-blue-700' : role.id === 'crc' ? 'from-emerald-500 to-emerald-700' : role.id === 'dm' ? 'from-amber-500 to-amber-700' : role.id === 'cra' ? 'from-rose-500 to-rose-700' : 'from-purple-500 to-purple-700'} rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <span class="text-sm text-slate-400">${membersInRole.length} 人</span>
              </div>
              
              <h4 class="text-lg font-semibold mb-2">${role.name}</h4>
              <p class="text-sm text-slate-400 mb-4">${role.description}</p>
              
              <div class="border-t border-slate-800 pt-4">
                <div class="text-xs text-slate-500 uppercase tracking-wider mb-2">团队成员</div>
                <div class="flex -space-x-2">
                  ${membersInRole.slice(0, 4).map(m => `
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br ${m.color} border-2 border-slate-900 flex items-center justify-center text-xs font-semibold text-white" title="${m.name}">
                      ${m.name.charAt(0)}
                    </div>
                  `).join('')}
                  ${membersInRole.length > 4 ? `
                    <div class="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-medium text-slate-300">
                      +${membersInRole.length - 4}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold">协作状态机说明</h3>
            <p class="text-sm text-slate-400 mt-1">标准任务状态流转规则，确保多角色协作流程规范可控</p>
          </div>
        </div>
        
        <div class="flex items-center justify-between overflow-x-auto pb-4">
          ${state.taskStatuses.map((status, index) => {
            const isLast = index === state.taskStatuses.length - 1;
            const taskCount = state.tasks.filter(t => t.status === status.id).length;
            
            return `
              <div class="flex items-center flex-shrink-0">
                <div class="flex flex-col items-center">
                  <div class="w-16 h-16 rounded-2xl ${status.id === 'completed' ? 'bg-emerald-600' : status.id === 'rejected' || status.id === 'failed' ? 'bg-rose-600' : 'bg-blue-600'} flex items-center justify-center text-white font-semibold">
                    ${taskCount}
                  </div>
                  <div class="mt-2 text-sm font-medium">${status.name}</div>
                  <div class="text-xs text-slate-400">${taskCount} 个任务</div>
                </div>
                ${!isLast ? `
                  <div class="mx-4">
                    <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                    <div class="text-xs text-slate-500 mt-1 whitespace-nowrap">
                      ${status.transitions.map(t => {
                        const s = state.taskStatuses.find(ts => ts.id === t);
                        return s ? s.name : t;
                      }).join(' / ')}
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold">当前登录用户</h3>
            <p class="text-sm text-slate-400 mt-1">点击切换不同角色，体验各角色的操作权限差异</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          ${state.teamMembers.map(member => {
            const role = state.roles.find(r => r.id === member.role);
            const isCurrentUser = state.currentUser && state.currentUser.id === member.id;
            
            return `
              <div class="p-4 rounded-xl border-2 transition-all cursor-pointer ${isCurrentUser ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-800/30'}" onclick="switchUser('${member.id}')">
                <div class="flex items-center gap-3 mb-3">
                  ${renderAvatar(member)}
                  <div class="flex-1">
                    <div class="font-medium">${member.name}</div>
                    <div class="text-xs text-slate-400">${role ? role.name : '未知角色'}</div>
                  </div>
                  ${isCurrentUser ? `
                    <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  ` : ''}
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-400">
                  <span class="w-2 h-2 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-slate-500'}"></span>
                  ${member.status === 'online' ? '在线' : '离线'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = containerHtml;
}

window.switchUser = function(userId) {
  const state = getState();
  const user = state.teamMembers.find(m => m.id === userId);
  
  if (!user) return;
  
  state.currentUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    color: user.color
  };
  
  showToast(`已切换到「${user.name}」(${state.roles.find(r => r.id === user.role)?.name || '未知角色'})`, 'success');
  
  navigateTo(currentPage);
};

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600'
  };
  
  const icons = {
    success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
    error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
    warning: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>',
    info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
  };
  
  const toast = document.createElement('div');
  toast.className = `${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0`;
  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      ${icons[type]}
    </svg>
    <span class="text-sm font-medium">${message}</span>
  `;
  
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  });
  
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.showToast = showToast;
window.navigateTo = navigateTo;

document.addEventListener('DOMContentLoaded', initApp);

if (document.readyState !== 'loading') {
  initApp();
}

export { renderDashboard, renderRolesManagement, showToast, navigateTo };
