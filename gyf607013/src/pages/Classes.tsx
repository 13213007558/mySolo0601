import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Baby as BabyIcon,
  AlertCircle,
  ChevronDown,
  Loader2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import PrivacyCell from '@/components/PrivacyCell';
import { api } from '@/utils/api';
import { formatDate, getSourceLabel } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { ClassInfo, DisinfectionRecord, Baby } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export default function Classes() {
  const { currentUser } = useAuthStore();
  const role = currentUser?.role ?? 'staff';

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [records, setRecords] = useState<DisinfectionRecord[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadClassDetails(selectedClassId);
    }
  }, [selectedClassId]);

  async function loadClasses() {
    setLoading(true);
    try {
      const res = await api<ApiResponse<ClassInfo[]>>('/classes');
      if (res.success) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error('加载班级失败:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadClassDetails(classId: string) {
    setRecordsLoading(true);
    try {
      const [recordsRes, babiesRes] = await Promise.all([
        api<ApiResponse<DisinfectionRecord[]>>(`/schedules?classId=${classId}`),
        api<ApiResponse<Baby[]>>(`/babies?classId=${classId}`),
      ]);
      if (recordsRes.success) setRecords(recordsRes.data);
      if (babiesRes.success) setBabies(babiesRes.data);
    } catch (err) {
      console.error('加载班级详情失败:', err);
    } finally {
      setRecordsLoading(false);
    }
  }

  function getBabyName(babyId: string): string {
    const baby = babies.find((b) => b.id === babyId);
    return baby?.name ?? '';
  }

  function toggleClass(classId: string) {
    setSelectedClassId(selectedClassId === classId ? null : classId);
  }

  function renderProgressRing(rate: number) {
    const percent = Math.round(rate * 100);
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-ink-100"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              percent >= 90 ? 'text-mint-500' : percent >= 75 ? 'text-warm-500' : 'text-danger-500'
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink-800">
          {percent}%
        </div>
      </div>
    );
  }

  if (loading) {
    return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-medical-500" />
        </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-medical-50">
            <GraduationCap className="h-5 w-5 text-medical-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900 page-title">班级总览</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {classes.map((cls) => {
          const isSelected = selectedClassId === cls.id;
          return (
            <div key={cls.id} className="col-span-1">
              <div
                onClick={() => toggleClass(cls.id)}
                className={cn(
                  'group cursor-pointer rounded-2xl border bg-white p-6 shadow-card transition-all hover:shadow-card-hover',
                  isSelected && 'border-medical-300 ring-2 ring-medical-100'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink-900">{cls.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{cls.babyCount} 名宝宝</span>
                    </div>
                  </div>
                  <div className="relative">
                    {renderProgressRing(cls.completionRate)}
                    {cls.exceptionCount > 0 && (
                      <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1.5 text-xs font-medium text-white">
                        <AlertCircle className="mr-0.5 h-3 w-3" />
                        {cls.exceptionCount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-ink-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-mint-500" />
                    <span>完成率</span>
                  </div>
                  <div className="flex items-center gap-1 text-ink-600 transition-transform group-hover:text-medical-600">
                    <span>{isSelected ? '收起详情' : '查看消毒记录'}</span>
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isSelected && 'rotate-180')}
                    />
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-card animate-fade-in-up">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-semibold text-ink-800">消毒记录</h4>
                    <div className="text-sm text-ink-500">共 {records.length} 条记录</div>
                  </div>

                  {recordsLoading ? (
                    <div className="flex h-32 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-medical-500" />
                    </div>
                  ) : records.length === 0 ? (
                    <div className="py-8 text-center text-sm text-ink-400">暂无消毒记录</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-500">
                            <th className="px-3 py-3">物品</th>
                            <th className="px-3 py-3">宝宝</th>
                            <th className="px-3 py-3">时间</th>
                            <th className="px-3 py-3">状态</th>
                            <th className="px-3 py-3">操作人</th>
                            <th className="px-3 py-3">处理人</th>
                            <th className="px-3 py-3">来源</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((record) => (
                            <tr
                              key={record.id}
                              className="border-b border-ink-50 transition-colors hover:bg-ink-50/50"
                            >
                              <td className="px-3 py-3 font-medium text-ink-800">
                                {record.itemName}
                              </td>
                              <td className="px-3 py-3">
                                <Link
                                  to={`/baby/${record.babyId}`}
                                  className="text-medical-600 hover:text-medical-700 hover:underline"
                                >
                                  <div className="flex items-center gap-1">
                                    <BabyIcon className="h-3.5 w-3.5" />
                                    <PrivacyCell
                                      value={getBabyName(record.babyId)}
                                      field="baby.name"
                                      role={role}
                                    />
                                  </div>
                                </Link>
                              </td>
                              <td className="px-3 py-3 text-ink-600">
                                {formatDate(record.actualTime || record.scheduledTime, true)}
                              </td>
                              <td className="px-3 py-3">
                                <StatusBadge status={record.status} />
                              </td>
                              <td className="px-3 py-3 text-ink-600">
                                {record.operatorName || '-'}
                              </td>
                              <td className="px-3 py-3 text-ink-600">
                                {record.handlerName || '-'}
                              </td>
                              <td className="px-3 py-3">
                                <span
                                  className={cn(
                                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs',
                                    record.source === 'scan'
                                      ? 'bg-mint-50 text-mint-700'
                                      : 'bg-warm-50 text-warm-700'
                                  )}
                                >
                                  {getSourceLabel(record.source)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
