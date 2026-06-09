import { useState } from 'react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { DataOverview } from '@/components/DataOverview';
import { OperationToolbar } from '@/components/OperationToolbar';
import { AlarmCard } from '@/components/AlarmCard';
import { FilterPanel } from '@/components/FilterPanel';
import { AlarmDetailPanel } from '@/components/AlarmDetailPanel';
import { SupplementForm } from '@/components/SupplementForm';
import { DuplicateSiteModal } from '@/components/DuplicateSiteModal';
import type { Alarm } from '@/types';
import { Wind, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';

export const AlarmWall = () => {
  const { getFilteredAlarms, duplicateConflicts, clearDuplicateConflicts, selectAll, clearSelection, selectedIds } =
    useAlarmStore();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [showSupplement, setShowSupplement] = useState<Alarm | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAlarms = getFilteredAlarms();
  const sortedAlarms = [...filteredAlarms].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const handleCardClick = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
  };

  const handleCloseDetail = () => {
    setSelectedAlarm(null);
  };

  const handleOpenSupplement = () => {
    if (selectedAlarm) {
      setShowSupplement(selectedAlarm);
    }
  };

  const handleCloseSupplement = () => {
    setShowSupplement(null);
  };

  const handleCloseDuplicate = () => {
    clearDuplicateConflicts();
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-industrial-primary/20 rounded-lg">
              <Wind className="w-8 h-8 text-industrial-primaryLight" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-industrial-text font-mono">
                能源风机叶片告警墙
              </h1>
              <p className="text-industrial-textMuted text-sm">
                风机叶片缺陷检测告警全流程管理系统
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-industrial-warning animate-pulse" />
              <span className="text-xs text-industrial-warning">实时监控中</span>
            </div>
          </div>
        </header>

        <DataOverview />

        <OperationToolbar onFilterClick={() => setShowFilter(!showFilter)} />

        <FilterPanel isOpen={showFilter} onClose={() => setShowFilter(false)} />

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-industrial-textMuted">
            共 <span className="text-industrial-text font-medium">{sortedAlarms.length}</span> 条告警
            {selectedIds.length > 0 && (
              <span className="ml-2">
                已选择 <span className="text-industrial-primaryLight font-medium">{selectedIds.length}</span> 条
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="text-sm text-industrial-textMuted hover:text-industrial-text transition-colors"
              onClick={selectAll}
            >
              全选
            </button>
            <button
              className="text-sm text-industrial-textMuted hover:text-industrial-text transition-colors"
              onClick={clearSelection}
            >
              清除
            </button>
            <button
              className="flex items-center gap-1 text-sm text-industrial-textMuted hover:text-industrial-text transition-colors"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              按时间
              {sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {sortedAlarms.length === 0 ? (
          <div className="card-industrial text-center py-16">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-industrial-textMuted opacity-50" />
            <p className="text-industrial-textMuted">暂无符合条件的告警数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedAlarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onClick={() => handleCardClick(alarm)}
              />
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-industrial-warning/10 border border-industrial-warning/30 rounded-lg">
          <div className="flex items-center gap-2 text-industrial-warning mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">周顾问手工补录区</span>
          </div>
          <p className="text-sm text-industrial-textMuted mb-3">
            点击任意告警卡片，在详情面板中选择"周顾问手工补录标注"来添加叶片裂纹标注。
            补录后可在"补录差异"标签页查看补录前后差异。
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-industrial-warning/20 text-industrial-warning px-2 py-1 rounded">
              ✓ 支持补录叶片裂纹标注
            </span>
            <span className="text-xs bg-industrial-warning/20 text-industrial-warning px-2 py-1 rounded">
              ✓ 自动记录补录前后差异
            </span>
            <span className="text-xs bg-industrial-warning/20 text-industrial-warning px-2 py-1 rounded">
              ✓ 导出时包含补录信息
            </span>
            <span className="text-xs bg-industrial-warning/20 text-industrial-warning px-2 py-1 rounded">
              ✓ 支持读回验证数据完整性
            </span>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-industrial-textMuted">
          <p>© 2026 能源风机叶片告警管理系统 · 数据自动持久化至本地存储</p>
        </footer>
      </div>

      {selectedAlarm && (
        <AlarmDetailPanel
          alarm={selectedAlarm}
          onClose={handleCloseDetail}
          onOpenSupplement={handleOpenSupplement}
        />
      )}

      {showSupplement && (
        <SupplementForm alarm={showSupplement} onClose={handleCloseSupplement} />
      )}

      {duplicateConflicts.length > 0 && (
        <DuplicateSiteModal conflicts={duplicateConflicts} onClose={handleCloseDuplicate} />
      )}
    </div>
  );
};
