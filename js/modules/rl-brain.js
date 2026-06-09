/**
 * 强化学习资源动态分配脑核心链路模块
 * 处理 RL 调度器状态、资源分配可视化、调度决策干预等交互逻辑
 */

import { getState, subscribe, updateRLPolicy, updateResourceAllocation, overrideRLDecision, showToast } from '../state/store.js';
import { renderStatusBadge } from '../components/status-badge.js';
import { formatNumber, formatPercent, getPolicyLabel, truncateText } from '../utils/format.js';

let selectedResourceType = 'compute';
let rewardChart = null;

export function initRLBrain() {
  subscribe('rlBrain', () => {
    renderRLBrain();
  });
  
  document.addEventListener('click', handleBrainClick);
  document.addEventListener('change', handleBrainChange);
  
  renderRLBrain();
  startRLSimulation();
}

function handleBrainClick(e) {
  // 切换资源类型
  if (e.target.closest('[data-resource-type]')) {
    selectedResourceType = e.target.closest('[data-resource-type]').dataset.resourceType;
    renderRLBrain();
    return;
  }
  
  // 切换策略
  if (e.target.closest('[data-action="change-policy"]')) {
    const policy = e.target.closest('[data-action="change-policy"]').dataset.policy;
    handleChangePolicy(policy);
    return;
  }
  
  // 覆盖决策
  if (e.target.closest('[data-action="override"]')) {
    const index = parseInt(e.target.closest('[data-action="override"]').dataset.index);
    handleOverrideDecision(index);
    return;
  }
  
  // 调整资源
  if (e.target.closest('[data-action="adjust-resource"]')) {
    const node = e.target.closest('[data-action="adjust-resource"]').dataset.node;
    const action = e.target.closest('[data-action="adjust-resource"]').dataset.adjust;
    handleAdjustResource(node, action);
    return;
  }
  
  // 重置调度器
  if (e.target.closest('[data-action="reset-scheduler"]')) {
    handleResetScheduler();
    return;
  }
  
  // 调整奖励权重
  if (e.target.closest('[data-action="adjust-reward"]')) {
    const type = e.target.closest('[data-action="adjust-reward"]').dataset.type;
    const value = parseFloat(e.target.closest('[data-action="adjust-reward"]').dataset.value);
    handleAdjustRewardWeight(type, value);
    return;
  }
}

function handleBrainChange(e) {
  // 策略选择
  if (e.target.id === 'policy-select') {
    handleChangePolicy(e.target.value);
  }
}

export function renderRLBrain() {
  const container = document.getElementById('rl-brain-container');
  if (!container) return;
  
  const state = getState();
  const rlBrain = state.rlBrain;
  
  container.innerHTML = `
    <div class="p-6 space-y-6">
      <!-- 脑核心状态概览 -->
      <div class="grid grid-cols-4 gap-4">
        <div class="metric-card">
          <div class="text-slate-400 text-sm">当前调度策略</div>
          <div class="text-xl font-bold text-sky-400 mt-1">${getPolicyLabel(rlBrain.currentPolicy)}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">探索率</div>
          <div class="text-xl font-bold text-amber-400 mt-1">${formatPercent(parseFloat(rlBrain.explorationRate) * 100)}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">累计奖励</div>
          <div class="text-xl font-bold text-emerald-400 mt-1">${rlBrain.totalReward}</div>
        </div>
        <div class="metric-card">
          <div class="text-slate-400 text-sm">已执行决策</div>
          <div class="text-xl font-bold text-white mt-1">${formatNumber(rlBrain.recentDecisions.length * 12)}</div>
        </div>
      </div>
      
      <!-- 主内容区 -->
      <div class="grid grid-cols-3 gap-6">
        <!-- 左侧：RL 调度器状态 -->
        <div class="col-span-1 space-y-6">
          <!-- 调度器核心 -->
          <div class="block-card">
            <div class="block-header">
              <div class="flex items-center gap-2">
                <div class="status-indicator healthy"></div>
                <span class="font-medium text-white">RL 调度器核心</span>
              </div>
              <span class="status-badge success">运行中</span>
            </div>
            <div class="p-4 space-y-4">
              <!-- 脑图式核心 -->
              <div class="relative h-48 flex items-center justify-center">
                <!-- 中枢 -->
                <div class="absolute w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/30 z-10">
                  <div class="text-center">
                    <div class="text-2xl">🧠</div>
                    <div class="text-[10px] text-white">RL Core</div>
                  </div>
                </div>
                <!-- 辐射节点 -->
                ${['算力', '带宽', '存储', '延迟', '成本'].map((label, i) => {
                  const angle = (i * 72 - 90) * Math.PI / 180;
                  const x = Math.cos(angle) * 80;
                  const y = Math.sin(angle) * 80;
                  return `
                    <div class="absolute w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-slate-300"
                         style="transform: translate(${x}px, ${y}px)">
                      ${label}
                    </div>
                    <div class="absolute w-[80px] h-px bg-gradient-to-r from-sky-500/50 to-transparent origin-left"
                         style="transform: translate(0, 0) rotate(${angle}rad)"></div>
                  `;
                }).join('')}
              </div>
              
              <!-- 策略选择 -->
              <div>
                <label class="block text-sm text-slate-400 mb-2">调度策略</label>
                <select id="policy-select" class="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option value="optimize_latency" ${rlBrain.currentPolicy === 'optimize_latency' ? 'selected' : ''}>延迟优先</option>
                  <option value="optimize_throughput" ${rlBrain.currentPolicy === 'optimize_throughput' ? 'selected' : ''}>吞吐量优先</option>
                  <option value="balance_load" ${rlBrain.currentPolicy === 'balance_load' ? 'selected' : ''}>负载均衡</option>
                  <option value="minimize_cost" ${rlBrain.currentPolicy === 'minimize_cost' ? 'selected' : ''}>成本优先</option>
                </select>
              </div>
              
              <!-- 奖励权重 -->
              <div>
                <label class="block text-sm text-slate-400 mb-2">奖励权重调整</label>
                <div class="space-y-2">
                  ${[
                    { label: '延迟', type: 'latency', value: 0.3 },
                    { label: '吞吐量', type: 'throughput', value: 0.25 },
                    { label: '公平性', type: 'fairness', value: 0.25 },
                    { label: '成本', type: 'cost', value: 0.2 }
                  ].map(item => `
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-slate-300">${item.label}</span>
                      <div class="flex items-center gap-1">
                        <button class="btn btn-icon btn-secondary text-xs" data-action="adjust-reward" data-type="${item.type}" data-value="-0.05">-</button>
                        <span class="w-12 text-center text-xs text-white">${(item.value * 100).toFixed(0)}%</span>
                        <button class="btn btn-icon btn-secondary text-xs" data-action="adjust-reward" data-type="${item.type}" data-value="0.05">+</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <button class="btn btn-secondary w-full" data-action="reset-scheduler">
                重置调度器
              </button>
            </div>
          </div>
          
          <!-- 奖励曲线 -->
          <div class="block-card">
            <div class="block-header">
              <span class="font-medium text-white">奖励趋势</span>
            </div>
            <div class="p-4">
              <div id="reward-chart" class="h-32 flex items-end gap-1">
                ${rlBrain.rewardHistory.map((val, i) => {
                  const min = Math.min(...rlBrain.rewardHistory);
                  const max = Math.max(...rlBrain.rewardHistory);
                  const height = max === min ? 50 : ((val - min) / (max - min)) * 100;
                  const isLast = i === rlBrain.rewardHistory.length - 1;
                  return `
                    <div class="flex-1 rounded-t transition-all duration-500 ${isLast ? 'bg-sky-500' : 'bg-sky-500/50'}" 
                         style="height: ${Math.max(10, height)}%"
                         title="${val}"></div>
                  `;
                }).join('')}
              </div>
              <div class="flex justify-between text-xs text-slate-400 mt-2">
                <span>历史</span>
                <span>当前: ${rlBrain.totalReward}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 中间：资源分配热力图 -->
        <div class="col-span-1">
          <div class="block-card h-full">
            <div class="block-header">
              <span class="font-medium text-white">资源分配热力图</span>
            </div>
            <div class="p-4 space-y-4">
              <!-- 资源类型切换 -->
              <div class="flex gap-2">
                ${[
                  { key: 'compute', label: '算力' },
                  { key: 'bandwidth', label: '带宽' },
                  { key: 'storage', label: '存储' }
                ].map(item => `
                  <button class="flex-1 btn btn-sm ${selectedResourceType === item.key ? 'btn-primary' : 'btn-secondary'}"
                          data-resource-type="${item.key}">
                    ${item.label}
                  </button>
                `).join('')}
              </div>
              
              <!-- 热力图 -->
              <div class="grid grid-cols-5 gap-2">
                ${Object.entries(rlBrain.resourceAllocation[selectedResourceType]).map(([node, value]) => {
                  const intensity = value / 35;
                  const color = selectedResourceType === 'compute' ? 'sky' : 
                                selectedResourceType === 'bandwidth' ? 'emerald' : 'amber';
                  return `
                    <div class="text-center">
                      <div class="heatmap-cell mb-1"
                           style="background-color: rgba(${selectedResourceType === 'compute' ? '14, 165, 233' : selectedResourceType === 'bandwidth' ? '16, 185, 129' : '245, 158, 11'}, ${intensity})"
                           title="${node}: ${value}%">
                      </div>
                      <div class="text-[10px] text-slate-400">${node.replace('节点-', '')}</div>
                      <div class="text-xs font-medium text-white">${value}%</div>
                      <div class="flex gap-1 justify-center mt-1">
                        <button class="btn btn-icon btn-secondary text-[10px] w-5 h-5 p-0" 
                                data-action="adjust-resource" data-node="${node}" data-adjust="down">-</button>
                        <button class="btn btn-icon btn-secondary text-[10px] w-5 h-5 p-0" 
                                data-action="adjust-resource" data-node="${node}" data-adjust="up">+</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <!-- 图例 -->
              <div class="flex items-center justify-center gap-4 pt-4 border-t border-slate-700">
                <div class="flex items-center gap-1">
                  <div class="w-4 h-4 rounded" style="background-color: rgba(14, 165, 233, 0.2)"></div>
                  <span class="text-xs text-slate-400">低</span>
                </div>
                <div class="w-24 h-2 rounded bg-gradient-to-r from-sky-500/20 via-sky-500/60 to-sky-500"></div>
                <div class="flex items-center gap-1">
                  <span class="text-xs text-slate-400">高</span>
                  <div class="w-4 h-4 rounded bg-sky-500"></div>
                </div>
              </div>
              
              <!-- 资源分配详情 -->
              <div class="space-y-2 pt-4 border-t border-slate-700">
                <div class="text-sm text-slate-400 mb-2">分配详情</div>
                ${Object.entries(rlBrain.resourceAllocation[selectedResourceType]).map(([node, value]) => `
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-300 w-20">${node}</span>
                    <div class="flex-1 progress-bar">
                      <div class="progress-fill bg-${selectedResourceType === 'compute' ? 'sky' : selectedResourceType === 'bandwidth' ? 'emerald' : 'amber'}-500" 
                           style="width: ${value}%"></div>
                    </div>
                    <span class="text-xs text-white w-10 text-right">${value}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧：调度决策日志 -->
        <div class="col-span-1">
          <div class="block-card h-full">
            <div class="block-header">
              <span class="font-medium text-white">调度决策日志</span>
              <span class="status-badge info">最近 ${rlBrain.recentDecisions.length} 条</span>
            </div>
            <div class="p-4">
              <div class="space-y-3 max-h-[500px] overflow-y-auto">
                ${rlBrain.recentDecisions.map((decision, index) => `
                  <div class="bg-slate-700/30 rounded-lg p-3 ${decision.overridden ? 'opacity-50' : ''}">
                    <div class="flex items-start justify-between mb-2">
                      <span class="text-xs text-slate-400">${decision.time}</span>
                      <span class="status-badge success text-[10px]">${decision.reward}</span>
                    </div>
                    <div class="text-sm text-white mb-1">${decision.action}</div>
                    <div class="text-xs text-slate-400 mb-2">${decision.reason}</div>
                    ${decision.overridden ? `
                      <div class="text-xs text-amber-400">已被人工覆盖: ${decision.overrideAction}</div>
                    ` : `
                      <div class="flex gap-1">
                        <button class="btn btn-sm btn-secondary text-[10px]" 
                                data-action="override" data-index="${index}">
                          人工覆盖
                        </button>
                      </div>
                    `}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================================================
// 操作处理函数
// ==========================================================================

function handleChangePolicy(policy) {
  updateRLPolicy(policy);
  showToast(`调度策略已切换为: ${getPolicyLabel(policy)}`, 'success');
}

function handleOverrideDecision(index) {
  const decision = getState().rlBrain.recentDecisions[index];
  if (!decision) return;
  
  const overrideAction = prompt('请输入覆盖操作说明:', '保持当前资源分配不变');
  if (overrideAction !== null) {
    overrideRLDecision(index, overrideAction || '人工覆盖');
    showToast('决策已被人工覆盖', 'info');
  }
}

function handleAdjustResource(node, action) {
  const allocation = getState().rlBrain.resourceAllocation[selectedResourceType];
  if (!allocation[node]) return;
  
  const delta = action === 'up' ? 2 : -2;
  const newValue = Math.max(5, Math.min(40, allocation[node] + delta));
  
  updateResourceAllocation(selectedResourceType, node, newValue);
  showToast(`${node} ${selectedResourceType === 'compute' ? '算力' : selectedResourceType === 'bandwidth' ? '带宽' : '存储'}分配已调整为 ${newValue}%`, 'success');
}

function handleResetScheduler() {
  if (confirm('确定要重置 RL 调度器吗？这将清除所有历史决策数据。')) {
    const rlBrain = getState().rlBrain;
    rlBrain.totalReward = 700;
    rlBrain.rewardHistory = [700, 705, 710, 715, 720, 725];
    rlBrain.explorationRate = '0.15';
    rlBrain.recentDecisions.forEach(d => delete d.overridden);
    showToast('RL 调度器已重置', 'info');
    renderRLBrain();
  }
}

function handleAdjustRewardWeight(type, value) {
  showToast(`奖励权重 ${type} 已调整 ${value > 0 ? '+' : ''}${(value * 100).toFixed(0)}%`, 'info');
}

// ==========================================================================
// RL 模拟引擎
// ==========================================================================

function startRLSimulation() {
  // 每 10 秒模拟一次资源调整
  setInterval(() => {
    const rlBrain = getState().rlBrain;
    const nodes = Object.keys(rlBrain.resourceAllocation.compute);
    
    // 随机微调资源分配
    nodes.forEach(node => {
      ['compute', 'bandwidth', 'storage'].forEach(type => {
        const current = rlBrain.resourceAllocation[type][node];
        const change = Math.floor(Math.random() * 5) - 2;
        rlBrain.resourceAllocation[type][node] = Math.max(5, Math.min(40, current + change));
      });
    });
    
    // 更新奖励
    const rewardDelta = Math.floor(Math.random() * 6) - 2;
    rlBrain.totalReward = Math.round((rlBrain.totalReward + rewardDelta) * 10) / 10;
    rlBrain.rewardHistory.push(rlBrain.totalReward);
    if (rlBrain.rewardHistory.length > 20) {
      rlBrain.rewardHistory.shift();
    }
    
    renderRLBrain();
  }, 10000);
}
