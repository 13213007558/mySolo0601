import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Thermometer,
  Filter,
  Baby,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { STATUS_LABELS, REVIEW_STATUS_LABELS } from '../../shared/types';
import type { DailyCheckRecord, CheckStatus, ReviewStatus } from '../../shared/types';
import StatusBadge from '@/components/StatusBadge';
import ReviewModal from '@/components/ReviewModal';

const statusColors: Record<CheckStatus, string> = {
  normal: 'bg-health-normal',
  abnormal: 'bg-health-abnormal',
  pending: 'bg-health-pending',
  leave: 'bg-health-leave',
};

const reviewColors: Record<ReviewStatus, string> = {
  unreviewed: 'text-orange-600 bg-orange-50 border-orange-200',
  reviewed: 'text-green-600 bg-green-50 border-green-200',
  appealed: 'text-blue-600 bg-blue-50 border-blue-200',
};

export default function ReviewWall() {
  const navigate = useNavigate();
  const {
    babies,
    records,
    selectedDate,
    selectedClassName,
    selectedStatus,
    searchKeyword,
    setSelectedDate,
    setSelectedClassName,
    setSelectedStatus,
    setSearchKeyword,
    fetchBabies,
    fetchRecords,
  } = useAppStore();

  const [selectedRecord, setSelectedRecord] = useState<DailyCheckRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [failedDates] = useState<Set<string>>(new Set(['2026-06-03']));

  useEffect(() => {
    fetchBabies();
  }, [fetchBabies]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, selectedDate, selectedClassName, selectedStatus]);

  const babyMap = useMemo(() => {
    const m = new Map<string, typeof babies[0]>();
    babies.forEach((b) => m.set(b.id, b));
    return m;
  }, [babies]);

  const allDates = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.date));
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      set.add(d.toISOString().split('T')[0]);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const classes = useMemo(() => {
    const s = new Set<string>();
    babies.forEach((b) => s.add(b.className));
    return Array.from(s);
  }, [babies]);

  const filteredRecords = useMemo(() => {
    let list = records.filter((r) => r.date === selectedDate);
    if (selectedClassName) {
      const ids = babies.filter((b) => b.className === selectedClassName).map((b) => b.id);
      list = list.filter((r) => ids.includes(r.babyId));
    }
    if (selectedStatus) list = list.filter((r) => r.status === selectedStatus);
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter((r) => {
        const baby = babyMap.get(r.babyId);
        return baby?.name.toLowerCase().includes(kw) || baby?.className.toLowerCase().includes(kw);
      });
    }
    return list;
  }, [records, selectedDate, selectedClassName, selectedStatus, searchKeyword, babies, babyMap]);

  const stats = useMemo(() => {
    const s = { total: 0, normal: 0, abnormal: 0, pending: 0, leave: 0, unreviewed: 0 };
    records.filter((r) => r.date === selectedDate).forEach((r) => {
      s.total++;
      s[r.status]++;
      if (r.reviewStatus === 'unreviewed') s.unreviewed++;
    });
    return s;
  }, [records, selectedDate]);

  const dateFailed = failedDates.has(selectedDate);

  const formatDateLabel = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
    let label = '';
    if (diff === 0) label = '今天';
    else if (diff === 1) label = '昨天';
    else if (diff === 2) label = '前天';
    return { label, weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] };
  };

  const handleOpenReview = (record: DailyCheckRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedRecord(record);
    setModalOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 min-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Baby className="w-6 h-6 text-brand-500" />
            宝宝复核墙
          </h2>
          <p className="text-gray-500 mt-1">倒序浏览晨检记录，点击宝宝卡片查看详情</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-500" />
              日期选择（倒序）
            </h3>
            <div className="space-y-1.5">
              {allDates.map((d) => {
                const { label, weekday } = formatDateLabel(d);
                const failed = failedDates.has(d);
                const active = selectedDate === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? 'bg-brand-500 text-white shadow-md'
                        : failed
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          {label || d.slice(5)}
                          {failed && <AlertTriangle className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-gray-500'}`}>
                          {weekday} {!label ? d.slice(0, 4) : ''}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${active ? 'translate-x-0' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              班级筛选
            </h3>
            <select
              className="select-field"
              value={selectedClassName}
              onChange={(e) => setSelectedClassName(e.target.value)}
            >
              <option value="">全部班级</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-500" />
              状态筛选
            </h3>
            <div className="space-y-1.5">
              {(['', 'normal', 'abnormal', 'pending', 'leave'] as const).map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setSelectedStatus(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStatus === s
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s ? STATUS_LABELS[s] : '全部状态'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: '总记录', value: stats.total, icon: Users, cls: 'bg-gray-100 text-gray-700' },
              { label: '正常', value: stats.normal, icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
              { label: '异常', value: stats.abnormal, icon: AlertTriangle, cls: 'bg-red-100 text-red-700' },
              { label: '待复核', value: stats.pending, icon: Clock, cls: 'bg-orange-100 text-orange-700' },
              { label: '未处理', value: stats.unreviewed, icon: Thermometer, cls: 'bg-brand-100 text-brand-700' },
            ].map((it) => {
              const Icon = it.icon;
              return (
                <div key={it.label} className="card p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${it.cls} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{it.label}</p>
                    <p className="text-xl font-bold font-display text-gray-900">{it.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {dateFailed && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3 animate-fade-in-up">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800">该日期部分数据加载失败</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  但不影响您查看其他日期的正常数据，可继续复核其他宝宝
                </p>
              </div>
            </div>
          )}

          <div className="card p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索宝宝姓名..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="card border-2 border-dashed border-gray-200">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Baby className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="font-display text-lg font-semibold text-gray-600 mb-1">暂无晨检记录</h4>
                <p className="text-sm text-gray-400 max-w-sm">
                  {selectedDate} 暂无符合条件的晨检数据，请尝试切换日期或调整筛选条件
                </p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRecords.map((rec, idx) => {
                const baby = babyMap.get(rec.babyId);
                const maxTemp = rec.temperatures.length > 0
                  ? Math.max(...rec.temperatures.map((t) => t.temperature))
                  : null;
                const isAbnormal = rec.status === 'abnormal' || rec.status === 'pending';
                return (
                  <div
                    key={rec.id}
                    onClick={() => navigate(`/review/${rec.id}`)}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className={`card card-hover cursor-pointer relative overflow-hidden animate-fade-in-up`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${statusColors[rec.status]}`} />

                    {isAbnormal && (
                      <div className="absolute top-4 right-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-health-abnormal block animate-pulse-soft" />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                          <Baby className="w-6 h-6 text-brand-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{baby?.name || '未知宝宝'}</h4>
                          <p className="text-xs text-gray-500">{baby?.className || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <StatusBadge status={rec.status} pulse={isAbnormal} size="sm" />
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${reviewColors[rec.reviewStatus]}`}>
                        {REVIEW_STATUS_LABELS[rec.reviewStatus]}
                      </span>
                    </div>

                    {maxTemp !== null && (
                      <div className="flex items-center gap-2 mb-3">
                        <Thermometer className={`w-4 h-4 ${maxTemp >= 37.5 ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`text-lg font-display font-bold ${maxTemp >= 37.5 ? 'text-red-600' : 'text-gray-700'}`}>
                          {maxTemp.toFixed(1)}℃
                        </span>
                        <span className="text-xs text-gray-400">/ 共 {rec.temperatures.length} 次测量</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                      {rec.initialReason || '暂无备注'}
                    </p>

                    {rec.reviewStatus === 'unreviewed' && (
                      <button
                        onClick={(e) => handleOpenReview(rec, e)}
                        className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-1.5"
                      >
                        人工改判
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        record={selectedRecord}
        babyName={selectedRecord ? babyMap.get(selectedRecord.babyId)?.name : undefined}
      />
    </div>
  );
}
