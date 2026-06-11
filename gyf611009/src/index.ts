import { createApp } from './ui/app.js';

function bootstrap(): void {
  const root = document.getElementById('app');
  if (!root) {
    console.error('[wine-counter] #app 根节点不存在');
    return;
  }
  createApp(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
