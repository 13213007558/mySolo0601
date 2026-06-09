import React from 'react';
import { useShadowStore } from '@/store/useShadowStore';
import { getThresholdAlerts } from '@/utils/thresholdInterpreter';
import { AlertTriangle, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const ThresholdAlert: React.FC = () => {
  const { getVisibleRecords, thresholdConfig } = useShadowStore();
  const visibleRecords = getVisibleRecords();
  const alerts = getThresholdAlerts(visibleRecords, thresholdConfig);

  if (alerts.length === 0) return null;

  const getAlertStyles = (type: 'normal' | 'warning' | 'danger') => {
    switch (type) {
      case 'normal':
        return 'bg-success-50 border-success-200 text-success-800';
      case 'warning':
        return 'bg-warning-50 border-warning-200 text-warning-800';
      case 'danger':
        return 'bg-danger-50 border-danger-200 text-danger-800 animate-pulse-slow';
    }
  };

  const getIcon = (type: 'normal' | 'warning' | 'danger') => {
    switch (type) {
      case 'normal':
        return <CheckCircle2 size={20} className="text-success-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-warning-500 flex-shrink-0" />;
      case 'danger':
        return <AlertCircle size={20} className="text-danger-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${getAlertStyles(alert.type)}`}
          style={{
            animationDelay: `${index * 100}ms`,
            opacity: 0,
            animation: 'fadeInUp 0.4s ease-out forwards',
          }}
        >
          {getIcon(alert.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{alert.title}</h4>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/50">
                影响 {alert.affectedCount} 条
              </span>
            </div>
            <p className="text-sm mt-1 opacity-90 leading-relaxed">
              {alert.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
