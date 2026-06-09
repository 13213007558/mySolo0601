/**
 * 音视频转码流水线模块
 * 实现多模态音视频的秒级转码处理流水线
 */

import { getState, subscribe, startTranscoding, pauseTranscoding, retryTranscoding, showToast } from '../state/store.js';
import { formatDateTime, formatRelativeTime, getPriorityLabel } from '../utils/format.js';
import { renderStatusBadge, renderAvatar, renderPriorityBadge, renderTag } from '../components/status-badge.js';
import { openDrawer, confirmDialog } from '../components/modal.js';

let container = null;

/**
 * 初始化转码流水线模块
 */
export function initTranscodingPipeline(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  // 订阅状态变化
  subscribe('transcodingTasks', () => render());
  
  if (container) {
    render();
  }
}

/**
 * 渲染转码流水线
 */
export function render(containerElement) {
  if (containerElement) {
    container = containerElement;
  }
  
  if (!container) return;
  
  const state = getState();
  const tasks = state.transcodingTasks;
  const pipelineStages = state.pipelineStages;
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-100">音视频转码流水线</h2>
          <p class="text-slate-400 mt-1">支持多格式音视频的秒级转码处理，自动完成格式校验、编码转换和加密脱敏</p>
        </div>
        <button class="btn btn-primary" onclick="window.showNewTranscodingForm()">
          <span class="mr-2">+</span> 新建转码任务
        </button>
      </div>

      <!-- 流水线概览 -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-slate-100 mb-4">转码流水线</h3>
        <div class="flex items-center">
          ${pipelineStages.map((stage, index) => `
            <div class="pipeline-stage text-center">
              <div class="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                ${getStageIcon(stage.id)}
              </div>
              <div class="font-medium text-slate-200">${stage.name}</div>
              <div class="text-xs text-slate-500 mt-1">${stage.description}</div>
              <div class="mt-2 text-lg font-bold text-blue-400">
                ${getTasksInStage(tasks, stage.id)}
              </div>
            </div>
            ${index < pipelineStages.length - 1 ? `
              <div class="pipeline-connector ${isStageActive(tasks, stage.id) ? 'active' : ''}">
                <div class="text-center text-xs text-slate-500 mt-2">→</div>
              </div>
            ` : ''}
          `).join('')}
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-5 gap-4">
        <div class="card p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center text-xl">
              📋
            </div>
            <div>
              <div class="text-xl font-bold text-slate-100">${tasks.filter(t => t.status === 'queued').length}</div>
              <div class="text-xs text-slate-400">排队中</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div>
              <div class="text-xl font-bold text-slate-100">${tasks.filter(t => t.status === 'processing').length}</div>
              <div class="text-xs text-slate-400">处理中</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xl">
              ⏸️
            </div>
            <div>
              <div class="text-xl font-bold text-slate-100">${tasks.filter(t => t.status === 'paused').length}</div>
              <div class="text-xs text-slate-400">已暂停</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">
              ✅
            </div>
            <div>
              <div class="text-xl font-bold text-slate-100">${tasks.filter(t => t.status === 'completed').length}</div>
              <div class="text-xs text-slate-400">已完成</div>
            </div>
          </div>
        </div>
        <div class="card p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-xl">
              ❌
            </div>
            <div>
              <div class="text-xl font-bold text-slate-100">${tasks.filter(t => t.status === 'failed').length}</div>
              <div class="text-xs text-slate-400">失败</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="card">
        <div class="card-header">
          <h3 class="text-lg font-semibold text-slate-100">转码任务列表</h3>
          <div class="flex gap-3">
            <select id="transcode-status-filter" class="form-select w-32" onchange="window.filterTranscodingTasks()">
              <option value="all">全部状态</option>
              <option value="queued">排队中</option>
              <option value="processing">处理中</option>
              <option value="paused">已暂停</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
            <select id="transcode-type-filter" class="form-select w-32" onchange="window.filterTranscodingTasks()">
              <option value="all">全部类型</option>
              <option value="video">视频</option>
              <option value="audio">音频</option>
            </select>
          </div>
        </div>
        <div class="card-body p-0">
          <table class="data-table">
            <thead>
              <tr>
                <th>任务ID</th>
                <th>名称</th>
                <th>类型</th>
                <th>原始格式</th>
                <th>目标格式</th>
                <th>大小</th>
                <th>进度</th>
                <th>优先级</th>
                <th>状态</th>
                <th>创建者</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody id="transcode-table-body">
              ${renderTranscodingTableRows(tasks)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * 获取阶段图标
 */
function getStageIcon(stageId) {
  const icons = {
    upload: '📤',
    validate: '✅',
    extract: '📦',
    transcode: '🔄',
    encrypt: '🔒',
    deliver: '📥'
  };
  return icons[stageId] || '📋';
}

/**
 * 获取某阶段的任务数
 */
function getTasksInStage(tasks, stageId) {
  const stageIndex = ['upload', 'validate', 'extract', 'transcode', 'encrypt', 'deliver'].indexOf(stageId);
  return tasks.filter(t => {
    if (t.status === 'queued') return stageId === 'upload';
    if (t.status === 'completed') return stageId === 'deliver';
    if (t.status === 'failed') return false;
    if (t.status === 'paused') {
      const currentIndex = Math.floor(t.progress / 20);
      return currentIndex === stageIndex;
    }
    if (t.status === 'processing') {
      const currentIndex = Math.floor(t.progress / 20);
      return currentIndex === stageIndex;
    }
    return false;
  }).length;
}

/**
 * 检查阶段是否活跃
 */
function isStageActive(tasks, stageId) {
  return tasks.some(t => {
    if (t.status !== 'processing') return false;
    const currentIndex = Math.floor(t.progress / 20);
    const stageIndex = ['upload', 'validate', 'extract', 'transcode', 'encrypt', 'deliver'].indexOf(stageId);
    return currentIndex === stageIndex;
  });
}

/**
 * 渲染转码表格行
 */
function renderTranscodingTableRows(tasks) {
  if (!tasks || tasks.length === 0) {
    return `
      <tr>
        <td colspan="12" class="text-center py-12 text-slate-500">
          暂无转码任务
        </td>
      </tr>
    `;
  }

  return tasks.map(task => {
    const priority = getPriorityLabel(task.priority);
    
    return `
      <tr class="cursor-pointer hover:bg-slate-800/50 transition-colors" onclick="window.viewTranscodingDetail('${task.id}')">
        <td class="font-mono text-xs text-blue-400">${task.id}</td>
        <td class="font-medium text-slate-200">${task.name}</td>
        <td>${renderTag(task.mediaType === 'video' ? '视频' : '音频', task.mediaType === 'video' ? 'purple' : 'cyan')}</td>
        <td class="text-slate-400">${task.originalFormat}</td>
        <td class="text-slate-400">
          <div class="flex flex-wrap gap-1">
            ${task.targetFormats.map(f => `<span class="text-xs bg-slate-700 px-1.5 py-0.5 rounded">${f}</span>`).join('')}
          </div>
        </td>
        <td class="text-slate-400">${task.sourceSize}</td>
        <td class="w-40">
          <div class="flex items-center gap-2">
            <div class="flex-1 progress-bar">
              <div class="progress-fill ${task.status === 'failed' ? '!bg-red-500' : ''}" style="width: ${task.progress}%"></div>
            </div>
            <span class="text-xs text-slate-400 w-10">${task.progress}%</span>
          </div>
        </td>
        <td>${renderPriorityBadge(task.priority, 'sm')}</td>
        <td>${renderStatusBadge(task.status, 'sm')}</td>
        <td>
          <div class="flex items-center gap-2">
            ${renderAvatar(task.createdBy, 'sm')}
            <span class="text-sm text-slate-300">${task.createdBy.name}</span>
          </div>
        </td>
        <td class="text-slate-400 text-xs">${formatRelativeTime(task.createdAt)}</td>
        <td>
          <div class="flex gap-1">
            ${task.status === 'queued' || task.status === 'paused' ? `
              <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); window.startTranscodingTask('${task.id}')" title="开始">
                ▶
              </button>
            ` : ''}
            ${task.status === 'processing' ? `
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.pauseTranscodingTask('${task.id}')" title="暂停">
                ⏸
              </button>
            ` : ''}
            ${task.status === 'failed' ? `
              <button class="btn btn-warning btn-sm" onclick="event.stopPropagation(); window.retryTranscodingTask('${task.id}')" title="重试">
                ↻
              </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); window.viewTranscodingDetail('${task.id}')" title="详情">
              ☰
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * 查看转码任务详情
 */
export function viewTranscodingDetail(taskId) {
  const state = getState();
  const task = state.transcodingTasks.find(t => t.id === taskId);
  
  if (!task) {
    showToast('任务不存在', 'error');
    return;
  }

  const content = `
    <div class="space-y-6">
      <!-- 基本信息 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-400">任务ID</label>
          <div class="font-mono text-blue-400 mt-1">${task.id}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">状态</label>
          <div class="mt-1">${renderStatusBadge(task.status)}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">任务名称</label>
          <div class="font-medium text-slate-200 mt-1">${task.name}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">媒体类型</label>
          <div class="mt-1">${renderTag(task.mediaType === 'video' ? '视频' : '音频', task.mediaType === 'video' ? 'purple' : 'cyan')}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">原始格式</label>
          <div class="text-slate-300 mt-1">${task.originalFormat}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">分辨率</label>
          <div class="text-slate-300 mt-1">${task.resolution}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">时长</label>
          <div class="text-slate-300 mt-1">${task.duration}</div>
        </div>
        <div>
          <label class="text-sm text-slate-400">源文件大小</label>
          <div class="text-slate-300 mt-1">${task.sourceSize}</div>
        </div>
      </div>

      <!-- 目标格式 -->
      <div>
        <label class="text-sm text-slate-400 block mb-2">目标格式</label>
        <div class="flex flex-wrap gap-2">
          ${task.targetFormats.map(f => `
            <span class="bg-slate-700 px-3 py-1.5 rounded-lg text-sm text-slate-300">${f}</span>
          `).join('')}
        </div>
      </div>

      <!-- 转码进度 -->
      <div class="bg-slate-900/50 rounded-xl p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm text-slate-400">转码进度</span>
          <span class="text-sm font-medium text-slate-200">${task.progress}%</span>
        </div>
        <div class="progress-bar h-4">
          <div class="progress-fill ${task.status === 'failed' ? '!bg-red-500' : ''}" style="width: ${task.progress}%"></div>
        </div>
        ${task.status === 'processing' ? `
          <div class="flex items-center justify-between mt-3 text-sm">
            <span class="text-slate-400">处理速度：${task.speed}</span>
            <span class="text-slate-400">预计剩余：${task.estimatedTime}</span>
          </div>
        ` : ''}
        ${task.status === 'failed' ? `
          <div class="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div class="text-red-400 text-sm">
              <span class="font-medium">错误信息：</span>${task.error}
            </div>
          </div>
        ` : ''}
        ${task.status === 'completed' ? `
          <div class="mt-3 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-400">输出路径</span>
              <span class="text-emerald-400 font-mono text-xs">${task.outputPath}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-400">校验和</span>
              <span class="text-slate-400 font-mono text-xs">${task.checksum}</span>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- 时间信息 -->
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="text-sm text-slate-400">创建时间</label>
          <div class="text-slate-300 mt-1 text-sm">${formatDateTime(task.createdAt)}</div>
        </div>
        ${task.startedAt ? `
          <div>
            <label class="text-sm text-slate-400">开始时间</label>
            <div class="text-slate-300 mt-1 text-sm">${formatDateTime(task.startedAt)}</div>
          </div>
        ` : ''}
        ${task.completedAt ? `
          <div>
            <label class="text-sm text-slate-400">完成时间</label>
            <div class="text-slate-300 mt-1 text-sm">${formatDateTime(task.completedAt)}</div>
          </div>
        ` : ''}
      </div>

      <!-- 创建者信息 -->
      <div>
        <label class="text-sm text-slate-400 block mb-2">创建者</label>
        <div class="flex items-center gap-3">
          ${renderAvatar(task.createdBy, 'lg')}
          <div>
            <div class="font-medium text-slate-200">${task.createdBy.name}</div>
            <div class="text-sm text-slate-400">${task.createdBy.department}</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 pt-4 border-t border-slate-700">
        ${task.status === 'queued' || task.status === 'paused' ? `
          <button class="btn btn-primary flex-1" onclick="window.startTranscodingTask('${task.id}'); window.closeDrawer();">
            开始转码
          </button>
        ` : ''}
        ${task.status === 'processing' ? `
          <button class="btn btn-warning flex-1" onclick="window.pauseTranscodingTask('${task.id}'); window.closeDrawer();">
            暂停转码
          </button>
        ` : ''}
        ${task.status === 'failed' ? `
          <button class="btn btn-warning flex-1" onclick="window.retryTranscodingTask('${task.id}'); window.closeDrawer();">
            重新转码
          </button>
        ` : ''}
        <button class="btn btn-secondary" onclick="window.closeDrawer()">
          关闭
        </button>
      </div>
    </div>
  `;

  openDrawer(content, {
    title: `转码详情 - ${task.name}`,
    width: 'max-w-2xl'
  });
}

/**
 * 开始转码任务
 */
export function startTranscodingTask(taskId) {
  startTranscoding(taskId);
}

/**
 * 暂停转码任务
 */
export function pauseTranscodingTask(taskId) {
  pauseTranscoding(taskId);
}

/**
 * 重试转码任务
 */
export function retryTranscodingTask(taskId) {
  retryTranscoding(taskId);
}

/**
 * 筛选转码任务
 */
export function filterTranscodingTasks() {
  const state = getState();
  const statusFilter = document.getElementById('transcode-status-filter')?.value || 'all';
  const typeFilter = document.getElementById('transcode-type-filter')?.value || 'all';
  
  let filtered = [...state.transcodingTasks];
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  
  if (typeFilter !== 'all') {
    filtered = filtered.filter(t => t.mediaType === typeFilter);
  }
  
  const tbody = document.getElementById('transcode-table-body');
  if (tbody) {
    tbody.innerHTML = renderTranscodingTableRows(filtered);
  }
}

/**
 * 显示新建转码任务表单
 */
export function showNewTranscodingForm() {
  const state = getState();
  const projects = state.projects;
  
  const content = `
    <form id="new-transcoding-form" class="space-y-4">
      <div>
        <label class="form-label">任务名称 *</label>
        <input type="text" name="name" class="form-input" placeholder="请输入转码任务名称" required>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="form-label">媒体类型 *</label>
          <select name="mediaType" class="form-select" required>
            <option value="video">视频</option>
            <option value="audio">音频</option>
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
        <label class="form-label">所属项目</label>
        <select name="projectId" class="form-select">
          <option value="">请选择项目</option>
          ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
      </div>
      
      <div>
        <label class="form-label">源文件模拟</label>
        <div class="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <div class="text-4xl mb-2">📁</div>
          <div class="text-slate-400 mb-2">点击或拖拽文件到此处</div>
          <div class="text-xs text-slate-500">支持 MP4, AVI, MOV, WAV, MP3 等格式（模拟）</div>
          <input type="hidden" name="sourceSize" value="${(Math.random() * 5 + 1).toFixed(1)} GB">
          <input type="hidden" name="originalFormat" value="${['MP4', 'AVI', 'MOV', 'WAV', 'MP3'][Math.floor(Math.random() * 5)]}">
          <input type="hidden" name="duration" value="${Math.floor(Math.random() * 120) + 30}分钟">
          <input type="hidden" name="resolution" value="${['4K', '1080P', '720P', '高清'][Math.floor(Math.random() * 4)]}">
        </div>
      </div>
      
      <div>
        <label class="form-label">目标格式 *</label>
        <div class="grid grid-cols-3 gap-2">
          ${['MP4 (H.264)', 'MP4 (H.265)', 'WebM', 'OGG', '音频提取', 'GIF动图'].map((format, index) => `
            <label class="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <input type="checkbox" name="targetFormats" value="${format}" ${index < 2 ? 'checked' : ''} class="rounded">
              <span class="text-sm text-slate-300">${format}</span>
            </label>
          `).join('')}
        </div>
      </div>
      
      <div>
        <label class="form-label">转码设置</label>
        <div class="space-y-3">
          <label class="flex items-center gap-2">
            <input type="checkbox" name="encrypt" checked class="rounded">
            <span class="text-sm text-slate-300">自动加密脱敏</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" name="watermark" class="rounded">
            <span class="text-sm text-slate-300">添加水印</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" name="thumbnail" checked class="rounded">
            <span class="text-sm text-slate-300">生成缩略图</span>
          </label>
        </div>
      </div>
      
      <div class="flex gap-3 pt-4">
        <button type="button" class="btn btn-secondary flex-1" onclick="window.closeModal()">取消</button>
        <button type="submit" class="btn btn-primary flex-1">创建转码任务</button>
      </div>
    </form>
  `;

  // 使用模态框而不是抽屉
  const modal = document.createElement('div');
  modal.id = 'new-transcoding-modal';
  modal.className = 'modal open';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="window.closeNewTranscodingModal()"></div>
    <div class="modal-content max-w-xl">
      <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-slate-100">新建转码任务</h3>
        <button onclick="window.closeNewTranscodingModal()" class="text-slate-400 hover:text-slate-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="p-6 max-h-[80vh] overflow-y-auto">
        ${content}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // 绑定表单提交
  setTimeout(() => {
    const form = document.getElementById('new-transcoding-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        handleNewTranscodingSubmit(form);
      };
    }
  }, 100);
}

/**
 * 处理新建转码任务提交
 */
function handleNewTranscodingSubmit(form) {
  const formData = new FormData(form);
  const name = formData.get('name');
  const mediaType = formData.get('mediaType');
  const priority = formData.get('priority');
  const targetFormats = formData.getAll('targetFormats');
  
  if (!name || targetFormats.length === 0) {
    showToast('请填写完整信息', 'warning');
    return;
  }

  const state = getState();
  const newTask = {
    id: `trans-${String(state.transcodingTasks.length + 1).padStart(5, '0')}`,
    name,
    mediaType,
    originalFormat: formData.get('originalFormat') || 'MP4',
    targetFormats,
    resolution: formData.get('resolution') || '1080P',
    duration: formData.get('duration') || '60分钟',
    sourceSize: formData.get('sourceSize') || '2.5 GB',
    status: 'queued',
    statusName: '排队中',
    progress: 0,
    currentStage: 'upload',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    estimatedTime: null,
    createdBy: state.currentUser,
    priority,
    speed: null,
    error: null,
    outputPath: null,
    checksum: null
  };

  state.transcodingTasks.unshift(newTask);
  showToast('转码任务创建成功，已加入队列', 'success');
  closeNewTranscodingModal();
  render();
}

/**
 * 关闭新建转码任务模态框
 */
export function closeNewTranscodingModal() {
  const modal = document.getElementById('new-transcoding-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}

// 暴露到全局
window.viewTranscodingDetail = viewTranscodingDetail;
window.startTranscodingTask = startTranscodingTask;
window.pauseTranscodingTask = pauseTranscodingTask;
window.retryTranscodingTask = retryTranscodingTask;
window.filterTranscodingTasks = filterTranscodingTasks;
window.showNewTranscodingForm = showNewTranscodingForm;
window.closeNewTranscodingModal = closeNewTranscodingModal;
