import { useState } from 'react';
import { Filter, AlertTriangle, CheckCircle, Zap, Car, Clock, WifiOff } from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import type { SpotStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { cn } from '../../utils/helpers';
import ParkingSpotCard from '../ParkingSpot/ParkingSpotCard';

const ParkingGrid = () => {
  const { spots, filterStatus, setFilterStatus } = useParkingStore();
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const filters: Array<{ id: SpotStatus | 'all'; label: string; icon?: any }> = [
    { id: 'all', label: '全部' },
    { id: 'mismatch', label: '数据异常', icon: AlertTriangle },
    { id: 'available', label: '空闲', icon: CheckCircle },
    { id: 'occupied', label: '占用', icon: Car },
    { id: 'charging', label: '充电中', icon: Zap },
    { id: 'offline', label: '离线', icon: WifiOff },
  ];

  const filteredSpots = spots.filter((spot) => {
    if (showOnlyAlerts && !spot.hasAlert) return false;
    if (filterStatus !== 'all' && spot.status !== filterStatus) return false;
    return true;
  });

  const alertCount = spots.filter((s) => s.hasAlert).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-industrial-muted" />
          <div className="flex gap-1 flex-wrap">
            {filters.map((filter) => {
              const Icon = filter.icon;
              const isActive = filterStatus === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all rounded-sm',
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-industrial-card text-industrial-muted hover:text-industrial-text hover:bg-industrial-border/30 border border-industrial-border'
                  )}
                >
                  {Icon && <Icon size={14} />}
                  {filter.label}
                  <span className="font-mono-nums text-xs opacity-70">
                    ({filter.id === 'all'
                      ? spots.length
                      : spots.filter((s) => s.status === filter.id).length})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all rounded-sm border-2',
            showOnlyAlerts
              ? 'bg-alert-red border-alert-red text-white'
              : 'bg-industrial-card border-industrial-border text-industrial-muted hover:text-industrial-text'
          )}
        >
          <AlertTriangle size={16} className={showOnlyAlerts ? 'animate-pulse' : ''} />
          仅显示异常
          {showOnlyAlerts && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-sm text-xs font-mono-nums">
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {filteredSpots.length === 0 ? (
        <div className="card-industrial p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-alert-green mb-4 opacity-50" />
          <div className="text-xl font-medium text-industrial-text mb-2">暂无异常车位</div>
          <div className="text-industrial-muted">所有充电车位数据正常</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSpots.map((spot) => (
            <ParkingSpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkingGrid;
