import type { JadeSlice, StandardSample } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `ann_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getCurrentTimestamp(): number {
  return Date.now();
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function getAnnotationTypeName(type: string): string {
  const map: Record<string, string> = {
    crack: "裂隙",
    impurity: "杂质",
    inclusion: "包裹体",
  };
  return map[type] || type;
}

export function getSeverityName(severity: string): string {
  const map: Record<string, string> = {
    minor: "轻微",
    moderate: "中等",
    severe: "严重",
  };
  return map[severity] || severity;
}

export function getAnnotationColor(type: string): string {
  const map: Record<string, string> = {
    crack: "#dc2626",
    impurity: "#d97706",
    inclusion: "#2563eb",
  };
  return map[type] || "#6b7280";
}

export function getAnnotationFillColor(type: string): string {
  const map: Record<string, string> = {
    crack: "rgba(220, 38, 38, 0.15)",
    impurity: "rgba(217, 119, 6, 0.15)",
    inclusion: "rgba(37, 99, 235, 0.15)",
  };
  return map[type] || "rgba(107, 114, 128, 0.15)";
}

export function getMockSlices(): JadeSlice[] {
  return [
    {
      id: "slice_001",
      name: "和田玉籽料切片",
      code: "HT-2025-0611-001",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jade%20slice%20cross%20section%20under%20transmitted%20light%20close%20up%20macro%20photography%20showing%20internal%20cracks%20inclusions%20and%20texture%20on%20bright%20white%20backlight%20professional%20gemology%20photography&image_size=square_hd",
      width: 52,
      height: 38,
      thickness: 4.2,
      origin: "新疆和田地区",
      category: "软玉（和田玉）",
      weight: 28.6,
      requiredAnnotations: ["crack", "impurity", "inclusion"],
    },
    {
      id: "slice_002",
      name: "翡翠冰种切片",
      code: "FC-2025-0611-002",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=high%20quality%20jadeite%20jade%20translucent%20icy%20variety%20slice%20under%20transmitted%20light%20with%20visible%20internal%20fibrous%20structure%20bright%20cool%20white%20backlight%20macro%20gemological%20photography&image_size=square_hd",
      width: 45,
      height: 30,
      thickness: 3.5,
      origin: "缅甸帕敢",
      category: "硬玉（翡翠）",
      weight: 18.3,
      requiredAnnotations: ["crack", "impurity", "inclusion"],
    },
    {
      id: "slice_003",
      name: "独山玉切片",
      code: "DS-2025-0611-003",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dushan%20jade%20multicolor%20green%20white%20lavender%20slice%20under%20transmitted%20light%20showing%20mineral%20grains%20and%20internal%20structure%20gemstone%20photography%20professional%20backlit&image_size=square_hd",
      width: 60,
      height: 42,
      thickness: 5.0,
      origin: "河南南阳",
      category: "独山玉",
      weight: 45.2,
      requiredAnnotations: ["crack", "impurity", "inclusion"],
    },
  ];
}

export function getMockStandardSamples(): StandardSample[] {
  return [
    {
      id: "std_a_plus",
      name: "A+ 收藏级标准样",
      grade: "A+",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=perfect%20flawless%20top%20grade%20A%2B%20jade%20translucent%20uniform%20texture%20under%20bright%20transmitted%20light%20no%20cracks%20no%20inclusions%20reference%20standard%20sample&image_size=square_hd",
      opacity: 0.4,
      visible: false,
    },
    {
      id: "std_a",
      name: "A 优质级标准样",
      grade: "A",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=high%20quality%20grade%20A%20jade%20translucent%20with%20very%20minor%20natural%20inclusions%20under%20transmitted%20light%20good%20uniformity%20reference%20standard%20sample&image_size=square_hd",
      opacity: 0.4,
      visible: false,
    },
    {
      id: "std_b",
      name: "B 标准级标准样",
      grade: "B",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grade%20B%20standard%20jade%20with%20visible%20natural%20cracks%20and%20impurities%20under%20transmitted%20light%20moderate%20translucency%20reference%20standard%20sample&image_size=square_hd",
      opacity: 0.4,
      visible: false,
    },
  ];
}
