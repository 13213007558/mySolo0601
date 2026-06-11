export type UserRole = "operator" | "curator" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface SwabPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  componentId: string;
  description?: string;
}

export interface Component {
  id: string;
  name: string;
  rfidTag: string;
  type: string;
  position: string;
  isShipmentLocked: boolean;
  lockedAt?: string;
  unlockedAt?: string;
  unlockedBy?: string;
  swabPoints: SwabPoint[];
  batchId?: string;
}

export interface MoistureReading {
  id: string;
  pointId: string;
  componentId: string;
  value: number;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  microPhoto?: string;
  notes?: string;
  isRecheck: boolean;
  recheckTaskId?: string;
  synced: boolean;
}

export interface RecheckTask {
  id: string;
  componentId: string;
  pointId: string;
  createdAt: string;
  dueBy?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assignedTo?: string;
  reason: string;
  lastReadingId: string;
  readings: MoistureReading[];
}

export interface Batch {
  id: string;
  name: string;
  createdAt: string;
  componentIds: string[];
  status: "draft" | "ready" | "shipped" | "signed";
  signedBy?: string;
  signedAt?: string;
  signature?: string;
}

export interface OfflineQueueItem {
  id: string;
  type: "reading" | "recheck" | "component" | "batch";
  data: unknown;
  timestamp: string;
  retryCount: number;
}

export const MOISTURE_THRESHOLD = 18;
export const OFFLINE_QUEUE_LIMIT = 50;
export const RECHECK_INTERVAL_HOURS = 4;
