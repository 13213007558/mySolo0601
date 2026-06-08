import { Users, UserCheck, ChefHat } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn, roleText, roleDescription } from "@/utils/uiHelpers";
import type { UserRole } from "@/types";

const roles: { key: UserRole; icon: typeof Users }[] = [
  { key: "elder", icon: UserCheck },
  { key: "parent", icon: Users },
  { key: "nanny", icon: ChefHat },
];

export default function RoleSwitcher() {
  const currentRole = useStore((s) => s.currentRole);
  const setRole = useStore((s) => s.setRole);

  return (
    <div className="card-base p-2">
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          {roles.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200",
                currentRole === key
                  ? "bg-sage-500 text-white shadow-md"
                  : "text-ink-700 hover:bg-cream-100"
              )}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{roleText(key).split(" ")[1]}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-700/60 text-center pt-1 px-2">
          {roleDescription(currentRole)}
        </p>
      </div>
    </div>
  );
}
