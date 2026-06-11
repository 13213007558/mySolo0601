import { useState } from "react";
import { Form } from "@remix-run/react";
import { Anchor, ShieldAlert, Users, Waves } from "lucide-react";
import type { Role } from "~/data/types";
import { roleLabel } from "~/utils/format";

interface Props {
  defaultRole?: Role;
  error?: string | null;
}

const ROLE_ICONS: Record<Role, React.ReactNode> = {
  diver: <Waves className="w-5 h-5" />,
  instructor: <Anchor className="w-5 h-5" />,
  support: <Users className="w-5 h-5" />,
  admin: <ShieldAlert className="w-5 h-5" />,
};

export default function LoginPanel({ defaultRole = "diver", error }: Props) {
  const [role, setRole] = useState<Role>(defaultRole);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden sonar-bg p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-nautical-900 via-nautical-900 to-[#05121F]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-indicator-cyan/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indicator-amber/10 blur-3xl animate-pulse" />

      <div className="relative z-10 w-full max-w-md console-card p-7 border-2 border-nautical-600/70">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-md bg-indicator-cyan/10 border-2 border-indicator-cyan flex items-center justify-center shadow-led-cyan">
            <Anchor className="w-7 h-7 text-indicator-cyan" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">深潜减压核对台</h1>
            <p className="text-xs text-indicator-cyan reading-mono">DECOMPRESSION CHECKSTATION v1.0</p>
          </div>
        </div>

        <div className="console-divider mb-5" />

        <Form method="post" className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              选择角色 / Role
            </label>
            <div className="grid grid-cols-2 gap-2" role="tablist">
              {(["diver", "instructor", "support", "admin"] as Role[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  name="role-choose"
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border-2 transition-all text-sm font-medium
                    ${role === r
                      ? "border-indicator-cyan bg-indicator-cyan/10 text-indicator-cyan shadow-led-cyan"
                      : "border-nautical-600/60 bg-nautical-800/50 text-slate-300 hover:border-nautical-500"
                    }`}
                >
                  <span className={role === r ? "text-indicator-cyan" : "text-slate-500"}>
                    {ROLE_ICONS[r]}
                  </span>
                  {roleLabel(r)}
                  <span
                    className={`ml-auto w-2 h-2 rounded-full ${
                      role === r ? "led-cyan" : "bg-slate-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              工号 / Employee ID
            </label>
            <input
              name="employeeId"
              required
              autoComplete="username"
              placeholder="例：DV001 / IR001"
              className="console-input"
              defaultValue={role === "diver" ? "DV001" : role === "instructor" ? "IR001" : role === "support" ? "SP001" : "AD001"}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2 font-semibold">
              密码 / Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••"
              className="console-input"
              defaultValue="123456"
            />
          </div>

          <input type="hidden" name="intent" value="login" />
          <input type="hidden" name="role" value={role} />

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-sm bg-indicator-red/10 border-2 border-indicator-red/50 text-indicator-red text-sm">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-industrial-primary w-full h-14 !text-base !tracking-[0.25em] mt-2"
          >
            ⚓ 登 录 系 统
          </button>
        </Form>

        <div className="mt-6 text-[11px] text-slate-500 leading-relaxed border-t border-nautical-700/60 pt-4">
          <p className="mb-1 text-indicator-amber">⚠ 海事局抽查合规系统 · 所有操作均加密留痕</p>
          <p>测试账号：DV001 / IR001 / SP001 / AD001，密码统一 123456</p>
        </div>
      </div>
    </div>
  );
}
