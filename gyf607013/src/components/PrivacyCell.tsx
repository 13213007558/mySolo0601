import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { maskByRole, canViewField, getFieldPermissionHint } from '@/utils/privacy';
import { getRoleLabel } from '@/utils/format';

interface PrivacyCellProps {
  value: string;
  field: string;
  role: UserRole;
  className?: string;
}

export default function PrivacyCell({ value, field, role, className }: PrivacyCellProps) {
  const [revealed, setRevealed] = useState(false);
  const hasPermission = canViewField(role, field);
  const displayValue = revealed || hasPermission ? value : maskByRole({ role, field, value });
  const hint = getFieldPermissionHint(field);

  return (
    <div className={cn('group relative inline-flex items-center gap-1', className)}>
      <span className="text-sm text-ink-800">{displayValue || '-'}</span>
      {!hasPermission && value && (
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="text-ink-400 transition hover:text-ink-600"
          title={revealed ? '隐藏' : `无权限查看完整信息，${hint}`}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink-800 px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100">
        当前角色：{getRoleLabel(role)}。{hint}
      </div>
    </div>
  );
}
