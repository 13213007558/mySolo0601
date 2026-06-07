import SummaryPanel from '@/components/SummaryPanel';
import ScheduleList from '@/components/ScheduleList';
import ScheduleDetail from '@/components/ScheduleDetail';
import ExportPanel from '@/components/ExportPanel';
import { Baby, ShieldCheck, Puzzle, Wrench, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0a0d17]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-amber-400/40 via-sky-500/30 to-violet-500/40 blur-md opacity-70" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1220] ring-1 ring-white/10">
                <Baby className="h-5 w-5 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-semibold tracking-tight text-white">
                  婴幼儿接送授权排程板
                </h1>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-amber-300">
                  试听顾问版
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                  <Sparkles className="h-2.5 w-2.5" /> v1.0
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-white/40">
                身份 · 材料 · 状态 三端绑定 · 异常审计可追溯 · 导出报告与页面一致
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
              <ShieldCheck className="h-3 w-3 text-emerald-300" />
              身份核验
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
              <Puzzle className="h-3 w-3 text-orange-300" />
              部分成功
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/60">
              <Wrench className="h-3 w-3 text-teal-300" />
              人工更正
            </div>
            <ExportPanel />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 sm:p-6">
        <SummaryPanel />

        <section className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <ScheduleList />
          </div>
          <div className="lg:col-span-8">
            <ScheduleDetail />
          </div>
        </section>

        <footer className="mt-2 border-t border-white/5 pt-3 text-center text-[10px] text-white/30">
          © 试听顾问版 · 样例中包含一条手工补录（SCH-005 浩浩），可对比补录前后差异；失败路径（SCH-004 桐桐）与部分成功（SCH-001 果果）均已标注，便于主管复盘
        </footer>
      </main>
    </div>
  );
}
