import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  ArrowLeft,
  Baby,
  AlertTriangle,
  ChevronRight,
  Bed,
  AlertCircle,
} from 'lucide-react';
import { applyPrivacyFilter } from '@/utils/privacyFilter';
import type { Baby as BabyType, ClassInfo } from '@/types';

export default function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const allClasses = useAppStore((s) => s.classes);
  const allBabies = useAppStore((s) => s.babies);
  const allRecords = useAppStore((s) => s.records);
  const allAnomalies = useAppStore((s) => s.anomalies);
  const allUsers = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);

  const role = useMemo(() => {
    const u = allUsers.find((x) => x.id === currentUserId);
    return u?.role ?? 'nurse';
  }, [allUsers, currentUserId]);

  const cls = useMemo<ClassInfo | undefined>(
    () => allClasses.find((c) => c.id === classId),
    [allClasses, classId]
  );

  const babies = useMemo<BabyType[]>(
    () => allBabies.filter((b) => b.classId === classId),
    [allBabies, classId]
  );

  const babyPendingAnomalyCount = useMemo<Map<string, number>>(() => {
    const recordToBaby = new Map(
      allRecords.map((r) => [r.id, r.babyId] as const)
    );
    const m = new Map<string, number>();
    for (const a of allAnomalies) {
      if (a.status !== 'pending') continue;
      const bid = recordToBaby.get(a.recordId);
      if (!bid) continue;
      m.set(bid, (m.get(bid) ?? 0) + 1);
    }
    return m;
  }, [allAnomalies, allRecords]);

  if (!cls) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">班级不存在</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          返回总览
        </button>
      </div>
    );
  }

  const filteredBabies = applyPrivacyFilter(babies, role) as typeof babies;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="btn-ghost -ml-2">
          <ArrowLeft className="w-4 h-4" />
          返回总览
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            {cls.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {babies.length} 位宝宝在住 · 今日 {cls.todayAnomalyCount} 项待处理异常
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
          宝宝列表
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBabies.map((baby, idx) => {
            const realBabyId = babies[idx].id;
            const count = babyPendingAnomalyCount.get(realBabyId) ?? 0;
            return (
              <Link
                key={baby.id}
                to={`/baby/${baby.id}`}
                className="card-hoverable p-4 block group"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={baby.avatar}
                    alt=""
                    className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                        {baby.name}
                      </h3>
                      {count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-dot flex-shrink-0">
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" />
                        {baby.bedNo}
                      </span>
                      {baby.allergies.length > 0 && (
                        <span className="flex items-center gap-1 text-coral-600">
                          <AlertCircle className="w-3 h-3" />
                          {baby.allergies.length} 项过敏
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                {baby.allergies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {baby.allergies.map((a) => (
                      <span
                        key={a}
                        className="chip bg-coral-50 text-coral-700 border border-coral-100"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {a}过敏
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
          {filteredBabies.length === 0 && (
            <div className="col-span-full text-center py-10 text-sm text-slate-400">
              <Baby className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              该班级暂无宝宝
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
