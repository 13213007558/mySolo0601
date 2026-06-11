export type Role = "diver" | "instructor" | "support" | "admin";

export interface User {
  id: string;
  employeeId: string;
  name: string;
  role: Role;
  password: string;
}

export type StepStatus =
  | "locked"
  | "unlocked"
  | "arrived"
  | "counting"
  | "diverSigned"
  | "completed"
  | "skipped";

export interface DecompressionStep {
  id: string;
  index: number;
  plannedDepth: number;
  plannedDuration: number;
  status: StepStatus;
  assignedDiverId: string;

  actualArrivalTime?: number;
  gpsLat?: number;
  gpsLng?: number;
  diverSignature?: string;
  diverSignTime?: number;
  instructorSignature?: string;
  instructorSignTime?: number;
  deviationSeconds?: number;
  hasAlert?: boolean;
  startedAt?: number;
}

export interface DivePlan {
  id: string;
  siteName: string;
  siteGpsLat: number;
  siteGpsLng: number;
  maxDepth: number;
  plannedStartTime: number;
  steps: DecompressionStep[];
}

export interface HistoricalProfile {
  id: string;
  date: string;
  siteName: string;
  diverName: string;
  points: { depth: number; time: number }[];
}

export type DiveMode = "login" | "selectPlan" | "underway" | "emergency" | "completed";

export interface DiveAlert {
  id: string;
  type: "deviation" | "countdown_end" | "emergency";
  stepId: string;
  message: string;
  createdAt: number;
  acknowledged: boolean;
}

export interface DiveState {
  mode: DiveMode;
  currentStepId: string | null;
  plan: DivePlan | null;
  alerts: DiveAlert[];
  emergencyReason?: string;
  surfacedAt?: number;
  tokenId?: string;
}

export type DiveAction =
  | { type: "START_DIVE"; plan: DivePlan }
  | { type: "CHECKIN"; stepId: string; time: number; lat: number; lng: number }
  | { type: "START_COUNTING"; stepId: string }
  | { type: "DIVER_SIGN"; stepId: string; signature: string; time: number; diverId: string }
  | { type: "INSTRUCTOR_SIGN"; stepId: string; signature: string; time: number }
  | { type: "UPDATE_DEVIATION"; stepId: string; seconds: number }
  | { type: "TRIGGER_ALERT"; stepId: string; message: string }
  | { type: "ACK_ALERT"; alertId: string }
  | { type: "EMERGENCY_ASCENT"; reason: string }
  | { type: "CONFIRM_SURFACE"; time: number; tokenId: string }
  | { type: "RESET" };
