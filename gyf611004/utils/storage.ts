import {
  Component,
  MoistureReading,
  RecheckTask,
  Batch,
  OfflineQueueItem,
  User,
  MOISTURE_THRESHOLD,
  RECHECK_INTERVAL_HOURS,
} from "../types/index.ts";

const STORAGE_KEYS = {
  components: "arch_components",
  readings: "arch_readings",
  recheckTasks: "arch_recheck_tasks",
  batches: "arch_batches",
  offlineQueue: "arch_offline_queue",
  users: "arch_users",
  currentUser: "arch_current_user",
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getComponents(): Component[] {
  return getFromStorage<Component[]>(STORAGE_KEYS.components, []);
}

export function saveComponents(components: Component[]): void {
  setToStorage(STORAGE_KEYS.components, components);
}

export function getComponentById(id: string): Component | undefined {
  return getComponents().find((c) => c.id === id);
}

export function getComponentByRfid(rfid: string): Component | undefined {
  return getComponents().find((c) => c.rfidTag === rfid);
}

export function getReadings(): MoistureReading[] {
  return getFromStorage<MoistureReading[]>(STORAGE_KEYS.readings, []);
}

export function saveReadings(readings: MoistureReading[]): void {
  setToStorage(STORAGE_KEYS.readings, readings);
}

export function getReadingsByPoint(pointId: string): MoistureReading[] {
  return getReadings()
    .filter((r) => r.pointId === pointId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getReadingsByComponent(componentId: string): MoistureReading[] {
  return getReadings()
    .filter((r) => r.componentId === componentId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getLatestReading(pointId: string): MoistureReading | undefined {
  const readings = getReadingsByPoint(pointId);
  return readings[0];
}

export function getRecheckTasks(): RecheckTask[] {
  return getFromStorage<RecheckTask[]>(STORAGE_KEYS.recheckTasks, []);
}

export function saveRecheckTasks(tasks: RecheckTask[]): void {
  setToStorage(STORAGE_KEYS.recheckTasks, tasks);
}

export function getPendingRecheckTasks(): RecheckTask[] {
  return getRecheckTasks().filter((t) => t.status === "pending");
}

export function getRecheckTasksByComponent(componentId: string): RecheckTask[] {
  return getRecheckTasks().filter((t) => t.componentId === componentId);
}

export function canPerformRecheck(componentId: string, pointId: string): { allowed: boolean; reason?: string } {
  const pointReadings = getReadingsByPoint(pointId)
    .filter((r) => r.isRecheck)
    .slice(0, 1);

  if (pointReadings.length === 0) {
    return { allowed: true };
  }

  const lastRecheck = pointReadings[0];
  const hoursSince = (Date.now() - new Date(lastRecheck.timestamp).getTime()) / (1000 * 60 * 60);

  if (hoursSince < RECHECK_INTERVAL_HOURS) {
    const remaining = RECHECK_INTERVAL_HOURS - hoursSince;
    return {
      allowed: false,
      reason: `距上次复检不足${RECHECK_INTERVAL_HOURS}小时，还需等待${remaining.toFixed(1)}小时`,
    };
  }

  return { allowed: true };
}

export function addMoistureReading(
  reading: Omit<MoistureReading, "id" | "synced">,
): MoistureReading {
  const readings = getReadings();
  const newReading: MoistureReading = {
    ...reading,
    id: generateId("r"),
    synced: false,
  };
  readings.unshift(newReading);
  saveReadings(readings);

  if (reading.value > MOISTURE_THRESHOLD) {
    const components = getComponents();
    const idx = components.findIndex((c) => c.id === reading.componentId);
    if (idx !== -1 && !components[idx].isShipmentLocked) {
      components[idx].isShipmentLocked = true;
      components[idx].lockedAt = new Date().toISOString();
      saveComponents(components);
    }

    const existingTask = getRecheckTasks().find(
      (t) => t.pointId === reading.pointId && t.status === "pending",
    );
    if (!existingTask) {
      createRecheckTask({
        componentId: reading.componentId,
        pointId: reading.pointId,
        reason: `含水率${reading.value.toFixed(1)}%超过阈值${MOISTURE_THRESHOLD}%`,
        lastReadingId: newReading.id,
      });
    }
  }

  addToOfflineQueue("reading", newReading);

  return newReading;
}

export function createRecheckTask(
  task: Omit<RecheckTask, "id" | "createdAt" | "status" | "readings">,
): RecheckTask {
  const tasks = getRecheckTasks();
  const newTask: RecheckTask = {
    ...task,
    id: generateId("rt"),
    createdAt: new Date().toISOString(),
    status: "pending",
    readings: [],
  };
  tasks.unshift(newTask);
  saveRecheckTasks(tasks);
  addToOfflineQueue("recheck", newTask);
  return newTask;
}

export function completeRecheckTask(
  taskId: string,
  readingId: string,
): RecheckTask | undefined {
  const tasks = getRecheckTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return undefined;

  tasks[idx].status = "completed";
  tasks[idx].readings.push(
    ...getReadings().filter((r) => r.id === readingId),
  );
  saveRecheckTasks(tasks);
  return tasks[idx];
}

export function unlockShipment(componentId: string, userId: string): boolean {
  const components = getComponents();
  const idx = components.findIndex((c) => c.id === componentId);
  if (idx === -1) return false;

  components[idx].isShipmentLocked = false;
  components[idx].unlockedAt = new Date().toISOString();
  components[idx].unlockedBy = userId;
  saveComponents(components);
  return true;
}

export function getBatches(): Batch[] {
  return getFromStorage<Batch[]>(STORAGE_KEYS.batches, []);
}

export function saveBatches(batches: Batch[]): void {
  setToStorage(STORAGE_KEYS.batches, batches);
}

export function getBatchById(id: string): Batch | undefined {
  return getBatches().find((b) => b.id === id);
}

export function createBatch(
  batch: Omit<Batch, "id" | "createdAt" | "status">,
): Batch {
  const batches = getBatches();
  const newBatch: Batch = {
    ...batch,
    id: generateId("b"),
    createdAt: new Date().toISOString(),
    status: "draft",
  };
  batches.unshift(newBatch);
  saveBatches(batches);
  return newBatch;
}

export function signBatch(batchId: string, userId: string, signature: string): Batch | undefined {
  const batches = getBatches();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1) return undefined;

  batches[idx].status = "signed";
  batches[idx].signedBy = userId;
  batches[idx].signedAt = new Date().toISOString();
  batches[idx].signature = signature;
  saveBatches(batches);
  return batches[idx];
}

export function getOfflineQueue(): OfflineQueueItem[] {
  return getFromStorage<OfflineQueueItem[]>(STORAGE_KEYS.offlineQueue, []);
}

export function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  setToStorage(STORAGE_KEYS.offlineQueue, queue);
}

export function addToOfflineQueue(type: OfflineQueueItem["type"], data: unknown): void {
  const queue = getOfflineQueue();
  queue.push({
    id: generateId("q"),
    type,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  });
  saveOfflineQueue(queue);
}

export function isOfflineQueueFull(): boolean {
  return getOfflineQueue().length >= 50;
}

export function syncOfflineQueue(): { success: number; failed: number } {
  const queue = getOfflineQueue();
  const readings = getReadings();
  const readingIds = new Set(readings.map((r) => r.id));

  let success = 0;
  let failed = 0;

  const newQueue = queue.filter((item) => {
    try {
      if (item.type === "reading") {
        const reading = item.data as MoistureReading;
        if (readingIds.has(reading.id)) {
          const idx = readings.findIndex((r) => r.id === reading.id);
          readings[idx].synced = true;
          success++;
          return false;
        }
      }
      failed++;
      return true;
    } catch {
      failed++;
      return true;
    }
  });

  saveReadings(readings);
  saveOfflineQueue(newQueue);

  return { success, failed };
}

export function getUsers(): User[] {
  return getFromStorage<User[]>(STORAGE_KEYS.users, []);
}

export function saveUsers(users: User[]): void {
  setToStorage(STORAGE_KEYS.users, users);
}

export function getCurrentUser(): User | null {
  return getFromStorage<User | null>(STORAGE_KEYS.currentUser, null);
}

export function setCurrentUser(user: User | null): void {
  setToStorage(STORAGE_KEYS.currentUser, user);
}

export function hasPermission(
  user: User | null,
  requiredRole: User["role"],
): boolean {
  if (!user) return false;
  const roleHierarchy: Record<User["role"], number> = {
    operator: 1,
    curator: 2,
    admin: 3,
  };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export function seedInitialData(): void {
  if (getComponents().length > 0) return;

  const users: User[] = [
    { id: "u_curator", name: "陈馆长", role: "curator" },
    { id: "u_op1", name: "李技师", role: "operator" },
    { id: "u_op2", name: "王技师", role: "operator" },
  ];
  saveUsers(users);
  setCurrentUser(users[1]);

  const components: Component[] = [
    {
      id: "c_001",
      name: "船首左舷外板",
      rfidTag: "RFID-MC-0001",
      type: "外板",
      position: "船首左侧",
      isShipmentLocked: false,
      swabPoints: [
        { id: "p_001_1", name: "上测点", x: 20, y: 15, componentId: "c_001", description: "上部榫卯连接处" },
        { id: "p_001_2", name: "中测点", x: 50, y: 50, componentId: "c_001", description: "中部板芯" },
        { id: "p_001_3", name: "下测点", x: 80, y: 85, componentId: "c_001", description: "下部水线处" },
      ],
    },
    {
      id: "c_002",
      name: "龙骨中段",
      rfidTag: "RFID-MC-0002",
      type: "龙骨",
      position: "船体中部",
      isShipmentLocked: false,
      swabPoints: [
        { id: "p_002_1", name: "前端点", x: 10, y: 50, componentId: "c_002", description: "龙骨前端面" },
        { id: "p_002_2", name: "中心点", x: 50, y: 50, componentId: "c_002", description: "龙骨中心断面" },
        { id: "p_002_3", name: "后端点", x: 90, y: 50, componentId: "c_002", description: "龙骨后端面" },
      ],
    },
    {
      id: "c_003",
      name: "右舷舱壁板",
      rfidTag: "RFID-MC-0003",
      type: "舱壁",
      position: "右舷第三舱",
      isShipmentLocked: false,
      swabPoints: [
        { id: "p_003_1", name: "左上", x: 25, y: 20, componentId: "c_003" },
        { id: "p_003_2", name: "右上", x: 75, y: 20, componentId: "c_003" },
        { id: "p_003_3", name: "中心", x: 50, y: 50, componentId: "c_003" },
        { id: "p_003_4", name: "左下", x: 25, y: 80, componentId: "c_003" },
        { id: "p_003_5", name: "右下", x: 75, y: 80, componentId: "c_003" },
      ],
    },
    {
      id: "c_004",
      name: "船尾舵柱",
      rfidTag: "RFID-MC-0004",
      type: "舵柱",
      position: "船尾正中",
      isShipmentLocked: false,
      swabPoints: [
        { id: "p_004_1", name: "上部", x: 50, y: 15, componentId: "c_004" },
        { id: "p_004_2", name: "中部", x: 50, y: 50, componentId: "c_004" },
        { id: "p_004_3", name: "下部", x: 50, y: 85, componentId: "c_004" },
      ],
    },
  ];
  saveComponents(components);

  const sampleReading: MoistureReading = {
    id: "r_sample_1",
    pointId: "p_002_2",
    componentId: "c_002",
    value: 12.5,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    operatorId: "u_op1",
    operatorName: "李技师",
    isRecheck: false,
    synced: true,
    notes: "首次采样，状态良好",
  };
  saveReadings([sampleReading]);
}
