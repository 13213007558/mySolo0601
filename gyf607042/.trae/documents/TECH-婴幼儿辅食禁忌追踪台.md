## 1. 架构设计

```mermaid
graph TD
    A["React 18 前端 UI 层"] --> B["Zustand 状态管理"]
    B --> C["localStorage 持久化层"]
    A --> D["React Router 路由"]
    A --> E["Tailwind CSS 样式层"]
    A --> F["Lucide React 图标层"]
    C --> G["初始样例数据（内置 5 条）"]
```

纯前端单页应用，无后端服务。所有数据通过 Zustand 管理并同步到 localStorage 实现服务重启后数据不丢失。

## 2. 技术说明

- **前端**：React@18 + TypeScript@5 + TailwindCSS@3 + Vite@5
- **初始化工具**：vite-init（react-ts 模板）
- **路由**：react-router-dom@6
- **状态管理**：zustand@4（含 persist 中间件 → localStorage）
- **图标**：lucide-react@latest
- **后端**：无
- **数据库**：localStorage（由 zustand persist 自动序列化）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 追踪台首页（列表 + 统计 + 筛选） |
| /record/:id | 记录详情页 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    RECORD {
        string id PK "记录唯一ID"
        string roomNo "房间号"
        string babyName "宝宝姓名（脱敏后）"
        string babyNameRaw "宝宝姓名原文"
        string motherPhone "妈妈手机号（原文）"
        string mealType "餐次：早餐/午餐/晚餐/加餐"
        string mealDate "膳食日期 YYYY-MM-DD"
        string photoUrl "餐盘照片URL"
        string photoCaption "照片说明"
        string status "状态：normal/abnormal/manual_overridden/pending"
        string overrideReason "人工改判理由"
        array ingredients "食材清单 Ingredient[]"
        array taboosMatched "命中的禁忌项 TabooMatch[]"
        array validationIssues "校验问题 ValidationIssue[]"
        array rectificationLogs "整改记录 RectificationLog[]"
        boolean isManualEntry "是否手工补录"
        string createdAt "创建时间 ISO"
        string updatedAt "更新时间 ISO"
    }

    INGREDIENT {
        string name "食材名称"
        string category "类别：主食/蔬菜/肉类/蛋奶/海鲜/坚果/其他"
        boolean isForbidden "是否为禁忌食材"
    }

    TABOO_MATCH {
        string ingredientName "命中食材"
        string tabooName "禁忌名称"
        string riskLevel "风险等级：高/中/低"
        string description "禁忌说明"
    }

    VALIDATION_ISSUE {
        string field "字段名"
        string issue "问题类型：phone_format/privacy_leak 等"
        string severity "严重程度：warn/error"
        string humanReadable "自然语言说明"
        string rawValue "原始值（调试用）"
    }

    RECTIFICATION_LOG {
        string id PK "日志ID"
        string action "操作：create/status_change/rectify/override"
        string operator "操作人"
        string note "备注"
        string timestamp "操作时间 ISO"
    }
```

### 4.2 初始样例数据（5 条）

1. **正常记录**：302 房 小米粥+南瓜泥+蛋黄，无禁忌，手机号格式正确
2. **异常记录**：501 房 虾仁蒸蛋（海鲜禁忌），手机号格式混乱（"138-1234-5678转01"），存在隐私字段
3. **人工改判记录**：208 房 系统判定花生碎为禁忌，主管核实为专用低敏花生粉，人工改判通过
4. **待审核记录**：405 房 数据待处理，供走审核流程
5. **手工补录记录**：101 房 补录记录，`isManualEntry=true`，展示补录前后字段差异

## 5. 核心逻辑模块

| 模块 | 位置 | 职责 |
|------|------|------|
| useRecordStore | src/store/useRecordStore.ts | Zustand store：CRUD、状态流转、持久化 |
| tabooEngine | src/utils/tabooEngine.ts | 禁忌比对引擎：输入食材列表，输出命中禁忌 |
| validationEngine | src/utils/validationEngine.ts | 校验引擎：手机号格式、隐私字段检测，输出自然语言说明 |
| exportSummary | src/utils/exportSummary.ts | 导出同事可读的摘要文本（脱敏） |
| sampleData | src/data/sampleData.ts | 内置 5 条样例数据 |
