import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, createCookieSessionStorage, json, redirect } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { Anchor, ShieldAlert, Users, Waves, MapPin, ChevronRight, FileText, User, LogOut, Eraser, Lock, AlertCircle, Clock, UserCog, Signature, CheckCircle2, Radio, Eye, Activity, AlertOctagon, X, Award, AlertTriangle, XCircle } from "lucide-react";
import jsPDF from "jspdf";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, _loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          if (shellRendered) {
            console.error(error);
          }
          responseStatusCode = 500;
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const styles = "/assets/tailwind-B9uENSV7.css";
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap"
  },
  { rel: "stylesheet", href: styles }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "zh-CN", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" }),
      /* @__PURE__ */ jsx("meta", { name: "theme-color", content: "#0A1628" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { className: "bg-nautical-900 text-slate-100 antialiased overflow-x-hidden selection:bg-indicator-cyan/30", children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const now = Date.now();
function buildStep(id, index, depth, durationSec, diverId) {
  return {
    id,
    index,
    plannedDepth: depth,
    plannedDuration: durationSec,
    status: index === 0 ? "unlocked" : "locked",
    assignedDiverId: diverId
  };
}
const USERS = [
  { id: "u_dv1", employeeId: "DV001", name: "陈海峰", role: "diver", password: "123456" },
  { id: "u_dv2", employeeId: "DV002", name: "李深蓝", role: "diver", password: "123456" },
  { id: "u_ir1", employeeId: "IR001", name: "王教练", role: "instructor", password: "123456" },
  { id: "u_sp1", employeeId: "SP001", name: "赵支援", role: "support", password: "123456" },
  { id: "u_ad1", employeeId: "AD001", name: "管理员", role: "admin", password: "123456" }
];
const DIVE_PLANS = [
  {
    id: "plan_001",
    siteName: "东海 W12 沉船点",
    siteGpsLat: 30.6321,
    siteGpsLng: 122.3844,
    maxDepth: 42,
    plannedStartTime: now,
    steps: [
      buildStep("s1", 0, 30, 180, "u_dv1"),
      buildStep("s2", 1, 21, 240, "u_dv1"),
      buildStep("s3", 2, 15, 300, "u_dv1"),
      buildStep("s4", 3, 9, 240, "u_dv1"),
      buildStep("s5", 4, 6, 180, "u_dv1"),
      buildStep("s6", 5, 3, 120, "u_dv1"),
      buildStep("s7", 6, 0, 60, "u_dv1")
    ]
  },
  {
    id: "plan_002",
    siteName: "南海珊瑚礁保护区",
    siteGpsLat: 18.2301,
    siteGpsLng: 109.5167,
    maxDepth: 28,
    plannedStartTime: now,
    steps: [
      buildStep("s1", 0, 18, 150, "u_dv2"),
      buildStep("s2", 1, 12, 210, "u_dv2"),
      buildStep("s3", 2, 6, 180, "u_dv2"),
      buildStep("s4", 3, 3, 90, "u_dv2"),
      buildStep("s5", 4, 0, 60, "u_dv2")
    ]
  },
  {
    id: "plan_003",
    siteName: "青岛港 5 号锚地检修",
    siteGpsLat: 36.0671,
    siteGpsLng: 120.3826,
    maxDepth: 22,
    plannedStartTime: now,
    steps: [
      buildStep("s1", 0, 15, 120, "u_dv1"),
      buildStep("s2", 1, 9, 180, "u_dv1"),
      buildStep("s3", 2, 6, 150, "u_dv1"),
      buildStep("s4", 3, 3, 90, "u_dv1"),
      buildStep("s5", 4, 0, 60, "u_dv1")
    ]
  }
];
const HISTORICAL_PROFILES = [
  {
    id: "hp_001",
    date: "2026-05-18",
    siteName: "东海 W12 沉船点",
    diverName: "陈海峰",
    points: [
      { time: 0, depth: 0 },
      { time: 120, depth: 30 },
      { time: 300, depth: 30 },
      { time: 340, depth: 21 },
      { time: 580, depth: 21 },
      { time: 630, depth: 15 },
      { time: 930, depth: 15 },
      { time: 980, depth: 9 },
      { time: 1220, depth: 9 },
      { time: 1260, depth: 6 },
      { time: 1440, depth: 6 },
      { time: 1470, depth: 3 },
      { time: 1590, depth: 3 },
      { time: 1610, depth: 0 }
    ]
  },
  {
    id: "hp_002",
    date: "2026-04-22",
    siteName: "东海 W12 沉船点",
    diverName: "李深蓝",
    points: [
      { time: 0, depth: 0 },
      { time: 140, depth: 30 },
      { time: 330, depth: 30 },
      { time: 375, depth: 21 },
      { time: 620, depth: 21 },
      { time: 670, depth: 15 },
      { time: 970, depth: 15 },
      { time: 1020, depth: 9 },
      { time: 1260, depth: 9 },
      { time: 1310, depth: 6 },
      { time: 1490, depth: 6 },
      { time: 1525, depth: 3 },
      { time: 1650, depth: 3 },
      { time: 1670, depth: 0 }
    ]
  },
  {
    id: "hp_003",
    date: "2026-03-09",
    siteName: "东海 W12 沉船点",
    diverName: "陈海峰",
    points: [
      { time: 0, depth: 0 },
      { time: 130, depth: 30 },
      { time: 320, depth: 30 },
      { time: 360, depth: 21 },
      { time: 600, depth: 21 },
      { time: 650, depth: 15 },
      { time: 950, depth: 15 },
      { time: 1e3, depth: 9 },
      { time: 1240, depth: 9 },
      { time: 1285, depth: 6 },
      { time: 1465, depth: 6 },
      { time: 1500, depth: 3 },
      { time: 1620, depth: 3 },
      { time: 1640, depth: 0 }
    ]
  }
];
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "deep-decompression-checkstation-dev-secret-key-2026";
}
const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "dive_checkstation_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [process.env.SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    httpOnly: true
  }
});
function formatTime(timestamp) {
  if (!timestamp) return "--:--:--";
  const d = new Date(timestamp);
  return d.toLocaleTimeString("zh-CN", { hour12: false });
}
function formatDateTime(timestamp) {
  if (!timestamp) return "--";
  const d = new Date(timestamp);
  return d.toLocaleString("zh-CN", { hour12: false });
}
function formatGps(lat, lng) {
  if (lat === void 0 || lng === void 0) return "GPS 定位中…";
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lng).toFixed(4)}°${ew}`;
}
function formatDepth(m) {
  return `${m.toFixed(1)}m`;
}
function formatDurationMM(sec) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m${s}s` : `${m}min`;
}
function generateTokenId() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const d = /* @__PURE__ */ new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `SRF-${date}-${rand}`;
}
function roleLabel(role) {
  return {
    diver: "潜水员",
    instructor: "教练",
    support: "水面支援",
    admin: "管理员"
  }[role] || role;
}
function stepStatusLabel(s) {
  return {
    locked: "未解锁",
    unlocked: "待到达",
    arrived: "已到达",
    counting: "倒计时中",
    diverSigned: "待教练副签",
    completed: "已完成",
    skipped: "紧急跳过"
  }[s] || s;
}
const ROLE_ICONS = {
  diver: /* @__PURE__ */ jsx(Waves, { className: "w-5 h-5" }),
  instructor: /* @__PURE__ */ jsx(Anchor, { className: "w-5 h-5" }),
  support: /* @__PURE__ */ jsx(Users, { className: "w-5 h-5" }),
  admin: /* @__PURE__ */ jsx(ShieldAlert, { className: "w-5 h-5" })
};
function LoginPanel({ defaultRole = "diver", error }) {
  const [role, setRole] = useState(defaultRole);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center relative overflow-hidden sonar-bg p-4", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-nautical-900 via-nautical-900 to-[#05121F]" }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indicator-cyan/10 blur-3xl animate-pulse" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indicator-amber/10 blur-3xl animate-pulse" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md console-card p-7 border-2 border-nautical-600/70", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-md bg-indicator-cyan/10 border-2 border-indicator-cyan flex items-center justify-center shadow-led-cyan", children: /* @__PURE__ */ jsx(Anchor, { className: "w-7 h-7 text-indicator-cyan" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold tracking-tight text-slate-100", children: "深潜减压核对台" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-indicator-cyan reading-mono", children: "DECOMPRESSION CHECKSTATION v1.0" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "console-divider mb-5" }),
      /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold", children: "选择角色 / Role" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", role: "tablist", children: ["diver", "instructor", "support", "admin"].map((r) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setRole(r),
              name: "role-choose",
              className: `flex items-center gap-2 px-3 py-2.5 rounded-sm border-2 transition-all text-sm font-medium
                    ${role === r ? "border-indicator-cyan bg-indicator-cyan/10 text-indicator-cyan shadow-led-cyan" : "border-nautical-600/60 bg-nautical-800/50 text-slate-300 hover:border-nautical-500"}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: role === r ? "text-indicator-cyan" : "text-slate-500", children: ROLE_ICONS[r] }),
                roleLabel(r),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `ml-auto w-2 h-2 rounded-full ${role === r ? "led-cyan" : "bg-slate-600"}`
                  }
                )
              ]
            },
            r
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold", children: "工号 / Employee ID" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "employeeId",
              required: true,
              autoComplete: "username",
              placeholder: "例：DV001 / IR001",
              className: "console-input",
              defaultValue: role === "diver" ? "DV001" : role === "instructor" ? "IR001" : role === "support" ? "SP001" : "AD001"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold", children: "密码 / Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              name: "password",
              required: true,
              autoComplete: "current-password",
              placeholder: "••••••",
              className: "console-input",
              defaultValue: "123456"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "intent", value: "login" }),
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "role", value: role }),
        error && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 p-3 rounded-sm bg-indicator-red/10 border-2 border-indicator-red/50 text-indicator-red text-sm", children: [
          /* @__PURE__ */ jsx(ShieldAlert, { className: "w-4 h-4 mt-0.5 flex-shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: error })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "btn-industrial-primary w-full h-14 !text-base !tracking-[0.25em] mt-2",
            children: "⚓ 登 录 系 统"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 text-[11px] text-slate-500 leading-relaxed border-t border-nautical-700/60 pt-4", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-1 text-indicator-amber", children: "⚠ 海事局抽查合规系统 · 所有操作均加密留痕" }),
        /* @__PURE__ */ jsx("p", { children: "测试账号：DV001 / IR001 / SP001 / AD001，密码统一 123456" })
      ] })
    ] })
  ] });
}
function PlanSelector({ plans, historicalProfiles, user, onSelectPlan }) {
  const canStart = user.role === "instructor" || user.role === "admin";
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen w-full p-6 md:p-10 bg-nautical-900", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-md bg-indicator-cyan/10 border-2 border-indicator-cyan flex items-center justify-center shadow-led-cyan", children: /* @__PURE__ */ jsx(Anchor, { className: "w-7 h-7 text-indicator-cyan" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold text-slate-100", children: "选择下潜计划" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
          "欢迎，",
          /* @__PURE__ */ jsx("span", { className: "text-indicator-cyan font-semibold", children: user.name }),
          /* @__PURE__ */ jsx("span", { className: "mx-2 text-slate-600", children: "|" }),
          canStart ? "教练/管理员可发起下潜作业" : "请等待教练发起作业"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-5 mb-10", children: plans.map((plan, idx) => {
      const hpCount = historicalProfiles.filter((hp) => hp.siteName === plan.siteName).length;
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "console-card p-5 hover:border-indicator-cyan/60 transition-all group cursor-pointer",
          onClick: () => canStart && onSelectPlan(plan.id),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "inline-flex items-center justify-center w-8 h-8 rounded-sm bg-nautical-700 border border-nautical-600 text-indicator-cyan reading-mono text-sm font-bold", children: String(idx + 1).padStart(2, "0") }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-slate-100 leading-tight", children: plan.siteName }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-xs text-slate-400 mt-0.5", children: [
                    /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
                    plan.siteGpsLat.toFixed(2),
                    "°N ",
                    plan.siteGpsLng.toFixed(2),
                    "°E"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(ChevronRight, { className: `w-5 h-5 transition-transform ${canStart ? "text-slate-600 group-hover:text-indicator-cyan group-hover:translate-x-1" : "text-slate-700"}` })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "console-divider mb-4" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-2.5 bg-nautical-900/60 rounded-sm border border-nautical-700/60", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase text-slate-500 tracking-wider", children: "最大深度" }),
                /* @__PURE__ */ jsx("div", { className: "reading-mono text-xl text-indicator-cyan font-bold mt-0.5", children: formatDepth(plan.maxDepth) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-2.5 bg-nautical-900/60 rounded-sm border border-nautical-700/60", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase text-slate-500 tracking-wider", children: "减压阶梯" }),
                /* @__PURE__ */ jsxs("div", { className: "reading-mono text-xl text-indicator-amber font-bold mt-0.5", children: [
                  plan.steps.length,
                  " 阶"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 text-xs mb-4", children: [
              plan.steps.slice(0, 5).map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-300", children: [
                /* @__PURE__ */ jsx("span", { className: "w-1 h-1 rounded-full bg-indicator-cyan/60" }),
                /* @__PURE__ */ jsx("span", { className: "reading-mono w-16 text-indicator-cyan", children: formatDepth(s.plannedDepth) }),
                /* @__PURE__ */ jsx(Waves, { className: "w-3 h-3 text-slate-600" }),
                /* @__PURE__ */ jsxs("span", { className: "reading-mono text-slate-400", children: [
                  "停留 ",
                  formatDurationMM(s.plannedDuration)
                ] })
              ] }, s.id)),
              plan.steps.length > 5 && /* @__PURE__ */ jsxs("div", { className: "text-slate-600 pl-3", children: [
                "... 另有 ",
                plan.steps.length - 5,
                " 阶浅水区停留"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-nautical-700/60 text-xs", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
                "历史潜次: ",
                /* @__PURE__ */ jsx("span", { className: "text-indicator-cyan reading-mono", children: hpCount })
              ] }),
              canStart ? /* @__PURE__ */ jsx("span", { className: "text-indicator-cyan font-semibold", children: "点击启动 →" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-600", children: "教练专属操作" })
            ] })
          ]
        },
        plan.id
      );
    }) }),
    !canStart && /* @__PURE__ */ jsxs("div", { className: "p-5 rounded-md bg-indicator-amber/10 border-2 border-indicator-amber/50 text-center", children: [
      /* @__PURE__ */ jsxs("p", { className: "text-indicator-amber font-semibold", children: [
        "您当前以 ",
        /* @__PURE__ */ jsx("strong", { children: user.name }),
        " 身份登录，系统等待教练 IR001（王教练）发起下潜计划。"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-2", children: "请切换账号或通知教练启动作业。" }),
      /* @__PURE__ */ jsxs(Form, { method: "post", className: "inline-block mt-3", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "intent", value: "logout" }),
        /* @__PURE__ */ jsx("button", { className: "btn-industrial-muted !py-1.5 !text-xs", children: "切换账号" })
      ] })
    ] })
  ] }) });
}
function TopBar({ user, plan, gps, canExport, onExport, exporting }) {
  var _a;
  const [now2, setNow] = useState(() => /* @__PURE__ */ new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
    return () => clearInterval(i);
  }, []);
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 border-b-2 border-nautical-700/80 bg-nautical-900/95 backdrop-blur-md", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 px-5 py-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 pr-4 border-r border-nautical-700/60", children: [
      /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-sm bg-indicator-cyan/10 border-2 border-indicator-cyan flex items-center justify-center shadow-led-cyan", children: /* @__PURE__ */ jsx(Anchor, { className: "w-5 h-5 text-indicator-cyan" }) }),
      /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "font-bold tracking-wide text-slate-100 text-[15px]", children: "减压核对台" }),
        /* @__PURE__ */ jsx("div", { className: "text-[10px] reading-mono text-indicator-cyan/80 uppercase tracking-[0.2em]", children: "DCS v1.0" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
      /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-indicator-cyan flex-shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "truncate", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-100", children: (plan == null ? void 0 : plan.siteName) ?? "未选择潜点" }),
        plan && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 ml-2 reading-mono hidden md:inline", children: [
          plan.siteGpsLat.toFixed(3),
          "°N ",
          plan.siteGpsLng.toFixed(3),
          "°E"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-nautical-800/70 border border-nautical-700/60", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full led-green animate-pulse" }),
      /* @__PURE__ */ jsx("span", { className: "text-[11px] text-slate-400 uppercase tracking-wider", children: "GPS" }),
      /* @__PURE__ */ jsx("span", { className: "reading-mono text-xs text-slate-200", children: gps.lat ? `${gps.lat.toFixed(3)}°N ${(_a = gps.lng) == null ? void 0 : _a.toFixed(3)}°E` : "定位中…" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ml-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "reading-mono text-lg tabular-nums text-indicator-cyan px-3 py-1 bg-nautical-800/60 rounded-sm border border-nautical-700/50 shadow-led-cyan/30", children: formatTime(now2.getTime()) }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onExport,
          disabled: !canExport || exporting,
          className: "btn-industrial-success !py-2 !px-3 text-xs hidden sm:inline-flex",
          title: "导出海事格式 PDF",
          children: [
            /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
            exporting ? "导出中…" : "导出 PDF"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pl-3 border-l border-nautical-700/60", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-9 h-9 rounded-full bg-nautical-700 border-2 border-indicator-cyan/60", children: /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-indicator-cyan" }) }),
        /* @__PURE__ */ jsxs("div", { className: "leading-tight text-sm", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-100", children: user.name }),
          /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-indicator-cyan/80 uppercase tracking-wider reading-mono", children: [
            roleLabel(user.role),
            " · ",
            user.employeeId
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Form, { method: "post", className: "ml-1", children: [
        /* @__PURE__ */ jsx("input", { type: "hidden", name: "intent", value: "logout" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "w-9 h-9 flex items-center justify-center rounded-sm border-2 border-nautical-600/70 text-slate-400 hover:text-indicator-red hover:border-indicator-red transition-all",
            title: "退出登录",
            children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" })
          }
        )
      ] })
    ] })
  ] }) });
}
function useCountdown(plannedSeconds, isActive, startedAt, onDeviation, onAlert) {
  const [now2, setNow] = useState(() => Date.now());
  const rafRef = useRef(null);
  const alertedRef = useRef(false);
  useEffect(() => {
    if (!isActive || !startedAt) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      setNow(Date.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, startedAt]);
  if (!isActive || !startedAt) {
    return {
      remaining: plannedSeconds,
      elapsed: 0,
      status: "idle",
      progressPct: 0,
      deviation: 0
    };
  }
  const elapsed = Math.floor((now2 - startedAt) / 1e3);
  const remaining = plannedSeconds - elapsed;
  const progressPct = Math.max(0, Math.min(1, elapsed / plannedSeconds));
  const deviation = elapsed - plannedSeconds;
  let status = "running";
  if (remaining <= 30 && remaining > 0) status = "warning";
  if (remaining <= 0 && deviation <= 180) status = "overtime";
  if (deviation > 180) status = "alert";
  if (typeof window !== "undefined") {
    if (deviation > 180 && !alertedRef.current) {
      alertedRef.current = true;
    }
  }
  return { remaining: Math.max(0, remaining), elapsed, status, progressPct, deviation };
}
function formatMMSS(totalSec) {
  const s = Math.abs(Math.floor(totalSec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
function SignaturePad({
  onReady,
  height = 110,
  placeholder = "请在此区域签署姓名",
  accentColor = "cyan",
  readOnlyPreview
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const hasDrawnRef = useRef(false);
  const readOnlyImgRef = useRef(null);
  const accent = {
    cyan: { stroke: "#00E5FF", border: "border-indicator-cyan/50", glow: "shadow-led-cyan/20", btn: "text-indicator-cyan" },
    green: { stroke: "#30D158", border: "border-indicator-green/50", glow: "shadow-led-green/20", btn: "text-indicator-green" },
    amber: { stroke: "#FFB020", border: "border-indicator-amber/50", glow: "shadow-led-amber/20", btn: "text-indicator-amber" }
  }[accentColor];
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width) * dpr;
    canvas.height = Math.max(1, rect.height) * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = accent.stroke;
    if (readOnlyPreview) {
      const img = new Image();
      img.onload = () => {
        const cw = rect.width;
        const ch = rect.height;
        const iw = img.width;
        const ih = img.height;
        const scale = Math.min(cw / iw, ch / ih) * 0.95;
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      };
      img.src = readOnlyPreview;
      readOnlyImgRef.current = img;
      hasDrawnRef.current = true;
    }
  };
  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const handlePointerDown = (e) => {
    if (readOnlyPreview) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
    hasDrawnRef.current = true;
  };
  const handlePointerMove = (e) => {
    if (!drawingRef.current || readOnlyPreview) return;
    const canvas = canvasRef.current;
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
    if (!canvas || !ctx || !lastPosRef.current) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };
  const handlePointerUp = (e) => {
    var _a;
    drawingRef.current = false;
    lastPosRef.current = null;
    (_a = canvasRef.current) == null ? void 0 : _a.releasePointerCapture(e.pointerId);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas == null ? void 0 : canvas.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupCanvas();
    hasDrawnRef.current = !!readOnlyPreview;
  };
  const toDataURL = () => {
    var _a;
    return ((_a = canvasRef.current) == null ? void 0 : _a.toDataURL("image/png")) || "";
  };
  const isEmpty = () => !hasDrawnRef.current;
  useEffect(() => {
    onReady == null ? void 0 : onReady({ clear, toDataURL, isEmpty });
  }, [onReady]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(canvas);
    const id = requestAnimationFrame(setupCanvas);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(id);
    };
  }, [readOnlyPreview]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative rounded-sm border-2 ${accent.border} bg-nautical-900/80 overflow-hidden ${!readOnlyPreview ? `hover:${accent.border.replace("/50", "/80")}` : "opacity-90"}`,
      style: { height },
      children: [
        !readOnlyPreview && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity", children: /* @__PURE__ */ jsx("span", { className: "text-slate-600 text-sm italic tracking-wide", children: placeholder }) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 opacity-30 pointer-events-none",
            style: {
              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px)"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "canvas",
          {
            ref: canvasRef,
            className: "w-full h-full block touch-none cursor-crosshair",
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onPointerCancel: handlePointerUp
          }
        ),
        !readOnlyPreview && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: clear,
            className: `absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-sm bg-nautical-800/80 border ${accent.border} ${accent.btn} hover:bg-nautical-700 transition-all`,
            title: "清除签名",
            children: /* @__PURE__ */ jsx(Eraser, { className: "w-3.5 h-3.5" })
          }
        )
      ]
    }
  );
}
function LadderCard({
  step,
  currentUser,
  users,
  isEmergency,
  isSupport,
  onCheckin,
  onDiverSign,
  onInstructorSign
}) {
  const assignedDiver = users.find((u) => u.id === step.assignedDiverId);
  const locked = step.status === "locked" || isSupport;
  const diverPadRef = useRef(null);
  const instrPadRef = useRef(null);
  const [diverApi, setDiverApi] = useState(null);
  const [instrApi, setInstrApi] = useState(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  useEffect(() => {
    if (step.status === "unlocked") {
      setJustUnlocked(true);
      const id = setTimeout(() => setJustUnlocked(false), 500);
      return () => clearTimeout(id);
    }
  }, [step.status]);
  const canCheckin = !locked && step.status === "unlocked" && currentUser.role === "diver" && currentUser.id === step.assignedDiverId;
  const { status: cdStatus, remaining, progressPct, deviation } = useCountdown(
    step.plannedDuration,
    step.status === "counting" || step.status === "diverSigned",
    step.startedAt
  );
  const statusLed = (() => {
    switch (step.status) {
      case "locked":
        return "led-gray";
      case "unlocked":
        return "led-cyan animate-pulse";
      case "arrived":
        return "led-cyan";
      case "counting":
        return cdStatus === "alert" ? "led-red animate-pulse" : cdStatus === "overtime" ? "led-amber animate-pulse" : cdStatus === "warning" ? "led-amber" : "led-cyan animate-pulse";
      case "diverSigned":
        return "led-amber animate-pulse";
      case "completed":
        return "led-green";
      case "skipped":
        return "led-red";
      default:
        return "led-gray";
    }
  })();
  const statusTextColor = (() => {
    switch (step.status) {
      case "locked":
        return "text-slate-600";
      case "unlocked":
        return "text-indicator-cyan";
      case "arrived":
        return "text-indicator-cyan";
      case "counting":
        return cdStatus === "alert" ? "text-indicator-red" : cdStatus === "overtime" || cdStatus === "warning" ? "text-indicator-amber" : "text-indicator-cyan";
      case "diverSigned":
        return "text-indicator-amber";
      case "completed":
        return "text-indicator-green";
      case "skipped":
        return "text-indicator-red";
      default:
        return "text-slate-400";
    }
  })();
  const countdownTextColor = cdStatus === "alert" ? "text-indicator-red" : cdStatus === "overtime" ? "text-indicator-red/80" : cdStatus === "warning" ? "text-indicator-amber" : "text-indicator-cyan";
  const borderColor = (() => {
    if (isEmergency || step.status === "skipped") return "border-indicator-red/60";
    if (step.status === "completed") return "border-indicator-green/50";
    if (step.status === "locked") return "border-slate-700/50";
    if (step.hasAlert || cdStatus === "alert") return "border-indicator-red/60 shadow-led-red";
    return "border-indicator-cyan/50 shadow-led-cyan/40";
  })();
  const countdownBarColor = cdStatus === "alert" ? "bg-indicator-red" : cdStatus === "overtime" ? "bg-indicator-red/80" : cdStatus === "warning" ? "bg-indicator-amber" : "bg-indicator-cyan";
  const showDiverSignBtn = !locked && (step.status === "counting" || step.status === "arrived") && currentUser.role === "diver" && currentUser.id === step.assignedDiverId;
  const showInstrSignBtn = !locked && step.status === "diverSigned" && currentUser.role === "instructor";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `console-card p-4 md:p-5 border-2 ${borderColor} transition-all relative
        ${locked ? "opacity-70 grayscale" : ""}
        ${justUnlocked ? "animate-unlock-slide" : ""}
        ${step.status === "skipped" ? "bg-indicator-red/5" : ""}
        ${step.status === "completed" ? "bg-indicator-green/5" : ""}
      `,
      children: [
        step.status === "locked" && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-nautical-900/30 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none rounded-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-500", children: [
          /* @__PURE__ */ jsx(Lock, { className: "w-5 h-5" }),
          /* @__PURE__ */ jsx("span", { className: "reading-mono text-xs uppercase tracking-[0.3em]", children: "locked · 上级未完成" })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row lg:items-stretch gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:w-44 flex-shrink-0 flex lg:flex-col items-center lg:items-stretch gap-3 pr-0 lg:pr-4 border-b-2 lg:border-b-0 lg:border-r-2 border-nautical-700/50 pb-3 lg:pb-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 lg:mb-auto", children: [
              /* @__PURE__ */ jsx("span", { className: `${statusLed} w-3 h-3` }),
              /* @__PURE__ */ jsxs("span", { className: `text-[11px] uppercase tracking-wider font-bold ${statusTextColor} reading-mono`, children: [
                stepStatusLabel(step.status),
                step.hasAlert && /* @__PURE__ */ jsx(AlertCircle, { className: "inline w-3 h-3 ml-1 text-indicator-red" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-left flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-center lg:justify-start mb-0.5", children: [
                /* @__PURE__ */ jsx(Waves, { className: "w-3.5 h-3.5 text-indicator-cyan/70" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider text-slate-500", children: "深度" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "reading-mono text-3xl font-bold text-slate-100 tabular-nums", children: formatDepth(step.plannedDepth) }),
              /* @__PURE__ */ jsxs("div", { className: "text-[11px] text-slate-500 mt-0.5", children: [
                "停留 ",
                /* @__PURE__ */ jsx("span", { className: "reading-mono text-indicator-amber font-semibold", children: formatDurationMM(step.plannedDuration) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-center lg:text-right text-[10px] reading-mono text-slate-600 uppercase tracking-widest", children: [
              "阶梯 #",
              String(step.index + 1).padStart(2, "0")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => canCheckin && onCheckin(step.id),
                  disabled: !canCheckin,
                  className: `flex items-center gap-2 px-4 py-3 rounded-sm border-2 font-semibold text-sm transition-all min-w-[180px]
                ${canCheckin ? "border-indicator-cyan bg-indicator-cyan/10 text-indicator-cyan hover:bg-indicator-cyan/20 hover:shadow-led-cyan" : "border-slate-700 bg-nautical-800/50 text-slate-500 cursor-not-allowed"}`,
                  children: [
                    /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
                    step.actualArrivalTime ? /* @__PURE__ */ jsxs(Fragment, { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 mr-1", children: "到达时刻" }),
                      /* @__PURE__ */ jsx("span", { className: "reading-mono text-lg tabular-nums", children: formatTime(step.actualArrivalTime) })
                    ] }) : /* @__PURE__ */ jsx("span", { children: canCheckin ? "点击确认已到达" : "等待到达确认" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-slate-400", children: [
                /* @__PURE__ */ jsx(MapPin, { className: "w-3.5 h-3.5 text-indicator-cyan/60" }),
                /* @__PURE__ */ jsx("span", { className: "reading-mono text-slate-300", children: step.gpsLat ? formatGps(step.gpsLat, step.gpsLng) : "未打点" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative bg-nautical-900/90 rounded-sm border border-nautical-700/60 p-3 md:p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-[0.3em] text-slate-500 font-semibold", children: "减压倒计时" }),
                cdStatus !== "idle" && deviation > 0 && /* @__PURE__ */ jsxs("span", { className: `reading-mono text-xs ${deviation > 180 ? "text-indicator-red" : deviation > 30 ? "text-indicator-amber" : "text-indicator-green"}`, children: [
                  "Δ",
                  deviation > 0 ? "+" : "",
                  deviation,
                  "s"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-2 rounded-full bg-nautical-700 overflow-hidden mb-3", children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: `h-full ${countdownBarColor} transition-all duration-300`,
                  style: { width: `${Math.min(100, progressPct * 100)}%` }
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: `countdown-flip reading-mono text-4xl md:text-5xl font-bold tabular-nums ${countdownTextColor} text-center`, children: [
                formatMMSS(remaining),
                deviation > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xl md:text-2xl ml-3 opacity-80 text-indicator-red reading-mono", children: [
                  "+",
                  formatMMSS(deviation)
                ] })
              ] }),
              (step.status === "counting" || step.status === "diverSigned") && /* @__PURE__ */ jsxs("div", { className: "text-center text-[10px] uppercase tracking-widest text-slate-500 mt-1 reading-mono", children: [
                cdStatus === "alert" && "⚠ 偏离超3分钟 触发告警",
                cdStatus === "overtime" && "⚠ 已超时 请尽快减压上浮",
                cdStatus === "warning" && "即将结束 准备前往下一深度",
                cdStatus === "running" && "减压进行中"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2 text-[11px] text-slate-500", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(UserCog, { className: "w-3 h-3" }),
              /* @__PURE__ */ jsx("span", { children: "潜水员：" }),
              /* @__PURE__ */ jsx("span", { className: `font-semibold ${(assignedDiver == null ? void 0 : assignedDiver.id) === currentUser.id ? "text-indicator-cyan" : "text-slate-300"}`, children: (assignedDiver == null ? void 0 : assignedDiver.name) ?? "未分配" }),
              /* @__PURE__ */ jsxs("span", { className: "text-slate-600 reading-mono ml-1", children: [
                "[",
                assignedDiver == null ? void 0 : assignedDiver.employeeId,
                "]"
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:w-[280px] flex-shrink-0 flex flex-col gap-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Signature, { className: "w-3.5 h-3.5 text-indicator-cyan" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider font-bold text-indicator-cyan", children: "潜水员签名" })
                ] }),
                step.diverSignTime && /* @__PURE__ */ jsx("span", { className: "text-[10px] reading-mono text-slate-500", children: formatTime(step.diverSignTime) })
              ] }),
              step.diverSignature ? /* @__PURE__ */ jsx(SignaturePad, { readOnlyPreview: step.diverSignature, height: 80, accentColor: "cyan" }) : /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(
                  SignaturePad,
                  {
                    accentColor: "cyan",
                    height: 80,
                    placeholder: showDiverSignBtn ? "✍ 请潜水员在此签名" : "等待潜水员签名",
                    onReady: (api) => {
                      setDiverApi(api);
                      diverPadRef.current = api;
                    }
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    disabled: !showDiverSignBtn || !!step.diverSignature || !diverApi || diverApi.isEmpty(),
                    onClick: () => {
                      if (diverApi && !diverApi.isEmpty()) {
                        onDiverSign(step.id, diverApi.toDataURL());
                      }
                    },
                    className: `mt-2 w-full h-9 rounded-sm border-2 font-semibold text-xs uppercase tracking-wider transition-all
                    ${showDiverSignBtn && diverApi && !diverApi.isEmpty() ? "border-indicator-cyan bg-indicator-cyan/10 text-indicator-cyan hover:bg-indicator-cyan/20" : "border-slate-700/50 bg-nautical-800/30 text-slate-600 cursor-not-allowed"}`,
                    children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "inline w-3.5 h-3.5 mr-1" }),
                      "确认潜水员签名"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-indicator-green" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wider font-bold text-indicator-green", children: "教练副签" })
                ] }),
                step.instructorSignTime && /* @__PURE__ */ jsx("span", { className: "text-[10px] reading-mono text-slate-500", children: formatTime(step.instructorSignTime) })
              ] }),
              step.instructorSignature ? /* @__PURE__ */ jsx(SignaturePad, { readOnlyPreview: step.instructorSignature, height: 80, accentColor: "green" }) : step.status === "diverSigned" || step.status === "completed" ? /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx(
                  SignaturePad,
                  {
                    accentColor: "green",
                    height: 80,
                    placeholder: showInstrSignBtn ? "✍ 请教练在此副签" : "等待潜水员先签",
                    onReady: (api) => {
                      setInstrApi(api);
                      instrPadRef.current = api;
                    }
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    disabled: !showInstrSignBtn || !!step.instructorSignature || !instrApi || instrApi.isEmpty(),
                    onClick: () => {
                      if (instrApi && !instrApi.isEmpty()) {
                        onInstructorSign(step.id, instrApi.toDataURL());
                      }
                    },
                    className: `mt-2 w-full h-9 rounded-sm border-2 font-semibold text-xs uppercase tracking-wider transition-all
                    ${showInstrSignBtn && instrApi && !instrApi.isEmpty() ? "border-indicator-green bg-indicator-green/10 text-indicator-green hover:bg-indicator-green/20" : "border-slate-700/50 bg-nautical-800/30 text-slate-600 cursor-not-allowed"}`,
                    children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { className: "inline w-3.5 h-3.5 mr-1" }),
                      "确认教练副签 · 解锁下一阶"
                    ]
                  }
                )
              ] }) : /* @__PURE__ */ jsx("div", { className: "h-20 rounded-sm border-2 border-dashed border-slate-700/50 bg-nautical-900/40 flex items-center justify-center text-slate-600 text-xs italic", children: "当前阶段未到教练签署时机" })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function DecompressionLadder({
  steps,
  currentUser,
  users,
  isEmergency,
  onCheckin,
  onDiverSign,
  onInstructorSign
}) {
  const sorted = [...steps].sort((a, b) => a.index - b.index);
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: sorted.map((step) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    step.index > 0 && /* @__PURE__ */ jsx("div", { className: "absolute -top-4 left-8 md:left-12 lg:left-16 w-0.5 h-4 bg-gradient-to-b from-nautical-700 to-indicator-cyan/40" }),
    /* @__PURE__ */ jsx(
      LadderCard,
      {
        step,
        currentUser,
        users,
        isEmergency,
        isSupport: currentUser.role === "support",
        onCheckin,
        onDiverSign,
        onInstructorSign
      }
    )
  ] }, step.id)) });
}
function MiniStepStatus({ step }) {
  const { status, remaining, progressPct, deviation } = useCountdown(
    step.plannedDuration,
    step.status === "counting",
    step.startedAt
  );
  const colorMap = {
    locked: "bg-slate-700",
    unlocked: "led-cyan",
    arrived: "led-cyan",
    counting: status === "warning" ? "led-amber" : status === "overtime" || status === "alert" ? "led-red animate-pulse" : "led-cyan animate-pulse",
    diverSigned: "led-amber",
    completed: "led-green",
    skipped: "bg-indicator-red"
  };
  const textColor = status === "alert" ? "text-indicator-red" : status === "overtime" || status === "warning" ? "text-indicator-amber" : step.status === "completed" ? "text-indicator-green" : step.status === "locked" ? "text-slate-600" : "text-indicator-cyan";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-1.5 border-b border-nautical-700/40 last:border-b-0", children: [
    /* @__PURE__ */ jsx("span", { className: `w-2 h-2 rounded-full flex-shrink-0 ${colorMap[step.status]}` }),
    /* @__PURE__ */ jsx("span", { className: "reading-mono text-sm w-12 shrink-0 text-slate-200", children: formatDepth(step.plannedDepth) }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children: step.status === "counting" ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-nautical-700 overflow-hidden", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `h-full transition-all ${status === "alert" ? "bg-indicator-red" : status === "overtime" ? "bg-indicator-red/70" : status === "warning" ? "bg-indicator-amber" : "bg-indicator-cyan"}`,
          style: { width: `${Math.min(100, progressPct * 100)}%` }
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: `reading-mono text-xs mt-0.5 ${textColor} tabular-nums`, children: [
        "⏱ ",
        formatMMSS(remaining),
        deviation > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-indicator-red", children: [
          "+",
          deviation,
          "s"
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: `text-[11px] ${textColor}`, children: [
      stepStatusLabel(step.status),
      step.actualArrivalTime && /* @__PURE__ */ jsxs("span", { className: "ml-1.5 text-slate-500 reading-mono", children: [
        "@",
        formatTime(step.actualArrivalTime)
      ] })
    ] }) })
  ] });
}
function SupportPanel({ state }) {
  const plan = state.plan;
  if (!plan) return null;
  const sorted = [...plan.steps].sort((a, b) => a.index - b.index);
  const completedCount = sorted.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const totalCount = sorted.length;
  const progressPct = completedCount / totalCount * 100;
  return /* @__PURE__ */ jsxs("aside", { className: "console-card p-4 flex flex-col h-full min-h-[480px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3 pb-3 border-b-2 border-nautical-700/70", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Radio, { className: "w-4 h-4 text-indicator-cyan animate-pulse" }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-100 tracking-wider", children: "水面支援只读台" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-[10px] reading-mono px-2 py-0.5 rounded-sm bg-indicator-cyan/10 text-indicator-cyan border border-indicator-cyan/40 uppercase tracking-wider flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3" }),
        " View Only"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between mb-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] uppercase text-slate-500 tracking-wider", children: "整体进度" }),
        /* @__PURE__ */ jsxs("span", { className: "reading-mono text-indicator-cyan font-bold text-sm", children: [
          completedCount,
          "/",
          totalCount,
          " 阶"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-2 rounded-full bg-nautical-700 overflow-hidden border border-nautical-600/50", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "h-full bg-gradient-to-r from-indicator-cyan to-indicator-green transition-all",
          style: { width: `${progressPct}%` }
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3 text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx("span", { children: "减压阶梯实时同步" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-600 reading-mono", children: "深度↓ / 时间→" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto space-y-0 pr-1 -mr-1", children: sorted.map((s) => /* @__PURE__ */ jsx(MiniStepStatus, { step: s }, s.id)) }),
    state.alerts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-nautical-700/60", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-indicator-amber font-bold mb-1.5", children: "⚠ 告警日志" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1 max-h-28 overflow-y-auto text-[11px]", children: state.alerts.slice(-5).reverse().map((a) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `flex items-start gap-1.5 py-1 border-l-2 pl-2 ${a.type === "emergency" ? "border-indicator-red text-indicator-red" : "border-indicator-amber text-indicator-amber"}`,
          children: [
            /* @__PURE__ */ jsx("span", { className: "reading-mono text-slate-500 shrink-0", children: formatTime(a.createdAt) }),
            /* @__PURE__ */ jsx("span", { className: "truncate", children: a.message })
          ]
        },
        a.id
      )) })
    ] })
  ] });
}
function ProfileChart({ plan, historical, steps }) {
  const [hover, setHover] = useState(null);
  const width = 480;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 32, left: 46 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxDepth = Math.max(plan.maxDepth * 1.1, 20);
  const currentPoints = useMemo(() => {
    const pts = [];
    const sorted = [...steps].sort((a, b) => a.index - b.index);
    const totalDur = sorted.reduce((s, st) => s + st.plannedDuration, 0);
    let accTime = 120;
    pts.push({
      x: padding.left,
      y: padding.top,
      depth: 0,
      time: 0
    });
    pts.push({
      x: padding.left + accTime / (totalDur + 240) * innerW,
      y: padding.top + sorted[0].plannedDepth / maxDepth * innerH,
      depth: sorted[0].plannedDepth,
      time: accTime
    });
    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      const startX = pts[pts.length - 1].x;
      const endX = startX + s.plannedDuration / (totalDur + 240) * innerW;
      const y = padding.top + s.plannedDepth / maxDepth * innerH;
      pts.push({ x: endX, y, depth: s.plannedDepth, time: accTime + s.plannedDuration });
      accTime += s.plannedDuration;
      if (i < sorted.length - 1) {
        const next = sorted[i + 1];
        const transX = endX + 10;
        const transY = padding.top + next.plannedDepth / maxDepth * innerH;
        pts.push({ x: transX, y: transY, depth: next.plannedDepth, time: accTime + 15 });
        accTime += 15;
      }
    }
    const last = pts[pts.length - 1];
    pts.push({ x: last.x + 20, y: padding.top, depth: 0, time: accTime + 30 });
    return pts;
  }, [steps, maxDepth, innerW, innerH]);
  const currentPath = useMemo(() => {
    return currentPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }, [currentPoints]);
  const relevantHistorical = historical.filter((hp) => hp.siteName === plan.siteName).slice(0, 3);
  const scaleHistory = (hp) => {
    var _a;
    if (!hp.points.length) return [];
    const maxT = Math.max(...hp.points.map((p) => p.time), ((_a = currentPoints[currentPoints.length - 1]) == null ? void 0 : _a.time) ?? 1);
    return hp.points.map((p) => {
      const x = padding.left + p.time / (maxT * 1.05) * innerW;
      const y = padding.top + p.depth / maxDepth * innerH;
      return { x, y, depth: p.depth, time: p.time, date: hp.date, diver: hp.diverName };
    });
  };
  const depthTicks = [];
  for (let d = 0; d <= maxDepth; d += Math.ceil(maxDepth / 6)) {
    depthTicks.push(d);
  }
  return /* @__PURE__ */ jsxs("div", { className: "console-card p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-indicator-cyan" }),
        /* @__PURE__ */ jsx("h3", { className: "font-bold tracking-wide text-slate-100 text-sm", children: "Dive Profile 比对" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[10px] reading-mono", children: [
        /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "w-5 h-0.5 bg-indicator-cyan rounded" }),
          " 当前计划"
        ] }),
        relevantHistorical.map((hp, i) => /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-slate-500", children: [
          /* @__PURE__ */ jsx("span", { className: "w-5 h-0.5 rounded", style: { background: `rgba(148, 163, 184, ${0.25 + i * 0.2})` } }),
          hp.date.slice(5)
        ] }, hp.id))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-sm bg-nautical-900/70 border border-nautical-700/50", children: [
      /* @__PURE__ */ jsxs(
        "svg",
        {
          viewBox: `0 0 ${width} ${height}`,
          className: "w-full h-auto block touch-none",
          onMouseLeave: () => setHover(null),
          children: [
            /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "currentFill", x1: "0", x2: "0", y1: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#00E5FF", stopOpacity: "0.35" }),
              /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#00E5FF", stopOpacity: "0" })
            ] }) }),
            depthTicks.map((d, i) => {
              const y = padding.top + d / maxDepth * innerH;
              return /* @__PURE__ */ jsxs("g", { children: [
                /* @__PURE__ */ jsx(
                  "line",
                  {
                    x1: padding.left,
                    x2: width - padding.right,
                    y1: y,
                    y2: y,
                    stroke: "rgba(38, 77, 117, 0.4)",
                    strokeDasharray: "2 4"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "text",
                  {
                    x: padding.left - 6,
                    y: y + 3,
                    textAnchor: "end",
                    fontSize: "10",
                    fill: "#64748b",
                    fontFamily: "JetBrains Mono, monospace",
                    children: formatDepth(d)
                  }
                )
              ] }, i);
            }),
            /* @__PURE__ */ jsx(
              "text",
              {
                transform: `rotate(-90, ${10}, ${height / 2})`,
                x: 10,
                y: height / 2,
                fontSize: "10",
                fill: "#475569",
                fontFamily: "JetBrains Mono, monospace",
                children: "DEPTH (m)"
              }
            ),
            /* @__PURE__ */ jsx(
              "text",
              {
                x: width - padding.right,
                y: height - 8,
                textAnchor: "end",
                fontSize: "10",
                fill: "#475569",
                fontFamily: "JetBrains Mono, monospace",
                children: "TIME →"
              }
            ),
            relevantHistorical.map((hp, i) => {
              const scaled = scaleHistory(hp);
              const path = scaled.map((p, idx) => (idx === 0 ? "M" : "L") + p.x + "," + p.y).join(" ");
              return /* @__PURE__ */ jsx("g", { className: "pointer-events-none", children: /* @__PURE__ */ jsx(
                "path",
                {
                  d: path,
                  fill: "none",
                  stroke: `rgba(148, 163, 184, ${0.25 + i * 0.2})`,
                  strokeWidth: "1.2",
                  strokeDasharray: "4 3"
                }
              ) }, hp.id);
            }),
            /* @__PURE__ */ jsx(
              "path",
              {
                d: `${currentPath} L${currentPoints[currentPoints.length - 1].x},${padding.top + innerH} L${currentPoints[0].x},${padding.top + innerH} Z`,
                fill: "url(#currentFill)"
              }
            ),
            /* @__PURE__ */ jsx(
              "path",
              {
                d: currentPath,
                fill: "none",
                stroke: "#00E5FF",
                strokeWidth: "2.2",
                strokeLinejoin: "round",
                strokeLinecap: "round"
              }
            ),
            steps.sort((a, b) => a.index - b.index).map((s, i) => {
              const pt = currentPoints.find((p) => Math.abs(p.depth - s.plannedDepth) < 0.1);
              if (!pt) return null;
              const fillColor = s.status === "completed" ? "#30D158" : s.status === "skipped" ? "#FF3B30" : s.status === "locked" ? "#475569" : "#00E5FF";
              return /* @__PURE__ */ jsx(
                "circle",
                {
                  cx: pt.x,
                  cy: pt.y,
                  r: "5",
                  fill: fillColor,
                  stroke: "#0A1628",
                  strokeWidth: "2",
                  onMouseEnter: (e) => {
                    var _a;
                    const rect = (_a = e.target.ownerSVGElement) == null ? void 0 : _a.getBoundingClientRect();
                    if (!rect) return;
                    const svgX = (e.clientX - rect.left) / rect.width * width;
                    const svgY = (e.clientY - rect.top) / rect.height * height;
                    setHover({
                      x: svgX,
                      y: svgY,
                      label: `阶${i + 1}：${formatDepth(s.plannedDepth)} 停留${Math.round(s.plannedDuration / 60)}min [${s.status}]`
                    });
                  },
                  className: "cursor-pointer transition-all",
                  style: { filter: s.status !== "locked" ? `drop-shadow(0 0 4px ${fillColor})` : "" }
                },
                s.id
              );
            }),
            /* @__PURE__ */ jsx(
              "line",
              {
                x1: padding.left,
                x2: width - padding.right,
                y1: padding.top,
                y2: padding.top,
                stroke: "#30D158",
                strokeWidth: "1.5",
                strokeDasharray: "0",
                opacity: "0.7"
              }
            ),
            /* @__PURE__ */ jsx(
              "text",
              {
                x: padding.left + 2,
                y: padding.top - 4,
                fontSize: "10",
                fill: "#30D158",
                fontFamily: "JetBrains Mono, monospace",
                children: "SURFACE"
              }
            )
          ]
        }
      ),
      hover && /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute pointer-events-none z-10 bg-nautical-800/95 border border-indicator-cyan/60 px-2.5 py-1.5 rounded-sm text-[11px] text-slate-100 reading-mono shadow-lg",
          style: {
            left: Math.min(width - 150, Math.max(4, hover.x / width * 100)) + "%",
            top: Math.max(4, hover.y / height * 100 - 12) + "%",
            transform: "translate(-50%, -100%)"
          },
          children: hover.label
        }
      )
    ] })
  ] });
}
function EmergencyButton({ disabled, onConfirm }) {
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reason, setReason] = useState("");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-24 right-4 md:right-6 z-40 group", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: `relative transition-transform duration-300 ${disabled ? "opacity-50 pointer-events-none" : ""}`,
        onMouseEnter: () => setHovering(true),
        onMouseLeave: () => setHovering(false),
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-10 rounded-t-lg bg-gradient-to-b from-slate-500 to-slate-700 border-2 border-slate-600 transition-all origin-bottom z-20 cursor-pointer
              ${hovering ? "-translate-y-full -rotate-[25deg] opacity-70" : "translate-y-0 rotate-0"}
            `,
              style: {
                boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)"
              },
              children: /* @__PURE__ */ jsx("div", { className: "text-center text-[9px] uppercase tracking-[0.25em] text-slate-400 font-bold pt-3", children: "PROTECT" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => !disabled && setOpen(true),
              className: "relative w-20 h-20 md:w-24 md:h-24 rounded-full\n              bg-gradient-to-br from-indicator-red via-red-600 to-red-800\n              border-4 border-red-900\n              flex items-center justify-center\n              shadow-led-red\n              hover:brightness-110 active:brightness-90 active:scale-95 transition-all",
              style: {
                boxShadow: "0 0 20px 6px rgba(255,59,48,0.4), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -6px 0 rgba(0,0,0,0.35)"
              },
              disabled,
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center text-white", children: [
                /* @__PURE__ */ jsx(AlertOctagon, { className: "w-7 h-7 md:w-8 md:h-8 drop-shadow-lg", strokeWidth: 2.4 }),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] md:text-[10px] font-bold uppercase tracking-widest mt-0.5 drop-shadow", children: "紧急" }),
                /* @__PURE__ */ jsx("span", { className: "text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] opacity-90", children: "ASCENT" })
              ] })
            }
          )
        ]
      }
    ) }),
    open && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-nautical-900/85 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "console-card max-w-md w-full p-6 border-4 border-indicator-red shadow-led-red bg-indicator-red/5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-indicator-red/20 border-2 border-indicator-red flex items-center justify-center flex-shrink-0 animate-pulse", children: /* @__PURE__ */ jsx(ShieldAlert, { className: "w-6 h-6 text-indicator-red" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-indicator-red", children: "启动紧急上升程序" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300 mt-1 leading-relaxed", children: [
            "此操作将",
            /* @__PURE__ */ jsx("strong", { className: "text-indicator-red", children: "跳过所有未完成的减压阶梯" }),
            "， 强制生成紧急出水令牌。所有操作均会被海事审计系统永久留痕。"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "w-8 h-8 flex items-center justify-center rounded-sm border border-slate-600 text-slate-400 hover:text-slate-200",
            children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "console-divider mb-4" }),
      /* @__PURE__ */ jsx("label", { className: "block text-xs uppercase tracking-wider text-slate-400 font-bold mb-2", children: "紧急原因（必填）" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          autoFocus: true,
          value: reason,
          onChange: (e) => setReason(e.target.value),
          rows: 3,
          placeholder: "例：潜水员出现减压病早期症状 / 设备故障 / 海况突变…",
          className: "w-full bg-nautical-900 border-2 border-indicator-red/60 rounded-sm p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indicator-red focus:shadow-led-red"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 mt-5", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setOpen(false),
            className: "btn-industrial-muted flex-1 !py-3",
            children: "取消"
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            disabled: reason.trim().length < 6,
            onClick: () => {
              onConfirm(reason.trim());
              setOpen(false);
              setReason("");
            },
            className: "btn-industrial-danger flex-1 !py-3 !text-sm\n                  disabled:opacity-40 disabled:cursor-not-allowed\n                  flex items-center justify-center gap-2",
            children: [
              /* @__PURE__ */ jsx(AlertOctagon, { className: "w-4 h-4" }),
              "确认紧急上升"
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
function SurfaceToken({
  steps,
  mode: mode2,
  tokenId,
  emergencyReason,
  surfacedAt,
  currentUser,
  users,
  onConfirmSurface
}) {
  const incomplete = steps.filter(
    (s) => s.status !== "completed" && s.status !== "skipped"
  );
  const skipped = steps.filter((s) => s.status === "skipped");
  const allDone = incomplete.length === 0;
  const isEmergency = mode2 === "emergency";
  const canSurface = allDone || isEmergency;
  const canConfirm = canSurface && (currentUser.role === "instructor" || currentUser.role === "admin");
  const isDone = mode2 === "completed";
  const barClass = isDone ? "border-indicator-green bg-indicator-green/10 shadow-led-green/40" : isEmergency ? "border-indicator-red bg-indicator-red/15 shadow-led-red animate-pulse" : canSurface ? "border-indicator-green bg-indicator-green/10 shadow-led-green/40 animate-pulse" : "border-indicator-red/50 bg-nautical-800/95";
  return /* @__PURE__ */ jsx("div", { className: "fixed bottom-0 left-0 right-0 z-30", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto p-3 md:p-4", children: /* @__PURE__ */ jsx(
    "div",
    {
      className: `rounded-md border-4 ${barClass} backdrop-blur-md p-4 md:p-5 transition-all`,
      children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-start lg:items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-shrink-0 flex items-center gap-3 pr-4 lg:border-r border-current/20", children: [
          isDone ? /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-md bg-indicator-green/20 border-2 border-indicator-green flex items-center justify-center shadow-led-green", children: /* @__PURE__ */ jsx(Award, { className: "w-7 h-7 text-indicator-green" }) }) : isEmergency ? /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-md bg-indicator-red/20 border-2 border-indicator-red flex items-center justify-center shadow-led-red animate-pulse", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-7 h-7 text-indicator-red" }) }) : canSurface ? /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-md bg-indicator-green/20 border-2 border-indicator-green flex items-center justify-center shadow-led-green animate-pulse", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-7 h-7 text-indicator-green" }) }) : /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-md bg-nautical-700/60 border-2 border-slate-600 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { className: "w-7 h-7 text-slate-500" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `text-xs uppercase tracking-[0.25em] font-bold reading-mono
                  ${isDone ? "text-indicator-green" : isEmergency ? "text-indicator-red" : canSurface ? "text-indicator-green" : "text-slate-500"}`,
                children: isDone ? "已出水 SURFACED" : isEmergency ? "紧急出水令牌" : canSurface ? "准许出水 TOKEN ISSUED" : "出水令牌 未激活"
              }
            ),
            tokenId && /* @__PURE__ */ jsxs("div", { className: "reading-mono text-lg font-bold tabular-nums text-slate-100 mt-0.5", children: [
              "#",
              tokenId
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 w-full", children: [
          isDone && surfacedAt && /* @__PURE__ */ jsxs("div", { className: "text-sm text-slate-200", children: [
            "出水时间：",
            /* @__PURE__ */ jsx("span", { className: "reading-mono font-bold text-indicator-green ml-1", children: new Date(surfacedAt).toLocaleString("zh-CN", { hour12: false }) })
          ] }),
          isEmergency && emergencyReason && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 text-indicator-red mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("span", { className: "text-indicator-red/90", children: [
              /* @__PURE__ */ jsx("strong", { children: "紧急原因：" }),
              emergencyReason,
              skipped.length > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-indicator-amber", children: [
                "· 共跳过 ",
                skipped.length,
                " 个减压阶梯"
              ] })
            ] })
          ] }),
          !canSurface && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 text-sm text-indicator-red font-semibold", children: [
              /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "尚有 ",
                incomplete.length,
                " 个减压阶梯未完成，禁止出水："
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: incomplete.map((s) => {
              const diver = users.find((u) => u.id === s.assignedDiverId);
              return /* @__PURE__ */ jsxs(
                "span",
                {
                  className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-indicator-red/10 border border-indicator-red/40 text-[11px] reading-mono text-slate-200",
                  children: [
                    /* @__PURE__ */ jsx(Waves, { className: "w-3 h-3 text-indicator-red/80" }),
                    "阶#",
                    s.index + 1,
                    " ",
                    formatDepth(s.plannedDepth),
                    /* @__PURE__ */ jsx("span", { className: "text-slate-500 mx-0.5", children: "·" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-indicator-amber/80", children: [
                      roleLabel("diver"),
                      ":",
                      diver == null ? void 0 : diver.name
                    ] })
                  ]
                },
                s.id
              );
            }) })
          ] }),
          canSurface && !isDone && /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-300 leading-relaxed", children: isEmergency ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("span", { className: "text-indicator-red font-bold", children: "⚠ 紧急模式：" }),
            "已签发紧急出水令牌。所有潜水人员立即出水，",
            /* @__PURE__ */ jsx("strong", { children: "事后需补充海事报告" }),
            "。"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "inline w-4 h-4 text-indicator-green mr-1 align-[-2px]" }),
            /* @__PURE__ */ jsx("span", { className: "text-indicator-green font-semibold", children: "全部减压阶梯已合规完成：" }),
            /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
              "共 ",
              steps.length,
              " 阶停留，",
              steps.some((s) => s.hasAlert) ? /* @__PURE__ */ jsxs("span", { className: "text-indicator-amber", children: [
                "有 ",
                steps.filter((s) => s.hasAlert).length,
                " 次偏离告警记录"
              ] }) : /* @__PURE__ */ jsx("span", { className: "text-indicator-green", children: "无偏离告警" })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-full lg:w-auto", children: isDone ? /* @__PURE__ */ jsxs("div", { className: "h-14 px-6 rounded-sm border-2 border-indicator-green/60 flex items-center gap-2 bg-indicator-green/10 text-indicator-green font-bold text-sm uppercase tracking-wider", children: [
          /* @__PURE__ */ jsx(Award, { className: "w-5 h-5" }),
          "流程已归档 ✓"
        ] }) : /* @__PURE__ */ jsxs(
          "button",
          {
            disabled: !canConfirm,
            onClick: onConfirmSurface,
            className: `w-full lg:w-auto h-14 px-6 md:px-8 rounded-sm border-2 font-bold tracking-wider uppercase transition-all text-base
                    ${canConfirm ? isEmergency ? "btn-industrial-danger !h-14 !px-8 !text-base" : "btn-industrial-success !h-14 !px-8 !text-base shadow-led-green" : "border-slate-700/60 bg-nautical-800/60 text-slate-600 cursor-not-allowed"}`,
            children: [
              /* @__PURE__ */ jsx(Waves, { className: "inline w-5 h-5 mr-2 align-[-3px]" }),
              canConfirm ? isEmergency ? "确认紧急出水" : "确认准许出水" : currentUser.role !== "instructor" && currentUser.role !== "admin" ? "仅教练可签发" : "令牌未激活"
            ]
          }
        ) })
      ] })
    }
  ) }) });
}
function AlertOverlay({ alerts, mode: mode2, onAck, muted, onToggleMute }) {
  const unacked = alerts.filter((a) => !a.acknowledged);
  const hasEmergency = mode2 === "emergency";
  const hasAlert = hasEmergency || unacked.some((a) => a.type === "deviation");
  if (!hasAlert && !unacked.length) return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    hasEmergency && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 pointer-events-none emergency-overlay z-50" }),
    hasAlert && !hasEmergency && /* @__PURE__ */ jsx("div", { className: "pointer-events-none fixed inset-0 z-40 animate-pulse-alert rounded-sm" }),
    /* @__PURE__ */ jsxs("div", { className: "fixed top-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] space-y-2", children: [
      unacked.slice(0, 4).map((a) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `console-card border-2 p-3 flex items-start gap-3
              ${a.type === "emergency" ? "border-indicator-red shadow-led-red bg-indicator-red/10" : a.type === "deviation" ? "border-indicator-amber shadow-led-amber bg-indicator-amber/10" : "border-indicator-cyan bg-indicator-cyan/10"}`,
          children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: `w-5 h-5 flex-shrink-0 mt-0.5 ${a.type === "emergency" ? "text-indicator-red" : a.type === "deviation" ? "text-indicator-amber" : "text-indicator-cyan"}` }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-xs uppercase tracking-wider font-bold text-slate-500 reading-mono mb-0.5", children: [
                formatTime(a.createdAt),
                /* @__PURE__ */ jsx("span", { className: "ml-2", children: a.type === "emergency" ? "紧急事件" : a.type === "deviation" ? "偏离告警" : "倒计时结束" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-slate-100 leading-snug", children: a.message })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onAck(a.id),
                className: "w-7 h-7 flex items-center justify-center rounded-sm bg-nautical-900/60 border border-nautical-600/70 text-slate-400 hover:text-indicator-cyan hover:border-indicator-cyan transition-all",
                children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" })
              }
            )
          ]
        },
        a.id
      )),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onToggleMute,
          className: `px-3 py-1 text-[11px] font-semibold rounded-sm border transition-all reading-mono
              ${muted ? "border-slate-600 bg-nautical-800 text-slate-500" : "border-indicator-amber bg-indicator-amber/10 text-indicator-amber shadow-led-amber"}`,
          children: muted ? "🔇 告警音: 关" : "🔔 告警音: 开"
        }
      ) })
    ] })
  ] });
}
function useAlertSound() {
  const ctxRef = useRef(null);
  const ensureCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };
  const beep = useCallback((type = "alert") => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const now2 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "alert") {
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now2);
      osc.frequency.setValueAtTime(600, now2 + 0.18);
      osc.frequency.setValueAtTime(880, now2 + 0.36);
      gain.gain.setValueAtTime(0.35, now2);
      gain.gain.exponentialRampToValueAtTime(1e-4, now2 + 0.8);
      osc.start(now2);
      osc.stop(now2 + 0.8);
    } else if (type === "warn") {
      osc.type = "triangle";
      osc.frequency.value = 520;
      gain.gain.setValueAtTime(0.25, now2);
      gain.gain.exponentialRampToValueAtTime(1e-4, now2 + 0.3);
      osc.start(now2);
      osc.stop(now2 + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, now2);
      osc.frequency.setValueAtTime(880, now2 + 0.08);
      gain.gain.setValueAtTime(0.2, now2);
      gain.gain.exponentialRampToValueAtTime(1e-4, now2 + 0.2);
      osc.start(now2);
      osc.stop(now2 + 0.2);
    }
  }, []);
  return { beep };
}
async function getCurrentGps() {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return { lat: 0, lng: 0 };
  }
  return new Promise((resolve) => {
    const fallback = () => {
      resolve({
        lat: 30.6321 + (Math.random() * 2e-3 - 1e-3),
        lng: 122.3844 + (Math.random() * 2e-3 - 1e-3)
      });
    };
    const timer = setTimeout(fallback, 1500);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        fallback();
      },
      { timeout: 1500 }
    );
  });
}
async function generateDivePdf(state, users) {
  const plan = state.plan;
  if (!plan) throw new Error("No dive plan");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 14;
  let y = 18;
  doc.setFillColor(10, 22, 40);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(0, 229, 255);
  doc.setFontSize(18);
  doc.text("MARITIME DIVE DECOMPRESSION LOG", pageW / 2, 8, { align: "center" });
  doc.setTextColor(200, 220, 255);
  doc.setFontSize(9);
  doc.text("中华人民共和国海事局 潜水减压停留核对日志", pageW / 2, 14, { align: "center" });
  doc.setTextColor(20, 20, 20);
  y += 6;
  doc.setDrawColor(0, 229, 255);
  doc.setLineWidth(0.6);
  doc.line(marginL, y, pageW - marginL, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`潜点 Dive Site:`, marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(plan.siteName, marginL + 52, y);
  doc.setFont("helvetica", "bold");
  doc.text(`编号 Log No.:`, pageW - marginL - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(state.tokenId ?? "--", pageW - marginL - 20, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`最大深度 Max Depth:`, marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDepth(plan.maxDepth), marginL + 42, y);
  doc.setFont("helvetica", "bold");
  doc.text(`潜点 GPS:`, pageW - marginL - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatGps(plan.siteGpsLat, plan.siteGpsLng), pageW - marginL, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`开始时间 Start:`, marginL, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(plan.plannedStartTime), marginL + 34, y);
  doc.setFont("helvetica", "bold");
  doc.text(`出水时间 Surface:`, pageW - marginL - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(state.surfacedAt), pageW - marginL, y, { align: "right" });
  y += 4;
  doc.setDrawColor(150);
  doc.setLineWidth(0.2);
  doc.line(marginL, y, pageW - marginL, y);
  y += 8;
  const headers = ["#", "Depth", "Plan", "Arrival", "GPS", "Deviation", "Diver Sign", "Instr Sign"];
  const colX = [marginL, marginL + 10, marginL + 30, marginL + 62, marginL + 90, marginL + 120, marginL + 145, marginL + 165];
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(15, 39, 68);
  doc.rect(marginL, y - 4, pageW - marginL * 2, 6, "F");
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 5;
  doc.setTextColor(20, 20, 20);
  const sorted = [...plan.steps].sort((a, b) => a.index - b.index);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  for (const step of sorted) {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    const diver = users.find((u) => u.id === step.assignedDiverId);
    const rowH = 20;
    doc.setDrawColor(220);
    doc.rect(marginL, y - 3, pageW - marginL * 2, rowH);
    doc.text(String(step.index + 1), colX[0], y);
    doc.text(formatDepth(step.plannedDepth), colX[1], y);
    doc.text(formatDurationMM(step.plannedDuration), colX[2], y);
    doc.text(formatDateTime(step.actualArrivalTime), colX[3], y);
    doc.setTextColor(80);
    doc.text(
      step.gpsLat ? formatGps(step.gpsLat, step.gpsLng) : "--",
      colX[4],
      y
    );
    doc.setTextColor(
      step.deviationSeconds && step.deviationSeconds > 0 ? 200 : 20,
      step.deviationSeconds && step.deviationSeconds > 180 ? 30 : 20,
      step.deviationSeconds && step.deviationSeconds > 180 ? 30 : 20
    );
    doc.text(
      step.deviationSeconds ? `${step.deviationSeconds > 0 ? "+" : ""}${step.deviationSeconds}s` : "--",
      colX[5],
      y
    );
    doc.setTextColor(20, 20, 20);
    if (step.diverSignature) {
      try {
        doc.addImage(step.diverSignature, "PNG", colX[6] - 1, y - 1, 26, 13);
      } catch {
      }
    } else {
      doc.setTextColor(180, 30, 30);
      doc.text("缺失 MISSING", colX[6], y);
      doc.setTextColor(20, 20, 20);
    }
    if (step.instructorSignature) {
      try {
        doc.addImage(step.instructorSignature, "PNG", colX[7] - 1, y - 1, 26, 13);
      } catch {
      }
    } else {
      doc.setTextColor(180, 30, 30);
      doc.text(step.status === "skipped" ? "跳过 SKIP" : "缺失", colX[7], y);
      doc.setTextColor(20, 20, 20);
    }
    y += rowH;
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(
      `Diver: ${(diver == null ? void 0 : diver.name) ?? "--"}  ${roleLabel((diver == null ? void 0 : diver.role) ?? "")}`,
      colX[6],
      y - 1
    );
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(7.5);
  }
  y += 6;
  if (state.mode === "emergency") {
    doc.setFillColor(255, 235, 235);
    doc.setTextColor(200, 30, 30);
    doc.rect(marginL, y - 4, pageW - marginL * 2, 12, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`紧急上升事件 / EMERGENCY ASCENT`, marginL + 2, y + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`原因: ${state.emergencyReason ?? "未记录"}`, marginL + 2, y + 7);
    y += 14;
    doc.setTextColor(20, 20, 20);
  }
  if (state.tokenId) {
    doc.setFillColor(48, 209, 88);
    doc.rect(marginL, y - 4, pageW - marginL * 2, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`可出水令牌 SURFACE TOKEN: ${state.tokenId}`, pageW / 2, y + 4, { align: "center" });
    doc.setTextColor(20, 20, 20);
    y += 14;
  }
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  const signersText = state.alerts.filter((a) => a.type === "deviation").map((a) => `[偏离告警] ${a.message} @ ${formatDateTime(a.createdAt)}`).join("  |  ");
  if (signersText) {
    doc.text(`告警记录 Alerts: ${signersText}`, marginL, y);
    y += 5;
  }
  doc.text(`本文件由深潜减压核对台电子生成 ｜ 版本 v1.0 ｜ 打印时间 ${formatDateTime(Date.now())}`, marginL, y);
  return doc.output("blob");
}
const initialState = {
  mode: "login",
  currentStepId: null,
  plan: null,
  alerts: []
};
function unlockNextStep(steps) {
  const sorted = [...steps].sort((a, b) => a.index - b.index);
  const idx = sorted.findIndex((s) => s.status !== "completed" && s.status !== "skipped");
  if (idx > 0 && sorted[idx].status === "locked") {
    sorted[idx] = { ...sorted[idx], status: "unlocked" };
  }
  return steps.map((orig) => {
    const updated = sorted.find((s) => s.id === orig.id);
    return updated ?? orig;
  });
}
function allCompletedOrSkipped(steps) {
  return steps.every((s) => s.status === "completed" || s.status === "skipped");
}
function diveReducer(state, action2) {
  var _a;
  switch (action2.type) {
    case "START_DIVE": {
      return {
        ...state,
        mode: "underway",
        plan: { ...action2.plan, plannedStartTime: Date.now() },
        currentStepId: ((_a = action2.plan.steps.find((s) => s.status === "unlocked")) == null ? void 0 : _a.id) ?? null,
        alerts: []
      };
    }
    case "CHECKIN": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map((s) => {
        if (s.id !== action2.stepId) return s;
        return {
          ...s,
          status: "arrived",
          actualArrivalTime: action2.time,
          gpsLat: action2.lat,
          gpsLng: action2.lng,
          startedAt: action2.time
        };
      });
      return {
        ...state,
        plan: { ...state.plan, steps },
        currentStepId: action2.stepId
      };
    }
    case "START_COUNTING": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(
        (s) => s.id === action2.stepId ? { ...s, status: "counting" } : s
      );
      return { ...state, plan: { ...state.plan, steps } };
    }
    case "DIVER_SIGN": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map((s) => {
        if (s.id !== action2.stepId) return s;
        if (s.assignedDiverId !== action2.diverId) return s;
        return {
          ...s,
          status: "diverSigned",
          diverSignature: action2.signature,
          diverSignTime: action2.time
        };
      });
      return { ...state, plan: { ...state.plan, steps } };
    }
    case "INSTRUCTOR_SIGN": {
      if (!state.plan) return state;
      let steps = state.plan.steps.map((s) => {
        if (s.id !== action2.stepId) return s;
        return {
          ...s,
          status: "completed",
          instructorSignature: action2.signature,
          instructorSignTime: action2.time
        };
      });
      steps = unlockNextStep(steps);
      const nextCurrent = steps.find(
        (s) => s.status !== "completed" && s.status !== "skipped"
      );
      return {
        ...state,
        plan: { ...state.plan, steps },
        currentStepId: (nextCurrent == null ? void 0 : nextCurrent.id) ?? state.currentStepId
      };
    }
    case "UPDATE_DEVIATION": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(
        (s) => s.id === action2.stepId ? {
          ...s,
          deviationSeconds: action2.seconds,
          hasAlert: s.hasAlert || action2.seconds > 180
        } : s
      );
      return { ...state, plan: { ...state.plan, steps } };
    }
    case "TRIGGER_ALERT": {
      const alert2 = {
        id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "deviation",
        stepId: action2.stepId,
        message: action2.message,
        createdAt: Date.now(),
        acknowledged: false
      };
      return { ...state, alerts: [...state.alerts, alert2] };
    }
    case "ACK_ALERT": {
      const alerts = state.alerts.map(
        (a) => a.id === action2.alertId ? { ...a, acknowledged: true } : a
      );
      return { ...state, alerts };
    }
    case "EMERGENCY_ASCENT": {
      if (!state.plan) return state;
      const steps = state.plan.steps.map(
        (s) => s.status === "completed" || s.status === "skipped" ? s : { ...s, status: "skipped" }
      );
      const emergencyAlert = {
        id: `alert_emg_${Date.now()}}`,
        type: "emergency",
        stepId: state.currentStepId ?? "",
        message: `紧急上升启动：${action2.reason}`,
        createdAt: Date.now(),
        acknowledged: false
      };
      return {
        ...state,
        mode: "emergency",
        emergencyReason: action2.reason,
        plan: { ...state.plan, steps },
        alerts: [...state.alerts, emergencyAlert]
      };
    }
    case "CONFIRM_SURFACE": {
      const canSurface = state.plan && allCompletedOrSkipped(state.plan.steps);
      if (!state.plan || !canSurface) return state;
      return {
        ...state,
        mode: "completed",
        surfacedAt: action2.time,
        tokenId: action2.tokenId
      };
    }
    case "RESET":
      return initialState;
    default:
      return state;
  }
}
const meta = () => {
  return [
    { title: "深潜减压核对台 | Decompression Checkstation" },
    { name: "description", content: "海事局合规潜水减压停留电子核对系统" }
  ];
};
async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) {
    return json({
      authenticated: false,
      user: null,
      plans: DIVE_PLANS,
      historicalProfiles: HISTORICAL_PROFILES,
      mode: "login"
    });
  }
  const user = USERS.find((u) => u.id === userId) ?? null;
  const stateKey = `dive_state_${userId}`;
  const rawState = session.get(stateKey);
  let initialDiveState = {
    planId: null,
    steps: null,
    currentStepId: null,
    alerts: [],
    tokenId: null,
    surfacedAt: null,
    emergencyReason: null,
    diveMode: null
  };
  if (rawState && typeof rawState === "object") {
    initialDiveState = rawState;
  }
  return json({
    authenticated: true,
    user,
    plans: DIVE_PLANS,
    historicalProfiles: HISTORICAL_PROFILES,
    mode: (initialDiveState == null ? void 0 : initialDiveState.planId) ? "underway" : "selectPlan",
    initialDiveState
  });
}
async function action({ request }) {
  const form = await request.formData();
  const intent = form.get("intent");
  const session = await getSession(request.headers.get("Cookie"));
  if (intent === "login") {
    const employeeId = String(form.get("employeeId") || "");
    const password = String(form.get("password") || "");
    const selectedRole = form.get("role");
    const user = USERS.find((u) => u.employeeId === employeeId && u.password === password);
    if (!user) {
      return json({ ok: false, error: "工号或密码错误" }, { status: 401 });
    }
    if (selectedRole && user.role !== selectedRole && !(selectedRole === "diver" && user.role === "admin")) {
      if (user.role !== "admin") {
        return json(
          { ok: false, error: `该账号为 ${user.role} 账号，请选择正确角色` },
          { status: 403 }
        );
      }
    }
    session.set("userId", user.id);
    return json({ ok: true }, {
      headers: { "Set-Cookie": await commitSession(session) }
    });
  }
  if (intent === "logout") {
    return redirect("/", {
      headers: { "Set-Cookie": await destroySession(session) }
    });
  }
  const userId = session.get("userId");
  if (!userId) {
    return json({ ok: false, error: "未登录" }, { status: 401 });
  }
  if (intent === "export") {
    const stateRaw = form.get("stateJson");
    try {
      const parsed = JSON.parse(stateRaw);
      const blob = await generateDivePdf(parsed, USERS);
      const buffer = Buffer.from(await blob.arrayBuffer());
      const fname = `DIVE_LOG_${generateTokenId()}.pdf`;
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fname}"`
        }
      });
    } catch (e) {
      return json({ ok: false, error: "PDF 生成失败：" + (e == null ? void 0 : e.message) }, { status: 500 });
    }
  }
  return json({ ok: true });
}
function Index() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const nav = useNavigation();
  const [loginError, setLoginError] = useState(null);
  const initFromLoader = () => {
    if (!loaderData.authenticated || !loaderData.user) {
      return { mode: "login", currentStepId: null, plan: null, alerts: [] };
    }
    const init = loaderData.initialDiveState;
    if (init && init.planId && init.steps) {
      const plan2 = loaderData.plans.find((p) => p.id === init.planId) ?? null;
      if (plan2) {
        const mergedPlan = { ...plan2, steps: init.steps };
        const mode2 = init.diveMode === "emergency" ? "emergency" : init.surfacedAt ? "completed" : "underway";
        return {
          mode: mode2,
          currentStepId: init.currentStepId,
          plan: mergedPlan,
          alerts: init.alerts ?? [],
          tokenId: init.tokenId ?? void 0,
          surfacedAt: init.surfacedAt ?? void 0,
          emergencyReason: init.emergencyReason ?? void 0
        };
      }
    }
    return { mode: "selectPlan", currentStepId: null, plan: null, alerts: [] };
  };
  const [diveState, rawDispatch] = useReducer(diveReducer, void 0, initFromLoader);
  const { beep } = useAlertSound();
  const [gps, setGps] = useState({});
  const [muted, setMuted] = useState(false);
  const [exporting, setExporting] = useState(false);
  const alertFiredRef = useRef(/* @__PURE__ */ new Set());
  const deviationWarnedRef = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    if (loaderData.mode === "login") return;
    let cancelled = false;
    const update = async () => {
      const g = await getCurrentGps();
      if (!cancelled) setGps(g);
    };
    update();
    const id = setInterval(update, 15e3);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [loaderData.mode]);
  useEffect(() => {
    if (actionData && !actionData.ok && actionData.error && loaderData.mode === "login") {
      setLoginError(actionData.error);
    } else if (actionData == null ? void 0 : actionData.ok) {
      setLoginError(null);
    }
  }, [actionData, loaderData.mode]);
  useEffect(() => {
    if (!diveState.plan) return;
    const id = setInterval(() => {
      const now2 = Date.now();
      diveState.plan.steps.forEach((s) => {
        if ((s.status === "counting" || s.status === "diverSigned") && s.startedAt) {
          const elapsed = (now2 - s.startedAt) / 1e3;
          const dev = Math.floor(elapsed - s.plannedDuration);
          if (dev !== s.deviationSeconds) {
            rawDispatch({ type: "UPDATE_DEVIATION", stepId: s.id, seconds: dev });
          }
          if (dev > 180 && !alertFiredRef.current.has(s.id)) {
            alertFiredRef.current.add(s.id);
            rawDispatch({
              type: "TRIGGER_ALERT",
              stepId: s.id,
              message: `深度 ${s.plannedDepth}m 停留偏离计划超 3 分钟（超时 ${dev - 180 + 180}s），请立即上浮`
            });
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
    var _a, _b;
    if (!diveState.plan) return false;
    if (diveState.mode === "completed" || diveState.mode === "emergency") return true;
    const signed = diveState.plan.steps.filter((s) => s.instructorSignature).length;
    return signed >= 1 && (((_a = loaderData.user) == null ? void 0 : _a.role) === "instructor" || ((_b = loaderData.user) == null ? void 0 : _b.role) === "admin");
  }, [diveState, loaderData.user]);
  const handleCheckin = async (stepId) => {
    if (!diveState.plan || !loaderData.user) return;
    const { lat, lng } = gps.lat !== void 0 ? gps : await getCurrentGps();
    const now2 = Date.now();
    rawDispatch({ type: "CHECKIN", stepId, time: now2, lat, lng });
    rawDispatch({ type: "START_COUNTING", stepId });
    beep("ok");
  };
  const handleDiverSign = (stepId, signature) => {
    if (!loaderData.user) return;
    rawDispatch({
      type: "DIVER_SIGN",
      stepId,
      signature,
      time: Date.now(),
      diverId: loaderData.user.id
    });
    beep("ok");
  };
  const handleInstructorSign = (stepId, signature) => {
    if (!loaderData.user || loaderData.user.role !== "instructor" && loaderData.user.role !== "admin") return;
    rawDispatch({
      type: "INSTRUCTOR_SIGN",
      stepId,
      signature,
      time: Date.now()
    });
    beep("ok");
  };
  const handleSelectPlan = (planId) => {
    const plan2 = loaderData.plans.find((p) => p.id === planId);
    if (!plan2 || !loaderData.user) return;
    if (loaderData.user.role !== "instructor" && loaderData.user.role !== "admin") return;
    const fresh = {
      ...plan2,
      steps: plan2.steps.map((s) => ({ ...s, status: s.index === 0 ? "unlocked" : "locked" })),
      plannedStartTime: Date.now()
    };
    rawDispatch({ type: "START_DIVE", plan: fresh });
    beep("ok");
  };
  const handleEmergency = (reason) => {
    rawDispatch({ type: "EMERGENCY_ASCENT", reason });
  };
  const handleConfirmSurface = () => {
    if (!loaderData.user) return;
    const tokenId = generateTokenId();
    rawDispatch({ type: "CONFIRM_SURFACE", time: Date.now(), tokenId });
    beep("ok");
  };
  const handleAckAlert = (id) => {
    rawDispatch({ type: "ACK_ALERT", alertId: id });
  };
  const handleExport = async () => {
    var _a;
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
        const fname = ((_a = cd == null ? void 0 : cd.match(/filename="(.+?)"/)) == null ? void 0 : _a[1]) ?? `DIVE_LOG_${diveState.tokenId ?? generateTokenId()}.pdf`;
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
    return /* @__PURE__ */ jsx(LoginPanel, { error: loginError });
  }
  if (diveState.mode === "selectPlan" || !diveState.plan) {
    return /* @__PURE__ */ jsx(
      PlanSelector,
      {
        plans: loaderData.plans,
        historicalProfiles: loaderData.historicalProfiles,
        user: loaderData.user,
        onSelectPlan: handleSelectPlan
      }
    );
  }
  const user = loaderData.user;
  const plan = diveState.plan;
  const relevantHistory = loaderData.historicalProfiles.filter((hp) => hp.siteName === plan.siteName);
  const hasActiveAlerts = diveState.alerts.some((a) => !a.acknowledged) || diveState.mode === "emergency";
  return /* @__PURE__ */ jsxs("div", { className: `min-h-screen pb-40 relative ${hasActiveAlerts ? "animate-pulse-alert" : ""}`, children: [
    /* @__PURE__ */ jsx(
      TopBar,
      {
        user,
        plan,
        gps,
        canExport,
        onExport: handleExport,
        exporting
      }
    ),
    /* @__PURE__ */ jsx(
      AlertOverlay,
      {
        alerts: diveState.alerts,
        mode: diveState.mode,
        onAck: handleAckAlert,
        muted,
        onToggleMute: () => setMuted((m) => !m)
      }
    ),
    /* @__PURE__ */ jsx("main", { className: "max-w-7xl mx-auto p-3 md:p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-[1fr_380px] gap-4 md:gap-6", children: [
      /* @__PURE__ */ jsxs("section", { className: "space-y-4 md:space-y-6 min-w-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between mb-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h2", { className: "text-lg md:text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "w-1 h-6 bg-indicator-cyan rounded-sm shadow-led-cyan" }),
                "减压停留阶梯表",
                /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs reading-mono text-slate-500 uppercase tracking-[0.25em]", children: "Decompression Ladder" })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1 pl-3", children: [
                "自上而下按深度逐级完成 · 未签完当前阶 ",
                /* @__PURE__ */ jsx("strong", { className: "text-indicator-amber", children: "无法解锁" }),
                " 下一阶 · 未完成所有阶梯 ",
                /* @__PURE__ */ jsx("strong", { className: "text-indicator-red", children: "禁止签发可出水令牌" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-3 text-xs reading-mono", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { className: "led-green" }),
                " 已完成"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { className: "led-cyan animate-pulse" }),
                " 进行中"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { className: "led-amber" }),
                " 待教练副签"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-slate-400", children: [
                /* @__PURE__ */ jsx("span", { className: "led-gray" }),
                " 未解锁"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            DecompressionLadder,
            {
              steps: plan.steps,
              currentUser: user,
              users: USERS,
              isEmergency: diveState.mode === "emergency",
              onCheckin: handleCheckin,
              onDiverSign: handleDiverSign,
              onInstructorSign: handleInstructorSign
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          ProfileChart,
          {
            plan,
            historical: relevantHistory,
            steps: plan.steps
          }
        )
      ] }),
      /* @__PURE__ */ jsx("aside", { className: "lg:sticky lg:top-24 space-y-4 md:space-y-6 self-start", children: /* @__PURE__ */ jsx(SupportPanel, { state: diveState }) })
    ] }) }),
    /* @__PURE__ */ jsx(
      EmergencyButton,
      {
        disabled: diveState.mode === "completed" || user.role !== "instructor" && user.role !== "diver" && user.role !== "admin" || nav.state !== "idle",
        onConfirm: handleEmergency
      }
    ),
    /* @__PURE__ */ jsx(
      SurfaceToken,
      {
        steps: plan.steps,
        mode: diveState.mode,
        tokenId: diveState.tokenId,
        emergencyReason: diveState.emergencyReason,
        surfacedAt: diveState.surfacedAt,
        currentUser: user,
        users: USERS,
        onConfirmSurface: handleConfirmSurface
      }
    )
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Index,
  loader,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-_oDY_s_Z.js", "imports": ["/assets/components-DDxTwQnv.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CMw1xy1-.js", "imports": ["/assets/components-DDxTwQnv.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-6mX78ixn.js", "imports": ["/assets/components-DDxTwQnv.js"], "css": [] } }, "url": "/assets/manifest-608973ab.js", "version": "608973ab" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
