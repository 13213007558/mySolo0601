import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Stone, StoneStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 合规只读状态判断 - 核心业务规则
 * 哪些状态下裸石进入只读锁定、禁止任何编辑：
 * - submitted: 已提交对标报告 → 必须锁定
 * - erratum_pending: 勘误申请已提交、等待主管审批 → 必须锁定（防止绕过审批直接修改）
 * 仅以下状态可编辑：
 * - pending：待开始
 * - in_progress：进行中
 * - erratum_approved：勘误已批准（Store会自动转成in_progress）
 */
export function isStoneReadonlyStatus(status: StoneStatus): boolean {
  return status === "submitted" || status === "erratum_pending";
}

export function isStoneReadOnly(stone: Stone | undefined | null): boolean {
  if (!stone) return true;
  return isStoneReadonlyStatus(stone.status);
}

/**
 * 是否可提交对标报告
 * 条件：未锁定 + 绘图完成 + 字段全确认
 */
export function canSubmitStone(stone: Stone | undefined | null): boolean {
  if (!stone) return false;
  if (isStoneReadOnly(stone)) return false;
  if (stone.progress < 100) return false;
  if (!stone.fieldMappings.every((f) => f.confirmed)) return false;
  return true;
}

/**
 * 是否可申请勘误（仅已提交状态可申请，勘误待审时不应重复申请）
 */
export function canRequestErratum(stone: Stone | undefined | null): boolean {
  return stone?.status === "submitted";
}

/**
 * 是否显示勘误审批按钮（主管视角）- 勘误待审状态
 */
export function canApproveErratum(stone: Stone | undefined | null): boolean {
  return stone?.status === "erratum_pending";
}

/**
 * 获取状态对应的只读提示文案
 */
export function getReadonlyHint(status: StoneStatus): string {
  switch (status) {
    case "submitted":
      return "已提交 · 只读锁定";
    case "erratum_pending":
      return "勘误待审 · 锁定中";
    default:
      return "";
  }
}

/**
 * 统一的不可编辑状态列表 - 用于各组件UI显示逻辑
 */
export const LOCKED_STATUSES: ReadonlyArray<StoneStatus> = [
  "submitted",
  "erratum_pending",
];
