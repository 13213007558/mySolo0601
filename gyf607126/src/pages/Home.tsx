import { useState, useEffect, useRef } from 'react';
import { useContractStore } from '../store/contractStore';
import { EmptyStateType } from '../types/contract';
import { Header } from '../components/Header';
import { StatsCards } from '../components/StatsCards';
import { ContractChart } from '../components/ContractChart';
import { FilterBar } from '../components/FilterBar';
import { ContractTable } from '../components/ContractTable';
import { BatchActions } from '../components/BatchActions';
import { ContractDetail } from '../components/ContractDetail';
import { DiffCompare } from '../components/DiffCompare';
import { SupplementForm } from '../components/SupplementForm';
import { EmptyState } from '../components/EmptyState';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function Home() {
  const initializeData = useContractStore((state) => state.initializeData);
  const contracts = useContractStore((state) => state.contracts);
  const isDataLoaded = useContractStore((state) => state.isDataLoaded);
  const isCorrupted = useContractStore((state) => state.isCorrupted);
  const getFilteredContracts = useContractStore((state) => state.getFilteredContracts);
  const resetToMock = useContractStore((state) => state.resetToMock);
  const resetFilters = useContractStore((state) => state.resetFilters);
  const filters = useContractStore((state) => state.filters);
  const validateAll = useContractStore((state) => state.validateAll);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [showSupplement, setShowSupplement] = useState(false);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hasValidated = useRef(false);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (contracts.length > 0 && !hasValidated.current) {
      hasValidated.current = true;
      validateAll();
    }
  }, [contracts.length, validateAll]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleViewDetail = (id: string) => {
    setDetailId(id);
  };

  const handleCompare = (id1: string, id2: string) => {
    setDetailId(null);
    setCompareIds([id1, id2]);
  };

  const handleSupplementSuccess = (id: string) => {
    setShowSupplement(false);
    showNotification('success', '补录合同已成功保存');
    const original = contracts.find((c) => c.contractNo === 'SD-2026-003');
    if (original) {
      setTimeout(() => {
        setCompareIds([original.id, id]);
      }, 500);
    }
  };

  const getEmptyStateType = (): EmptyStateType | null => {
    if (isCorrupted) return 'corrupted';
    if (!isDataLoaded || contracts.length === 0) return 'no_import';
    
    const filtered = getFilteredContracts();
    if (filtered.length === 0) {
      const hasActiveFilters = filters.status || filters.customerManager || filters.hasAnomaly !== null || filters.dateRange || filters.searchKeyword;
      return hasActiveFilters ? 'filtered_empty' : 'no_data';
    }
    return null;
  };

  const emptyStateType = getEmptyStateType();
  const filteredCount = getFilteredContracts().length;
  const hasActiveFilters = filters.status || filters.customerManager || filters.hasAnomaly !== null || filters.dateRange || filters.searchKeyword;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header onOpenSupplement={() => setShowSupplement(true)} />

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {notification && (
          <div className={`fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl animate-slide-up ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {emptyStateType === 'corrupted' && (
          <EmptyState
            type="corrupted"
            onAction={() => resetToMock()}
            onReset={() => setShowSupplement(true)}
          />
        )}

        {emptyStateType === 'no_import' && (
          <EmptyState
            type="no_import"
            onAction={() => setShowSupplement(true)}
            onReset={() => resetToMock()}
          />
        )}

        {emptyStateType === 'filtered_empty' && (
          <>
            <StatsCards />
            <ContractChart />
            <FilterBar />
            <EmptyState
              type="filtered_empty"
              onAction={() => resetFilters()}
            />
          </>
        )}

        {emptyStateType === 'no_data' && (
          <>
            <StatsCards />
            <ContractChart />
            <FilterBar />
            <EmptyState
              type="no_data"
              onAction={() => resetFilters()}
            />
          </>
        )}

        {!emptyStateType && (
          <>
            <StatsCards />
            <ContractChart />
            <FilterBar />

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-slate-500">
                显示 <span className="font-semibold text-slate-700">{filteredCount}</span> / {contracts.length} 条记录
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    已筛选
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                提示：点击表格单元格可直接编辑，勾选左侧复选框可批量操作
              </div>
            </div>

            <ContractTable onViewDetail={handleViewDetail} />
          </>
        )}
      </main>

      <BatchActions />

      {detailId && (
        <ContractDetail
          contractId={detailId}
          onClose={() => setDetailId(null)}
          onCompare={handleCompare}
        />
      )}

      {compareIds && (
        <DiffCompare
          id1={compareIds[0]}
          id2={compareIds[1]}
          onClose={() => setCompareIds(null)}
        />
      )}

      {showSupplement && (
        <SupplementForm
          onClose={() => setShowSupplement(false)}
          onSuccess={handleSupplementSuccess}
        />
      )}
    </div>
  );
}
