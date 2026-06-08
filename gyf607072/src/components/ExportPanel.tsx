import { useState } from "react";
import { Download, Copy, Check, Users, ChefHat, UserCheck } from "lucide-react";
import { useStore } from "@/store/useStore";
import { generateElderSummary, generateParentSummary, generateColleagueSummary } from "@/utils/exportSummary";
import type { FoodRecord, UserRole } from "@/types";
import { cn } from "@/utils/uiHelpers";

interface Props {
  singleRecord?: FoodRecord;
}

interface ExportVariant {
  key: string;
  roleLabel: string;
  icon: typeof Users;
  description: string;
  accentClass: string;
  getText: (records: FoodRecord[], rec?: FoodRecord) => string;
}

export default function ExportPanel({ singleRecord }: Props) {
  const records = useStore((s) => s.records);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const variants: ExportVariant[] = [
    {
      key: "elder",
      roleLabel: "老人版 · 极简摘要",
      icon: UserCheck,
      description: "大字、简短，只说结论，适合爷爷奶奶看",
      accentClass: "from-sage-100 to-sage-50 border-sage-200",
      getText: (_, rec) => (rec ? generateElderSummary(rec) : "请选择单条记录生成老人版摘要"),
    },
    {
      key: "parent",
      roleLabel: "父母版 · 完整详情",
      icon: Users,
      description: "三日食材完整明细，含禁忌、改判、补录等全部信息",
      accentClass: "from-cream-100 to-cream-50 border-cream-200",
      getText: (recs) => generateParentSummary(recs),
    },
    {
      key: "colleague",
      roleLabel: "同事版 · 专业摘要",
      icon: ChefHat,
      description: "脱敏统计数据，可直接转发给育儿嫂同事或家政顾问",
      accentClass: "from-baby-100 to-baby-50 border-baby-200",
      getText: (recs) => generateColleagueSummary(recs),
    },
  ];

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (e) {
      console.warn("复制失败", e);
    }
  };

  const handleDownload = (key: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `沐沐辅食对账_${key}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-bold text-ink-800">按角色导出摘要</h3>
      </div>

      <p className="text-sm text-ink-700/60">
        不同角色看到的信息边界不同。点击卡片可直接复制对应文本到剪贴板，也可下载为 .txt 文件转发。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {variants.map((v) => {
          const text = v.getText(records, singleRecord);
          const isCopied = copiedKey === v.key;
          const Icon = v.icon;
          return (
            <div
              key={v.key}
              className={cn(
                "card-base bg-gradient-to-br p-5 border transition-all cursor-pointer hover:scale-[1.02]",
                v.accentClass
              )}
              onClick={() => handleCopy(v.key, text)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <Icon size={18} className="text-ink-700" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(v.key, text);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center hover:bg-white transition"
                  >
                    {isCopied ? <Check size={14} className="text-sage-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(v.key, text);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center hover:bg-white transition"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>

              <h4 className="font-display font-semibold text-ink-800 mb-1">{v.roleLabel}</h4>
              <p className="text-xs text-ink-700/60 mb-3">{v.description}</p>

              <div className="bg-white/70 rounded-xl p-3 text-xs text-ink-700 font-mono whitespace-pre-wrap max-h-44 overflow-auto leading-relaxed">
                {text}
              </div>

              {isCopied && (
                <div className="mt-2 text-xs text-sage-500 flex items-center gap-1 animate-fade-in">
                  <Check size={12} /> 已复制到剪贴板，可直接粘贴发送
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
