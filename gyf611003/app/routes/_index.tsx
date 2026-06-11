import { useReducer, useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useRevalidator } from "@remix-run/react";
import { USERS, DIVE_PLANS, HISTORICAL_PROFILES } from "~/data/mockData";
import { getSession, commitSession, destroySession } from "~/data/session.server";
import { getSharedDiveState, setSharedDiveState, resetSharedDiveState } from "~/data/sharedState.server";
import type { User, DivePlan, HistoricalProfile, DiveAlert, Role } from "~/data/types";
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
  sharedDiveState: {
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

function serializeSharedState(state: DiveState): LoaderData["sharedDiveState"] {
  return {
    planId: state.plan?.id ?? null,
    steps: state.plan?.steps ?? null,
    currentStepId: state.currentStepId,
    alerts: state.alerts,
    tokenId: state.tokenId ?? null,
    surfacedAt: state.surfacedAt ?? null,
    emergencyReason: state.emergencyReason ?? null,
    diveMode: state.mode,
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
      sharedDiveState: serializeSharedState(getSharedDiveState()),
    });
  }

  const user = USERS.find(u => u.id === userId) ?? null;
  const shared = getSharedDiveState();

  return json<LoaderData>({
    authenticated: true,
    user,
    plans: DIVE_PLANS,
    historicalProfiles: HISTORICAL_PROFILES,
    mode: shared.plan && shared.mode !== "login" ? "underway" : "selectPlan",
    sharedDiveState: serializeSharedState(shared),
  });
}

interface ActionData {
  ok: boolean;
  error?: string;
  redirectTo?: string;
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

  const userId = session.get("userId") as string | undefined;
  if (!userId) {
    return json<ActionData>({ ok: false, error: "未登录" }, { status: 401 });
  }
  const user = USERS.find(u => u.id === userId);
  if (!user) {
    return json<ActionData>({ ok: false, error: "用户不存在" }, { status: 401 });
  }

  if (intent === "syncState") {
    const stateRaw = form.get("stateJson") as string;
    try {
      const parsed = JSON.parse(stateRaw) as DiveState;
      setSharedDiveState(parsed);
      return json<ActionData>({ ok: true });
    } catch (e: any) {
      return json<ActionData>({ ok: false, error: "状态同步失败：" + e?.message }, { status: 400 });
    }
  }

  if (intent === "resetDive") {
    if (user.role !== "instructor" && user.role !== "admin") {
      return json<ActionData>({ ok: false, error: "无权限" }, { status: 403 });
    }
    resetSharedDiveState();
    return json<ActionData>({ ok: true });
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

const BROADCAST_CHANNEL = "dive-checkstation-sync";
const SHARED_STORAGE_KEY = "dive_checkstation_shared_v1";

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nav = useNavigation();
  const revalidator = useRevalidator();
  const [loginError, setLoginError] = useState<string | null>(null);

  const initFromShared = (): DiveState => {
    if (!loaderData.authenticated || !loaderData.user) {
      return { mode: "login", currentStepId: null, plan: null, alerts: [] };
    }
    const s = loaderData.sharedDiveState;
    if (s.planId && s.steps) {
      const plan = loaderData.plans.find(p => p.id === s.planId) ?? null;
      if (plan) {
        const mergedPlan: DivePlan = { ...plan, steps: s.steps };
        const mode = (
          s.diveMode === "emergency" ? "emergency"
          : s.diveMode === "completed" ? "completed"
          : s.diveMode === "underway" ? "underway"
          : s.surfacedAt ? "completed"
          : "underway"
        ) as DiveState["mode"];
        return {
          mode,
          currentStepId: s.currentStepId,
          plan: mergedPlan,
          alerts: s.alerts ?? [],
          tokenId: s.tokenId ?? undefined,
          surfacedAt: s.surfacedAt ?? undefined,
          emergencyReason: s.emergencyReason ?? undefined,
        };
      }
    }
    return { mode: "selectPlan", currentStepId: null, plan: null, alerts: [] };
  };

  const [diveState, rawDispatch] = useReducer(diveReducer, undefined, initFromShared) as unknown as [DiveState, (a: DiveAction) => void];
  const { beep } = useAlertSound();
  const [gps, setGps] = useState<{ lat?: number; lng?: number }>({});
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const alertFiredRef = useRef<Set<string>>(new Set());
  const deviationWarnedRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<number | null>(null);
  const lastSyncedStateRef = useRef<string>("");
  const bcRef = useRef<BroadcastChannel | null>(null);
  const isExternalUpdateRef = useRef(false);

  const persistAndBroadcast = useCallback((state: DiveState) => {
    const json = JSON.stringify(state);
    if (json === lastSyncedStateRef.current) return;
    lastSyncedStateRef.current = json;

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SHARED_STORAGE_KEY, json);
        window.localStorage.setItem(SHARED_STORAGE_KEY + "_ts", String(Date.now()));
      }
    } catch (_) {}

    try {
      if (bcRef.current) {
        bcRef.current.postMessage({ type: "state_update", state: json, ts: Date.now() });
      }
    } catch (_) {}

    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(async () => {
      try {
        const form = new FormData();
        form.append("intent", "syncState");
        form.append("stateJson", json);
        await fetch("/?index", { method: "POST", body: form });
      } catch (_) {}
    }, 150);
  }, []);

  const dispatch: (a: DiveAction) => void = useCallback((action) => {
    isExternalUpdateRef.current = false;
    rawDispatch(action);
  }, []);

  useEffect(() => {
    if (diveState.mode === "login") return;
    persistAndBroadcast(diveState);
  }, [diveState, persistAndBroadcast]);

  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bcRef.current = new BroadcastChannel(BROADCAST_CHANNEL);
        bcRef.current.onmessage = (ev) => {
          if (ev.data?.type === "state_update" && ev.data?.state) {
            try {
              const incoming: DiveState = JSON.parse(ev.data.state);
              isExternalUpdateRef.current = true;
              rawDispatch({ type: "RESET" } as DiveAction);
              if (incoming.mode === "selectPlan" || incoming.mode === "login") {
                rawDispatch({ type: "RESET" } as DiveAction);
              } else if (incoming.plan) {
                rawDispatch({ type: "START_DIVE", plan: incoming.plan } as DiveAction);
                incoming.alerts.forEach(a => {
                  rawDispatch({ type: "TRIGGER_ALERT", stepId: a.stepId, message: a.message } as DiveAction);
                  if (a.acknowledged) {
                    rawDispatch({ type: "ACK_ALERT", alertId: a.id } as DiveAction);
                  }
                });
                if (incoming.mode === "emergency" && incoming.emergencyReason) {
                  rawDispatch({ type: "EMERGENCY_ASCENT", reason: incoming.emergencyReason } as DiveAction);
                }
                if (incoming.mode === "completed" && incoming.tokenId && incoming.surfacedAt) {
                  rawDispatch({ type: "CONFIRM_SURFACE", time: incoming.surfacedAt, tokenId: incoming.tokenId } as DiveAction);
                }
              }
            } catch (_) {}
          }
        };
      }
    } catch (_) {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_STORAGE_KEY && e.newValue) {
        try {
          const incoming: DiveState = JSON.parse(e.newValue);
          isExternalUpdateRef.current = true;
          if (incoming.mode === "selectPlan" || incoming.mode === "login") {
            rawDispatch({ type: "RESET" } as DiveAction);
          } else if (incoming.plan) {
            rawDispatch({ type: "START_DIVE", plan: incoming.plan } as DiveAction);
            incoming.alerts.forEach(a => {
              rawDispatch({ type: "TRIGGER_ALERT", stepId: a.stepId, message: a.message } as DiveAction);
              if (a.acknowledged) {
                rawDispatch({ type: "ACK_ALERT", alertId: a.id } as DiveAction);
              }
            });
            if (incoming.mode === "emergency" && incoming.emergencyReason) {
              rawDispatch({ type: "EMERGENCY_ASCENT", reason: incoming.emergencyReason } as DiveAction);
            }
            if (incoming.mode === "completed" && incoming.tokenId && incoming.surfacedAt) {
              rawDispatch({ type: "CONFIRM_SURFACE", time: incoming.surfacedAt, tokenId: incoming.tokenId } as DiveAction);
            }
          }
        } catch (_) {}
      }
    };
    try { window.addEventListener("storage", onStorage); } catch (_) {}

    return () => {
      try { bcRef.current?.close(); } catch (_) {}
      try { window.removeEventListener("storage", onStorage); } catch (_) {}
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    };
  }, []);

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

  useEffect(() => {
    if (actionData && !actionData.ok && actionData.error && loaderData.mode === "login") {
      setLoginError(actionData.error);
    } else if (actionData?.ok) {
      setLoginError(null);
    }
  }, [actionData, loaderData.mode]);

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
              message: `深度 ${s.plannedDepth}m 停留偏离计划超 3 分钟，请立即上浮`,
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

  const handleCheckin = async (stepId: string) => {
    if (!diveState.plan || !loaderData.user) return;
    if (loaderData.user.role !== "diver") return;
    const step = diveState.plan.steps.find(s => s.id === stepId);
    if (!step || step.assignedDiverId !== loaderData.user.id) return;
    const { lat, lng } = gps.lat !== undefined ? gps : await getCurrentGps();
    const now = Date.now();
    dispatch({ type: "CHECKIN", stepId, time: now, lat, lng } as DiveAction);
    dispatch({ type: "START_COUNTING", stepId } as DiveAction);
    beep("ok");
  };

  const handleDiverSign = (stepId: string, signature: string) => {
    if (!loaderData.user || loaderData.user.role !== "diver") return;
    if (!diveState.plan) return;
    const step = diveState.plan.steps.find(s => s.id === stepId);
    if (!step || step.assignedDiverId !== loaderData.user.id) return;
    dispatch({
      type: "DIVER_SIGN",
      stepId,
      signature,
      time: Date.now(),
      diverId: loaderData.user.id,
    } as DiveAction);
    beep("ok");
  };

  const handleInstructorSign = (stepId: string, signature: string) => {
    if (!loaderData.user) return;
    if (loaderData.user.role !== "instructor" && loaderData.user.role !== "admin") return;
    dispatch({
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
    dispatch({ type: "START_DIVE", plan: fresh } as DiveAction);
    beep("ok");
  };

  const handleEmergency = (reason: string) => {
    dispatch({ type: "EMERGENCY_ASCENT", reason } as DiveAction);
  };

  const handleConfirmSurface = () => {
    if (!loaderData.user) return;
    if (loaderData.user.role !== "instructor" && loaderData.user.role !== "admin") return;
    const tokenId = generateTokenId();
    dispatch({ type: "CONFIRM_SURFACE", time: Date.now(), tokenId } as DiveAction);
    beep("ok");
  };

  const handleAckAlert = (id: string) => {
    dispatch({ type: "ACK_ALERT", alertId: id } as DiveAction);
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

  const user = loaderData.user;
  const plan = diveState.plan;
  const isSupportRole = user.role === "support";
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
                    {isSupportRole && <span className="ml-2 text-indicator-cyan">（支援席只读模式）</span>}
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
                isSupport={isSupportRole}
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

          <aside className="lg:sticky lg:top-24 space-y-4 md:space-y-6 self-start">
            <SupportPanel state={diveState} />
          </aside>
        </div>
      </main>

      <EmergencyButton
        disabled={
          diveState.mode === "completed" ||
          isSupportRole ||
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
