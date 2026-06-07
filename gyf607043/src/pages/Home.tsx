import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  Users,
  AlertTriangle,
  ArrowRight,
  Baby,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { relativeTime } from '@/utils/format';
import { applyPrivacyFilter } from '@/utils/privacyFilter';
import type { Role } from '@/types';

export default function HomePage() {
  const classes = useAppStore((s) => s.classes);
  const babies = useAppStore((s) => s.babies);
  const anomalies = useAppStore((s) => s.anomalies);
  const allUsers = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const resetToDefaults = useAppStore((s) => s.resetToDefaults);

  const role = useMemo<Role>(() => {
    const u = allUsers.find((x) => x.id === currentUserId);
    return u?.role ?? 'nurse';
  }, [allUsers, currentUserId]);

  const totalPending = anomalies.filter((a) => a.status === 'pending').length;
  const totalBabies = babies.length;
  const filteredClasses = applyPrivacyFilter(classes, role) as typeof classes;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 tracking-tight">
            班级总览
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            婴幼儿用品消毒复核墙 · 实时同步各班级消毒状态与异常情况
          </p>
        </div>
        <button onClick={resetToDefaults} className="btn-ghost">
          <RotateCcw className="w-4 h-4" />
          重置演示数据
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">在住宝宝</p>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <Baby className="w-4.5 h-4.5 text-teal-600" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-semibold text-slate-900">
            {totalBabies}
          </p>
          <p className="mt-1 text-xs text-slate-400">覆盖 {classes.length} 个班级</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">待处理异常</p>
            <div className="w-9 h-9 rounded-xl bg-coral-50 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-coral-600" />
            </div>
          </div>
          <p
            className={`mt-3 font-mono text-3xl font-semibold ${
              totalPending > 0 ? 'text-coral-600' : 'text-teal-600'
            }`}
          >
            {totalPending}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {totalPending > 0 ? '请前往复核墙处理' : '全部正常，继续保持'}
          </p>
        </div>

        <div className="card p-5 bg-gradient-to-br from-teal-600 to-teal-700 text-white border-transparent">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-teal-100">今日已确认</p>
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-semibold">
            {
              anomalies.filter(
                (a) => a.status === 'resolved' || a.status === 'partial_resolved'
              ).length
            }
          </p>
          <p className="mt-1 text-xs text-teal-100">整改完成的异常记录</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-slate-800">
            班级列表
          </h2>
          <p className="text-xs text-slate-400">
            数据每 30 秒自动同步 · 异常处理后立即刷新
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const classBabies = babies.filter((b) => b.classId === cls.id);
            return (
              <Link
                key={cls.id}
                to={`/class/${cls.id}`}
                className="card-hoverable p-5 block group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      更新于 {relativeTime(cls.lastUpdatedAt)}
                    </p>
                  </div>
                  {cls.todayAnomalyCount > 0 ? (
                    <span className="chip bg-coral-50 text-coral-700 border border-coral-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-pulse-dot" />
                      {cls.todayAnomalyCount} 项待处理
                    </span>
                  ) : (
                    <span className="chip bg-teal-50 text-teal-700 border border-teal-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      全部正常
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="font-mono font-medium">{cls.babyCount}</span>
                    <span className="text-slate-400">位宝宝</span>
                  </div>
                  <div className="flex -space-x-2">
                    {classBabies.slice(0, 4).map((b) => (
                      <img
                        key={b.id}
                        src={b.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full border-2 border-white bg-slate-100"
                      />
                    ))}
                    {classBabies.length > 4 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-500 flex items-center justify-center">
                        +{classBabies.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">查看班级详情</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
