import React, { useEffect } from 'react';
import { useRecordStore } from '../store/useRecordStore';
import { ActionBar } from '../components/ActionBar';
import { FilterPanel } from '../components/FilterPanel';
import { CrossDayAlert } from '../components/CrossDayAlert';
import { RecordTable } from '../components/RecordTable';
import { ReviewPanel } from '../components/ReviewPanel';
import { ManualEntryModal } from '../components/ManualEntryModal';
import { SampleSelector } from '../components/SampleSelector';

export default function Home() {
  const { currentView, refreshAlerts, records } = useRecordStore();

  useEffect(() => {
    if (records.length > 0) {
      refreshAlerts();
    }
  }, [records.length]);

  return (
    <div className="min-h-screen flex flex-col">
      <ActionBar />
      <FilterPanel />
      <CrossDayAlert />
      
      <main className="flex-1 overflow-auto">
        {currentView === 'main' ? (
          <RecordTable />
        ) : (
          <ReviewPanel />
        )}
      </main>

      <footer className="py-3 px-4 text-center text-xs text-gray-500 border-t border-bgdark-700 bg-bgdark-800/50">
        能源充电枪复核台 · 数据仅存储在本地浏览器 · 
        <span className="ml-2 font-mono">v1.0.0</span>
      </footer>

      <ManualEntryModal />
      <SampleSelector />
    </div>
  );
}
