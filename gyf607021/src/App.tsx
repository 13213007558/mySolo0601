import { StoreProvider } from './store';
import ScheduleBoard from './components/ScheduleBoard';

export default function App() {
  return (
    <StoreProvider>
      <ScheduleBoard />
    </StoreProvider>
  );
}
