import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Camera, Shield } from 'lucide-react';
import type { Anomaly } from '@/types';
import { formatDate } from '@/utils/storage';
import { useCylinderStore } from '@/store/useCylinderStore';

interface AnomalyCardProps {
  anomaly: Anomaly;
  cylinderCode?: string;
}

const AnomalyCard = ({ anomaly, cylinderCode }: AnomalyCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const resolveAnomaly = useCylinderStore(state => state.resolveAnomaly);
  const cylinder = useCylinderStore(state =>
    state.cylinders.find(c => c.id === anomaly.cylinderId)
  );

  const typeConfig = {
    photo_missing_direction: {
      icon: Camera,
      label: '照片缺少方向说明',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    permission_phone_leak: {
      icon: Shield,
      label: '权限视图泄露手机号',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
  };

  const config = typeConfig[anomaly.type];
  const Icon = config.icon;

  const handleResolve = () => {
    if (confirm('确认标记此异常为已解决？')) {
      resolveAnomaly(anomaly.id);
    }
  };

  return (
    <div
      className={`card-industrial p-4 ${config.bgColor} ${config.borderColor} border ${
        !anomaly.resolved ? 'animate-pulse-slow' : 'opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-sm ${config.bgColor} ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${config.color}`}>{config.label}</span>
                {cylinderCode && (
                  <span className="text-xs text-industrial-400 font-mono">
                    气瓶: {cylinderCode}
                  </span>
                )}
                {anomaly.resolved && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已解决
                  </span>
                )}
              </div>
              <p className="text-sm text-industrial-300 mb-2">{anomaly.readableReason}</p>
              <p className="text-xs text-industrial-500">
                检测时间: {formatDate(anomaly.detectedAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!anomaly.resolved && (
                <button
                  onClick={handleResolve}
                  className="px-2 py-1 text-xs bg-emerald-600/20 text-emerald-400 rounded-sm hover:bg-emerald-600/30 transition-colors"
                >
                  标记解决
                </button>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-industrial-400 hover:text-white transition-colors"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-industrial-700/50 animate-fade-in-up">
              <p className="text-xs text-industrial-400 mb-2">技术详情:</p>
              <div className="bg-industrial-950/50 p-3 rounded-sm font-mono text-xs text-industrial-300 overflow-x-auto">
                {anomaly.technicalDetails}
              </div>
              {cylinder && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-industrial-400">关联气瓶:</span>
                  <span className="text-white font-mono">{cylinder.code}</span>
                  <span className="text-industrial-400">-</span>
                  <span className="text-industrial-300">{cylinder.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomalyCard;
