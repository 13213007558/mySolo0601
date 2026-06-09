import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCards from '@/components/StatCards';
import ValveTable from '@/components/ValveTable';
import TrendChart from '@/components/TrendChart';
import ContractPanel from '@/components/ContractPanel';
import EditRecordModal from '@/components/EditRecordModal';
import ManualRecordModal from '@/components/ManualRecordModal';
import UndoModal from '@/components/UndoModal';
import AnomalyFeedback from '@/components/AnomalyFeedback';
import { useValveStore } from '@/store/valveStore';
import { useViewStore } from '@/store/viewStore';
import { useAuditStore } from '@/store/auditStore';

export default function DutyView() {
  const {
    showEditModal,
    showManualModal,
    showContractPanel,
    records,
    filteredRecords,
    contracts,
  } = useValveStore();

  const { anomalyState } = useViewStore();
  const { showUndoModal } = useAuditStore();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-6 py-6">
        <div className={`transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <StatCards />

          {anomalyState === 'chart_not_sync' && (
            <div className="mb-4">
              <AnomalyFeedback type="chart_not_sync" />
            </div>
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className={`transition-all duration-300 ${showContractPanel ? 'col-span-8' : 'col-span-12'}`}>
              <div className="mb-6">
                <ValveTable />
              </div>

              <div className="mb-6">
                <TrendChart />
              </div>
            </div>

            {showContractPanel && (
              <div className="col-span-4">
                <ContractPanel />
              </div>
            )}
          </div>
        </div>
      </main>

      {showEditModal && <EditRecordModal />}
      {showManualModal && <ManualRecordModal />}
      {showUndoModal && <UndoModal />}
    </div>
  );
}
