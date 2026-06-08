import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Baby, Download, UtensilsCrossed, CalendarDays } from "lucide-react";
import { useStore } from "@/store/useStore";
import RoleSwitcher from "@/components/RoleSwitcher";
import StatusFilterTabs from "@/components/StatusFilterTabs";
import ParentNoteBanner from "@/components/ParentNoteBanner";
import RecordCard from "@/components/RecordCard";
import ExportPanel from "@/components/ExportPanel";

export default function Home() {
  const navigate = useNavigate();
  const records = useStore((s) => s.records);
  const activeFilter = useStore((s) => s.activeFilter);
  const currentRole = useStore((s) => s.currentRole);
  const needsReconfirm = useStore((s) => s.needsReconfirm);

  const filteredRecords = useMemo(() => {
    if (activeFilter === "all") {
      return records;
    }
    return records.filter((r) => r.status === activeFilter);
  }, [records, activeFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof records> = {};
    for (const r of filteredRecords) {
      if (!groups[r.dateLabel]) groups[r.dateLabel] = [];
      groups[r.dateLabel].push(r);
    }
    return groups;
  }, [filteredRecords]);

  const stats = useMemo(() => {
    const valid = records.filter((r) => r.status !== "invalid");
    return {
      total: valid.length,
      normal: valid.filter((r) => r.status === "normal").length,
      abnormal: valid.filter((r) => ["abnormal", "pending_review"].includes(r.status)).length,
      revised: valid.filter((r) => r.status === "revised").length,
    };
  }, [records]);

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-cream-100/80 border-b border-cream-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sage-300 to-sage-500 flex items-center justify-center shadow-md">
                <Baby size={22} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-ink-800 leading-tight">
                  沐沐辅食对账台
                </h1>
                <p className="text-xs text-ink-700/60">婴幼儿辅食禁忌 · 家庭协作版</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate("/export")}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <Download size={16} />
                导出
              </button>
              <div className="hidden md:block w-56">
                <RoleSwitcher />
              </div>
            </div>
          </div>

          <div className="md:hidden mt-3">
            <RoleSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {needsReconfirm && <ParentNoteBanner />}

        {currentRole !== "elder" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "总记录", value: stats.total, icon: CalendarDays, color: "text-ink-800", bg: "bg-cream-100" },
              { label: "正常", value: stats.normal, icon: UtensilsCrossed, color: "text-sage-700", bg: "bg-sage-100" },
              { label: "异常/待处理", value: stats.abnormal, icon: Baby, color: "text-baby-500", bg: "bg-baby-100" },
              { label: "已改判", value: stats.revised, icon: Download, color: "text-sunset-500", bg: "bg-sunset-100" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="card-base p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon size={18} className={s.color} />
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${s.color} leading-tight`}>{s.value}</div>
                    <div className="text-xs text-ink-700/60">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <StatusFilterTabs />

        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <section key={date} className="animate-fade-in">
              <h2 className="font-display font-bold text-lg text-ink-800 mb-3 flex items-center gap-2">
                <CalendarDays size={18} className="text-sage-500" />
                {date}
                <span className="text-sm font-normal text-ink-700/50">
                  ({items.length} 餐)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((r) => (
                  <RecordCard key={r.id} record={r} />
                ))}
              </div>
            </section>
          ))}

          {filteredRecords.length === 0 && (
            <div className="card-base p-12 text-center">
              <UtensilsCrossed size={40} className="text-cream-200 mx-auto mb-3" />
              <p className="text-ink-700/50">当前筛选下没有记录</p>
            </div>
          )}
        </div>

        <div className="card-base p-5">
          <ExportPanel />
        </div>

        <footer className="text-center text-xs text-ink-700/40 pt-4">
          婴幼儿辅食禁忌对账台 · 家庭协作版 · 三日食材确认 · 所有操作留痕可追溯
        </footer>
      </main>
    </div>
  );
}
