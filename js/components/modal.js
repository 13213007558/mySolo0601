/**
 * 模态框和抽屉组件
 */

/**
 * 打开模态框
 * @param {string} content - 模态框内容 HTML
 * @param {Object} options - 配置选项
 */
export function openModal(content, options = {}) {
  const {
    title = '',
    width = 'max-w-2xl',
    onClose = null,
    closable = true
  } = options;

  // 移除已存在的模态框
  closeModal();

  const modal = document.createElement('div');
  modal.id = 'app-modal';
  modal.className = 'modal open';
  modal.innerHTML = `
    <div class="modal-backdrop" ${closable ? 'onclick="window.closeModal()"' : ''}></div>
    <div class="modal-content ${width}">
      ${title ? `
        <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-100">${title}</h3>
          ${closable ? `
            <button onclick="window.closeModal()" class="text-slate-400 hover:text-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          ` : ''}
        </div>
      ` : ''}
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
        ${content}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // 保存关闭回调
  if (onClose) {
    modal._onClose = onClose;
  }

  // 阻止背景滚动
  document.body.style.overflow = 'hidden';
}

/**
 * 关闭模态框
 */
export function closeModal() {
  const modal = document.getElementById('app-modal');
  if (modal) {
    // 调用关闭回调
    if (modal._onClose) {
      modal._onClose();
    }
    
    modal.classList.remove('open');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}

/**
 * 打开抽屉
 * @param {string} content - 抽屉内容 HTML
 * @param {Object} options - 配置选项
 */
export function openDrawer(content, options = {}) {
  const {
    title = '',
    width = 'max-w-2xl',
    onClose = null,
    closable = true
  } = options;

  // 移除已存在的抽屉
  closeDrawer();

  // 创建遮罩
  const backdrop = document.createElement('div');
  backdrop.id = 'drawer-backdrop';
  backdrop.className = 'drawer-backdrop open';
  if (closable) {
    backdrop.onclick = closeDrawer;
  }

  // 创建抽屉
  const drawer = document.createElement('div');
  drawer.id = 'app-drawer';
  drawer.className = `drawer open ${width}`;
  drawer.innerHTML = `
    <div class="h-full flex flex-col">
      ${title ? `
        <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-100">${title}</h3>
          ${closable ? `
            <button onclick="window.closeDrawer()" class="text-slate-400 hover:text-slate-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          ` : ''}
        </div>
      ` : ''}
      <div class="flex-1 overflow-y-auto p-6">
        ${content}
      </div>
    </div>
  `;

  // 保存关闭回调
  if (onClose) {
    drawer._onClose = onClose;
  }

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  // 阻止背景滚动
  document.body.style.overflow = 'hidden';
}

/**
 * 关闭抽屉
 */
export function closeDrawer() {
  const drawer = document.getElementById('app-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  
  if (drawer) {
    // 调用关闭回调
    if (drawer._onClose) {
      drawer._onClose();
    }
    
    drawer.classList.remove('open');
  }
  
  if (backdrop) {
    backdrop.classList.remove('open');
  }

  setTimeout(() => {
    drawer?.remove();
    backdrop?.remove();
    document.body.style.overflow = '';
  }, 300);
}

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @param {Object} options - 配置选项
 */
export function confirmDialog(message, options = {}) {
  const {
    title = '确认操作',
    confirmText = '确认',
    cancelText = '取消',
    type = 'info' // info, warning, danger
  } = options;

  return new Promise((resolve) => {
    const typeColors = {
      info: 'bg-blue-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500'
    };

    const typeIcons = {
      info: 'ℹ️',
      warning: '⚠️',
      danger: '❌'
    };

    const content = `
      <div class="text-center">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full ${typeColors[type]}/20 flex items-center justify-center text-3xl">
          ${typeIcons[type]}
        </div>
        <p class="text-slate-300 mb-6">${message}</p>
        <div class="flex gap-3 justify-center">
          <button onclick="window._confirmResult(false)" class="btn btn-secondary px-6">
            ${cancelText}
          </button>
          <button onclick="window._confirmResult(true)" class="btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'} px-6">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    window._confirmResult = (result) => {
      closeModal();
      delete window._confirmResult;
      resolve(result);
    };

    openModal(content, {
      title,
      closable: false
    });
  });
}

// 暴露到全局
window.openModal = openModal;
window.closeModal = closeModal;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.confirmDialog = confirmDialog;
