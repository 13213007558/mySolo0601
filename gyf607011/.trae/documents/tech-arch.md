## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 React 18"
        A1["晨检列表页 /records"]
        A2["宝宝详情页 /baby/:id"]
        A3["记录编辑/补录弹窗"]
        A4["审计历史侧边抽屉"]
        A5["追溯链面包屑组件"]
        A6["三态反馈容器组件"]
    end
    
    subgraph "状态层 Zustand"
        B1["recordsStore 晨检记录"]
        B2["babyStore 宝宝信息"]
        B3["auditStore 审计日志"]
        B4["uiStore 界面状态"]
    end
    
    subgraph "后端 Express"
        C1["records 路由"]
        C2["babies 路由"]
        C3["audit 路由"]
        C4["export 路由（反查）"]
    end
    
    subgraph "数据层 Mock（SQLite 结构预留）"
        D1["babies 宝宝表"]
        D2["morning_checks 晨检记录表"]
        D3["thermometer_logs 体温枪原始记录表"]
        D4["leave_slips 请假条表"]
        D5["audit_logs 审计日志表"]
        D6["manual_entries 手工补录表"]
    end
    
    A1 --> B1
    A2 --> B2
    A2 --> B1
    A3 --> B1
    A4 --> B3
    A5 --> B1
    A6 --> B4
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    
    C1 --> D2
    C1 --> D3
    C1 --> D4
    C2 --> D1
    C3 --> D5
    C1 --> D6
```

## 2. 技术说明

- 前端：React@18 + TypeScript + tailwindcss@3 + Vite + React Router v6 + Zustand + Lucide React
- 初始化工具：vite-init
- 后端：Express@4 + TypeScript（ESM）
- 数据库：Mock 数据（内存 JSON），SQLite 结构预留用于后续升级
- 图片：请假条照片使用外部图片服务 URL

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 重定向到 /records |
| /records | 晨检列表页（三态反馈 + 筛选 + 导出） |
| /baby/:id | 宝宝详情页（时间轴 + 原始记录追溯 + 补录对比） |

## 4. API 定义

```typescript
// 宝宝信息
interface Baby {
  id: string;
  name: string;
  avatar: string;
  className: string;
  parentPhone: string;
  healthCode: string;
  exportRowNo?: number;
}

// 晨检记录
interface MorningCheck {
  id: string;
  babyId: string;
  date: string;
  temperature: number;
  oralCheck: 'normal' | 'abnormal';
  handCheck: 'normal' | 'abnormal';
  skinCheck: 'normal' | 'abnormal';
  status: 'normal' | 'abnormal' | 'leave';
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'rolled-back';
  dataQuality: 'clean' | 'dirty' | 'empty';
  isManualEntry: boolean;
  thermometerLogId?: string;
  leaveSlipId?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// 体温枪原始记录
interface ThermometerLog {
  id: string;
  deviceNo: string;
  temperature: number;
  measuredAt: string;
  babyId: string;
  rawSnapshot: string;
}

// 请假条
interface LeaveSlip {
  id: string;
  babyId: string;
  photoUrl: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
}

// 审计日志
interface AuditLog {
  id: string;
  recordId: string;
  fieldName: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  operator: string;
  operatedAt: string;
  operationType: 'create' | 'update' | 'delete' | 'manual-entry' | 'rollback';
  isAutoRollback: boolean;
}

// 部分提交结果
interface PartialSubmitResult {
  success: boolean[];
  failed: { index: number; error: string }[];
  message: string;
}
```

**API 端点：**
- `GET /api/babies` - 获取宝宝列表
- `GET /api/babies/:id` - 获取宝宝详情
- `GET /api/records` - 获取晨检记录列表（支持筛选）
- `GET /api/records/:id` - 获取单条晨检记录
- `POST /api/records` - 创建晨检记录（支持部分成功）
- `PUT /api/records/:id` - 更新晨检记录（自动写审计日志）
- `POST /api/records/manual` - 手工补录记录
- `GET /api/records/:id/audit` - 获取记录审计历史
- `GET /api/thermometer/:id` - 获取体温枪原始记录
- `GET /api/leaves/:id` - 获取请假条详情
- `GET /api/export/lookup?rowNo=` - 导出表反查宝宝

## 5. 服务端架构图

```mermaid
graph LR
    A["路由层 Routes"] --> B["服务层 Services"]
    B --> C["数据访问层 DAO"]
    C --> D["Mock 数据层 JSON"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    BABIES ||--o{ MORNING_CHECKS : has
    BABIES ||--o{ THERMOMETER_LOGS : has
    BABIES ||--o{ LEAVE_SLIPS : has
    MORNING_CHECKS ||--o{ AUDIT_LOGS : has
    MORNING_CHECKS ||--o| THERMOMETER_LOGS : references
    MORNING_CHECKS ||--o| LEAVE_SLIPS : references
    MORNING_CHECKS ||--o| MANUAL_ENTRIES : has
    
    BABIES {
        string id PK
        string name
        string avatar
        string class_name
        string parent_phone
        string health_code
        int export_row_no
    }
    
    MORNING_CHECKS {
        string id PK
        string baby_id FK
        string date
        float temperature
        string oral_check
        string hand_check
        string skin_check
        string status
        string review_status
        string data_quality
        boolean is_manual_entry
        string thermometer_log_id FK
        string leave_slip_id FK
        string created_at
        string updated_at
        string reviewed_by
        string reviewed_at
    }
    
    THERMOMETER_LOGS {
        string id PK
        string device_no
        float temperature
        string measured_at
        string baby_id FK
        string raw_snapshot
    }
    
    LEAVE_SLIPS {
        string id PK
        string baby_id FK
        string photo_url
        string reason
        string submitted_by
        string submitted_at
    }
    
    AUDIT_LOGS {
        string id PK
        string record_id FK
        string field_name
        string old_value
        string new_value
        string operator
        string operated_at
        string operation_type
        boolean is_auto_rollback
    }
    
    MANUAL_ENTRIES {
        string id PK
        string record_id FK
        string before_snapshot
        string after_snapshot
        string entered_by
        string entered_at
    }
```

### 6.2 初始数据设计

样例数据包含：
- 8 个宝宝（含 1 个绑定导出表行号，用于反查演示）
- 12 条晨检记录：3 条空数据状态、2 条脏数据状态、7 条正常数据状态
- 1 条手工补录样例（带前后对比快照）
- 5 条体温枪原始记录
- 3 张请假条照片
- 6 条审计日志（含 1 条"自动回退"标签记录）
