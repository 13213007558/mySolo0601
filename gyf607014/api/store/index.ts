import type {
  CourseRescheduleRecord,
  ChangeHistory,
  ExceptionEvent,
  ExportLog,
  StatsSummary,
  RecordFilters,
  UserRole,
} from '../../shared/types';

const now = new Date();
const daysAgo = (d: number) => {
  const t = new Date(now);
  t.setDate(t.getDate() - d);
  return t.toISOString();
};
const hoursAgo = (h: number) => {
  const t = new Date(now);
  t.setHours(t.getHours() - h);
  return t.toISOString();
};

const genId = () => Math.random().toString(36).slice(2, 10);

const makeHistory = (
  recordId: string,
  entries: Array<{
    field: string;
    fieldLabel: string;
    oldValue: string;
    newValue: string;
    operator: string;
    operatorRole: UserRole;
    note: string;
    hoursAgo: number;
  }>,
): ChangeHistory[] =>
  entries.map((e) => ({
    id: genId(),
    recordId,
    field: e.field,
    fieldLabel: e.fieldLabel,
    oldValue: e.oldValue,
    newValue: e.newValue,
    operator: e.operator,
    operatorRole: e.operatorRole,
    reviewedAt: hoursAgo(e.hoursAgo),
    note: e.note,
    createdAt: hoursAgo(e.hoursAgo),
  }));

export const records: CourseRescheduleRecord[] = [
  {
    id: "rec-001",
    infantName: "林思语",
    infantAge: 2,
    guardianName: "林女士",
    guardianPhone: "138****2341",
    courseName: "婴幼儿感官启智课",
    originalDate: "2026-05-28",
    newDate: "2026-06-10",
    sourceFile: "2026-05-亲子餐厅改期登记.xlsx",
    sourceFileUrl: "#",
    operator: "张护士",
    operatorRole: "nurse",
    status: "reviewed",
    dataSource: "normal",
    latestNote: "家长因孩子发烧申请改期，已复核原始病历截图",
    reviewCount: 2,
    createdAt: daysAgo(14),
    updatedAt: hoursAgo(26),
    changeHistory: makeHistory("rec-001", [
      { field: "status", fieldLabel: "记录状态", oldValue: "待复核", newValue: "已复核", operator: "王园长", operatorRole: "director", note: "材料齐全，符合改期政策", hoursAgo: 26 },
      { field: "newDate", fieldLabel: "新课程日期", oldValue: "2026-06-05", newValue: "2026-06-10", operator: "张护士", operatorRole: "nurse", note: "家长来电二次调整，孩子未完全康复", hoursAgo: 50 },
      { field: "originalDate", fieldLabel: "原课程日期", oldValue: "-", newValue: "2026-05-28", operator: "张护士", operatorRole: "nurse", note: "初始录入", hoursAgo: 320 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-002",
    infantName: "陈梓豪",
    infantAge: 3,
    guardianName: "陈先生",
    guardianPhone: "139****5678",
    courseName: "亲子烹饪启蒙课",
    originalDate: "2026-06-01",
    newDate: "2026-06-15",
    sourceFile: "6月第一周改期申请.pdf",
    operator: "李护士",
    operatorRole: "nurse",
    status: "pending",
    dataSource: "normal",
    latestNote: "家长出差，需改到中旬，等待园长复核",
    reviewCount: 0,
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(8),
    changeHistory: makeHistory("rec-002", [
      { field: "status", fieldLabel: "记录状态", oldValue: "-", newValue: "待复核", operator: "李护士", operatorRole: "nurse", note: "新建记录，待园长审批", hoursAgo: 8 },
      { field: "newDate", fieldLabel: "新课程日期", oldValue: "2026-06-08", newValue: "2026-06-15", operator: "李护士", operatorRole: "nurse", note: "6月8日家长仍在外省", hoursAgo: 22 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-003",
    infantName: "王雨桐",
    infantAge: 1,
    guardianName: "王女士",
    guardianPhone: "137****9912",
    courseName: "婴儿抚触护理课",
    originalDate: "2026-05-20",
    newDate: "2026-06-20",
    sourceFile: "服务重启前旧系统记录",
    operator: "系统迁移",
    operatorRole: "nurse",
    status: "exception",
    dataSource: "corrupted",
    latestNote: "服务重启后该记录部分字段丢失，已通过纸质档案补全新日期",
    reviewCount: 1,
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(72),
    changeHistory: makeHistory("rec-003", [
      { field: "newDate", fieldLabel: "新课程日期", oldValue: "[数据丢失]", newValue: "2026-06-20", operator: "王园长", operatorRole: "director", note: "对照5月20日前台签到簿补录", hoursAgo: 72 },
      { field: "guardianPhone", fieldLabel: "监护人电话", oldValue: "[数据丢失]", newValue: "137****9912", operator: "王园长", operatorRole: "director", note: "从会员中心数据库同步", hoursAgo: 73 },
    ]),
    exceptions: [
      {
        id: genId(),
        recordId: "rec-003",
        type: "service_restart",
        title: "5月30日服务重启导致历史数据丢失",
        reason: "凌晨 02:15 服务器意外重启，Redis 缓存未持久化，该记录创建于重启前 6 小时、未及落盘，导致 guardianPhone、newDate、latestNote 字段丢失。",
        recoveryNote: "已通过纸质档案 + 会员中心对照恢复，恢复人：王园长。电话字段来源于会员中心，新日期由前台签到簿推算。恢复后状态标记为异常，留痕审计。",
        createdAt: daysAgo(8),
        operator: "系统",
      },
      {
        id: genId(),
        recordId: "rec-003",
        type: "bad_data",
        title: "原课程日期字段异常（早于会员注册日）",
        reason: "originalDate=2026-05-20，但会员系统显示该家庭 5 月 22 日才完成注册，疑似前台录入时手误。",
        recoveryNote: "暂不修改原始日期，保留异常记录；已通知前台下周核对。",
        createdAt: daysAgo(7),
        operator: "王园长",
      },
    ],
  },
  {
    id: "rec-004",
    infantName: "赵一诺",
    infantAge: 4,
    guardianName: "赵先生",
    guardianPhone: "135****4421",
    courseName: "儿童手工创意课",
    originalDate: "2026-06-03",
    newDate: "2026-06-17",
    sourceFile: "手工补录-6月第2周.xlsx",
    operator: "张护士",
    operatorRole: "nurse",
    status: "supplemented",
    dataSource: "supplement",
    latestNote: "家长通过微信申请改期，未走系统流程，由护士手工补录",
    reviewCount: 1,
    createdAt: hoursAgo(48),
    updatedAt: hoursAgo(12),
    changeHistory: makeHistory("rec-004", [
      { field: "status", fieldLabel: "记录状态", oldValue: "补录中", newValue: "已补录", operator: "王园长", operatorRole: "director", note: "核对微信聊天记录截图通过", hoursAgo: 12 },
      { field: "courseName", fieldLabel: "课程名称", oldValue: "儿童创意课", newValue: "儿童手工创意课", operator: "张护士", operatorRole: "nurse", note: "补录时课程名称简写，修正为全称", hoursAgo: 30 },
      { field: "originalDate", fieldLabel: "原课程日期", oldValue: "-", newValue: "2026-06-03", operator: "张护士", operatorRole: "nurse", note: "微信申请补录", hoursAgo: 48 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-005",
    infantName: "孙浩然",
    infantAge: 2,
    guardianName: "孙女士",
    guardianPhone: "136****7788",
    courseName: "婴幼儿音乐律动课",
    originalDate: "2026-06-05",
    newDate: "2026-06-19",
    sourceFile: "2026-06-改期汇总.xlsx",
    operator: "李护士",
    operatorRole: "nurse",
    status: "reviewed",
    dataSource: "normal",
    latestNote: "全家出游，改至 6 月 19 日，已复核",
    reviewCount: 1,
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(96),
    changeHistory: makeHistory("rec-005", [
      { field: "status", fieldLabel: "记录状态", oldValue: "待复核", newValue: "已复核", operator: "王园长", operatorRole: "director", note: "机票行程单已核实", hoursAgo: 96 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-006",
    infantName: "周沐阳",
    infantAge: 3,
    guardianName: "周先生",
    guardianPhone: "133****5566",
    courseName: "亲子绘本阅读课",
    originalDate: "2026-06-02",
    newDate: "2026-06-24",
    sourceFile: "5月异常恢复后重建数据",
    operator: "王园长",
    operatorRole: "director",
    status: "exception",
    dataSource: "corrupted",
    latestNote: "5月服务重启时该记录整条丢失，从历史快照中恢复并人工确认",
    reviewCount: 3,
    createdAt: daysAgo(25),
    updatedAt: hoursAgo(120),
    changeHistory: makeHistory("rec-006", [
      { field: "status", fieldLabel: "记录状态", oldValue: "待复核", newValue: "已复核", operator: "王园长", operatorRole: "director", note: "家长电话二次确认通过", hoursAgo: 120 },
      { field: "newDate", fieldLabel: "新课程日期", oldValue: "2026-06-10", newValue: "2026-06-24", operator: "李护士", operatorRole: "nurse", note: "家长后续又改了一次", hoursAgo: 140 },
      { field: "originalDate", fieldLabel: "原课程日期", oldValue: "-", newValue: "2026-06-02", operator: "王园长", operatorRole: "director", note: "从数据库 5 月 28 日 23:00 快照中恢复", hoursAgo: 190 },
    ]),
    exceptions: [
      {
        id: genId(),
        recordId: "rec-006",
        type: "data_loss",
        title: "5月30日整记录丢失",
        reason: "该记录创建于 5 月 29 日 18:22，属于 5 月 30 日重启事故中丢失的 7 条记录之一。写入时仅完成 Redis 缓存，数据库事务因进程被杀未 commit。",
        recoveryNote: "从每日 23:00 自动快照恢复基础字段，家长联系方式由前台 5 月改期登记本补录，新日期通过电话回访家长确认。恢复完成后累计复核 3 次。",
        createdAt: daysAgo(9),
        operator: "王园长",
      },
    ],
  },
  {
    id: "rec-007",
    infantName: "吴可馨",
    infantAge: 1,
    guardianName: "吴女士",
    guardianPhone: "132****3344",
    courseName: "婴儿水育早教课",
    originalDate: "2026-06-08",
    newDate: "2026-06-22",
    sourceFile: "2026-06-改期汇总.xlsx",
    operator: "张护士",
    operatorRole: "nurse",
    status: "pending",
    dataSource: "normal",
    latestNote: "孩子轻微湿疹，医生建议延后两周",
    reviewCount: 0,
    createdAt: hoursAgo(36),
    updatedAt: hoursAgo(6),
    changeHistory: makeHistory("rec-007", [
      { field: "latestNote", fieldLabel: "人工说明", oldValue: "-", newValue: "孩子轻微湿疹，医生建议延后两周", operator: "张护士", operatorRole: "nurse", note: "补充说明", hoursAgo: 6 },
      { field: "newDate", fieldLabel: "新课程日期", oldValue: "-", newValue: "2026-06-22", operator: "张护士", operatorRole: "nurse", note: "新建记录", hoursAgo: 36 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-008",
    infantName: "郑子轩",
    infantAge: 4,
    guardianName: "郑先生",
    guardianPhone: "131****8899",
    courseName: "儿童烘焙体验课",
    originalDate: "2026-06-04",
    newDate: "2026-06-18",
    sourceFile: "手工补录-郑子轩.pdf",
    operator: "王园长",
    operatorRole: "director",
    status: "supplemented",
    dataSource: "supplement",
    latestNote: "前台漏录，园长从家长群聊天记录中手工补录",
    reviewCount: 2,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(4),
    changeHistory: makeHistory("rec-008", [
      { field: "status", fieldLabel: "记录状态", oldValue: "补录中", newValue: "已补录", operator: "王园长", operatorRole: "director", note: "与家长电话确认完成", hoursAgo: 4 },
      { field: "guardianPhone", fieldLabel: "监护人电话", oldValue: "-", newValue: "131****8899", operator: "张护士", operatorRole: "nurse", note: "从会员系统匹配", hoursAgo: 10 },
      { field: "courseName", fieldLabel: "课程名称", oldValue: "-", newValue: "儿童烘焙体验课", operator: "王园长", operatorRole: "director", note: "家长群聊天记录补录", hoursAgo: 20 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-009",
    infantName: "何欣怡",
    infantAge: 2,
    guardianName: "何女士",
    guardianPhone: "130****1122",
    courseName: "婴幼儿社交游戏课",
    originalDate: "2026-06-06",
    newDate: "2026-06-28",
    sourceFile: "2026-06-改期汇总.xlsx",
    operator: "李护士",
    operatorRole: "nurse",
    status: "reviewed",
    dataSource: "normal",
    latestNote: "搬家后距离较远，改至月底",
    reviewCount: 1,
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(40),
    changeHistory: makeHistory("rec-009", [
      { field: "status", fieldLabel: "记录状态", oldValue: "待复核", newValue: "已复核", operator: "王园长", operatorRole: "director", note: "地址变更证明已收到", hoursAgo: 40 },
    ]),
    exceptions: [],
  },
  {
    id: "rec-010",
    infantName: "冯梓萱",
    infantAge: 3,
    guardianName: "冯先生",
    guardianPhone: "159****6677",
    courseName: "亲子户外自然课",
    originalDate: "2026-05-25",
    newDate: "2026-06-29",
    sourceFile: "历史遗留-5月改期.csv",
    operator: "系统迁移",
    operatorRole: "nurse",
    status: "exception",
    dataSource: "corrupted",
    latestNote: "该记录来源为旧系统 CSV 导入，课程日期存在异常早于开课日",
    reviewCount: 1,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
    changeHistory: makeHistory("rec-010", [
      { field: "latestNote", fieldLabel: "人工说明", oldValue: "-", newValue: "该记录来源为旧系统 CSV 导入，课程日期存在异常早于开课日", operator: "王园长", operatorRole: "director", note: "标记异常，待前台核对", hoursAgo: 24 },
    ]),
    exceptions: [
      {
        id: genId(),
        recordId: "rec-010",
        type: "bad_data",
        title: "CSV 导入脏数据：原日期早于课程上线日",
        reason: "originalDate=2026-05-25，但亲子户外自然课 6 月 1 日才正式排课，疑似旧系统中课程 ID 对应错误。",
        recoveryNote: "暂保留原值，等待前台与家长逐一核对后再处理，避免误改。",
        createdAt: daysAgo(1),
        operator: "王园长",
      },
    ],
  },
];

export const exportLogs: ExportLog[] = [
  {
    id: "exp-001",
    operator: "王园长",
    filters: { status: "reviewed", dateFrom: "2026-05-01", dateTo: "2026-05-31" },
    format: "csv",
    recordCount: 24,
    downloadUrl: "#",
    createdAt: daysAgo(6),
  },
  {
    id: "exp-002",
    operator: "张护士",
    filters: { dataSource: "supplement" },
    format: "xlsx",
    recordCount: 5,
    downloadUrl: "#",
    createdAt: daysAgo(2),
  },
];

export function getStats(): StatsSummary {
  return {
    pending: records.filter((r) => r.status === "pending").length,
    reviewed: records.filter((r) => r.status === "reviewed").length,
    exception: records.filter((r) => r.status === "exception").length,
    supplemented: records.filter((r) => r.status === "supplemented").length,
    total: records.length,
  };
}

export function filterRecords(f: RecordFilters): CourseRescheduleRecord[] {
  let list = [...records];
  if (f.status) list = list.filter((r) => r.status === f.status);
  if (f.dataSource) list = list.filter((r) => r.dataSource === f.dataSource);
  if (f.operator) list = list.filter((r) => r.operator === f.operator);
  if (f.search) {
    const kw = f.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.infantName.toLowerCase().includes(kw) ||
        r.guardianName.toLowerCase().includes(kw) ||
        r.courseName.toLowerCase().includes(kw) ||
        r.sourceFile.toLowerCase().includes(kw),
    );
  }
  if (f.dateFrom) list = list.filter((r) => r.originalDate >= f.dateFrom!);
  if (f.dateTo) list = list.filter((r) => r.originalDate <= f.dateTo!);
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findById(id: string): CourseRescheduleRecord | undefined {
  return records.find((r) => r.id === id);
}

export function addRecord(r: Omit<CourseRescheduleRecord, "id" | "changeHistory" | "exceptions" | "reviewCount" | "createdAt" | "updatedAt">): CourseRescheduleRecord {
  const now = new Date().toISOString();
  const rec: CourseRescheduleRecord = {
    ...r,
    id: "rec-" + genId(),
    changeHistory: [],
    exceptions: [],
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  records.unshift(rec);
  return rec;
}

export function updateRecord(
  id: string,
  patch: Partial<CourseRescheduleRecord>,
  meta: { operator: string; operatorRole: UserRole; note: string },
): CourseRescheduleRecord | null {
  const rec = findById(id);
  if (!rec) return null;
  const now = new Date().toISOString();
  const fieldLabels: Record<string, string> = {
    infantName: "婴幼儿姓名",
    infantAge: "婴幼儿月龄",
    guardianName: "监护人姓名",
    guardianPhone: "监护人电话",
    courseName: "课程名称",
    originalDate: "原课程日期",
    newDate: "新课程日期",
    sourceFile: "来源文件",
    status: "记录状态",
    latestNote: "人工说明",
  };
  for (const key of Object.keys(patch) as Array<keyof CourseRescheduleRecord>) {
    const oldV = String(rec[key] ?? "");
    const newV = String(patch[key] ?? "");
    if (oldV !== newV) {
      rec.changeHistory.unshift({
        id: genId(),
        recordId: id,
        field: key as string,
        fieldLabel: fieldLabels[key] || key,
        oldValue: oldV,
        newValue: newV,
        operator: meta.operator,
        operatorRole: meta.operatorRole,
        reviewedAt: now,
        note: meta.note,
        createdAt: now,
      });
    }
  }
  Object.assign(rec, patch);
  if (patch.status === "reviewed") rec.reviewCount += 1;
  rec.updatedAt = now;
  return rec;
}

export function addException(recordId: string, evt: Omit<ExceptionEvent, "id" | "recordId" | "createdAt">): ExceptionEvent | null {
  const rec = findById(recordId);
  if (!rec) return null;
  const e: ExceptionEvent = { ...evt, id: genId(), recordId, createdAt: new Date().toISOString() };
  rec.exceptions.unshift(e);
  rec.status = "exception";
  rec.updatedAt = e.createdAt;
  return e;
}

export function addExportLog(log: Omit<ExportLog, "id" | "createdAt">): ExportLog {
  const entry: ExportLog = { ...log, id: "exp-" + genId(), createdAt: new Date().toISOString() };
  exportLogs.unshift(entry);
  return entry;
}
