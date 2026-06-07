import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, AlertTriangle, Layers } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import RecordTimeline from '@/components/RecordTimeline';
import AddRecordModal from '@/components/AddRecordModal';
import StatusBadge from '@/components/StatusBadge';
import { SOURCE_LABEL, sourceColor, formatDateTime } from '@/utils/format';

export default function BabyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { detailBaby, detailRecords, loading, fetchDetail, clearDetail } = useAuthStore();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (id) fetchDetail(id);
    return () => clearDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const latest = detailRecords[0];
  const anomalyRecords = detailRecords.filter((r) => r.affectsSummary === false || !!r.anomalyReason);

  return (
    <div className="min-h-screen bg-paper-texture">
      <header className="sticky top-0 z-30 border-b border-night-500/60 bg-night-800/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1 rounded-md border border-night-400/60 bg-night-600 px-3 py-1.5 text-sm text-night-100 transition hover:bg-night-500"
          >
            <ArrowLeft size={14} />
            返回汇总
          </button>
          <div className="text-sm text-night-200">
            {detailBaby ? (
              <>
                <span className="font-display text-base font-semibold text-night-50">{detailBaby.name}</span>
                <span className="mx-2 text-night-400">·</span>
                <span>{detailBaby.className}</span>
              </>
            ) : (
              loading ? '加载中…' : '未找到'
            )}
          </div>
          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-night-900 transition hover:bg-amber-400"
          >
            <Plus size={14} />
            补录
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {loading && (
          <div className="rounded-xl border border-night-500/60 bg-night-600/60 p-8 text-center text-sm text-night-200">
            正在从服务器读取历史版本…
          </div>
        )}

        {!loading && detailBaby && latest && (
          <section className="fade-in-up mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-night-500/60 bg-night-600/60 p-4">
              <div className="text-xs text-night-200">最新授权状态</div>
              <div className="mt-2"><StatusBadge status={latest.status} /></div>
            </div>
            <div className="rounded-xl border border-night-500/60 bg-night-600/60 p-4">
              <div className="text-xs text-night-200">最新来源</div>
              <div className={`mt-2 font-display text-lg font-semibold ${sourceColor(latest.source)}`}>
                {SOURCE_LABEL[latest.source]}
              </div>
            </div>
            <div className="rounded-xl border border-night-500/60 bg-night-600/60 p-4">
              <div className="text-xs text-night-200">最近更新</div>
              <div className="mt-2 font-display text-lg font-semibold text-night-50">
                {formatDateTime(latest.createdAt)}
              </div>
            </div>
          </section>
        )}

        {!loading && detailBaby && (
          <section className="fade-in-up mb-6 flex flex-wrap items-center gap-3 text-xs text-night-200" style={{ animationDelay: '80ms' }}>
            <span className="inline-flex items-center gap-1 rounded-full border border-night-500/60 bg-night-600/60 px-3 py-1">
              <Layers size={12} />
              共 {detailRecords.length} 个历史版本
            </span>
            {anomalyRecords.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-3 py-1 text-danger">
                <AlertTriangle size={12} />
                {anomalyRecords.length} 条异常/隔离记录
              </span>
            )}
          </section>
        )}

        {!loading && detailBaby && (
          <section>
            <h2 className="mb-4 font-display text-base font-semibold text-night-50">版本时间线（由新到旧）</h2>
            <RecordTimeline records={detailRecords} />
          </section>
        )}

        {!loading && !detailBaby && (
          <div className="rounded-xl border border-night-500/60 bg-night-600/60 p-8 text-center text-sm text-night-200">
            该宝宝不存在，请返回汇总页
          </div>
        )}
      </main>

      <AddRecordModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        preselectedBabyId={detailBaby?.id}
      />
    </div>
  );
}
