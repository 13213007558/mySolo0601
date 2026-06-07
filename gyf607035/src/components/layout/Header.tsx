import { useAppStore } from "@/store/useAppStore";
import { ROLE_LABELS } from "@/types";
import { ChevronDown, ShieldCheck, UserRound, Baby, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const { currentRole, currentUser, switchRole, balance } = useAppStore();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isNegative = balance.remainingBalance < 0;

  const navItems = [
    { path: "/", label: "核销工作台", icon: Baby },
    { path: "/supplement", label: "手工补录", icon: Plus },
    { path: "/audit", label: "审计中心", icon: ShieldCheck, supervisorOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-xl text-stone-900">婴幼儿费用核销复核墙</h1>
            <p className="text-[11px] text-stone-500 -mt-0.5">试听顾问版 · 标准化核销流程</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {navItems.map((item) => {
            if (item.supervisorOnly && currentRole !== "supervisor") return null;
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isNegative
              ? "bg-danger-50 text-danger-600 border border-danger-200 animate-pulse-border"
              : "bg-brand-50 text-brand-700 border border-brand-200"
          }`}
        >
          <span className="text-[11px] opacity-75 font-normal">本月余额</span>
          <span className={isNegative ? "animate-pulse" : ""}>
            ¥{balance.remainingBalance.toLocaleString("zh-CN")}
          </span>
          {isNegative && <span className="text-[10px] font-bold">⚠负余额预警</span>}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-300 to-accent-500 flex items-center justify-center">
              <UserRound className="w-4 h-4 text-white" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-medium text-stone-800">{currentUser}</div>
              <div className="text-[11px] text-stone-500">{ROLE_LABELS[currentRole]}</div>
            </div>
            <ChevronDown className={`w-4 h-4 text-stone-500 transition ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                <div className="text-xs text-stone-500 mb-1">切换角色视图</div>
                <div className="text-sm font-medium text-stone-800">不同角色看到不同功能</div>
              </div>
              <div className="p-1.5">
                {(["consultant", "supervisor"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setOpen(false);
                      if (r !== "supervisor" && location.pathname === "/audit") navigate("/");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                      currentRole === r
                        ? "bg-brand-50 text-brand-700"
                        : "hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        r === "supervisor" ? "bg-accent-100" : "bg-brand-100"
                      }`}
                    >
                      {r === "supervisor" ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-accent-600" />
                      ) : (
                        <UserRound className="w-3.5 h-3.5 text-brand-600" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{ROLE_LABELS[r]}</div>
                      <div className="text-[11px] text-stone-500">
                        {r === "supervisor" ? "可查看完整审计与边界值复核" : "专注核销流程操作"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
