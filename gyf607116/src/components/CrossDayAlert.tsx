import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useRecordStore } from '../store/useRecordStore';

export const CrossDayAlert: React.FC = () => {
  const { alerts, dismissAlert, dismissAllAlerts } = useRecordStore();
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (alerts.length === 0) {
    return null;
  }

  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');
  const errorAlerts = alerts.filter(a => a.type === 'error');
  const successAlerts = alerts.filter(a => a.type === 'success');

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-900/40 border-orange-500 text-orange-100';
      case 'error':
        return 'bg-red-900/40 border-red-500 text-red-100';
      case 'success':
        return 'bg-emerald-900/40 border-emerald-500 text-emerald-100';
      case 'info':
      default:
        return 'bg-blue-900/40 border-blue-500 text-blue-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
      case 'error':
        return AlertTriangle;
      case 'success':
      case 'info':
      default:
        return Info;
    }
  };

  return (
    <div className="mx-4 mt-4 space-y-2 animate-slide-down">
      {alerts.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            {warningAlerts.length > 0 && (
              <span className="flex items-center gap-1 text-orange-400">
                <AlertTriangle size={14} />
                {warningAlerts.length} 条警告
              </span>
            )}
            {infoAlerts.length > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <Info size={14} />
                {infoAlerts.length} 条提示
              </span>
            )}
          </div>
          <button
            onClick={dismissAllAlerts}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            全部关闭
          </button>
        </div>
      )}

      {alerts.map((alert) => {
        const Icon = getIcon(alert.type);
        const isExpanded = expandedAlerts.has(alert.id);
        const hasPlainText = alert.plainText && alert.plainText !== alert.message;

        return (
          <div
            key={alert.id}
            className={`alert-banner ${getAlertStyle(alert.type)} animate-pulse-once`}
          >
            <div className="flex items-start gap-3">
              <Icon size={20} className="flex-shrink-0 mt-0.5" />
              
              <div className="flex-1 min-w-0">
                {alert.type === 'warning' && (
                  <div className="font-semibold mb-1">
                    值班员请注意：
                  </div>
                )}
                <div className="text-sm">
                  {alert.message}
                </div>
                
                {hasPlainText && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 transition-opacity"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={14} />
                          收起详情
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          查看详细说明
                        </>
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-black/20 rounded text-sm leading-relaxed">
                        {alert.plainText}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismissAlert(alert.id)}
                className="p-1 opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
