## 1. 架构设计
```mermaid
flowchart TB
    A["前端 React@18"] --> B["Mock 数据层"]
    A --> C["权限控制层"]
    C --> D["审计日志模块"]
    C --> E["角色权限模块"]
    B --> F["宝宝晨检数据"]
    B --> G["体温枪记录"]
    B --> H["请假条照片"]
    B --> I["跨班记录"]
    B --> J["补录记录"]
```

## 2. 技术描述
- 前端：React@18 + tailwindcss@3 + vite
- 初始化工具：vite-init
- 后端：无后端，全部使用 Mock 数据
- 数据：本地 Mock JSON 数据

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| /login | 登录页，角色选择 |
| /dashboard | 排程板主页 |
| /baby/:id | 宝宝详情页 |
| /audit | 审计日志页 |
| /data-status | 数据状态页 |

## 4. 数据模型
### 4.1 数据模型定义
```mermaid
erDiagram
    BABY ||--o{ TEMPERATURE : "has"
    BABY ||--o{ LEAVE : "has"
    BABY ||--o{ CROSS_CLASS : "has"
    BABY ||--o{ SUPPLEMENT : "has"
    USER ||--o{ AUDIT_LOG : "generates"
    BABY {
        string id
        string name
        string class
        string status
    }
    TEMPERATURE {
        string id
        string babyId
        float value
        datetime time
        string source
    }
    LEAVE {
        string id
        string babyId
        string photoUrl
        date date
        string reason
    }
    CROSS_CLASS {
        string id
        string babyId
        string fromClass
        string toClass
        string status
    }
    SUPPLEMENT {
        string id
        string babyId
        string field
        string beforeValue
        string afterValue
        datetime time
        string operator
    }
    AUDIT_LOG {
        string id
        string userId
        string action
        string target
        datetime time
        string result
    }
```
