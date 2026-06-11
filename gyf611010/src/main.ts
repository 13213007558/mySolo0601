import './style.css';
import './app.ts';

const appContainer = document.querySelector<HTMLDivElement>('#app');
if (appContainer) {
  appContainer.innerHTML = '<cheese-app></cheese-app>';
}
