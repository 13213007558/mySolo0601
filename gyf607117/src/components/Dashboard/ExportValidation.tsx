import { FileSpreadsheet, AlertTriangle, CheckCircle, RefreshCw, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';
import { cn } from '../../utils/helpers';

const ExportValidation = () => {
  const { spots, getMismatchCount } = useParkingStore();

  const exportTotal = spots.reduce((sum, s) => sum + s.exportValue, 0);
  const actualTotal = spots.reduce((sum, s) => sum + s.actualValue, 0);
  const mismatchCount = getMismatchCount();
  const isValid = exportTotal === actualTotal;

  const mismatchSpots = spots.filter((s) => s.exportValue !== s.actualValue);

  const exportByStatus = {
    available: spots.filter((s) => s.exportValue === 0).length,
    occupied: spots.filter((s) => s.exportValue === 1).length,
  };

  const actualByStatus = {
    available: spots.filter((s) => s.actualValue === 0).length,
    occupied: spots.filter((s) => s.actualValue === 1).length,
  };

  return (
    <div className="card-industrial p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-sm flex items-center justify-center',
            isValid ? 'bg-alert-green/20' : 'bg-alert-red/20'
          )}>
            <FileSpreadsheet size={20} className={isValid ? 'text-alert-green' : 'text-alert-red'} />
          </div>
          <div>
            <div className="font-semibold text-industrial-text">导出数据校验</div>
            <div className="text-xs text-industrial-muted">
              实时对比系统导出值与实际状态
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <RefreshCw size={14} />
            刷新数据
          </button>
          <button className="btn-primary flex items-center gap-2 text-xs">
            <Download size={14} />
            导出报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-industrial-bg/50 p-3 rounded-sm text-center">
          <div className="text-xs text-industrial-muted mb-1">系统导出 - 占用</div>
          <div className="font-mono-nums text-2xl font-bold text-industrial-text">
            {exportByStatus.occupied}
          </div>
        </div>
        <div className="bg-industrial-bg/50 p-3 rounded-sm text-center">
          <div className="text-xs text-industrial-muted mb-1">系统导出 - 空闲</div>
          <div className="font-mono-nums text-2xl font-bold text-industrial-text">
            {exportByStatus.available}
          </div>
        </div>
        <div className="bg-industrial-bg/50 p-3 rounded-sm text-center">
          <div className="text-xs text-industrial-muted mb-1">实际 - 占用</div>
          <div className="font-mono-nums text-2xl font-bold text-industrial-text">
            {actualByStatus.occupied}
          </div>
        </div>
        <div className="bg-industrial-bg/50 p-3 rounded-sm text-center">
          <div className="text-xs text-industrial-muted mb-1">实际 - 空闲</div>
          <div className="font-mono-nums text-2xl font-bold text-industrial-text">
            {actualByStatus.available}
          </div>
        </div>
      </div>

      <div className={cn(
        'p-4 rounded-sm mb-4 flex items-center justify-between',
        isValid ? 'bg-alert-green/10 border border-alert-green/30' : 'bg-alert-red/10 border border-alert-red/30'
      )}>
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircle size={24} className="text-alert-green" />
          ) : (
            <AlertTriangle size={24} className="text-alert-red animate-pulse" />
          )}
          <div>
            <div className={cn(
              'font-semibold',
              isValid ? 'text-alert-green' : 'text-alert-red'
            )}>
              {isValid ? '数据校验通过' : '发现数据不一致'}
            </div>
            <div className="text-sm text-industrial-muted">
              {isValid
                ? `系统导出 ${exportTotal} 辆，实际 ${actualTotal} 辆，数据完全一致`
                : `系统导出 ${exportTotal} 辆，实际 ${actualTotal} 辆，相差 ${Math.abs(exportTotal - actualTotal)} 辆`
              }
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {exportTotal > actualTotal ? (
            <div className="flex items-center gap-1 text-alert-red">
              <TrendingDown size={20} />
              <span className="font-mono-nums font-bold">-{exportTotal - actualTotal}</span>
            </div>
          ) : exportTotal < actualTotal ? (
            <div className="flex items-center gap-1 text-alert-orange">
              <TrendingUp size={20} />
              <span className="font-mono-nums font-bold">+{actualTotal - exportTotal}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-alert-green">
              <CheckCircle size={20} />
              <span className="font-bold">0</span>
            </div>
          )}
        </div>
      </div>

      {mismatchCount > 0 && (
        <div>
          <div className="text-sm font-medium text-industrial-text mb-2">
            不一致车位列表（{mismatchCount}个）
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {mismatchSpots.map((spot) => (
              <div
                key={spot.id}
                className="bg-industrial-bg/50 p-3 rounded-sm flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-nums text-lg font-bold text-industrial-text">
                    {spot.spotNumber}
                  </span>
                  {spot.vehiclePlate && (
                    <span className="text-sm text-industrial-muted font-mono-nums">
                      {spot.vehiclePlate}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xs text-industrial-muted">导出</div>
                    <div className={cn(
                      'font-mono-nums font-bold',
                      spot.exportValue !== spot.actualValue ? 'text-alert-red' : 'text-industrial-text'
                    )}>
                      {spot.exportValue}
                    </div>
                  </div>
                  <div className="text-industrial-muted">≠</div>
                  <div className="text-center">
                    <div className="text-xs text-industrial-muted">实际</div>
                    <div className={cn(
                      'font-mono-nums font-bold',
                      spot.exportValue !== spot.actualValue ? 'text-alert-green' : 'text-industrial-text'
                    )}>
                      {spot.actualValue}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportValidation;
