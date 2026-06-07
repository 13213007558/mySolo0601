import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABEL } from '@/utils/format';
import { applyPrivacyFilter } from '@/utils/privacyFilter';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function RoleSwitcher() {
  const currentUser = useAppStore((s) => s.getCurrentUser())!;
  const users = useAppStore((s) => s.users);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const role = currentUser?.role ?? 'nurse';

  const Icon =
    role === 'admin' ? ShieldAlert : role === 'supervisor' ? ShieldCheck : Shield;

  const visibleUsers = applyPrivacyFilter(users, role) as typeof users;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
        <Icon className="w-4 h-4 text-teal-600" />
        <span className="text-xs text-slate-600">
          当前身份：
          <span className="font-medium text-slate-800">
            {visibleUsers.find((u) => u.id === currentUser?.id)?.name}
          </span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-teal-700">{ROLE_LABEL[role]}</span>
        </span>
      </div>
      <select
        value={currentUser?.id}
        onChange={(e) => setCurrentUser(e.target.value)}
        className="input !w-auto !py-1.5 !text-xs cursor-pointer"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {ROLE_LABEL[u.role]}
          </option>
        ))}
      </select>
    </div>
  );
}
