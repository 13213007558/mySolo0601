import { Form } from "@remix-run/react";
import { Anchor, MapPin, ChevronRight, Waves } from "lucide-react";
import type { DivePlan, HistoricalProfile, User } from "~/data/types";
import { formatDepth, formatDurationMM } from "~/utils/format";

interface Props {
  plans: DivePlan[];
  historicalProfiles: HistoricalProfile[];
  user: User;
  onSelectPlan: (planId: string) => void;
}

export default function PlanSelector({ plans, historicalProfiles, user, onSelectPlan }: Props) {
  const canStart = user.role === "instructor" || user.role === "admin";

  return (
    <div className="min-h-screen w-full p-6 md:p-10 bg-nautical-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-md bg-indicator-cyan/10 border-2 border-indicator-cyan flex items-center justify-center shadow-led-cyan">
            <Anchor className="w-7 h-7 text-indicator-cyan" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">选择下潜计划</h1>
            <p className="text-sm text-slate-400">
              欢迎，<span className="text-indicator-cyan font-semibold">{user.name}</span>
              <span className="mx-2 text-slate-600">|</span>
              {canStart ? "教练/管理员可发起下潜作业" : "请等待教练发起作业"}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {plans.map((plan, idx) => {
            const hpCount = historicalProfiles.filter(hp => hp.siteName === plan.siteName).length;
            return (
              <div
                key={plan.id}
                className="console-card p-5 hover:border-indicator-cyan/60 transition-all group cursor-pointer"
                onClick={() => canStart && onSelectPlan(plan.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-nautical-700 border border-nautical-600 text-indicator-cyan reading-mono text-sm font-bold">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg text-slate-100 leading-tight">{plan.siteName}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {plan.siteGpsLat.toFixed(2)}°N {plan.siteGpsLng.toFixed(2)}°E
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${canStart ? "text-slate-600 group-hover:text-indicator-cyan group-hover:translate-x-1" : "text-slate-700"}`} />
                </div>

                <div className="console-divider mb-4" />

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="p-2.5 bg-nautical-900/60 rounded-sm border border-nautical-700/60">
                    <div className="text-[10px] uppercase text-slate-500 tracking-wider">最大深度</div>
                    <div className="reading-mono text-xl text-indicator-cyan font-bold mt-0.5">{formatDepth(plan.maxDepth)}</div>
                  </div>
                  <div className="p-2.5 bg-nautical-900/60 rounded-sm border border-nautical-700/60">
                    <div className="text-[10px] uppercase text-slate-500 tracking-wider">减压阶梯</div>
                    <div className="reading-mono text-xl text-indicator-amber font-bold mt-0.5">{plan.steps.length} 阶</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mb-4">
                  {plan.steps.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-slate-300">
                      <span className="w-1 h-1 rounded-full bg-indicator-cyan/60" />
                      <span className="reading-mono w-16 text-indicator-cyan">{formatDepth(s.plannedDepth)}</span>
                      <Waves className="w-3 h-3 text-slate-600" />
                      <span className="reading-mono text-slate-400">停留 {formatDurationMM(s.plannedDuration)}</span>
                    </div>
                  ))}
                  {plan.steps.length > 5 && (
                    <div className="text-slate-600 pl-3">... 另有 {plan.steps.length - 5} 阶浅水区停留</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-nautical-700/60 text-xs">
                  <span className="text-slate-500">历史潜次: <span className="text-indicator-cyan reading-mono">{hpCount}</span></span>
                  {canStart ? (
                    <span className="text-indicator-cyan font-semibold">点击启动 →</span>
                  ) : (
                    <span className="text-slate-600">教练专属操作</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!canStart && (
          <div className="p-5 rounded-md bg-indicator-amber/10 border-2 border-indicator-amber/50 text-center">
            <p className="text-indicator-amber font-semibold">您当前以 <strong>{user.name}</strong> 身份登录，系统等待教练 IR001（王教练）发起下潜计划。</p>
            <p className="text-xs text-slate-400 mt-2">请切换账号或通知教练启动作业。</p>
            <Form method="post" className="inline-block mt-3">
              <input type="hidden" name="intent" value="logout" />
              <button className="btn-industrial-muted !py-1.5 !text-xs">切换账号</button>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
}
