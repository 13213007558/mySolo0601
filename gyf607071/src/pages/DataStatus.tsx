import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  CheckCircle,
  Ban,
  AlertTriangle,
  ArrowRight,
  Baby,
  Thermometer,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useStore } from '@/store/useStore';
import { DataQuality } from '@/types';

const statusConfig: Record<DataQuality, {
  icon: typeof CheckCircle; label: string; description: string; bgColor: string; textColor: string; borderColor: string; dotColor: string; }> = {
  normal: {
    icon: CheckCircle,
    label: '正常数据',
    description: '数据来源可靠，记录完整',
    bgColor: 'from-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  empty: {
    icon: Ban,
    label: '空数据',
    description: '缺少关键信息，需要补录',
    bgColor: 'from-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    dotColor: 'bg-gray-400',
  },
  dirty: {
    icon: AlertTriangle,
    label: '脏数据',
    description: '数据异常或来源不明',
    bgColor: 'from-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
};

export default function DataStatus() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const babies = useStore((s) => s.babies);
  const canManageData = useStore((s) => s.canManageData());
  const canViewAudit = useStore((s) => s.canViewAudit());
  const selectBaby = useStore((s) => s.selectBaby);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const canView = canManageData || currentUser.role === 'manager';
  if (!canView) {
    navigate('/dashboard');
    return null;
  }

  const groupedBabies = useMemo(() => {
    return {
      normal: babies.filter((b) => b.dataQuality === 'normal'),
      empty: babies.filter((b) => b.dataQuality === 'empty'),
      dirty: babies.filter((b) => b.dataQuality === 'dirty'),
    };
  }, [babies]);

  const stats = useMemo(() => {
    return {
      normal: groupedBabies.normal.length,
      empty: groupedBabies.empty.length,
      dirty: groupedBabies.dirty.length,
      total: babies.length,
    };
  }, [groupedBabies, babies.length]);

  const handleViewBaby = (babyId: string) => {
    selectBaby(babyId);
    navigate('/baby/' + babyId);
  };

  const renderBabyList = (list: typeof babies, quality: DataQuality) => {
    const config = statusConfig[quality];
    const Icon = config.icon;

    return (
      <div className={'bg-gradient-to-br ' + config.bgColor + ' rounded-2xl border ' + config.borderColor + ' p-6 animate-slide-up'}>
        <div className="flex items-center gap-3 mb-5">
          <div className={'w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center ' + config.textColor}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className={'font-serif text-xl font-bold ' + config.textColor}>
              {config.label}
            </h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
          <div className="ml-auto">
            <span className={'font-serif text-3xl font-bold ' + config.textColor}>
              {list.length}
            </span>
          </div>
        </div>

        {list.length > 0 ? (
          <div className="space-y-3">
            {list.map((baby) => (
              <div
                key={baby.id}
                onClick={() => handleViewBaby(baby.id)}
                className="group bg-white rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center text-lg font-bold text-medical-700">
                    {baby.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{baby.name}</p>
                    <p className="text-xs text-gray-500">{baby.className}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Thermometer className="w-3.5 h-3.5 text-medical-500" />
                      <span className="text-gray-700">{baby.temperatureSummary || '—'}</span>
                    </div>
                    {quality === 'dirty' && (
                      <p className="text-xs text-amber-600 mt-0.5">数据来源异常</p>
                    )}
                    {quality === 'empty' && (
                      <p className="text-xs text-gray-500 mt-0.5">等待补录</p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-medical-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center mx-auto mb-2">
              <Baby className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500">暂无此类数据</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-medical-50/30">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            数据状态管理
          </h1>
          <p className="text-gray-500">
            按数据质量分类展示，方便快速定位问题数据
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-medical-50 flex items-center justify-center">
              <Database className="w-6 h-6 text-medical-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg font-bold text-gray-900">
                今日数据概览
              </h3>
              <p className="text-sm text-gray-500">共 {stats.total} 条晨检记录</p>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="flex h-full">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: ((stats.normal / Math.max(stats.total, 1)) * 100) + '%' }}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: ((stats.dirty / Math.max(stats.total, 1)) * 100) + '%' }}
              />
              <div
                className="bg-gray-400 h-full transition-all"
                style={{ width: ((stats.empty / Math.max(stats.total, 1)) * 100) + '%' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">正常 {stats.normal}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-gray-600">异常 {stats.dirty}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-gray-600">缺失 {stats.empty}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {renderBabyList(groupedBabies.normal, 'normal')}
          {renderBabyList(groupedBabies.dirty, 'dirty')}
          {renderBabyList(groupedBabies.empty, 'empty')}
        </div>
      </div>
    </div>
  );
}
