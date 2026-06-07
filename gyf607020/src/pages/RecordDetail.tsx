import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Baby, Calendar, FileKey, Droplets, Hash, UserCheck, Clock, FileWarning } from 'lucide-react';
import Navbar from '@/components/Navbar';
import StatusTag from '@/components/StatusTag';
import IssueList from '@/components/IssueList';
import ReviewPanel from '@/components/ReviewPanel';
import ReviewTimeline from '@/components/ReviewTimeline';
import type { MilkRecord } from '@shared/types';
import { formatDate, formatMilk, maskPhone, maskIdCard } from '@/utils/format';
import { useStore } from '@/store/useStore';

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchRecords } = useStore();
  const [record, setRecord] = useState<MilkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/records/${id}`);
      if (res.status === 404) {
        setError('记录不存在，可能已被删除');
        return;
      }
      if (!res.ok) throw new Error('加载失败');
      setRecord(await res.json());
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleUpdated() {
    load();
    fetchRecords();
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-20">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-card p-8 text-center text-red-600">
            <FileWarning className="w-10 h-10 mx-auto mb-2 text-red-400" />
            {error || '记录不存在'}
          </div>
        </div>
      </div>
    );
  }

  const row =
    'grid grid-cols-[110px_1fr] items-start gap-2 py-2.5 border-b border-cream-100 last:border-0';
  const labelCls = 'text-xs text-gray-500 flex items-center gap-1.5';

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="flex items-center gap-3 animate-fade-in">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>
          <div className="h-4 w-px bg-cream-300" />
          <h2 className="font-serif text-xl font-bold text-gray-800">售后记录详情</h2>
          <StatusTag status={record.status} />
          {record.isBadData && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              已隔离
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-card shadow-card border border-cream-200 p-5 animate-fade-in">
              <h3 className="font-serif text-lg font-semibold text-gray-800 mb-4">基础信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <div className={row}>
                  <span className={labelCls}><Baby className="w-3.5 h-3.5" />婴儿姓名</span>
                  <span className="text-gray-800 font-medium">{record.babyName}</span>
                </div>
                <div className={row}>
                  <span className={labelCls}><Calendar className="w-3.5 h-3.5" />出生日期</span>
                  <span className="text-gray-700">{record.babyBirthday || '—'}</span>
                </div>
                <div className={row}>
                  <span className={labelCls}><User className="w-3.5 h-3.5" />家长姓名</span>
                  <span className="text-gray-800">{record.parentName}</span>
                </div>
                <div className={row}>
                  <span className={labelCls}><User className="w-3.5 h-3.5" />家长手机号</span>
                  <div>
                    <span className="font-mono text-gray-800">{record.parentPhone}</span>
                    <span className="text-xs text-gray-400 ml-2">（导出：{maskPhone(record.parentPhone)}）</span>
                  </div>
                </div>
                {record.parentIdCard && (
                  <div className={row}>
                    <span className={labelCls}><UserCheck className="w-3.5 h-3.5" />家长身份证</span>
                    <div>
                      <span className="font-mono text-xs text-gray-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        {maskIdCard(record.parentIdCard)}
                      </span>
                      <span className="text-xs text-rose-500 ml-2">（隐私字段，已脱敏显示）</span>
                    </div>
                  </div>
                )}
                <div className={row}>
                  <span className={labelCls}><Droplets className="w-3.5 h-3.5" />奶量</span>
                  <span className="text-gray-800 font-medium">{formatMilk(record)}</span>
                </div>
                <div className={row}>
                  <span className={labelCls}><FileKey className="w-3.5 h-3.5" />授权编号</span>
                  <span className="font-mono text-gray-700 text-sm">{record.authorizationNo}</span>
                </div>
                <div className={row}>
                  <span className={labelCls}><Hash className="w-3.5 h-3.5" />记录 ID</span>
                  <span className="font-mono text-xs text-gray-400">{record.id.slice(0, 13)}...</span>
                </div>
                <div className={row}>
                  <span className={labelCls}><Clock className="w-3.5 h-3.5" />创建时间</span>
                  <span className="text-gray-700 text-sm">{formatDate(record.createdAt)}</span>
                </div>
                {record.reviewedAt && (
                  <div className={row}>
                    <span className={labelCls}><Clock className="w-3.5 h-3.5" />复核时间</span>
                    <span className="text-gray-700 text-sm">{formatDate(record.reviewedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {record.dataIssues && record.dataIssues.length > 0 && (
              <IssueList issues={record.dataIssues} />
            )}

            <ReviewTimeline recordId={record.id} />
          </div>

          <div className="lg:col-span-1">
            <ReviewPanel record={record} onUpdated={handleUpdated} />
          </div>
        </div>
      </main>
    </div>
  );
}
