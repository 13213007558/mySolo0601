import { useReducer, useEffect, useMemo, useRef, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { USERS, DIVE_PLANS, HISTORICAL_PROFILES } from "~/data/mockData";
import { getSession, commitSession, destroySession } from "~/data/session.server";
import type { User, DivePlan, HistoricalProfile, DiveAlert } from "~/data/types";
import LoginPanel from "~/components/LoginPanel";
import PlanSelector from "~/components/PlanSelector";
import TopBar from "~/components/TopBar";
import DecompressionLadder from "~/components/DecompressionLadder";
import SupportPanel from "~/components/SupportPanel";
import ProfileChart from "~/components/ProfileChart";
import EmergencyButton from "~/components/EmergencyButton";
import SurfaceToken from "~/components/SurfaceToken";
import AlertOverlay from "~/components/AlertOverlay";
import { useAlertSound } from "~/hooks/useAlertSound";
import { getCurrentGps } from "~/utils/gps";
import { generateDivePdf } from "~/utils/pdfGenerator";
import { generateTokenId } from "~/utils/format";
import { diveReducer } from "~/hooks/useDiveReducer";
import type { DiveAction, DiveState, DecompressionStep } from "~/data/types";
import type { Role } from "~/data/types";

export const meta: MetaFunction = () => {
  return [
    { title: "深潜减压核对台 | Decompression Checkstation" },
    { name: "description", content: "海事局合规潜水减压停留电子核对系统" },
  ];
};

interface LoaderData {
  authenticated: boolean;
  user: User | null;
  plans: DivePlan[];
  historicalProfiles: HistoricalProfile[];
  mode: "login" | "selectPlan" | "underway";
  initialDiveState?: {
    planId: string | null;
    steps: DecompressionStep[] | null;
    currentStepId: string | null;
    alerts: DiveAlert[];
    tokenId: string | null;
    surfacedAt: number | null;
    emergencyReason: string | null;
    diveMode: string | null;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId") as string | undefined;

  if (!userId) {
    return json<LoaderData>({
      authenticated: false,
      user: null,
      plans: DIVE_PLANS,
      historicalProfiles: HISTORICAL_PROFILES,
      mode: "login",
    });
  }

  const user = USERS.find(u => u.id === userId) ?? null;
  const stateKey = `dive_state_${userId}`;
  const rawState = session.get(stateKey);
  let initialDiveState: LoaderData["initialDiveState"] = {
    planId: null, steps: null, currentStepId: null, alerts: [],
    tokenId: null, surfacedAt: null, emergencyReason: null, diveMode: null,
  };
  if (rawState && typeof rawState === "object") {
    initialDiveState = rawState as LoaderData["initialDiveState"];
  }

  return json<LoaderData>({
    authenticated: true,
    user,
    plans: DIVE_PLANS,
    historicalProfiles: HISTORICAL_PROFILES,
    mode: initialDiveState?.planId ? "underway" : "selectPlan",
    initialDiveState,
  });
}

interface ActionData {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  setCookie?: string;
  diveStatePatch?: Partial<LoaderData["initialDiveState"]>;
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent") as string;
  const session = await getSession(request.headers.get("Cookie"));

  if (intent === "login") {
    const employeeId = String(form.get("employeeId") || "");
    const password = String(form.get("password") || "");
    const selectedRole = form.get("role") as Role;

    const user = USERS.find(u => u.employeeId === employeeId && u.password === password);
    if (!user) {
      return json<ActionData>({ ok: false, error: "工号或密码错误" }, { status: 401 });
    }
    if (selectedRole && user.role !== selectedRole && !(selectedRole === "diver" && user.role === "admin")) {
      // 允许 admin 选择任意角色方式登录
      if (user.role !== "admin") {
        return json<ActionData>(
          { ok: false, error: `该账号为 ${user.role} 账号，请选择正确角色` },
          { status: 403 }
        );
      }
    }
    session.set("userId", user.id);
    return json<ActionData>({ ok: true }, {
      headers: { "Set-Cookie": await commitSession(session) },
    });
  }

  if (intent === "logout") {
    return redirect("/", {
      headers: { "Set-Cookie": await destroySession(session) },
    });
  }

  // 以下操作需要登录
  const userId = session.get("userId") as string | undefined;
  if (!userId) {
    return json<ActionData>({ ok: false, error: "未登录" }, { status: 401 });
  }

  if (intent === "export") {
    const stateRaw = form.get("stateJson") as string;
    try {
      const parsed = JSON.parse(stateRaw);
      const blob = await generateDivePdf(parsed, USERS);
      const buffer = Buffer.from(await blob.arrayBuffer());
      const fname = `DIVE_LOG_${generateTokenId()}.pdf`;
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fname}"`,
        },
      });
    } catch (e: any) {
      return json<ActionData>({ ok: false, error: "PDF 生成失败：" + e?.message }, { status: 500 });
    }
  }

  return json<ActionData>({ ok: true });
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const [loginError, setLoginError] = useState<string | null>(null);

  // dive state (客户端状态机)
  const initFromLoader = (): DiveState => {
    if (!loaderData.authenticated || !loaderData.user) {
      return { mode: "login", currentStepId: null, plan: null, alerts: [] };
    }
    const init = loaderData.initialDiveState;
    if (init && init.planId && init.steps) {
      const plan = loaderData.plans.find(p => p.id === init.planId) ?? null;
      if (plan) {
        const mergedPlan: DivePlan = { ...plan, steps: init.steps };
        const mode = (init.diveMode === "emergency" ? "emergency" : init.surfacedAt ? "completed" : "underway") as DiveState["mode"];
        return {
          mode,
          currentStepId: init.currentStepId,
          plan: mergedPlan,
          alerts: init.alerts ?? [],
          tokenId: init.tokenId ?? undefined,
          surfacedAt: init.surfacedAt ?? undefined,
          emergencyReason: init.emergencyReason ?? undefined,
        };
      }
    }
    return { mode: "selectPlan", currentStepId: null, plan: null, alerts: [] };
  };

  const [diveState, rawDispatch] = useReducer(diveReducer, undefined, initFromLoader) as unknown as [DiveState, (a: DiveAction) => void];
  const { beep } = useAlertSound();
  const [gps, setGps] = useState<{ lat?: number; lng?: number }>({});
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const alertFiredRef = useRef<Set<string>>(new Set());
  const deviationWarnedRef = useRef<Set<string>>(new Set());

  // GPS 周期更新
  useEffect(() => {
    if (loaderData.mode === "login") return;
    let cancelled = false;
    const update = async () => {
      const g = await getCurrentGps();
      if (!cancelled) setGps(g);
    };
    update();
    const id = setInterval(update, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [loaderData.mode]);

  // 登录错误
  useEffect(() => {
    if (actionData && !actionData.ok && actionData.error && loaderData.mode === "login") {
      setLoginError(actionData.error);
    } else if (actionData?.ok) {
      setLoginError(null);
    }
  }, [actionData, loaderData.mode]);

  // 持续偏离检测 & 告警触发
  useEffect(() => {
    if (!diveState.plan) return;
    const id = setInterval(() => {
      const now = Date.now();
      diveState.plan!.steps.forEach(s => {
        if ((s.status === "counting" || s.status === "diverSigned") && s.startedAt) {
          const elapsed = (now - s.startedAt) / 1000;
          const dev = Math.floor(elapsed - s.plannedDuration);
          if (dev !== s.deviationSeconds) {
            rawDispatch({ type: "UPDATE_DEVIATION", stepId: s.id, seconds: dev } as DiveAction);
          }
          if (dev > 180 && !alertFiredRef.current.has(s.id)) {
            alertFiredRef.current.add(s.id);
            rawDispatch({
              type: "TRIGGER_ALERT",
              stepId: s.id,
              message: `深度 ${s.plannedDepth}m 停留偏离计划超 3 分钟（超时 ${dev - 180 + 180}s），请立即上浮`,
            } as DiveAction);
            if (!muted) beep("alert");
          } else if (dev > 30 && !deviationWarnedRef.current.has(s.id)) {
            deviationWarnedRef.current.add(s.id);
            if (!muted) beep("warn");
          }
        }
      });
    }, 500);
    return () => clearInterval(id);
  }, [diveState.plan, muted, beep]);

  // 新告警声音
  useEffect(() => {
    if (diveState.alerts.length > 0 && !muted) {
      const last = diveState.alerts[diveState.alerts.length - 1];
      if (!last.acknowledged && !alertFiredRef.current.has("notified_" + last.id)) {
        alertFiredRef.current.add("notified_" + last.id);
        beep(last.type === "emergency" ? "alert" : "warn");
      }
    }
  }, [diveState.alerts, muted, beep]);

  const canExport = useMemo(() => {
    if (!diveState.plan) return false;
    if (diveState.mode === "completed" || diveState.mode === "emergency") return true;
    const signed = diveState.plan.steps.filter(s => s.instructorSignature).length;
    return signed >= 1 && (loaderData.user?.role === "instructor" || loaderData.user?.role === "admin");
  }, [diveState, loaderData.user]);

  // ===== 业务动作 =====
  const handleCheckin = async (stepId: string) => {
    if (!diveState.plan || !loaderData.user) return;
    const { lat, lng } = gps.lat !== undefined ? gps : await getCurrentGps();
    const now = Date.now();
    rawDispatch({ type: "CHECKIN", stepId, time: now, lat, lng } as DiveAction);
    rawDispatch({ type: "START_COUNTING", stepId } as DiveAction);
    beep("ok");
  };

  const handleDiverSign = (stepId: string, signature: string) => {
    if (!loaderData.user) return;
    rawDispatch({
      type: "DIVER_SIGN",
      stepId,
      signature,
      time: Date.now(),
      diverId: loaderData.user.id,
    } as DiveAction);
    beep("ok");
  };

  const handleInstructorSign = (stepId: string, signature: string) => {
    if (!loaderData.user || loaderData.user.role !== "instructor" && loaderData.user.role !== "admin") return;
    rawDispatch({
      type: "INSTRUCTOR_SIGN",
      stepId,
      signature,
      time: Date.now(),
    } as DiveAction);
    beep("ok");
  };

  const handleSelectPlan = (planId: string) => {
    const plan = loaderData.plans.find(p => p.id === planId);
    if (!plan || !loaderData.user) return;
    if (loaderData.user.role !== "instructor" && loaderData.user.role !== "admin") return;
    const fresh: DivePlan = {
      ...plan,
      steps: plan.steps.map(s => ({ ...s, status: (s.index === 0 ? "unlocked" : "locked") as DecompressionStep["status"] })),
      plannedStartTime: Date.now(),
    };
    rawDispatch({ type: "START_DIVE", plan: fresh } as DiveAction);
    beep("ok");
  };

  const handleEmergency = (reason: string) => {
    rawDispatch({ type: "EMERGENCY_ASCENT", reason } as DiveAction);
  };

  const handleConfirmSurface = () => {
    if (!loaderData.user) return;
    const tokenId = generateTokenId();
    rawDispatch({ type: "CONFIRM_SURFACE", time: Date.now(), tokenId } as DiveAction);
    beep("ok");
  };

  const handleAckAlert = (id: string) => {
    rawDispatch({ type: "ACK_ALERT", alertId: id } as DiveAction);
  };

  const handleExport = async () => {
    if (!diveState.plan || exporting) return;
    setExporting(true);
    try {
      const stateJson = JSON.stringify(diveState);
      const form = new FormData();
      form.append("intent", "export");
      form.append("stateJson", stateJson);
      const res = await fetch("/?index", { method: "POST", body: form });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const cd = res.headers.get("Content-Disposition");
        const fname = cd?.match(/filename="(.+?)"/)?.[1] ?? `DIVE_LOG_${diveState.tokenId ?? generateTokenId()}.pdf`;
        a.href = url;
        a.download = fname;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("PDF 导出失败");
      }
    } finally {
      setExporting(false);
    }
  };

  // ===== 渲染 =====
  if (diveState.mode === "login" || !loaderData.authenticated || !loaderData.user) {
    return <LoginPanel error={loginError} />;
  }

  if (diveState.mode === "selectPlan" || !diveState.plan) {
    return (
      <PlanSelector
        plans={loaderData.plans}
        historicalProfiles={loaderData.historicalProfiles}
        user={loaderData.user}
        onSelectPlan={handleSelectPlan}
      />
    );
  }

  // 主作业界面
  const user = loaderData.user;
  const plan = diveState.plan;
  const relevantHistory = loaderData.historicalProfiles.filter(hp => hp.siteName === plan.siteName);
  const hasActiveAlerts = diveState.alerts.some(a => !a.acknowledged) || diveState.mode === "emergency";

  return (
    <div className={`min-h-screen pb-40 relative ${hasActiveAlerts ? "animate-pulse-alert" : ""}`}>
      <TopBar
        user={user}
        plan={plan}
        gps={gps}
        canExport={canExport}
        onExport={handleExport}
        exporting={exporting}
      />

      <AlertOverlay
        alerts={diveState.alerts}
        mode={diveState.mode}
        onAck={handleAckAlert}
        muted={muted}
        onToggleMute={() => setMuted(m => !m)}
      />

      <main className="max-w-7xl mx-auto p-3 md:p-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-4 md:gap-6">
          {/* 左侧：阶梯表 + Profile */}
          <section className="space-y-4 md:space-y-6 min-w-0">
            <div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2">
                    <span className="w-1 h-6 bg-indicator-cyan rounded-sm shadow-led-cyan" />
                    减压停留阶梯表
                    <span className="ml-2 text-xs reading-mono text-slate-500 uppercase tracking-[0.25em]">
                      Decompression Ladder
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 pl-3">
                    自上而下按深度逐级完成 · 未签完当前阶 <strong className="text-indicator-amber">无法解锁</strong> 下一阶 · 未完成所有阶梯 <strong className="text-indicator-red">禁止签发可出水令牌</strong>
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs reading-mono">
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="led-green" /> 已完成</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="led-cyan animate-pulse" /> 进行中</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="led-amber" /> 待教练副签</span>
                  <span className="flex items-center gap-1.5 text-slate-400"><span className="led-gray" /> 未解锁</span>
                </div>
              </div>

              <DecompressionLadder
                steps={plan.steps}
                currentUser={user}
                users={USERS}
                isEmergency={diveState.mode === "emergency"}
                onCheckin={handleCheckin}
                onDiverSign={handleDiverSign}
                onInstructorSign={handleInstructorSign}
              />
            </div>

            <ProfileChart
              plan={plan}
              historical={relevantHistory}
              steps={plan.steps}
            />
          </section>

          {/* 右侧：支援面板 */}
          <aside className="lg:sticky lg:top-24 space-y-4 md:space-y-6 self-start">
            <SupportPanel state={diveState} />
          </aside>
        </div>
      </main>

      <EmergencyButton
        disabled={
          diveState.mode === "completed" ||
          (user.role !== "instructor" && user.role !== "diver" && user.role !== "admin") ||
          nav.state !== "idle"
        }
        onConfirm={handleEmergency}
      />

      <SurfaceToken
        steps={plan.steps}
        mode={diveState.mode}
        tokenId={diveState.tokenId}
        emergencyReason={diveState.emergencyReason}
        surfacedAt={diveState.surfacedAt}
        currentUser={user}
        users={USERS}
        onConfirmSurface={handleConfirmSurface}
      />
    </div>
  );
}
