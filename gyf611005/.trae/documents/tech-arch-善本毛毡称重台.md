# 善本毛毡称重台 - 技术架构文档

## 1. 架构设计

```mermaid
graph TD
    subgraph "前端展示层 (Nuxt2 Options API)"
        A["称重主页面"]
        B["双人复核页面"]
        C["历史记录页面"]
        D["封存流程页面"]
        E["系统设置页面"]
    end
    
    subgraph "状态管理层 (Vuex)"
        F["称重模块 Store"]
        G["温湿度模块 Store"]
        H["用户模块 Store"]
        I["工单模块 Store"]
    end
    
    subgraph "数据持久层 (LocalStorage + IndexedDB)"
        J["称重记录 (≥30年归档)"]
        K["温湿度历史数据"]
        L["用户操作日志"]
        M["脱酸工单数据"]
    end
    
    subgraph "硬件对接层"
        N["温湿度探针 API"]
        O["电子天平串口对接"]
        P["拍照摄像头 API"]
        Q["条码扫描器"]
    end
    
    subgraph "外部系统对接"
        R["典藏管理系统 (CSV)"]
        S["脱酸修复工单系统"]
        T["封存审批系统"]
    end
    
    A --> F
    B --> F
    C --> J
    D --> I
    E --> H
    F --> J
    F --> N
    F --> O
    F --> P
    H --> L
    I --> M
    I --> S
    I --> T
    C --> R
```

---

## 2. 技术选型说明

| 技术项 | 选型 | 说明 |
|--------|------|------|
| 前端框架 | **Nuxt 2.17.x + Vue 2.7.x** | 团队遗留代码量大，IE 插件仅 v2 可用，Options API 强制要求 |
| 状态管理 | **Vuex 3.6.x** | Nuxt2 生态原生支持，模块式管理称重、温湿度、工单状态 |
| UI 框架 | **Element UI 2.15.x** | IE 兼容良好，组件丰富，适合企业级应用 |
| 图表库 | **Chart.js 2.9.x** | 轻量级，IE11 兼容，满足 7 日滚动曲线图需求 |
| 数据持久化 | **LocalStorage + IndexedDB** | 前端本地存储 ≥30 年归档需求，支持大量历史数据 |
| CSV 导出 | **Papaparse 5.4.x** | 高性能 CSV 解析/导出，对接典藏管理系统 |
| 样式方案 | **SCSS + CSS Variables** | 主题色统一管理，响应式适配桌面与平板 |
| 日期处理 | **Day.js 1.11.x** | 轻量级 Moment.js 替代品，国际化支持 |
| 构建工具 | **Webpack 4.x** | Nuxt2 内置，确保 IE 兼容性 |
| 浏览器兼容 | **IE11+, Chrome 80+, Safari 13+** | 满足库房旧设备与 iPad 需求 |

### 关键约束

- **强制使用 Options API**：禁止 Composition API，保持与团队遗留代码一致
- **禁止引入 Vue 3 生态库**：所有依赖必须明确支持 Vue 2 + IE11
- **数值输入方案**：自研滚轮选择器组件，彻底解决戴棉手套无法点选小数点问题

---

## 3. 路由定义

| 路由路径 | 页面名称 | 页面组件 | 权限要求 |
|---------|----------|----------|----------|
| `/` | 首页/称重台主页 | `pages/index.vue` | 称重操作员 |
| `/weighing` | 称重主流程 | `pages/weighing/index.vue` | 称重操作员 |
| `/weighing/review` | 双人复核页面 | `pages/weighing/review.vue` | 复核员 |
| `/weighing/seal` | 封存阅览流程 | `pages/weighing/seal.vue` | 库房管理员 |
| `/records` | 历史记录查询 | `pages/records/index.vue` | 库房管理员 |
| `/records/export` | CSV 导出 | `pages/records/export.vue` | 库房管理员 |
| `/workorders` | 脱酸工单管理 | `pages/workorders/index.vue` | 库房管理员 |
| `/settings` | 系统设置 | `pages/settings/index.vue` | 系统管理员 |
| `/login` | 登录页面 | `pages/login.vue` | 公开 |

---

## 4. 数据模型定义

### 4.1 实体关系图

```mermaid
erDiagram
    USER ||--o{ WEIGHING_RECORD : "操作"
    USER ||--o{ REVIEW_RECORD : "复核"
    WEIGHING_RECORD ||--o{ REVIEW_RECORD : "关联"
    WEIGHING_RECORD ||--o{ WEIGHING_ATTEMPT : "包含"
    WEIGHING_RECORD ||--|| HUMIDITY_DATA : "绑定"
    WEIGHING_RECORD ||--o| WORK_ORDER : "生成"
    WEIGHING_RECORD ||--o| SEAL_PROCESS : "触发"
    WEIGHING_ATTEMPT ||--o| PHOTO_ARCHIVE : "留档"
    
    USER {
        string id PK "用户工号"
        string name "姓名"
        string role "角色: operator/reviewer/admin"
        string password_hash "密码哈希"
        datetime created_at "创建时间"
    }
    
    WEIGHING_RECORD {
        string id PK "记录ID"
        string rare_book_no "善本编号"
        string page_no "页码"
        decimal median_value "中值结果(g)"
        decimal max_deviation "最大偏差"
        int reweigh_count "复称次数"
        string status "状态: normal/reviewed/sealed"
        string operator_id FK "操作员ID"
        datetime created_at "称重时间"
        datetime archived_at "归档时间"
        boolean is_archived "是否归档"
    }
    
    WEIGHING_ATTEMPT {
        string id PK
        string record_id FK
        int attempt_no "第几次称重"
        decimal weight_1 "称重1(g)"
        decimal weight_2 "称重2(g)"
        decimal weight_3 "称重3(g)"
        decimal calculated_median "计算中值"
        decimal deviation "本次偏差"
        boolean is_valid "是否有效"
        datetime created_at
    }
    
    HUMIDITY_DATA {
        string id PK
        string record_id FK
        decimal temperature "温度(°C)"
        decimal humidity "湿度(%RH)"
        string probe_id "探针ID"
        datetime measured_at "测量时间"
        boolean probe_online "探针在线状态"
    }
    
    REVIEW_RECORD {
        string id PK
        string record_id FK
        string reviewer_id FK
        decimal review_value "复核输入值"
        decimal difference "与原中值差异"
        boolean is_match "是否一致"
        string review_note "复核备注"
        datetime reviewed_at
    }
    
    WORK_ORDER {
        string id PK
        string record_id FK
        string type "类型: deacidification"
        string priority "优先级: normal/urgent"
        string status "状态: pending/processing/completed"
        datetime scheduled_date "预约日期"
        string handler "处理人"
        text notes "备注"
    }
    
    SEAL_PROCESS {
        string id PK
        string record_id FK
        string initiator_id FK
        string approver_id FK
        string status "状态: pending/approved/rejected"
        text reason "封存原因"
        text approval_opinion "审批意见"
        datetime initiated_at
        datetime approved_at
    }
    
    PHOTO_ARCHIVE {
        string id PK
        string attempt_id FK
        string file_path "文件路径/Base64"
        string photo_type "类型: reweigh/seal"
        datetime taken_at
    }
```

### 4.2 数据持久化策略

1. **热数据（近 1 年）**：IndexedDB 存储，支持快速查询与图表渲染
2. **温数据（1-10 年）**：LocalStorage 分片压缩存储
3. **冷数据（10 年以上）**：导出为加密 JSON + CSV 双格式，提示用户备份至典藏系统
4. **索引策略**：按善本编号、日期范围、操作员建立多字段索引
5. **防篡改机制**：每条记录生成 SHA-256 哈希，修改时校验哈希链

---

## 5. 核心模块设计

### 5.1 称重核心算法 (`utils/weighing.js`)

```javascript
// 计算中值
export function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[1] // 三次取中
}

// 计算最大偏差
export function calculateDeviation(values, median) {
  return Math.max(...values.map(v => Math.abs(v - median)))
}

// 判断是否需要复称
export function needsReweigh(deviation, threshold = 0.3) {
  return deviation > threshold
}

// 复核比对
export function reviewMatch(original, review, threshold = 0.1) {
  return Math.abs(original - review) <= threshold
}
```

### 5.2 Store 模块结构

```
store/
├── weighing.js      # 称重状态管理
├── humidity.js      # 温湿度探针状态
├── user.js          # 用户登录与权限
├── workorder.js     # 脱酸工单管理
└── seal.js          # 封存流程管理
```

### 5.3 核心组件结构

```
components/
├── weighing/
│   ├── WeightInputPad.vue      # 大按钮数字输入键盘
│   ├── WheelNumberPicker.vue   # 滚轮选择器（解决小数点问题）
│   ├── WeighingCard.vue        # 单条称重卡片
│   ├── DeviationGauge.vue      # 偏差仪表盘
│   └── ReweighModal.vue        # 复称弹窗
├── humidity/
│   ├── ProbeStatusCard.vue     # 温湿度探针状态卡
│   └── HumidityTrendChart.vue  # 7日滚动曲线图
├── review/
│   └── DualComparePanel.vue    # 双人比对面板
├── common/
│   ├── PhotoCapture.vue        # 拍照留档组件
│   └── BarcodeScanner.vue      # 条码扫描组件
└── export/
    └── CsvExportButton.vue     # CSV 导出按钮
```

---

## 6. 合规与安全设计

### 6.1 操作日志

- 所有用户操作（登录、称重、修改、导出）均记录审计日志
- 日志包含：用户ID、操作类型、时间戳、IP地址、操作前后数据
- 日志不可删除、不可修改

### 6.2 数据完整性

- 每条称重记录生成数字签名
- 数据导出时附带完整性校验码
- 定期（每日）自动校验数据完整性

### 6.3 30 年归档保证

- 数据格式：采用 UTF-8 编码的 JSON + CSV 双格式
- 存储介质：前端 IndexedDB + 用户定期备份到典藏系统
- 格式说明：随导出文件附带格式说明文档，确保 30 年后仍可解析

---

## 7. 项目目录结构

```
/
├── assets/
│   ├── scss/
│   │   ├── _variables.scss     # 设计变量（胡桃木色、朱砂红等）
│   │   ├── _mixins.scss
│   │   └── main.scss
│   └── fonts/                  # 思源宋体、等宽字体
├── components/                 # 见 5.3 节
├── layouts/
│   ├── default.vue
│   └── login.vue
├── pages/                      # 见路由定义
├── plugins/
│   ├── element-ui.js
│   ├── dayjs.js
│   └── indexed-db.js           # IndexedDB 初始化
├── store/                      # 见 5.2 节
├── utils/
│   ├── weighing.js             # 称重核心算法
│   ├── csv.js                  # CSV 导出工具
│   ├── crypto.js               # 哈希与签名工具
│   └── validator.js            # 业务规则校验
├── static/
├── nuxt.config.js
├── package.json
└── .babelrc                    # IE11 兼容配置
```
