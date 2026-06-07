import type { FollowUpRecord } from "@/types";

export const mockRecords: FollowUpRecord[] = [
  {
    id: "guoguo-001",
    infant: { name: "果果", gender: "female", ageMonths: 6 },
    followUpDate: "2026-06-05",
    updatedAt: "2026-06-05T10:30:00",
    status: "normal",
    threeDayMeals: [
      {
        date: "2026-06-03",
        meals: [
          { meal: "breakfast", food: "强化铁米粉 2 勺", isAbnormal: false },
          { meal: "lunch", food: "南瓜泥 30g + 米粉", isAbnormal: false },
          { meal: "dinner", food: "苹果泥 20g", isAbnormal: false },
        ],
      },
      {
        date: "2026-06-04",
        meals: [
          { meal: "breakfast", food: "胡萝卜泥 + 米粉", isAbnormal: false },
          { meal: "lunch", food: "西兰花泥 25g", isAbnormal: false },
          { meal: "dinner", food: "香蕉泥 30g", isAbnormal: false },
        ],
      },
      {
        date: "2026-06-05",
        meals: [
          { meal: "breakfast", food: "山药泥 + 米粉", isAbnormal: false },
          { meal: "lunch", food: "牛油果泥 20g", isAbnormal: false },
          { meal: "dinner", food: "梨泥 25g", isAbnormal: false },
        ],
      },
    ],
    history: [
      {
        id: "h-guo-1",
        timestamp: "2026-06-05T10:30:00",
        operator: "李护士",
        field: "status",
        fieldLabel: "审核状态",
        oldValue: "待审核",
        newValue: "正常",
        reason: "三日食材均符合 6 月龄辅食添加规范，无禁忌食材",
      },
    ],
    isManualEntry: false,
    lastOperator: "李护士",
    reviewTime: "2026-06-05T10:30:00",
  },
  {
    id: "doudou-002",
    infant: { name: "豆豆", gender: "male", ageMonths: 8 },
    followUpDate: "2026-06-06",
    updatedAt: "2026-06-06T14:20:00",
    status: "abnormal",
    parentNote:
      "豆豆妈妈补充：昨天吃了家里自制花生酱后下巴和脸颊出现少量红疹，今天已消退。之前忘记写蜂蜜了，老人说加点蜂蜜不便秘。",
    threeDayMeals: [
      {
        date: "2026-06-04",
        meals: [
          { meal: "breakfast", food: "燕麦粥 + 鸡蛋黄", isAbnormal: false },
          {
            meal: "lunch",
            food: "鸡肝泥 + 烂面条",
            isAbnormal: false,
          },
          {
            meal: "dinner",
            food: "蜂蜜水 50ml（老人添加）",
            isAbnormal: true,
            remark: "1 岁以下禁用蜂蜜（肉毒杆菌风险）",
          },
        ],
      },
      {
        date: "2026-06-05",
        meals: [
          { meal: "breakfast", food: "小米粥 + 红薯泥", isAbnormal: false },
          {
            meal: "lunch",
            food: "整颗花生米约 5 粒",
            isAbnormal: true,
            remark: "整颗粒坚果存在严重窒息风险",
          },
          {
            meal: "dinner",
            food: "自制花生酱拌粥",
            isAbnormal: true,
            remark: "高过敏风险食材，首次添加应少量并观察 3 天",
          },
        ],
      },
      {
        date: "2026-06-06",
        meals: [
          { meal: "breakfast", food: "南瓜粥 + 蛋黄", isAbnormal: false },
          { meal: "lunch", food: "鳕鱼泥 + 软米饭", isAbnormal: false },
          {
            meal: "dinner",
            food: "蜂蜜柚子茶（约 60ml）",
            isAbnormal: true,
            remark: "含蜂蜜，1 岁以下禁用",
          },
        ],
      },
    ],
    history: [
      {
        id: "h-dou-1",
        timestamp: "2026-06-06T09:15:00",
        operator: "系统初判",
        field: "status",
        fieldLabel: "审核状态",
        oldValue: "待审核",
        newValue: "异常",
        reason: "检出蜂蜜、整颗花生等禁忌/高风险食材",
      },
      {
        id: "h-dou-2",
        timestamp: "2026-06-06T14:20:00",
        operator: "王护士",
        field: "parentNote",
        fieldLabel: "家长补充信息",
        oldValue: "（无）",
        newValue: "豆豆妈妈补充：昨天吃了家里自制花生酱后下巴和脸颊出现少量红疹，今天已消退。之前忘记写蜂蜜了，老人说加点蜂蜜不便秘。",
        reason: "家长电话补充信息，需重新确认",
      },
    ],
    isManualEntry: false,
    lastOperator: "王护士",
    reviewTime: "2026-06-06T09:15:00",
  },
  {
    id: "mengmeng-003",
    infant: { name: "萌萌", gender: "female", ageMonths: 10 },
    followUpDate: "2026-06-04",
    updatedAt: "2026-06-04T16:45:00",
    status: "revised",
    parentNote: "萌萌家长确认：蛋黄已连续添加两周，每日 1/4 个，无任何过敏反应。",
    threeDayMeals: [
      {
        date: "2026-06-02",
        meals: [
          { meal: "breakfast", food: "全麦面包 + 配方奶", isAbnormal: false },
          { meal: "lunch", food: "番茄牛肉粥", isAbnormal: false },
          {
            meal: "dinner",
            food: "蛋黄 1/4 个 + 米糊",
            isAbnormal: false,
            remark: "系统初判为高风险，但家长证明确已耐受",
          },
        ],
      },
      {
        date: "2026-06-03",
        meals: [
          { meal: "breakfast", food: "小米粥 + 肉松", isAbnormal: false },
          { meal: "lunch", food: "虾仁豆腐羹 + 软饭", isAbnormal: false },
          {
            meal: "dinner",
            food: "蛋黄 1/4 个 + 南瓜泥",
            isAbnormal: false,
          },
        ],
      },
      {
        date: "2026-06-04",
        meals: [
          { meal: "breakfast", food: "玉米糊 + 小馒头", isAbnormal: false },
          { meal: "lunch", food: "菠菜猪肝面", isAbnormal: false },
          { meal: "dinner", food: "三文鱼泥 + 米糊", isAbnormal: false },
        ],
      },
    ],
    history: [
      {
        id: "h-meng-1",
        timestamp: "2026-06-04T11:00:00",
        operator: "系统初判",
        field: "status",
        fieldLabel: "审核状态",
        oldValue: "待审核",
        newValue: "异常",
        reason: "检出蛋黄（首次添加标记为高过敏风险）",
      },
      {
        id: "h-meng-2",
        timestamp: "2026-06-04T16:45:00",
        operator: "张护士",
        field: "status",
        fieldLabel: "审核状态",
        oldValue: "异常",
        newValue: "正常（人工改判）",
        reason:
          "家长确认已逐步添加蛋黄满 2 周，每日 1/4 个，无过敏反应，既往记录可佐证。系统初判的高风险标签解除。",
      },
    ],
    isManualEntry: false,
    reviseReason:
      "家长确认已逐步添加蛋黄满 2 周无过敏反应，既往记录可佐证。",
    lastOperator: "张护士",
    reviewTime: "2026-06-04T16:45:00",
  },
  {
    id: "zhuangzhuang-004",
    infant: { name: "壮壮", gender: "male", ageMonths: 7 },
    followUpDate: "2026-06-01",
    updatedAt: "2026-06-06T09:00:00",
    status: "manual",
    parentNote: "壮壮家长于 6 月 1 日来社区门诊咨询，因系统当日维护未录入，现补登。",
    threeDayMeals: [
      {
        date: "2026-05-30",
        meals: [
          { meal: "breakfast", food: "强化铁米粉", isAbnormal: false },
          { meal: "lunch", food: "土豆泥 + 米粉", isAbnormal: false },
          { meal: "dinner", food: "西梅泥 15g", isAbnormal: false },
        ],
      },
      {
        date: "2026-05-31",
        meals: [
          { meal: "breakfast", food: "胡萝卜泥 + 米粉", isAbnormal: false },
          { meal: "lunch", food: "鸡肉泥 20g + 米糊", isAbnormal: false },
          { meal: "dinner", food: "牛油果泥", isAbnormal: false },
        ],
      },
      {
        date: "2026-06-01",
        meals: [
          { meal: "breakfast", food: "燕麦粥（稀）", isAbnormal: false },
          { meal: "lunch", food: "菠菜泥 + 烂面条", isAbnormal: false },
          { meal: "dinner", food: "苹果泥 25g", isAbnormal: false },
        ],
      },
    ],
    history: [
      {
        id: "h-zhuang-1",
        timestamp: "2026-06-06T09:00:00",
        operator: "刘护士",
        field: "recordStatus",
        fieldLabel: "记录来源",
        oldValue: "（不存在）",
        newValue: "手工补录",
        reason:
          "家长 6 月 1 日上门咨询时系统维护未录入，今日补登。随访当场已评估为正常，食材无禁忌。",
      },
    ],
    isManualEntry: true,
    manualEntryNote:
      "家长 6 月 1 日上门咨询时系统维护未录入，今日（6 月 6 日）补登。随访当场已评估为正常。",
    lastOperator: "刘护士",
    reviewTime: "2026-06-06T09:00:00",
  },
];
