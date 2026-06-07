import { create } from "zustand";
import type { CheckRecord, RecordStatus, StatusLog, TabooMatch, Ingredient } from "@/types";
import { mockRecords } from "@/data/mockData";
import { genId, ingredientsHash } from "@/utils/id";

const STORAGE_KEY = "baby_food_check_records_v1";
const LAST_SESSION_KEY = "baby_food_last_session_v1";

function loadFromStorage(): CheckRecord[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckRecord[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(records: CheckRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    sessionStorage.setItem(LAST_SESSION_KEY, Date.now().toString());
  } catch {
    /* noop */
  }
}

function validateRecord(r: CheckRecord): string | null {
  if (!r.id) return "缺少记录 ID";
  if (!r.babyName || !r.parentName) return "宝宝或家长姓名缺失";
  if (!/^1\d{10}$/.test(r.parentPhone)) return "家长手机号格式不正确";
  if (r.babyMonthAge < 0 || r.babyMonthAge > 72) return "宝宝月龄超出合理范围";
  if (!Array.isArray(r.ingredients)) return "食材清单缺失";
  return null;
}

function isDuplicate(records: CheckRecord[], phone: string, date: string, ingredients: Ingredient[]): { isDup: boolean; existingAt?: string } {
  const hash = ingredientsHash(ingredients);
  const found = records.find((r) => r.parentPhone === phone && r.checkDate === date && ingredientsHash(r.ingredients) === hash);
  return found ? { isDup: true, existingAt: found.createdAt } : { isDup: false };
}

function buildTaboos(ingredients: Ingredient[], monthAge: number): TabooMatch[] {
  const result: TabooMatch[] = [];
  const tabooRules: Array<{ keyword: string; reason: string; severity: "warning" | "danger"; maxMonth?: number }> = [
    { keyword: "蜂蜜", reason: "1 岁以下婴儿禁止食用蜂蜜，存在肉毒杆菌中毒风险", severity: "danger", maxMonth: 12 },
    { keyword: "鸡蛋白", reason: "1 岁以内建议只食用蛋黄，蛋清易引发过敏反应", severity: "danger", maxMonth: 12 },
    { keyword: "鲜牛奶", reason: "1 岁以内不建议直接饮用鲜牛奶，建议母乳或配方奶", severity: "warning", maxMonth: 12 },
    { keyword: "芒果", reason: "芒果为高致敏水果，首次添加建议少量试吃并观察 24 小时", severity: "warning" },
    { keyword: "菠萝", reason: "菠萝含蛋白酶易刺激口腔黏膜，初次添加需少量观察", severity: "warning" },
    { keyword: "螃蟹", reason: "蟹类性寒且易致敏，婴幼儿应谨慎食用", severity: "warning" },
  ];
  ingredients.forEach((ing) => {
    tabooRules.forEach((rule) => {
      if (ing.name.includes(rule.keyword) && (!rule.maxMonth || monthAge <= rule.maxMonth)) {
        result.push({
          id: genId("tab"),
          ingredientName: ing.name,
          tabooReason: rule.reason,
          severity: rule.severity,
        });
      }
    });
  });
  return result;
}

export interface NewManualEntry {
  babyName: string;
  babyMonthAge: number;
  parentName: string;
  parentPhone: string;
  checkDate: string;
  ingredients: { name: string; day: "Day1" | "Day2" | "Day3"; meal: "早餐" | "午餐" | "晚餐" | "加餐" }[];
  note: string;
}

interface RecordState {
  records: CheckRecord[];
  filterPhone: string;
  lastError: string | null;
  corruptedIds: string[];
  init: () => void;
  setFilterPhone: (p: string) => void;
  addManualRecord: (data: NewManualEntry) => { ok: boolean; error?: string; recordId?: string };
  reviewRecord: (id: string, target: RecordStatus, reason: string) => boolean;
  getRecordById: (id: string) => CheckRecord | undefined;
  getFilteredRecords: () => CheckRecord[];
  clearAll: () => void;
  resetToMock: () => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  filterPhone: "",
  lastError: null,
  corruptedIds: [],

  init() {
    const persisted = loadFromStorage();
    if (persisted && persisted.length > 0) {
      const valid: CheckRecord[] = [];
      const corrupted: string[] = [];
      const recoveredLogs: StatusLog[] = [];
      persisted.forEach((r) => {
        const err = validateRecord(r);
        if (err) {
          corrupted.push(r.id);
        } else {
          if (sessionStorage.getItem(LAST_SESSION_KEY) && !r.statusLogs.some((l) => l.type === "refresh_recover")) {
            recoveredLogs.push({
              id: genId("log"),
              fromStatus: r.status,
              toStatus: r.status,
              reason: "检测到页面刷新，状态已从本地存储恢复；若与预期不符请核对原始操作记录",
              operator: "系统",
              timestamp: new Date().toISOString(),
              type: "refresh_recover",
            });
            valid.push({ ...r, statusLogs: [...r.statusLogs, recoveredLogs[recoveredLogs.length - 1]] });
          } else {
            valid.push(r);
          }
        }
      });
      set({ records: valid, corruptedIds: corrupted });
      if (recoveredLogs.length > 0) saveToStorage(valid);
    } else {
      set({ records: [...mockRecords], corruptedIds: [] });
      saveToStorage(mockRecords);
    }
  },

  setFilterPhone(p) {
    set({ filterPhone: p.trim() });
  },

  addManualRecord(data) {
    const err =
      !data.babyName || !data.parentName || !data.parentPhone || !data.checkDate || data.ingredients.length === 0
        ? "请完整填写所有必填项（宝宝/家长信息、至少一条食材）"
        : !/^1\d{10}$/.test(data.parentPhone)
          ? "手机号格式不正确"
          : null;
    if (err) {
      set({ lastError: err });
      return { ok: false, error: err };
    }
    const ingredients: Ingredient[] = data.ingredients.map((i) => ({ ...i, id: genId("ing") }));
    const taboos = buildTaboos(ingredients, data.babyMonthAge);

    const { isDup, existingAt } = isDuplicate(get().records, data.parentPhone, data.checkDate, ingredients);
    const initialStatus: RecordStatus = taboos.length > 0 ? "pending_review" : "normal";

    if (isDup && existingAt) {
      set({ lastError: "检测到重复提交，已拦截本次提交，未写入正常记录列表" });
      return { ok: false, error: "该家长当日食材清单与已有记录完全一致，请勿重复提交" };
    }

    const now = new Date().toISOString();
    const log: StatusLog = {
      id: genId("log"),
      fromStatus: null,
      toStatus: initialStatus,
      reason: data.note ? `手工补录：${data.note}` : "手工补录：门店店长录入",
      operator: "店长",
      timestamp: now,
      type: "manual_create",
    };

    const newRecord: CheckRecord = {
      id: genId("rec"),
      babyName: data.babyName,
      babyMonthAge: data.babyMonthAge,
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      checkDate: data.checkDate,
      source: "manual",
      status: initialStatus,
      submitMethod: "手工补录",
      ingredients,
      taboos,
      statusLogs: [log],
      createdAt: now,
      updatedAt: now,
    };

    const validationError = validateRecord(newRecord);
    if (validationError) {
      set({ lastError: `数据校验失败：${validationError}，未写入记录列表` });
      return { ok: false, error: validationError };
    }

    const next = [...get().records, newRecord];
    set({ records: next, lastError: null });
    saveToStorage(next);
    return { ok: true, recordId: newRecord.id };
  },

  reviewRecord(id, target, reason) {
    if (!reason.trim()) return false;
    const list = get().records;
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    const original = list[idx];
    const log: StatusLog = {
      id: genId("log"),
      fromStatus: original.status,
      toStatus: "reviewed",
      reason: `人工改判（${STATUS_TEXT[original.status]} → ${target === "normal" ? "正常" : "异常"}）：${reason.trim()}`,
      operator: "店长",
      timestamp: new Date().toISOString(),
      type: "status_change",
    };
    const updated: CheckRecord = {
      ...original,
      status: "reviewed",
      statusLogs: [...original.statusLogs, log],
      updatedAt: new Date().toISOString(),
    };
    if (target === "abnormal" && original.taboos.length === 0) {
      updated.taboos = [
        {
          id: genId("tab"),
          ingredientName: "人工标记",
          tabooReason: reason.trim(),
          severity: "warning",
        },
      ];
    }
    const next = [...list];
    next[idx] = updated;
    set({ records: next });
    saveToStorage(next);
    return true;
  },

  getRecordById(id) {
    return get().records.find((r) => r.id === id);
  },

  getFilteredRecords() {
    const { records, filterPhone } = get();
    if (!filterPhone) return records;
    return records.filter((r) => r.parentPhone.includes(filterPhone));
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    set({ records: [], corruptedIds: [] });
  },

  resetToMock() {
    set({ records: [...mockRecords], corruptedIds: [], filterPhone: "" });
    saveToStorage(mockRecords);
  },
}));

const STATUS_TEXT: Record<RecordStatus, string> = {
  normal: "正常",
  abnormal: "异常",
  pending_review: "待复核",
  reviewed: "已复核",
};
