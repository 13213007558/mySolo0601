import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Gauge, User, ChevronRight, FileText } from 'lucide-react';
import type { Cylinder } from '@/types';
import StatusBadge from '../common/StatusBadge';
import { formatDateShort } from '@/utils/storage';
import { useCylinderStore } from '@/store/useCylinderStore';

interface CylinderCardProps {
  cylinder: Cylinder;
  delay?: number;
}

const CylinderCard = ({ cylinder, delay = 0 }: CylinderCardProps) => {
  const navigate = useNavigate();
  const getStatusHistoriesByCylinderId = useCylinderStore(state => state.getStatusHistoriesByCylinderId);
  const histories = getStatusHistoriesByCylinderId(cylinder.id);
  const latestHistory = histories[0];

  const handleClick = () => {
    navigate(`/cylinder/${cylinder.id}`);
  };

  return (
    <div
      className={`card-industrial p-5 cursor-pointer group animate-fade-in-up opacity-0 stagger-${delay} hover:shadow-lg hover:shadow-industrial-500/10`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-white font-semibold">{cylinder.code}</span>
            {cylinder.supplementId && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-sm font-mono">
                补录: {cylinder.supplementId}
              </span>
            )}
          </div>
          <p className="text-sm text-industrial-400">{cylinder.type}</p>
        </div>
        <StatusBadge status={cylinder.currentStatus} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-industrial-400" />
          <span className="text-industrial-300">{cylinder.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Gauge className="w-4 h-4 text-industrial-400" />
          <span className="text-industrial-300">压力: {cylinder.pressure}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-industrial-400" />
          <span className="text-industrial-300">巡检: {cylinder.inspector}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-industrial-400" />
          <span className="text-industrial-300">下次检查: {formatDateShort(cylinder.nextCheckDate)}</span>
        </div>
      </div>

      {latestHistory && (
        <div className="pt-3 border-t border-industrial-700/50">
          <div className="flex items-center gap-2 text-xs text-industrial-400 mb-1">
            <FileText className="w-3 h-3" />
            <span>最近处理</span>
          </div>
          <p className="text-sm text-industrial-300 line-clamp-2">{latestHistory.reason}</p>
          <p className="text-xs text-industrial-500 mt-1">
            {formatDateShort(latestHistory.timestamp)} · {latestHistory.operator}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-industrial-500 font-mono">ID: {cylinder.id}</span>
        <ChevronRight className="w-4 h-4 text-industrial-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

export default CylinderCard;
