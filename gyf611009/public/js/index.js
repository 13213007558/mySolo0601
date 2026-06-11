import { createApp } from './ui/app.js';
function bootstrap() {
    const root = document.getElementById('app');
    if (!root) {
        console.error('[wine-counter] #app 根节点不存在');
        return;
    }
    createApp(root);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
}
else {
    bootstrap();
}
//# sourceMappingURL=index.js.map