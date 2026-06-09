## 1. 架构设计

```mermaid
graph TD
    A["前端 React 应用"] --> B["状态管理层 (Zustand)"]
    B --> C["UI 组件层"]
    C --> D["台账列表组件"]
    C --> E["ECharts 图表组件"]
    C --> F["排放因子卡片组件"]
    C --> G["批量操作复盘组件"]
    C --> H["导出摘要组件"]
    A --> I["工具函数层"]
    I --> J["导出工具 (xlsx)"]
    I --> K["数据转换工具"]
    I --> L["提示语生成工具"]
    A --> M["Mock 数据层"]
    M --> N["台账数据"]
    M --> O["排放因子说明数据"]
    M --> P["操作历史数据"]
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript + Vite
- **状态管理**：Zustand（轻量级，适合企业级中后台）
- **UI 组件库**：Ant Design@5（企业级组件，内置表格、弹窗、表单）
- **图表库**：ECharts@5（支持复杂交互和事件绑定）
- **样式方案**：TailwindCSS@3 + CSS Variables
- **导出功能**：xlsx (SheetJS) + file-saver
- **图标**：lucide-react
- **初始化工具**：vite-init react-ts 模板
- **后端**：无（纯前端Mock数据，模拟真实业务场景）
- **数据库**：localStorage 持久化操作历史

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 台账追踪面板主页（列表+图表+排放因子卡片） |
| /review | 批量操作复盘页 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    CARBON_LEDGER ||--o{ OPERATION_HISTORY : "has"
    CARBON_LEDGER ||--o| EMISSION_FACTOR : "may have"
    CARBON_LEDGER {
        string id "台账ID"
        string date "统计日期"
        string building "楼宇名称"
        number electricity "用电量(kWh)"
        number gas "用气量(m³)"
        number carbon_emission "碳排放量(tCO2)"
        string emission_factor "排放因子"
        string status "状态：正常/已撤回/待拍板"
        string withdraw_reason "撤回原因"
        string handler "处理人"
        string plain_tip "白话提示"
        boolean selected "是否勾选"
        boolean is_manual_entry "是否韩工补录"
        number original_carbon_emission "原始碳排放（批量操作前）"
        string original_emission_factor "原始排放因子"
        string manual_entry_note "韩工补录说明"
        Date created_at "创建时间"
        Date updated_at "更新时间"
    }
    EMISSION_FACTOR {
        string id "说明ID"
        string factor_name "因子名称"
        number old_value "旧值"
        number new_value "新值"
        string operator "操作人（韩工）"
        string reason "补录原因"
        Date entry_time "补录时间"
        string source "数据来源"
    }
    OPERATION_HISTORY {
        string id "操作ID"
        string operation_type "操作类型：批量撤回/批量修改/单个编辑"
        array affected_ids "影响的台账ID列表"
        string operator "操作人"
        Date operation_time "操作时间"
        string reason "操作原因"
        object original_values "原始值快照"
        object new_values "新值快照"
        boolean can_rollback "是否可回滚（恒为false）"
    }
```

### 4.2 TypeScript 类型定义

```typescript
interface CarbonLedger {
  id: string;
  date: string;
  building: string;
  electricity: number;
  gas: number;
  carbonEmission: number;
  emissionFactor: string;
  status: 'normal' | 'withdrawn' | 'pending';
  withdrawReason: string;
  handler: string;
  plainTip: string;
  selected: boolean;
  isManualEntry: boolean;
  originalCarbonEmission: number;
  originalEmissionFactor: string;
  manualEntryNote: string;
  createdAt: string;
  updatedAt: string;
}

interface EmissionFactorNote {
  id: string;
  factorName: string;
  oldValue: number;
  newValue: number;
  operator: string;
  reason: string;
  entryTime: string;
  source: string;
}

interface OperationHistory {
  id: string;
  operationType: 'batch_withdraw' | 'batch_modify' | 'single_edit';
  affectedIds: string[];
  operator: string;
  operationTime: string;
  reason: string;
  originalValues: Record<string, Partial<CarbonLedger>>;
  newValues: Record<string, Partial<CarbonLedger>>;
  canRollback: false;
}

interface ExportSummary {
  totalCount: number;
  withdrawnCount: number;
  pendingCount: number;
  normalCount: number;
  reasons: { reason: string; count: number }[];
  handlers: { name: string; count: number }[];
  pendingRecords: CarbonLedger[];
  exportTime: string;
  exportBy: string;
}
```

## 5. 核心功能实现要点

### 5.1 列表-图表双向联动

- 勾选列表行 → 更新 Zustand store 中 `selected` 字段 → 图表组件订阅选中数据 → ECharts `setOption` 刷新
- 图表 `click` 事件 → 获取 dataIndex → 找到对应台账ID → 调用列表组件 `scrollToRow` 方法 → 触发高亮动画

### 5.2 撤回原因覆盖与白话提示

- 编辑撤回原因 → 直接覆盖 `withdrawReason` 字段 → 不保留历史版本
- 根据 `withdrawReason` 关键词自动生成 `plainTip`（使用映射表）
- 值班员视角：hover 显示 Tooltip 展示白话翻译

### 5.3 批量操作与复盘页

- 批量操作前：快照原始值到 `originalValues`
- 执行操作：更新数据 + 创建 `OperationHistory` 记录 + `canRollback = false`
- 复盘页：展示历史记录，对比原始值与新值，明确标识"不可回滚"

### 5.4 导出摘要

- 按状态统计数量 → 聚合原因和处理人 → 提取待拍板记录 → 生成 `ExportSummary`
- 导出 Excel：多 Sheet 设计（汇总、原因明细、待拍板记录）
- 支持复制邮箱功能，一键发送给资产负责人

### 5.5 韩工补录排放因子说明

- 特殊标记记录：`isManualEntry = true`，显示"韩工补录"标签
- 差异对比：高亮显示 `originalCarbonEmission` 与 `carbonEmission` 的差值
- 导出/读回：导出时包含补录说明，导入时验证数据一致性
