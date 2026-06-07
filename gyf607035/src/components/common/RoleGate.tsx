import type { ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { UserRole } from "@/types";

interface Props {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate = ({ allowedRoles, children, fallback = null }: Props) => {
  const role = useAppStore((s) => s.currentRole);
  if (allowedRoles.includes(role)) return <>{children}</>;
  return <>{fallback}</>;
};
