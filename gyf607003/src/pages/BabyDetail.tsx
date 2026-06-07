import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserCircle, Phone, IdCard, MapPin, AlertTriangle, CheckCircle,
  Shield, Plus, Clock, Droplets, Package, RotateCcw, Sparkles,
} from 'lucide-react';
import { appStore } from '@/store/app';
import { EXCEPTION_TYPE_LABEL } from '@shared/types';

const timelineIcon = (type: string) => {
  switch (type) {
    case 'disinfect':
    case 'disinfected': return Droplets;
    case 'distribute':
    case 'distributed': return Package;
    case 'recycle':
    case 'recycled': return RotateCcw;
    case 'exception': return AlertTriangle;
    case 'resolve': return CheckCircle;
    case 'manual': return Sparkles;
    default: return Clock;
  }
};

const timelineColor = (type: string) => {
  switch (type) {
    case 'exception': return 'bg-red-500 text-white border-red-500';
    case 'resolve': return 'bg-green-500 text-white border-green-500';
    case 'manual': return 'bg-yellow-500 text-white border-yellow-500';
    case 'distribute':
    case 'distributed': return 'bg-blue-500 text-white border-blue-500';
    case 'recycle':
    case 'recycled': return 'bg-purple-500 text-white border-purple-500';
    default: return 'bg-primary-500 text-white border-primary-500';
  }
};

export default function BabyDetail() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { babyDetail, babyTimeline, babyExceptions, fetchBabyDetail, fetchBabyTimeline, fetchBabyExceptions } = appStore();

  useEffect(() => {
    if (id) {
      fetchBabyDetail(id);
      fetchBabyTimeline(id);
      fetchBabyExceptions(id);
    }
  }, [id, fetchBabyDetail, fetchBabyTimeline, fetchBabyExceptions]);

  const baby = id ? babyDetail[id] : undefined;
  const timeline = id ? babyTimeline[id] || [] : [];
  const exceptions = id ? babyExceptions[id] || [] : [];

  if (!baby) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
        <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-30 animate-pulse" />
        <p className="text-sm">加载宝宝信息中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="font-serif-sc text-2xl font-bold text-gray-800">宝宝详情</h2>
          <p className="text-sm text-gray-500 mt-0.5">用品消毒历史与异常记录</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary font-bold font-serif-sc text-2xl">
            {baby.name.slice(0, 1)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-serif-sc text-xl font-bold text-gray-800">{baby.name}</h3>
              <span className="px-2 py-0.5 rounded bg-primary-50 text-primary text-xs font-semibold">{baby.className}</span>
              {baby.status === 'normal' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" /> 正常
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3" /> 异常
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="font-mono">{baby.parentPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <IdCard className="w-4 h-4 text-gray-400" />
                <span className="font-mono">{baby.parentIdCard}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{baby.homeAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-serif-sc text-lg font-bold text-gray-800">用品消毒时间线</h3>
          </div>
          <div className="p-6">
            {timeline.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无消毒记录</p>
              </div>
            ) : (
              <ol className="relative border-l-2 border-gray-100 ml-3 space-y-5">
                {timeline.map((e) => {
                  const Icon = timelineIcon(e.type);
                  return (
                    <li key={e.id} className="relative pl-6">
                      <div className={`absolute -left-[11px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${timelineColor(e.type)} shadow`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{e.title}</p>
                            {e.type === 'manual' && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-semibold border border-yellow-200">手工补录</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap font-mono">
                            {new Date(e.time).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{e.description}</p>
                        <p className="text-xs text-gray-400">操作人：{e.operatorName}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent-orange" />
            <h3 className="font-serif-sc text-lg font-bold text-gray-800">异常记录</h3>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
              {exceptions.length}
            </span>
          </div>
          <div className="p-5 space-y-4">
            {exceptions.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Plus className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">无异常记录</p>
              </div>
            ) : (
              exceptions.map((e) => (
                <div key={e.id} className={`rounded-lg p-4 border ${e.status === 'pending' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${e.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {e.status === 'pending' ? '待处理' : '已处理'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(e.createTime).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">类型：{EXCEPTION_TYPE_LABEL[e.type]}</p>
                  <p className="text-sm text-gray-700 mb-2">{e.reason}</p>
                  {e.handleMeasure && (
                    <div className="pt-2 border-t border-gray-200/50">
                      <p className="text-xs text-gray-500">处理措施：</p>
                      <p className="text-sm text-gray-700">{e.handleMeasure}</p>
                      <p className="text-[11px] text-gray-400 mt-1">处理人：{e.handlerName} · {e.handleTime && new Date(e.handleTime).toLocaleString('zh-CN')}</p>
                    </div>
                  )}
                  {e.reviewComment && (
                    <div className="pt-2 mt-2 border-t border-gray-200/50">
                      <p className="text-xs text-gray-500">主管复查：</p>
                      <p className="text-sm text-gray-700">{e.reviewComment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-start">
        <Link to="/classes" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> 返回班级列表
        </Link>
      </div>
    </div>
  );
}
