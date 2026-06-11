import type { User, DivePlan, HistoricalProfile, DecompressionStep } from "./types";

const now = Date.now();

function buildStep(
  id: string,
  index: number,
  depth: number,
  durationSec: number,
  diverId: string,
): DecompressionStep {
  return {
    id,
    index,
    plannedDepth: depth,
    plannedDuration: durationSec,
    status: index === 0 ? "unlocked" : "locked",
    assignedDiverId: diverId,
  };
}

export const USERS: User[] = [
  { id: "u_dv1", employeeId: "DV001", name: "陈海峰", role: "diver",     password: "123456" },
  { id: "u_dv2", employeeId: "DV002", name: "李深蓝", role: "diver",     password: "123456" },
  { id: "u_ir1", employeeId: "IR001", name: "王教练", role: "instructor",password: "123456" },
  { id: "u_sp1", employeeId: "SP001", name: "赵支援", role: "support",   password: "123456" },
  { id: "u_ad1", employeeId: "AD001", name: "管理员", role: "admin",     password: "123456" },
];

export const DIVE_PLANS: DivePlan[] = [
  {
    id: "plan_001",
    siteName: "东海 W12 沉船点",
    siteGpsLat: 30.6321,
    siteGpsLng: 122.3844,
    maxDepth: 42,
    plannedStartTime: now,
    steps: [
      buildStep("s1", 0, 30, 180, "u_dv1"),
      buildStep("s2", 1, 21, 240, "u_dv1"),
      buildStep("s3", 2, 15, 300, "u_dv1"),
      buildStep("s4", 3, 9,  240, "u_dv1"),
      buildStep("s5", 4, 6,  180, "u_dv1"),
      buildStep("s6", 5, 3,  120, "u_dv1"),
      buildStep("s7", 6, 0,  60,  "u_dv1"),
    ],
  },
  {
    id: "plan_002",
    siteName: "南海珊瑚礁保护区",
    siteGpsLat: 18.2301,
    siteGpsLng: 109.5167,
    maxDepth: 28,
    plannedStartTime: now,
    steps: [
      buildStep("s1", 0, 18, 150, "u_dv2"),
      buildStep("s2", 1, 12, 210, "u_dv2"),
      buildStep("s3", 2, 6,  180, "u_dv2"),
      buildStep("s4", 3, 3,  90,  "u_dv2"),
      buildStep("s5", 4, 0,  60,  "u_dv2"),
    ],
  },
  {
    id: "plan_003",
    siteName: "青岛港 5 号锚地检修",
    siteGpsLat: 36.0671,
    siteGpsLng: 120.3826,
    maxDepth: 22,
    plannedStartTime: now,
    steps: [
      buildStep("s1", 0, 15, 120, "u_dv1"),
      buildStep("s2", 1, 9,  180, "u_dv1"),
      buildStep("s3", 2, 6,  150, "u_dv1"),
      buildStep("s4", 3, 3,  90,  "u_dv1"),
      buildStep("s5", 4, 0,  60,  "u_dv1"),
    ],
  },
];

export const HISTORICAL_PROFILES: HistoricalProfile[] = [
  {
    id: "hp_001",
    date: "2026-05-18",
    siteName: "东海 W12 沉船点",
    diverName: "陈海峰",
    points: [
      { time: 0,    depth: 0 },
      { time: 120,  depth: 30 },
      { time: 300,  depth: 30 },
      { time: 340,  depth: 21 },
      { time: 580,  depth: 21 },
      { time: 630,  depth: 15 },
      { time: 930,  depth: 15 },
      { time: 980,  depth: 9 },
      { time: 1220, depth: 9 },
      { time: 1260, depth: 6 },
      { time: 1440, depth: 6 },
      { time: 1470, depth: 3 },
      { time: 1590, depth: 3 },
      { time: 1610, depth: 0 },
    ],
  },
  {
    id: "hp_002",
    date: "2026-04-22",
    siteName: "东海 W12 沉船点",
    diverName: "李深蓝",
    points: [
      { time: 0,    depth: 0 },
      { time: 140,  depth: 30 },
      { time: 330,  depth: 30 },
      { time: 375,  depth: 21 },
      { time: 620,  depth: 21 },
      { time: 670,  depth: 15 },
      { time: 970,  depth: 15 },
      { time: 1020, depth: 9 },
      { time: 1260, depth: 9 },
      { time: 1310, depth: 6 },
      { time: 1490, depth: 6 },
      { time: 1525, depth: 3 },
      { time: 1650, depth: 3 },
      { time: 1670, depth: 0 },
    ],
  },
  {
    id: "hp_003",
    date: "2026-03-09",
    siteName: "东海 W12 沉船点",
    diverName: "陈海峰",
    points: [
      { time: 0,    depth: 0 },
      { time: 130,  depth: 30 },
      { time: 320,  depth: 30 },
      { time: 360,  depth: 21 },
      { time: 600,  depth: 21 },
      { time: 650,  depth: 15 },
      { time: 950,  depth: 15 },
      { time: 1000, depth: 9 },
      { time: 1240, depth: 9 },
      { time: 1285, depth: 6 },
      { time: 1465, depth: 6 },
      { time: 1500, depth: 3 },
      { time: 1620, depth: 3 },
      { time: 1640, depth: 0 },
    ],
  },
];
