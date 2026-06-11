## 1. 架构设计

```mermaid
graph TB
    "Frontend Layer" --> "State Management(Zustand)"
    "State Management(Zustand)" --> "IndexedDB(Dexie.js)"
    "Frontend Layer" --> "Export Module"
    "Export Module" --> "Blob Download"
    subgraph "Frontend Layer"
        "测点网格组件"
        "坡度计算组件"
        "雨后证据组件"
        "返工建议组件"
        "版本历史组件"
        "导出面板组件"
    end
    subgraph "IndexedDB(Dexie.js)"
        "zones(分区表)"
        "measurePoints(测点表)"
        "evidences(证据表)"
        "suggestions(建议表)"
        "suggestionVersions(建议版本表)"
    end
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init (react-ts 模板)
- 状态管理：Zustand
- 本地存储：IndexedDB (Dexie.js)
- 后端：无
- 数据库：浏览器 IndexedDB，使用 Dexie.js 封装

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主排查页，包含所有功能模块 |

## 4. API定义
- 不适用，纯前端项目

## 5. 服务端架构图
- 不适用，纯前端项目

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Zone" ||--o{ "MeasurePoint" : "contains"
    "Zone" ||--o{ "Suggestion" : "has"
    "Zone" ||--o{ "Evidence" : "has"
    "Suggestion" ||--o{ "SuggestionVersion" : "versions"
    "MeasurePoint" {
        "string id PK"
        "string zoneId FK"
        "number row"
        "number col"
        "number elevation"
        "string unit"
        "boolean isSupplemented"
        "string createdAt"
    }
    "Zone" {
        "string id PK"
        "string name"
        "string drainageDirection"
        "number minSlopePercent"
    }
    "Evidence" {
        "string id PK"
        "string zoneId FK"
        "string photoUrl"
        "string description"
        "string timestamp"
        "boolean isSupplemented"
    }
    "Suggestion" {
        "string id PK"
        "string zoneId FK"
        "string currentContent"
        "string updatedAt"
    }
    "SuggestionVersion" {
        "string id PK"
        "string suggestionId FK"
        "string content"
        "number versionNumber"
        "string createdAt"
        "string changeNote"
    }
```

### 6.2 数据定义

IndexedDB 通过 Dexie.js 定义 schema：

- **zones**: `++id, name, drainageDirection, minSlopePercent`
- **measurePoints**: `++id, zoneId, row, col, elevation, unit, isSupplemented, createdAt`
- **evidences**: `++id, zoneId, photoUrl, description, timestamp, isSupplemented`
- **suggestions**: `++id, zoneId, currentContent, updatedAt`
- **suggestionVersions**: `++id, suggestionId, content, versionNumber, createdAt, changeNote`

初始样例数据包含：
- 3个屋面分区（A区、B区、C区）
- A区：6个测点(2x3网格)，含1个补录测点
- B区：9个测点(3x3网格)，含坡度异常
- C区：4个测点(2x2网格)，含空测点
- 雨后证据照片6张，其中2张标记为补录
- 返工建议3条，每条含2-3个版本
