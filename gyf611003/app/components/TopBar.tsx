import { Form } from "@remix-run/react";
import { Anchor, FileText, LogOut, MapPin, User as UserIcon } from "lucide-react";
import type { User } from "~/data/types";
import type { DiveState } from "~/data/types";
import { formatTime, roleLabel } from "~/utils/format";
import { useEffect, useState } from "react";

interface Props {
  user: User;
  plan: DiveState["plan"];
  gps: { lat?: number; lng?: number };
  canExport: boolean;
  onExport: () => void;
  exporting: boolean;
}

export default function TopBar({ user, plan, gps, canExport, onExport, exporting }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-nautical-700/80 bg-nautical-900/95 backdrop-blur-md">
      <div className="flex items-center gap-4 px-5 py-3">
        <div className="flex items-center gap-2.5 pr-4 border-r border-nautical-700/60">
          <div className="w-9 h-9 rounded-sm bg-indicator-cyan/10 border-2 border-indicator-cyan flex items-center justify-center shadow-led-cyan">
            <Anchor className="w-5 h-5 text-indicator-cyan" />
          </div>
          <div className="leading-tight">
            <div className="font-bold tracking-wide text-slate-100 text-[15px]">减压核对台</div>
            <div className="text-[10px] reading-mono text-indicator-cyan/80 uppercase tracking-[0.2em]">DCS v1.0</div>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-indicator-cyan flex-shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-slate-100">{plan?.siteName ?? "未选择潜点"}</span>
            {plan && (
              <span className="text-xs text-slate-500 ml-2 reading-mono hidden md:inline">
                {plan.siteGpsLat.toFixed(3)}°N {plan.siteGpsLng.toFixed(3)}°E
              </span>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-nautical-800/70 border border-nautical-700/60">
          <div className="w-2 h-2 rounded-full led-green animate-pulse" />
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">GPS</span>
          <span className="reading-mono text-xs text-slate-200">
            {gps.lat ? `${gps.lat.toFixed(3)}°N ${gps.lng?.toFixed(3)}°E` : "定位中…"}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="reading-mono text-lg tabular-nums text-indicator-cyan px-3 py-1 bg-nautical-800/60 rounded-sm border border-nautical-700/50 shadow-led-cyan/30">
            {formatTime(now.getTime())}
          </div>

          <button
            onClick={onExport}
            disabled={!canExport || exporting}
            className="btn-industrial-success !py-2 !px-3 text-xs hidden sm:inline-flex"
            title="导出海事格式 PDF"
          >
            <FileText className="w-4 h-4" />
            {exporting ? "导出中…" : "导出 PDF"}
          </button>

          <div className="flex items-center gap-2 pl-3 border-l border-nautical-700/60">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-nautical-700 border-2 border-indicator-cyan/60">
              <UserIcon className="w-4 h-4 text-indicator-cyan" />
            </div>
            <div className="leading-tight text-sm">
              <div className="font-semibold text-slate-100">{user.name}</div>
              <div className="text-[10px] text-indicator-cyan/80 uppercase tracking-wider reading-mono">
                {roleLabel(user.role)} · {user.employeeId}
              </div>
            </div>
          </div>

          <Form method="post" className="ml-1">
            <input type="hidden" name="intent" value="logout" />
            <button
              className="w-9 h-9 flex items-center justify-center rounded-sm border-2 border-nautical-600/70 text-slate-400 hover:text-indicator-red hover:border-indicator-red transition-all"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Form>
        </div>
      </div>
    </header>
  );
}
