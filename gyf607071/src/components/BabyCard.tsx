import { useNavigate } from 'react-router-dom';
import {
  Thermometer,
  AlertTriangle,
  UserX,
  ArrowRightLeft,
  Clock,
  AlertCircle,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { Baby, DataQuality } from '@/types';
import { useStore } from '@/store/useStore';

const statusConfig = {
  normal: {
    label: '正常',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    label: '体温偏高',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  absent: {
    label: '请假',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
  cross: {
    label: '跨班中',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
};

const dataQualityIcons: Record<DataQuality, typeof AlertCircle> = {
  normal: CheckCircle,
  empty: Ban,
  dirty: AlertTriangle,
};

const dataQualityLabels: Record<DataQuality, string> = {
  normal: '数据正常',
  empty: '数据缺失',
  dirty: '数据异常',
};

const dataQualityStyles: Record<DataQuality, string> = {
  normal: 'text-emerald-500',
  empty: 'text-gray-400',
  dirty: 'text-amber-500',
};

interface BabyCardProps {
  baby: Baby;
  showFullDetail: boolean;
}

export default function BabyCard({ baby, showFullDetail }: BabyCardProps) {
  const navigate = useNavigate();
  const selectBaby = useStore((s) => s.selectBaby);
  const addAuditLog = useStore((s) => s.addAuditLog);
  const currentUser = useStore((s) => s.currentUser);
  const canViewDetail = useStore((s) => s.canViewDetail(baby.id));

  const status = statusConfig[baby.status];
  const DataQualityIcon = dataQualityIcons[baby.dataQuality];

  const handleClick = () => {
    if (!currentUser) return;

    if (!canViewDetail) {
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'unauthorized_access',
        targetId: baby.id,
        targetName: baby.name,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        result: 'denied',
        detail: `无权访问宝宝 ${baby.name} 的详情`,
      });
      return;
    }

    selectBaby(baby.id);

    if (!showFullDetail && currentUser.role === 'elder') {
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'view_detail',
        targetId: baby.id,
        targetName: baby.name,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        result: 'partial',
        detail: '老人角色越权查看完整详情，仅显示摘要信息',
      });
    } else {
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'view_detail',
        targetId: baby.id,
        targetName: baby.name,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        result: 'success',
      });
    }

    navigate(`/baby/${baby.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-medical-200 transition-all duration-300 cursor-pointer ${
        !canViewDetail ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center text-xl font-bold text-medical-700 shadow-inner">
            {baby.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-800">
              {baby.name}
            </h3>
            <p className="text-sm text-gray-500">{baby.className}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot} ${baby.status !== 'absent' ? 'animate-pulse-soft' : ''}`} />
          {status.label}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-medical-500" />
          <span className="text-gray-700 font-medium">
            {baby.temperatureSummary || '—'}
          </span>
        </div>

        {baby.checkInTime && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>入园时间 {baby.checkInTime}</span>
          </div>
        )}

        {baby.status === 'absent' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <UserX className="w-4 h-4" />
            <span>今日请假未入园</span>
          </div>
        )}

        {baby.crossClassInfo && (
          <div className="flex items-center gap-2 text-sm text-violet-600">
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              {baby.crossClassInfo.fromClass} → {baby.crossClassInfo.toClass}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs ${dataQualityStyles[baby.dataQuality]}`}>
          <DataQualityIcon className="w-3.5 h-3.5" />
          <span className="font-medium">{dataQualityLabels[baby.dataQuality]}</span>
        </div>

        {canViewDetail ? (
          <div className="text-xs text-medical-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            查看详情
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        ) : (
          <div className="text-xs text-red-400 font-medium">无权限</div>
        )}
      </div>
    </div>
  );
}
