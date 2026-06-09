import { useEffect } from 'react';
import DutyView from './DutyView';
import ReviewView from './ReviewView';
import { useViewStore } from '@/store/viewStore';
import { useValveStore } from '@/store/valveStore';

export default function Home() {
  const { currentView, filters, searchKeyword } = useViewStore();
  const { init, applyFilters } = useValveStore();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    applyFilters(filters, searchKeyword);
  }, [filters, searchKeyword, applyFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'duty' ? <DutyView /> : <ReviewView />}
    </div>
  );
}
