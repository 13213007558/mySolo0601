import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Send, MessageSquarePlus } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  recordId: string;
}

export const RemarkInput = ({ value, onChange, recordId }: Props) => {
  const addRemark = useAppStore((s) => s.addRemark);
  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (!value.trim()) return;
    setSaving(true);
    addRemark(recordId, value.trim());
    setTimeout(() => {
      onChange("");
      setSaving(false);
    }, 300);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquarePlus className="w-4 h-4 text-stone-500" />
        <span className="text-sm font-medium text-stone-800">补充新备注</span>
        <span className="text-[11px] text-stone-500">
          （家长临时改口等情况，原备注不会被删除）
        </span>
      </div>
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="输入备注内容，例如：家长临时决定改为按次付费..."
          rows={2}
          className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent resize-none"
        />
        <button
          onClick={submit}
          disabled={!value.trim() || saving}
          className="self-end px-4 py-2.5 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white text-sm font-medium shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
