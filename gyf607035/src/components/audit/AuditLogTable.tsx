import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { AuditLogEntry } from "@/types";
import { formatDateTime } from "@/data/mockData";
import {
  Search,
  ShieldCheck,
  UserRound,
  FileWarning,
  PlusCircle,
  MessageSquare,
  AlertTriangle,
  Ban,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ACTION_META: Record<
  AuditLogEntry["action"],
  { label: string; icon: any; color: string }
> = {
  create: { label: "创建记录", icon: PlusCircle, color: "bg-blue-50 text-blue-700 border-blue-100" },
  verify: { label: "核销", icon: ShieldCheck, color: "bg-brand-50 text-brand-700 border-brand-100" },
  update_remark: { label: "备注变更", icon: MessageSquare, color: "bg-accent-50 text-accent-700 border-accent-100" },
  mark_boundary: { label: "边界值标记", icon: AlertTriangle, color: "bg-amber-50 text-amber-700 border-amber-100" },
  audit_boundary: { label: "边界值审计", icon: ShieldCheck, color: "bg-brand-100 text-brand-700 border-brand-200" },
  invalidate: { label: "记录失效", icon: Ban, color: "bg-stone-100 text-stone-700 border-stone-200" },
  import: { label: "数据导入", icon: Download, color: "bg-violet-50 text-violet-700 border-violet-100" },
  supplement: { label: "手工补录", icon: FileWarning, color: "bg-orange-50 text-orange-700 border-orange-100" },
};

export const AuditLogTable = () => {
  const allRecords = useAppStore((s) => s.records);
  const logs = useMemo(() => {
    return allRecords
      .flatMap((r) =>
        r.auditLogs.map((log) => ({
          ...log,
          recordId: r.id,
          recordTitle: `${r.parentName}-${r.courseName}`,
        }))
      )
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  }, [allRecords]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    let arr = logs;
    if (filter !== "all") arr = arr.filter((l) => l.action === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(
        (l) =>
          l.operator.toLowerCase().includes(q) ||
          (l as any).recordTitle?.toLowerCase().includes(q) ||
          l.note?.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [logs, filter, search]);

  const actions = [
    { key: "all", label: "全部" },
    { key: "verify", label: "核销" },
    { key: "mark_boundary", label: "边界值" },
    { key: "update_remark", label: "备注变更" },
    { key: "supplement", label: "补录" },
    { key: "invalidate", label: "失效" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex flex-wrap items-center gap-3">
        <div>
          <h3 className="font-display text-lg text-stone-900">操作审计日志</h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            所有操作完整留痕，共 {logs.length} 条
          </p>
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索操作人/内容..."
            className="pl-9 pr-3 py-2 w-56 rounded-xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="px-5 py-2.5 border-b border-stone-100 flex gap-1.5 overflow-x-auto">
        {actions.map((a) => (
          <button
            key={a.key}
            onClick={() => setFilter(a.key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filter === a.key
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="divide-y divide-stone-100 max-h-[520px] overflow-y-auto">
        {filtered.map((log) => {
          const meta = ACTION_META[log.action];
          const Icon = meta.icon;
          const key = log.id;
          const isOpen = expanded[key];
          return (
            <div key={key}>
              <button
                onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))}
                className="w-full px-5 py-3.5 flex items-center gap-3 text-left hover:bg-stone-50/80 transition"
              >
                <div
                  className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center ${meta.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {meta.label}
                    </span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                      {(log as any).recordTitle ?? "系统操作"}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5 truncate">
                    {log.note || (log.field ? `${log.field}: ${log.oldValue} → ${log.newValue}` : "")}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-stone-600">
                    {log.operatorRole === "supervisor" ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-600" />
                    ) : (
                      <UserRound className="w-3.5 h-3.5 text-brand-600" />
                    )}
                    <span>{log.operator}</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    {formatDateTime(log.timestamp)}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-4 pl-17">
                  <div className="ml-12 bg-stone-50 rounded-xl p-4 text-xs space-y-1.5">
                    {log.field && (
                      <div className="flex gap-3">
                        <span className="text-stone-500 shrink-0 w-20">变更字段：</span>
                        <span className="text-stone-800 font-medium">{log.field}</span>
                      </div>
                    )}
                    {log.oldValue !== undefined && (
                      <div className="flex gap-3">
                        <span className="text-stone-500 shrink-0 w-20">变更前：</span>
                        <span className="text-stone-600 line-through">{log.oldValue}</span>
                      </div>
                    )}
                    {log.newValue !== undefined && (
                      <div className="flex gap-3">
                        <span className="text-stone-500 shrink-0 w-20">变更后：</span>
                        <span className="text-brand-700 font-medium">{log.newValue}</span>
                      </div>
                    )}
                    {log.note && (
                      <div className="flex gap-3">
                        <span className="text-stone-500 shrink-0 w-20">操作说明：</span>
                        <span className="text-stone-800">{log.note}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-stone-500">
            未找到匹配记录
          </div>
        )}
      </div>
    </div>
  );
};
