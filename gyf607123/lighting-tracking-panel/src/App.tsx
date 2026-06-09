import { AppProvider } from './context/AppContext';
import { MainPanel } from './components/MainPanel';
import './App.css';

function App() {
  return (
    <AppProvider>
      <MainPanel />
    </AppProvider>
  );
}

export default App;
