# 婴幼儿费用核销排程板夜班交接版

> 覆盖完整链路追踪、权限隔离、口径一致、幂等导入、坏行隔离、已关闭后补录部分成功等核心流程

---

## 📋 功能特性

| # | 核心需求 | 实现机制 |
|---|---|---|
| 1 | **完整链路追踪** | 从课包流水→核销→补录→审计一路可追溯，`getCompleteTrace(hxId)` 提供完整链路文本 |
| 2 | **普通账号与主管权限差异** | 两个角色：`夜班老师(普通)` 和 `主管`。普通老师看不到审计表和审计字段 |
| 3 | **两边数量口径一致** | 所有公式统一过滤 `row_abnormal='正常'`，底层计算逻辑完全相同，仅可见字段不同 |
| 4 | **幂等导入** | 同一流水号再次导入自动标记为「重复作废」，不产生额外有效结果 |
| 5 | **坏行隔离** | 每行独立 `row_abnormal` 标记，异常行不影响同宝宝其他正常记录 |
| 6 | **已关闭后补录允许部分成功** | 已关闭核销追加补录时自动勾选 `allow_partial_success`，处理状态支持「部分成功」 |
| 7 | **审计保留** | 双字段冗余：`operator_id`(user) + `operator_name`(text)，账号注销后审计仍保留 |

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 初始化数据库

```bash
npm run init:db
```

### 导入样例数据

```bash
npm run seed
```

### 一键验证所有核心流程

```bash
npm run verify
```

### 分别验证不同角色视角

```bash
# 验证夜班老师视角（看不到审计、过滤异常行）
npm run verify:teacher

# 验证主管视角（完整权限、可看审计）
npm run verify:admin
```

### 启动 API 服务

```bash
npm start
```

服务启动后访问：http://localhost:3000

---

## 📡 API 接口

### 一键验证
```bash
GET /api/verify/all
```

### 角色权限
```bash
# 查看当前角色权限
GET /api/permissions

# 对比两个角色的视图差异
GET /api/views/compare/:tableName

# 查看所有视图配置
GET /api/views/configs
```

### 课包流水
```bash
# 列表（按角色过滤）
GET /api/flows

# 详情
GET /api/flows/:id

# 统计（验证口径一致）
GET /api/flows/:id/stats
```

### 核销记录
```bash
# 列表（按角色过滤）
GET /api/hx

# 完整链路追踪
GET /api/hx/:id/trace
```

### 审计日志（仅主管）
```bash
# 列表
GET /api/audit

# 统计
GET /api/audit/stats

# 需要复查的审计
GET /api/audit/need-review
```

### 切换角色
在请求头中添加 `X-Role`：
```bash
# 主管视角
curl -H "X-Role: 主管" http://localhost:3000/api/audit

# 普通老师视角（默认）
curl http://localhost:3000/api/audit  # 应返回 403 无权限
```

---

## 📁 项目结构

```
.
├── package.json              # 项目配置
├── README.md                 # 本文档
├── baby_records.json         # 宝宝信息样例数据
├── flow_records.json         # 课包流水样例数据
├── hx_records.json           # 核销记录样例数据
├── bl_records.json           # 补录材料样例数据
├── sj_records.json           # 审计日志样例数据
├── data/
│   └── app.db                # SQLite 数据库文件（初始化后生成）
├── scripts/
│   ├── init-db.js            # 数据库初始化脚本
│   ├── seed-data.js          # 样例数据导入脚本
│   ├── verify-all.js         # 一键验证所有核心流程
│   ├── verify-teacher-view.js # 夜班老师视角验证
│   └── verify-admin-view.js  # 主管视角验证
└── src/
    ├── server.js             # Express API 服务入口
    ├── config/
    │   └── roles.js          # 角色、权限、视图配置
    ├── db/
    │   ├── index.js          # 数据库连接
    │   └── schema.js         # 建表 SQL
    └── services/
        ├── permissionService.js  # 权限服务
        ├── viewService.js        # 视图服务
        ├── flowService.js        # 课包流水服务
        ├── hxService.js          # 核销记录服务
        └── auditService.js       # 审计日志服务
```

---

## 🧪 样例数据说明

### 三个测试宝宝

| 宝宝 | 场景 | 验证点 |
|---|---|---|
| **小安（正常）** | 1条有效流水 + 1条正常核销 | 基础链路验证 |
| **小博（含异常坏行）** | 2条流水（1有效1重复作废）+ 2条核销（1正常1异常隔离） | 坏行隔离、幂等导入 |
| **小晨（含补录）** | 1条流水 + 2条核销（1已关闭+1手工补录）+ 1条补录材料（部分成功） | 已关闭后补录、部分成功、审计保留 |

### 关键验证场景

1. **幂等导入测试**：导入时故意将小博的流水号 `LS-B-20240901-002` 导入两次，第二次自动标记为「重复作废」
2. **坏行隔离测试**：小博有一条核销 `HX-B-202501-002-BAD`，核销课时为 `-999`，被标记为异常隔离，统计时自动排除
3. **部分成功测试**：小晨旧核销 `HX-C-202412-003` 已关闭后追加补录，处理状态为「部分成功」
4. **审计保留测试**：审计记录 `SJ-C-004` 的 `operator_id` 为空（模拟账号注销），但 `operator_name` 保留为「张老师(已离职)」

---

## 🔍 验证说明

运行 `npm run verify` 会依次验证：

| 检查项 | 预期结果 |
|---|---|
| 完整链路追踪 | 可从课包流水一路追溯到核销、补录、审计 |
| 普通老师看不到审计 | 审计日志表无权限，核销记录的 audit_ids 字段无权限 |
| 主管可以看审计 | 审计日志表完整权限 |
| 数量口径一致 | 小博有效流水已核销课时=5，不包含异常隔离行的-999 |
| 幂等导入 | 同流水号第二次导入自动标记为重复作废，已核销课时=0 |
| 坏行隔离 | 小博有1条坏行被隔离，但有效核销仍=5 |
| 已关闭后补录 | 小晨已核销课时=18(旧15+手工补录3)，手工补录状态=部分成功 |
| 审计保留 | 至少1条审计记录处理人ID为空但姓名冗余保留 |

---

## 📊 权限矩阵

| 权限 | 夜班老师(普通) | 主管 |
|---|---|---|
| 宝宝信息表 | ✅ 可编辑 | ✅ 可编辑 |
| 课包流水表 | ✅ 可编辑（只看有效） | ✅ 完整权限 |
| 核销记录表 | ✅ 可编辑（隐藏审计字段） | ✅ 完整权限 |
| 补录材料表 | ✅ 可编辑 | ✅ 完整权限 |
| 审计日志表 | ❌ 无权限 | ✅ 完整权限 |
| 角色权限表 | ❌ 无权限 | ✅ 只读 |
| 视图配置表 | ✅ 只读 | ✅ 可编辑 |

---

## 🛠️ 核心服务说明

### [flowService.js](file:///Users/guo/pro/solo/workspaces/gyf607005/src/services/flowService.js)
- `importFlowRecords()` - 幂等导入，自动检测重复
- `getFlowStats()` - 统计时只算 `row_abnormal='正常'` 的核销记录

### [hxService.js](file:///Users/guo/pro/solo/workspaces/gyf607005/src/services/hxService.js)
- `createHxRecord()` - 创建核销并自动记录审计
- `addBlToClosedHx()` - 已关闭核销追加补录，自动勾选「允许部分成功」
- `markBadRow()` - 标记异常隔离行，行级隔离不影响其他记录
- `getCompleteTrace()` - 完整链路追踪

### [auditService.js](file:///Users/guo/pro/solo/workspaces/gyf607005/src/services/auditService.js)
- `logAudit()` - 强制要求 `operator_name`，确保审计不丢失
- `getAuditStats()` - 统计处理人ID为空但姓名保留的记录数

### [permissionService.js](file:///Users/guo/pro/solo/workspaces/gyf607005/src/services/permissionService.js)
- `hasTablePermission()` - 表级权限检查
- `hasFieldPermission()` - 字段级权限检查
- `applyViewFilter()` - 按角色过滤记录和字段

---

## 📝 License

MIT
