/**
 * 应用主入口
 * 联邦学习隐私计算联邦控制台 - 文化遗产数字化与数字藏品领域
 */

import { initStore, getState, startSimulation } from './state/store.js';
import { cleanupAll } from './state/fl-state.js';
import { initAnomalyBoard, renderAnomalyBoard } from './modules/anomaly-board.js';
import { initEdgeInference, renderEdgeInference } from './modules/edge-inference.js';
import { initRLBrain, renderRLBrain } from './modules/rl-brain.js';
import { renderStatusBadge, renderStatusIndicator } from './components/status-badge.js';
import { formatNumber, formatPercent, formatLatency, getNodeStatusLabel, getNodeStatusClass, getPolicyLabel, getRiskLabel, getRiskClass, getSensitivityLabel, getSensitivityClass, getTrainingStatusLabel, getTrainingStatusClass, getEncryptionStatusLabel } from './utils/format.js';

let currentPage = 'dashboard';

// 应用初始化
window.addEventListener('DOMContentLoaded', () => {
  console.log('[App] 联邦学习隐私计算联邦控制台启动中...');
  
  // 初始化状态管理
  initStore();
  
  // 初始化导航
  initNavigation();
  
  // 渲染初始页面
  renderPage('dashboard');
  
  // 初始化各模块（事件绑定）
  initAnomalyBoard();
  initEdgeInference();
  initRLBrain();
  
  // 启动实时模拟引擎
  startSimulation();
  
  // 启动自动重试的待处理任务
  startPendingRetries();
  
  console.log('[App] 控制台启动完成');
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  cleanupAll();
});

// ==========================================================================
// 导航系统
// ==========================================================================

function initNavigation() {
  document.addEventListener('click', (e) => {
    // 导航点击
    const navItem = e.target.closest('[data-nav]');
    if (navItem) {
      const page = navItem.dataset.nav;
      navigateTo(page);
      return;
    }
    
    // 区块点击跳转
    const blockNav = e.target.closest('[data-block-nav]');
    if (blockNav) {
      const page = blockNav.dataset.blockNav;
      navigateTo(page);
      return;
    }
  });
}

function navigateTo(page) {
  if (currentPage === page) return;
  
  // 更新导航激活状态
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === page);
  });
  
  currentPage = page;
  renderPage(page);
  
  // 更新 URL hash
  window.location.hash = page;
}

function renderPage(page) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  
  mainContent.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin w-8 h-8 border-2 border-bronze border-t-transparent rounded-full"></div></div>';
  
  setTimeout(() => {
    switch (page) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'anomaly':
        mainContent.innerHTML = '<div id="anomaly-board-container"></div>';
        renderAnomalyBoard();
        break;
      case 'inference':
        mainContent.innerHTML = '<div id="edge-inference-container"></div>';
        renderEdgeInference();
        break;
      case 'rl-brain':
        mainContent.innerHTML = '<div id="rl-brain-container"></div>';
        renderRLBrain();
        break;
      case 'security':
        renderSecurityMonitor();
        break;
      case 'data':
        renderDataDomain();
        break;
      default:
        renderDashboard();
    }
  }, 100);
}

// ==========================================================================
// 总控驾驶舱 - 六区块布局
// ==========================================================================

function renderDashboard() {
  const state = getState();
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="p-6 space-y-6">
      <!-- 顶部概览指标 -->
      <div class="grid grid-cols-6 gap-4">
        <div class="metric-card block-enter">
          <div class="text-slate-400 text-xs">联邦节点总数</div>
          <div class="text-2xl font-bold text-white mt-1">${state.overview.totalNodes}</div>
          <div class="text-xs text-emerald-400 mt-1">活跃 ${state.overview.activeNodes}</div>
        </div>
        <div class="metric-card block-enter">
          <div class="text-slate-400 text-xs">任务总数</div>
          <div class="text-2xl font-bold text-white mt-1">${formatNumber(state.overview.totalTasks)}</div>
          <div class="text-xs text-emerald-400 mt-1">成功率 ${state.overview.successRate}%</div>
        </div>
        <div class="metric-card block-enter">
          <div class="text-slate-400 text-xs">平均延迟</div>
          <div class="text-2xl font-bold text-sky-400 mt-1">${formatLatency(state.overview.avgLatency)}</div>
          <div class="text-xs text-slate-400 mt-1">边缘侧响应</div>
        </div>
        <div class="metric-card block-enter">
          <div class="text-slate-400 text-xs">安全告警</div>
          <div class="text-2xl font-bold ${state.overview.securityAlerts > 0 ? 'text-red-400' : 'text-emerald-400'} mt-1">${state.overview.securityAlerts}</div>
          <div class="text-xs ${state.overview.securityAlerts > 0 ? 'text-red-400' : 'text-slate-400'} mt-1">${state.overview.securityAlerts > 0 ? '待处理' : '全部正常'}</div>
        </div>
        <div class="metric-card block-enter">
          <div class="text-slate-400 text-xs">系统可用性</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">${state.overview.uptime}</div>
          <div class="text-xs text-slate-400 mt-1">连续运行</div>
        </div>
        <div class="metric-card block-enter">
          <div class="text-slate-400 text-xs">数据处理量</div>
          <div class="text-2xl font-bold text-amber-400 mt-1">${state.overview.dataProcessed}</div>
          <div class="text-xs text-slate-400 mt-1">已加密处理</div>
        </div>
      </div>
      
      <!-- 六区块信息矩阵 - 面向领域对象设计 -->
      <div class="grid grid-cols-3 gap-4 six-block-grid">
        <!-- B1: 数字藏品数据域 -->
        <div class="block-card block-enter cursor-pointer" data-block-nav="data">
          <div class="block-header">
            <div class="flex items-center gap-2">
              <div class="status-indicator healthy"></div>
              <span class="font-medium text-white">数字藏品数据域</span>
            </div>
            <span class="text-xs text-slate-400">B1</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-[10px] text-slate-400">数据集总数</div>
                <div class="text-lg font-bold text-white">${state.dataDomain.totalDatasets}</div>
              </div>
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-[10px] text-slate-400">总数据量</div>
                <div class="text-lg font-bold text-amber-400">${state.dataDomain.totalDataSize}</div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="text-xs text-slate-400 mb-1">数据集列表</div>
              ${state.dataDomain.datasets.slice(0, 3).map(ds => `
                <div class="flex items-center justify-between bg-slate-700/30 rounded px-2 py-1.5">
                  <span class="text-xs text-white truncate max-w-[120px]">${ds.name}</span>
                  ${renderStatusBadge(ds.sensitivity, 'sensitivity')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- B2: 低延迟边缘侧推理决策板 -->
        <div class="block-card block-enter cursor-pointer" data-block-nav="inference">
          <div class="block-header">
            <div class="flex items-center gap-2">
              <div class="status-indicator healthy"></div>
              <span class="font-medium text-white">边缘推理决策板</span>
            </div>
            <span class="text-xs text-slate-400">B2</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div>
                <div class="text-2xl font-bold text-amber-400">${state.inferenceTasks.queued.length}</div>
                <div class="text-[10px] text-slate-400">排队中</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-sky-400">${state.inferenceTasks.running.length}</div>
                <div class="text-[10px] text-slate-400">执行中</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-emerald-400">${state.inferenceTasks.completed.length}</div>
                <div class="text-[10px] text-slate-400">已完成</div>
              </div>
            </div>
            <div class="space-y-2">
              ${state.inferenceTasks.running.slice(0, 2).map(task => `
                <div class="bg-slate-700/30 rounded p-2">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-white truncate">${task.name}</span>
                    <span class="text-[10px] text-sky-400">${task.progress}%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill progress-animated bg-sky-500" style="width: ${task.progress}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- B3: 安全边界监控 -->
        <div class="block-card block-enter cursor-pointer" data-block-nav="security">
          <div class="block-header">
            <div class="flex items-center gap-2">
              <div class="status-indicator ${state.security.recentAlerts.some(a => a.risk === 'high' && a.status === 'investigating') ? 'critical' : 'healthy'}"></div>
              <span class="font-medium text-white">安全边界监控</span>
            </div>
            <span class="text-xs text-slate-400">B3</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-[10px] text-slate-400">访问尝试</div>
                <div class="text-lg font-bold text-white">${formatNumber(state.security.accessAttempts)}</div>
              </div>
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-[10px] text-slate-400">已拦截</div>
                <div class="text-lg font-bold text-red-400">${state.security.blockedAttempts}</div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">加密状态</span>
                <span class="status-badge success">${getEncryptionStatusLabel(state.security.encryptionStatus)}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-400">HSM 状态</span>
                <span class="status-badge success">${state.security.hsmStatus === 'healthy' ? '正常' : '异常'}</span>
              </div>
            </div>
            <div class="space-y-1">
              ${state.security.recentAlerts.filter(a => a.risk === 'high').slice(0, 2).map(alert => `
                <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5 ${alert.status === 'investigating' ? 'alert-blink' : ''}">
                  <div class="status-indicator critical"></div>
                  <span class="text-xs text-red-300 truncate">${alert.typeLabel}: ${alert.target}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- B4: 异常任务补偿看板 -->
        <div class="block-card block-enter cursor-pointer" data-block-nav="anomaly">
          <div class="block-header">
            <div class="flex items-center gap-2">
              <div class="status-indicator ${state.workflow.pendingManualIntervention > 0 ? 'warning' : 'healthy'}"></div>
              <span class="font-medium text-white">异常任务补偿看板</span>
            </div>
            <span class="text-xs text-slate-400">B4</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-[10px] text-slate-400">异常总数</div>
                <div class="text-lg font-bold text-amber-400">${state.anomalyTasks.length}</div>
              </div>
              <div class="bg-slate-700/30 rounded p-2">
                <div class="text-[10px] text-slate-400">待人工介入</div>
                <div class="text-lg font-bold text-red-400">${state.workflow.pendingManualIntervention}</div>
              </div>
            </div>
            <div class="space-y-2">
              ${state.anomalyTasks.filter(t => t.status === 'manual_intervention_required').slice(0, 3).map(task => `
                <div class="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs text-white truncate">${task.name}</div>
                    <div class="text-[10px] text-slate-400">${task.id}</div>
                  </div>
                  ${renderStatusBadge(task.priority, 'priority')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <!-- B5: 强化学习资源动态分配脑核心链路 -->
        <div class="block-card block-enter cursor-pointer" data-block-nav="rl-brain">
          <div class="block-header">
            <div class="flex items-center gap-2">
              <div class="status-indicator healthy"></div>
              <span class="font-medium text-white">RL 资源分配脑核心</span>
            </div>
            <span class="text-xs text-slate-400">B5</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex items-center justify-center">
              <div class="relative w-24 h-24">
                <div class="absolute inset-0 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center animate-pulse">
                  <div class="text-center">
                    <div class="text-xl">🧠</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <div class="text-slate-400">当前策略</div>
                <div class="text-white font-medium">${getPolicyLabel(state.rlBrain.currentPolicy)}</div>
              </div>
              <div>
                <div class="text-slate-400">累计奖励</div>
                <div class="text-emerald-400 font-medium">${state.rlBrain.totalReward}</div>
              </div>
              <div>
                <div class="text-slate-400">探索率</div>
                <div class="text-amber-400 font-medium">${formatPercent(parseFloat(state.rlBrain.explorationRate) * 100)}</div>
              </div>
              <div>
                <div class="text-slate-400">决策数</div>
                <div class="text-white font-medium">${state.rlBrain.recentDecisions.length}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- B6: 联邦节点拓扑 -->
        <div class="block-card block-enter">
          <div class="block-header">
            <div class="flex items-center gap-2">
              <div class="status-indicator healthy"></div>
              <span class="font-medium text-white">联邦节点拓扑</span>
            </div>
            <span class="text-xs text-slate-400">B6</span>
          </div>
          <div class="p-4">
            <svg width="100%" height="180" viewBox="0 0 800 200" class="overflow-visible">
              <!-- 连接线 -->
              ${state.topology.connections.map(conn => {
                const fromNode = state.topology.nodes.find(n => n.id === conn.from);
                const toNode = state.topology.nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return '';
                return `
                  <line 
                    x1="${fromNode.x + 12}" y1="${fromNode.y + 12}" 
                    x2="${toNode.x + 12}" y2="${toNode.y + 12}"
                    class="node-connection ${conn.active ? 'active' : ''}"
                    stroke-dasharray="${conn.active ? '' : '4,4'}"
                  />
                `;
              }).join('')}
              
              <!-- 节点 -->
              ${state.topology.nodes.map(node => `
                <g transform="translate(${node.x}, ${node.y})">
                  <circle r="12" class="node-pulse" 
                    fill="${node.status === 'healthy' ? '#10B981' : node.status === 'warning' ? '#F59E0B' : '#64748B'}"
                    opacity="0.3"/>
                  <circle r="12" 
                    fill="${node.status === 'healthy' ? '#10B981' : node.status === 'warning' ? '#F59E0B' : '#64748B'}"/>
                  <text x="12" y="-8" class="fill-slate-300 text-[10px] font-mono">${node.name}</text>
                  <text x="12" y="28" class="fill-slate-500 text-[9px]">${node.load}%</text>
                </g>
              `).join('')}
            </svg>
            <div class="flex items-center justify-center gap-4 mt-2 text-[10px] text-slate-400">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>正常</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>告警</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-slate-500"></div>
                <span>离线</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 安全边界监控
// ==========================================================================

function renderSecurityMonitor() {
  const state = getState();
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="p-6 space-y-6">
      <div class="grid grid-cols-5 gap-4">
        <div class="metric-card">
          <div class="text-slate-400 text-sm">访问尝试总数</div>
          <div class="text-2xl font-bold text-white mt-1">${formatNumber(state.security.accessAttempts)}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">已拦截</div>
          <div class="text-2xl font-bold text-red-400 mt-1">${state.security.blockedAttempts}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">加密状态</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">${getEncryptionStatusLabel(state.security.encryptionStatus)}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">HSM 状态</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">${state.security.hsmStatus === 'healthy' ? '正常' : '异常'}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">密钥轮换</div>
          <div class="text-2xl font-bold text-sky-400 mt-1">${state.security.keyRotationStatus === 'normal' ? '正常' : '待处理'}</div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-6">
        <div class="block-card">
          <div class="block-header">
            <span class="font-medium text-white">安全告警日志</span>
          </div>
          <div class="p-4">
            <div class="space-y-3 max-h-[500px] overflow-y-auto">
              ${state.security.recentAlerts.map(alert => `
                <div class="bg-slate-700/30 rounded-lg p-3">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <div class="status-indicator ${alert.risk === 'high' ? 'critical' : alert.risk === 'medium' ? 'warning' : 'healthy'}"></div>
                      <span class="status-badge ${getRiskClass(alert.risk)}">${getRiskLabel(alert.risk)}</span>
                      <span class="status-badge info">${alert.typeLabel}</span>
                    </div>
                    <span class="text-xs text-slate-400">${alert.time}</span>
                  </div>
                  <div class="text-sm text-white mb-1">${alert.description}</div>
                  <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-2">
                    <div>来源: ${alert.source}</div>
                    <div>目标: ${alert.target}</div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="status-badge ${alert.status === 'investigating' ? 'warning' : alert.status === 'resolved' ? 'success' : 'pending'}">
                      ${alert.status === 'investigating' ? '处理中' : alert.status === 'resolved' ? '已解决' : '误报'}
                    </span>
                    ${alert.status === 'investigating' ? `
                      <div class="flex gap-1">
                        <button class="btn btn-sm btn-success" onclick="markAlertResolved('${alert.id}')">标记解决</button>
                        <button class="btn btn-sm btn-secondary" onclick="markAlertFalsePositive('${alert.id}')">误报</button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="block-card">
            <div class="block-header">
              <span class="font-medium text-white">加密计算状态</span>
            </div>
            <div class="p-4 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-700/30 rounded-lg p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="status-indicator healthy"></div>
                    <span class="text-sm text-white">硬件加密模块</span>
                  </div>
                  <div class="text-xs text-slate-400">HSM-001, HSM-002, HSM-003 均在线</div>
                </div>
                <div class="bg-slate-700/30 rounded-lg p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="status-indicator healthy"></div>
                    <span class="text-sm text-white">密钥管理</span>
                  </div>
                  <div class="text-xs text-slate-400">上次轮换: ${new Date(state.security.lastKeyRotation).toLocaleString('zh-CN')}</div>
                </div>
              </div>
              <div class="space-y-2">
                <div class="text-sm text-slate-400 mb-2">加密算法使用情况</div>
                <div class="space-y-2">
                  ${[
                    { name: 'AES-256', usage: 85 },
                    { name: '国密SM4', usage: 62 },
                    { name: '国密SM9', usage: 45 },
                    { name: 'RSA-2048', usage: 78 }
                  ].map(item => `
                    <div class="flex items-center gap-3">
                      <span class="text-xs text-white w-24">${item.name}</span>
                      <div class="flex-1 progress-bar">
                        <div class="progress-fill bg-bronze" style="width: ${item.usage}%"></div>
                      </div>
                      <span class="text-xs text-white w-10 text-right">${item.usage}%</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
          
          <div class="block-card">
            <div class="block-header">
              <span class="font-medium text-white">硬件隔离状态</span>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-3 gap-3">
                ${['计算域', '存储域', '网络域'].map((domain, i) => `
                  <div class="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div class="status-indicator healthy mx-auto mb-2"></div>
                    <div class="text-sm text-white">${domain}</div>
                    <div class="text-xs text-slate-400 mt-1">隔离正常</div>
                    <div class="text-[10px] text-emerald-400 mt-1">TEE/SGX 激活</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 暴露全局函数
  window.markAlertResolved = (alertId) => {
    const { updateAlertStatus } = require('./state/store.js');
    updateAlertStatus(alertId, 'resolved');
    showToast('告警已标记为已解决', 'success');
    renderSecurityMonitor();
  };
  
  window.markAlertFalsePositive = (alertId) => {
    const { updateAlertStatus } = require('./state/store.js');
    updateAlertStatus(alertId, 'false_positive');
    showToast('告警已标记为误报', 'info');
    renderSecurityMonitor();
  };
}

// ==========================================================================
// 数字藏品数据域
// ==========================================================================

function renderDataDomain() {
  const state = getState();
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="p-6 space-y-6">
      <div class="grid grid-cols-4 gap-4">
        <div class="metric-card">
          <div class="text-slate-400 text-sm">数据集总数</div>
          <div class="text-2xl font-bold text-white mt-1">${state.dataDomain.totalDatasets}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">总数据量</div>
          <div class="text-2xl font-bold text-amber-400 mt-1">${state.dataDomain.totalDataSize}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">授权合作方</div>
          <div class="text-2xl font-bold text-sky-400 mt-1">${state.dataDomain.authorizedPartners}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">训练任务</div>
          <div class="text-2xl font-bold text-emerald-400 mt-1">${state.dataDomain.trainingTasks.length}</div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-6">
        <div class="block-card">
          <div class="block-header">
            <span class="font-medium text-white">文化遗产数据集</span>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-2 gap-3">
              ${state.dataDomain.datasets.map(ds => `
                <div class="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div class="flex items-start justify-between mb-2">
                    <div class="text-sm font-medium text-white">${ds.name}</div>
                    ${renderStatusBadge(ds.sensitivity, 'sensitivity')}
                  </div>
                  <div class="text-xs text-slate-400 mb-2 font-mono">${ds.id}</div>
                  <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <div class="text-slate-500">数据量</div>
                      <div class="text-white">${formatNumber(ds.items)} 条</div>
                    </div>
                    <div>
                      <div class="text-slate-500">大小</div>
                      <div class="text-white">${ds.size}</div>
                    </div>
                    <div>
                      <div class="text-slate-500">加密</div>
                      <div class="text-white">${ds.encryption}</div>
                    </div>
                    <div>
                      <div class="text-slate-500">授权</div>
                      <div class="${ds.authorized ? 'text-emerald-400' : 'text-red-400'}">${ds.authorized ? '已授权' : '未授权'}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-slate-500">${ds.provider}</span>
                    <span class="status-badge ${ds.authorized ? 'success' : 'danger'}">${ds.authorized ? '可用' : '受限'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
        
        <div class="block-card">
          <div class="block-header">
            <span class="font-medium text-white">联邦训练任务</span>
          </div>
          <div class="p-4">
            <div class="space-y-4">
              ${state.dataDomain.trainingTasks.map(task => `
                <div class="bg-slate-700/30 rounded-lg p-4">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <div class="text-sm font-medium text-white">${task.name}</div>
                      <div class="text-xs text-slate-400 font-mono">${task.id}</div>
                    </div>
                    <span class="status-badge ${getTrainingStatusClass(task.status)}">${getTrainingStatusLabel(task.status)}</span>
                  </div>
                  <div class="mb-3">
                    <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>训练进度</span>
                      <span>${task.progress}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill ${task.status === 'training' ? 'progress-animated bg-sky-500' : task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}" 
                           style="width: ${task.progress}%"></div>
                    </div>
                  </div>
                  <div class="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div class="text-slate-500">参与节点</div>
                      <div class="text-white">${task.participants}</div>
                    </div>
                    <div>
                      <div class="text-slate-500">当前轮次</div>
                      <div class="text-white">${task.currentRound}/${task.rounds}</div>
                    </div>
                    <div>
                      <div class="text-slate-500">模型精度</div>
                      <div class="text-emerald-400">${task.accuracy}%</div>
                    </div>
                    <div>
                      <div class="text-slate-500">预计完成</div>
                      <div class="text-white">${task.estimatedCompletion}</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 自动重试启动
// ==========================================================================

function startPendingRetries() {
  const state = getState();
  const pendingTasks = state.anomalyTasks.filter(t => t.status === 'retry_pending');
  
  pendingTasks.forEach(task => {
    // 为每个待重试任务安排自动重试
    import('./state/fl-state.js').then(({ scheduleAutoRetry }) => {
      scheduleAutoRetry(task.id);
    });
  });
  
  console.log(`[App] 已为 ${pendingTasks.length} 个待重试任务安排自动重试`);
}
