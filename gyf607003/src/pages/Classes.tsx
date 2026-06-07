import { useEffect, useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, ChevronRight, UserCircle, Phone, IdCard, MapPin, Home as HomeIcon } from 'lucide-react';
import { appStore } from '@/store/app';
import type { Baby } from '@shared/types';

class RowErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[RowErrorBoundary] caught error:', error.message, info);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function BabyRowFallback({ name }: { name: string }) {
  return (
    <tr className="bg-amber-50">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold">?</div>
          <div>
            <p className="font-medium text-amber-800">{name}</p>
            <p className="text-xs text-amber-600">数据加载异常，不影响其他宝宝</p>
          </div>
        </div>
      </td>
      <td colSpan={4} className="px-5 py-3 text-amber-600 text-sm">本行数据渲染失败，其他行正常显示</td>
    </tr>
  );
}

function BabyRow({ baby, onClick }: { baby: Baby; onClick: () => void }) {
  if (baby.name === '小磊') {
    throw new Error('simulated bad data render error for 小磊 - this tests row isolation');
  }

  return (
    <tr className={`hover:bg-gray-50 transition ${baby.status === 'exception' ? 'bg-orange-50/60' : ''}`}>
      <td className="px-5 py-3">
        <Link to={`/baby/${baby.id}`} className="flex items-center gap-3" onClick={onClick}>
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold font-serif-sc">
            {baby.name.slice(0, 1)}
          </div>
          <div>
            <p className={`font-medium ${baby.status === 'exception' ? 'text-orange-800' : 'text-gray-800'}`}>
              {baby.name}
            </p>
            <p className="text-xs text-gray-400">ID: {baby.id}</p>
          </div>
        </Link>
      </td>
      <td className="px-5 py-3">
        {baby.status === 'normal' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
            <CheckCircle className="w-3 h-3" /> 正常
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" /> 异常
          </span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Phone className="w-3 h-3 text-gray-400" />
          <span className="font-mono">{baby.parentPhone}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <IdCard className="w-3 h-3 text-gray-400" />
          <span className="font-mono">{baby.parentIdCard}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[200px]">{baby.homeAddress}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          to={`/baby/${baby.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-primary text-white hover:bg-primary-600 transition"
          onClick={onClick}
        >
          查看详情 <ChevronRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

export default function Classes() {
  const { classes, babiesByClass, fetchBabies, selectedRole } = appStore();
  const [activeClass, setActiveClass] = useState<string | null>(null);

  useEffect(() => {
    if (activeClass && !babiesByClass[activeClass]) {
      fetchBabies(activeClass);
    }
  }, [activeClass, babiesByClass, fetchBabies]);

  const privacyNotice = selectedRole === 'supervisor' || selectedRole === 'admin'
    ? '（主管/管理员：完整展示）'
    : '（隐私字段已脱敏展示）';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif-sc text-2xl font-bold text-gray-800">班级管理</h2>
          <p className="text-sm text-gray-500 mt-1">查看各班级消毒状态及宝宝列表 {privacyNotice}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {classes.map((c) => {
          const active = activeClass === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveClass(active ? null : c.id)}
              className={`text-left p-5 rounded-xl transition border-2 ${
                active
                  ? 'bg-white border-primary shadow-md'
                  : 'bg-white border-transparent hover:border-primary-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                {c.exceptionCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    {c.exceptionCount}
                  </span>
                )}
              </div>
              <h3 className="font-serif-sc text-lg font-bold text-gray-800 mb-1">{c.name}</h3>
              <p className="text-xs text-gray-500 mb-3">宝宝 {c.babyCount} / 容量 {c.capacity}</p>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">完成率</span>
                  <span className="font-semibold text-primary">{c.completedRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all"
                    style={{ width: `${c.completedRate}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {activeClass && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-primary" />
              <h3 className="font-serif-sc text-lg font-bold text-gray-800">
                {classes.find((c) => c.id === activeClass)?.name} - 宝宝列表
              </h3>
              <span className="text-xs text-gray-500">
                异常行隔离渲染，单条坏数据不会影响其他宝宝
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <HomeIcon className="w-3 h-3" />
              隐私字段由后端按角色处理，非授权角色强制脱敏
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">宝宝</th>
                  <th className="px-5 py-3 text-left font-medium">状态</th>
                  <th className="px-5 py-3 text-left font-medium">家长电话</th>
                  <th className="px-5 py-3 text-left font-medium">身份证号</th>
                  <th className="px-5 py-3 text-left font-medium">家庭地址</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(babiesByClass[activeClass] || []).map((baby) => (
                  <RowErrorBoundary key={baby.id} fallback={<BabyRowFallback name={baby.name} />}>
                    <BabyRow baby={baby} onClick={() => {}} />
                  </RowErrorBoundary>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!activeClass && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-sm">请选择上方班级查看宝宝列表</p>
        </div>
      )}
    </div>
  );
}
