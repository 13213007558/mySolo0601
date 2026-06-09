import { ActionBar } from '@/components/ActionBar';
import { FilterPanel } from '@/components/FilterPanel';
import { ForecastChart } from '@/components/ForecastChart';
import { DataTable } from '@/components/DataTable';
import { DetailModal } from '@/components/DetailModal';
import { WithdrawModal } from '@/components/WithdrawModal';
import { ReviseModal } from '@/components/ReviseModal';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100">
      <ActionBar />
      <FilterPanel />
      <div className="pb-6">
        <ForecastChart />
        <DataTable />
      </div>
      <DetailModal />
      <WithdrawModal />
      <ReviseModal />
    </div>
  );
}
