import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Clock, Zap, Car, User } from 'lucide-react';
import type { ParkingSpot } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import { cn, formatDuration, formatDateTime, getStatusBgClass, getStatusTextClass, getAlertLabel } from '../../utils/helpers';
import ExpandablePanel from './ExpandablePanel';
import { useParkingStore } from '../../store/parkingStore';

interface ParkingSpotCardProps {
  spot: ParkingSpot;
}

const ParkingSpotCard = ({ spot }: ParkingSpotCardProps) => {
  const { expandedSpotId, setExpandedSpotId } = useParkingStore();
  const isExpanded = expandedSpotId === spot.id;
  const [isHovered, setIsHovered] = useState(false);

  const toggleExpand = () => {
    setExpandedSpotId(isExpanded ? null : spot.id);
  };

  const isMismatch = spot.exportValue !== spot.actualValue;

  return (
    <div
      className={cn(
        'card-industrial transition-all duration-200',
        isExpanded && 'ring-2 ring-primary',
        spot.hasAlert && spot.alertType === 'export_mismatch' && 'alert-pulse',
        isHovered && 'border-primary/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 cursor-pointer" onClick={toggleExpand}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-3 h-3 rounded-sm',
              STATUS_COLORS[spot.status],
              spot.hasAlert && 'animate-pulse'
            )} />
            <div>
              <div className="font-mono-nums text-2xl font-bold text-industrial-text tracking-wider">
                {spot.spotNumber}
              </div>
              <div className={cn(
                'status-badge inline-flex items-center gap-1 mt-1',
                getStatusBgClass(spot.status),
                getStatusTextClass(spot.status)
              )}>
                {spot.status === 'charging' && <Zap size={12} />}
                {STATUS_LABELS[spot.status]}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spot.hasAlert && (
              <div className="flex items-center gap-1 text-alert-red bg-alert-red/10 px-2 py-1 rounded-sm text-xs font-medium">
                <AlertTriangle size={14} />
                {getAlertLabel(spot.alertType)}
              </div>
            )}
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-industrial-bg/50 p-2 rounded-sm">
            <div className="text-xs text-industrial-muted mb-1">系统导出</div>
            <div className={cn(
              'font-mono-nums text-xl font-bold',
              isMismatch ? 'text-alert-red' : 'text-industrial-text'
            )}>
              {spot.exportValue}
              {spot.chargePower && (
                <span className="text-xs font-normal text-industrial-muted ml-1">
                  {spot.chargePower}kW
                </span>
              )}
            </div>
          </div>
          <div className="bg-industrial-bg/50 p-2 rounded-sm">
            <div className="text-xs text-industrial-muted mb-1">实际状态</div>
            <div className={cn(
              'font-mono-nums text-xl font-bold',
              isMismatch ? 'text-alert-green' : 'text-industrial-text'
            )}>
              {spot.actualValue}
            </div>
          </div>
        </div>

        {spot.vehiclePlate && (
          <div className="flex items-center gap-2 text-sm text-industrial-muted mb-2">
            <Car size={14} />
            <span className="font-mono-nums">{spot.vehiclePlate}</span>
          </div>
        )}

        {spot.occupiedSince && (
          <div className="flex items-center gap-2 text-sm text-industrial-muted">
            <Clock size={14} />
            <span>已占用 {formatDuration(spot.occupiedSince)}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-industrial-border">
          <div className="text-xs text-industrial-muted flex items-center gap-1">
            <User size={12} />
            {spot.screenshots.length} 张截图
          </div>
          <div className="text-xs text-industrial-muted">
            更新于 {formatDateTime(spot.lastUpdated)}
          </div>
        </div>

        {isMismatch && (
          <div className="mt-3 bg-alert-red/10 border border-alert-red/30 p-2 rounded-sm">
            <div className="text-xs text-alert-red font-medium flex items-center gap-1">
              <AlertTriangle size={12} />
              数据不一致：导出显示{spot.exportValue === 1 ? '占用' : '空闲'}，实际为{spot.actualValue === 1 ? '占用' : '空闲'}
            </div>
          </div>
        )}
      </div>

      <ExpandablePanel spot={spot} isExpanded={isExpanded} />
    </div>
  );
};

export default ParkingSpotCard;
