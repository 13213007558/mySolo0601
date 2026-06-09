import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { useParkingStore } from '../../store/parkingStore';

const StatusBar = () => {
  const { currentUser, getAlertCount, getMismatchCount, spots } = useParkingStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const alertCount = getAlertCount();
  const mismatchCount = getMismatchCount();
  const totalSpots = spots.length;
  const occupiedSpots = spots.filter((s) => s.status === 'occupied' || s.status === 'charging').length;

  const exportTotal = spots.reduce((sum, s) => sum + s.exportValue, 0);
  const actualTotal = spots.reduce((sum, s) => sum + s.actualValue, 0);
  const isExportValid = exportTotal === actualTotal;

  return (
    <div className="card-industrial p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-industrial-muted" />
            <div>
              <div className="font-mono-nums text-lg font-semibold text-industrial-text">
                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
              </div>
              <div className="text-xs text-industrial-muted">
                {currentTime.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  weekday: 'short',
                })}
              </div>
            </div>
          </div>

          <div className="h-10 w-px bg-industrial-border" />

          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-sm border-2 border-industrial-border"
            />
            <div>
              <div className="font-medium text-industrial-text">{currentUser.name}</div>
              <div className="text-xs text-industrial-muted flex items-center gap-1">
                <User size={12} />
                工号: {currentUser.employeeId}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="card-industrial px-4 py-2 border-l-4 border-l-primary">
            <div className="text-xs text-industrial-muted">总车位</div>
            <div className="font-mono-nums text-2xl font-bold text-industrial-text">
              {totalSpots}
            </div>
          </div>

          <div className="card-industrial px-4 py-2 border-l-4 border-l-alert-orange">
            <div className="text-xs text-industrial-muted">占用/充电</div>
            <div className="font-mono-nums text-2xl font-bold text-alert-orange">
              {occupiedSpots}
            </div>
          </div>

          <div className={`card-industrial px-4 py-2 border-l-4 ${isExportValid ? 'border-l-alert-green' : 'border-l-alert-red'}`}>
            <div className="text-xs text-industrial-muted flex items-center gap-1">
              {isExportValid ? (
                <CheckCircle size={12} className="text-alert-green" />
              ) : (
                <XCircle size={12} className="text-alert-red" />
              )}
              导出校验
            </div>
            <div className="font-mono-nums text-2xl font-bold flex items-center gap-2">
              <span className={isExportValid ? 'text-alert-green' : 'text-alert-red'}>
                {exportTotal}
              </span>
              <span className="text-industrial-muted text-sm">/</span>
              <span className="text-industrial-text">{actualTotal}</span>
            </div>
          </div>

          <div className={`card-industrial px-4 py-2 border-l-4 ${mismatchCount > 0 ? 'border-l-alert-red' : 'border-l-alert-green'}`}>
            <div className="text-xs text-industrial-muted flex items-center gap-1">
              <AlertTriangle size={12} className={mismatchCount > 0 ? 'text-alert-red' : 'text-alert-green'} />
              数据异常
            </div>
            <div className={`font-mono-nums text-2xl font-bold ${mismatchCount > 0 ? 'text-alert-red' : 'text-alert-green'} ${mismatchCount > 0 ? 'animate-pulse' : ''}`}>
              {mismatchCount}
            </div>
          </div>

          <div className={`card-industrial px-4 py-2 border-l-4 ${alertCount > 0 ? 'border-l-alert-orange' : 'border-l-alert-green'}`}>
            <div className="text-xs text-industrial-muted flex items-center gap-1">
              <AlertTriangle size={12} className={alertCount > 0 ? 'text-alert-orange' : 'text-alert-green'} />
              今日告警
            </div>
            <div className={`font-mono-nums text-2xl font-bold ${alertCount > 0 ? 'text-alert-orange' : 'text-alert-green'}`}>
              {alertCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
