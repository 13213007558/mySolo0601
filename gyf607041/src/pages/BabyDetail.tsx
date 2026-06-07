import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Baby, User, Calendar, Home as HomeIcon, Upload, Plus, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import StatusBadge from '../components/StatusBadge';
import TemperatureTimeline from '../components/TemperatureTimeline';
import PhotoGallery from '../components/PhotoGallery';
import RectificationList from '../components/RectificationList';
import EmptyState from '../components/EmptyState';
import { api } from '../lib/api';

export default function BabyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBaby, loading, loadBabyDetail, clearCurrentBaby, refreshBabies } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [temp, setTemp] = useState('');
  const [remark, setRemark] = useState('');
  const [photoDesc, setPhotoDesc] = useState('');

  useEffect(() => {
    if (id) loadBabyDetail(id);
    return () => clearCurrentBaby();
  }, [id]);

  const reload = async () => {
    if (id) {
      await loadBabyDetail(id);
      await refreshBabies();
    }
  };

  const addTemp = async () => {
    if (!id || !temp) return;
    try {
      await api.addTemperature(id, {
        temperature: Number(temp),
        measureTime: new Date().toISOString(),
        measuredBy: '护理主管',
        deviceId: 'MANUAL',
        source: 'manual',
        remark,
      });
      setTemp(''); setRemark('');
      reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!id) return;
    try {
      await api.uploadPhoto(id, file, photoDesc);
      setPhotoDesc('');
      reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading && !currentBaby) {
    return (
      <div className="min-h-screen grain flex items-center justify-center">
        <div className="text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">正在加载宝宝详情...</p>
        </div>
      </div>
    );
  }

  if (!currentBaby) {
    return (
      <div className="min-h-screen grain">
        <div className="container py-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-medical-600 hover:text-medical-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> 返回提醒墙
          </Link>
          <EmptyState kind="no-results" />
        </div>
      </div>
    );
  }

  const b = currentBaby;
  const genderLabel = b.gender === 'male' ? '男宝' : '女宝';

  return (
    <div className="min-h-screen grain">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/60 shadow-soft">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-medical-600 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> 返回提醒墙
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${
                b.gender === 'male' ? 'bg-gradient-to-br from-medical-400 to-medical-600' : 'bg-gradient-to-br from-warmpink-300 to-warmpink-500'
              }`}>
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-2">
                  {b.name}
                  <span className="text-xs font-normal text-slate-400">（{genderLabel}）</span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">最后更新 {b.updatedAt?.slice(0, 16).replace('T', ' ')}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
          </div>
          <button onClick={reload} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors" title="刷新数据（模拟服务重启后重新打开）">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </header>

      <main className="container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp">
            <h2 className="font-serif text-base font-semibold text-slate-800 mb-4">基本信息</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-slate-500"><HomeIcon className="w-3.5 h-3.5" /> 房号</dt>
                <dd className="font-medium text-slate-800">{b.roomNumber}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-slate-500"><Baby className="w-3.5 h-3.5" /> 月龄</dt>
                <dd className="font-medium text-slate-800">{b.ageMonths} 个月</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-slate-500"><User className="w-3.5 h-3.5" /> 责任护士</dt>
                <dd className="font-medium text-slate-800">{b.nurseInCharge}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-1.5 text-slate-500"><Calendar className="w-3.5 h-3.5" /> 入所日期</dt>
                <dd className="font-medium text-slate-800">{b.admissionDate}</dd>
              </div>
              <div className="pt-3 mt-3 border-t border-dashed border-slate-100">
                <dt className="text-xs text-slate-400 mb-1.5">当前状态</dt>
                <StatusBadge status={b.status} />
              </div>
              {b.remark && (
                <div className="pt-3 mt-1 border-t border-dashed border-slate-100">
                  <dt className="text-xs text-slate-400 mb-1.5">早高峰备注回溯</dt>
                  <p className="text-sm text-slate-600 leading-relaxed bg-medical-50/50 px-3 py-2 rounded-lg border border-medical-50">{b.remark}</p>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp" style={{ animationDelay: '80ms' }}>
            <h2 className="font-serif text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-medical-500" /> 补充体温记录
            </h2>
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  type="number"
                  step="0.1"
                  min="34"
                  max="42"
                  placeholder="体温（如 36.5）"
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                />
                <span className="text-sm text-slate-400 self-center">°C</span>
              </div>
              <input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注（可选）"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
              />
              <button onClick={addTemp} className="w-full text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-medical-500 to-medical-700 text-white font-medium hover:shadow-soft transition-all">
                登记体温
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp" style={{ animationDelay: '120ms' }}>
            <h2 className="font-serif text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-warmpink-500" /> 上传请假条照片
            </h2>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); if (fileRef.current) fileRef.current.value = ''; }} />
            <div className="space-y-2.5">
              <input
                value={photoDesc}
                onChange={(e) => setPhotoDesc(e.target.value)}
                placeholder="照片说明（可选）"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
              />
              <button onClick={() => fileRef.current?.click()} className="w-full text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-warmpink-400 to-warmpink-600 text-white font-medium hover:shadow-soft transition-all inline-flex items-center justify-center gap-1.5">
                <Upload className="w-4 h-4" /> 选择照片上传
              </button>
              <p className="text-[11px] text-slate-400 leading-relaxed">上传后可在照片卡片点击编辑，标记材料缺页并填写说明。缺页记录会进入审计日志留存。</p>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp">
            <h2 className="font-serif text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-medical-500 to-medical-300 rounded-full"></span>
              体温记录时间线
              <span className="ml-auto text-xs font-normal text-slate-400">共 {b.temperatures.length} 条原始体温枪记录</span>
            </h2>
            <TemperatureTimeline records={b.temperatures} />
          </div>

          <div className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp" style={{ animationDelay: '60ms' }}>
            <h2 className="font-serif text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-warmpink-500 to-warmpink-300 rounded-full"></span>
              请假条照片
              <span className="ml-auto text-xs font-normal text-slate-400">共 {b.photos.length} 张，点击铅笔图标可标记材料缺页</span>
            </h2>
            <PhotoGallery babyId={b.id!} photos={b.photos} onUpdate={reload} />
          </div>

          <div className="rounded-2xl bg-white shadow-card border border-white/60 p-5 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
            <h2 className="font-serif text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-gradient-to-b from-amber-500 to-orange-400 rounded-full"></span>
              整改记录追踪
            </h2>
            <RectificationList babyId={b.id!} records={b.rectifications} onUpdate={reload} />
          </div>
        </section>
      </main>

      <footer className="mt-12 py-6 border-t border-slate-100/80 bg-white/40 backdrop-blur-sm">
        <div className="container text-center text-xs text-slate-400">
          本页所有数据（照片说明、状态标签、整改记录）均已持久化存储，服务重启后重新打开即可恢复。
        </div>
      </footer>
    </div>
  );
}
