import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Baby,
  Phone,
  CalendarDays,
  User,
  Hand,
  History,
  ShieldAlert,
  UtensilsCrossed,
  Camera,
  Gauge,
} from "lucide-react";
import { useRecordStore } from "@/store/useRecordStore";
import StatusBadge from "@/components/StatusBadge";
import IngredientTable from "@/components/IngredientTable";
import TabooList from "@/components/TabooList";
import StatusTimeline from "@/components/StatusTimeline";
import ReviewModal from "@/components/ReviewModal";
import { maskPhone, formatDateTime } from "@/utils/id";
import type { ReviewTarget } from "@/types";

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const getRecordById = useRecordStore((s) => s.getRecordById);
  const reviewRecord = useRecordStore((s) => s.reviewRecord);
  const record = id ? getRecordById(id) : undefined;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!record) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <div className="font-serif text-xl text-gray-800 mb-2">找不到该对账记录</div>
          <p className="text-sm text-mistblue-400 mb-5">该记录可能已被删除或 ID 不存在</p>
          <button onClick={() => nav("/")} className="btn-primary">
            <ArrowLeft size={16} /> 返回列表
          </button>
        </div>
      </div>
    );
  }

  const handleReview = (target: ReviewTarget, reason: string) => {
    const ok = reviewRecord(record.id, target, reason);
    if (ok) {
      setToast(`已完成人工改判：${target === "normal" ? "正常" : "异常"}`);
      setTimeout(() => setToast(null), 2600);
    }
    return ok;
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-cream-50/85 backdrop-blur border-b border-cream-100">
        <div className="container px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => nav("/")} className="btn-secondary !px-3 !py-2">
              <ArrowLeft size={16} /> 返回
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-semibold text-gray-800">
                  {record.babyName} 的辅食对账详情
                </h1>
                <StatusBadge status={record.status} />
                {record.source === "manual" && (
                  <span className="chip bg-coral-50 text-coral-500 border-coral-200">
                    <Hand size={12} /> 手工补录
                  </span>
                )}
              </div>
              <div className="text-xs text-mistblue-400 mt-0.5">
                {record.parentName} · {maskPhone(record.parentPhone)} · 对账日 {record.checkDate}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setReviewOpen(true)} className="btn-primary">
              <ShieldAlert size={16} /> 人工改判
            </button>
          </div>
        </div>
      </header>

      <main className="container px-6 pt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed size={18} className="text-milkgreen-500" />
              <h2 className="font-serif text-lg font-semibold text-gray-800">三日食材与禁忌对照</h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                <IngredientTable ingredients={record.ingredients} taboos={record.taboos} />
              </div>
              <div className="card p-4 bg-cream-50 border-cream-100">
                <div className="flex items-center gap-2 mb-3 text-sm text-mistblue-500">
                  <Camera size={14} /> 餐盘照片
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-cream-100 to-cream-200 flex flex-col items-center justify-center text-mistblue-400">
                  <Camera size={36} strokeWidth={1.2} />
                  <div className="text-xs mt-2">现场照片占位</div>
                </div>
                <div className="mt-3 text-xs text-mistblue-400 leading-relaxed">
                  店长早会前持餐盘照片现场核对，此处可对接拍照上传。
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gauge size={18} className="text-coral-500" />
              <h2 className="font-serif text-lg font-semibold text-gray-800">
                禁忌匹配结果
                <span className="ml-2 text-sm font-normal text-mistblue-400">
                  共 {record.taboos.length} 条
                </span>
              </h2>
            </div>
            <TabooList taboos={record.taboos} />
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-mistblue-500" />
              <h2 className="font-serif text-lg font-semibold text-gray-800">状态变更时间线</h2>
            </div>
            <p className="text-xs text-mistblue-400 mb-4">
              包含自动判定、人工改判、重复提交拦截、页面刷新恢复等所有事件，详情原因均已记录。
            </p>
            <StatusTimeline logs={record.statusLogs} />
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-mistblue-500" />
              <h2 className="font-serif text-lg font-semibold text-gray-800">基础信息</h2>
            </div>
            <dl className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Baby size={16} className="text-milkgreen-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-mistblue-400">宝宝</div>
                  <div className="font-medium text-gray-800">
                    {record.babyName} · {record.babyMonthAge} 月龄
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User size={16} className="text-milkgreen-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-mistblue-400">家长</div>
                  <div className="font-medium text-gray-800">{record.parentName}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={16} className="text-milkgreen-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-mistblue-400">联系电话</div>
                  <div className="font-medium text-gray-800">
                    {record.parentPhone}
                    <span className="text-mistblue-400 font-normal ml-1">（{maskPhone(record.parentPhone)}）</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays size={16} className="text-milkgreen-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-mistblue-400">对账日期</div>
                  <div className="font-medium text-gray-800">{record.checkDate}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-cream-100 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-mistblue-400">提交方式</div>
                  <div className="font-medium text-gray-800 mt-0.5">{record.submitMethod}</div>
                </div>
                <div>
                  <div className="text-xs text-mistblue-400">最后更新</div>
                  <div className="font-medium text-gray-800 mt-0.5">{formatDateTime(record.updatedAt)}</div>
                </div>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={18} className="text-coral-400" />
              <h2 className="font-serif text-lg font-semibold text-gray-800">人工改判</h2>
            </div>
            <p className="text-sm text-mistblue-400 mb-4 leading-relaxed">
              若系统判定结果与现场情况不符，店长可人工改判。改判原因将永久写入状态时间线，供后续核对追溯。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setReviewOpen(true)} className="btn-primary !justify-center">
                判为正常
              </button>
              <button
                onClick={() => setReviewOpen(true)}
                className="btn-danger !justify-center"
              >
                判为异常
              </button>
            </div>
            {record.status === "reviewed" && (
              <div className="mt-4 p-3 rounded-xl bg-milkgreen-50 border border-milkgreen-200 text-sm text-milkgreen-600">
                该记录已完成人工复核，可继续改判覆盖上次结论。
              </div>
            )}
          </section>

          <section className="card p-6 bg-gradient-to-br from-cream-50 to-cream-100/70">
            <div className="text-sm font-medium text-mistblue-500 mb-2">快速提示</div>
            <ul className="text-xs text-mistblue-400 space-y-1.5 leading-relaxed">
              <li>· 手机号筛选后再导出，可确保页面与客服核对条数一致</li>
              <li>· 重复提交会被系统自动拦截，原记录不被覆盖</li>
              <li>· 页面刷新后状态从本地存储恢复，并留下恢复日志</li>
              <li>· 损坏数据会自动隔离，不会污染正常记录</li>
            </ul>
          </section>
        </div>
      </main>

      <ReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} onSubmit={handleReview} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-milkgreen-500 text-white shadow-lg animate-fade-in-up text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}
