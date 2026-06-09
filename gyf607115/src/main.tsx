import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAlarmStore } from './stores/useAlarmStore';

function AppInitializer() {
  const initData = useAlarmStore((state) => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>
);
