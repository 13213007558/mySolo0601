# 图纸会审批注追踪板

> 管理多专业会审批注的责任流转，解决 PDF 截图、微信群意见、Excel 清单多来源材料的统一管理问题。

## 技术栈

- **React 18** - 前端框架
- **Vite** - 构建工具
- **IndexedDB (Dexie.js)** - 浏览器本地数据库
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库
- **SheetJS (xlsx)** - Excel 解析和导出

## 核心功能

### 1. 批注定位
- 按楼栋、专业、责任人、图纸页码多维度筛选
- 关键词搜索批注编号和内容
- 正常记录与问题记录分区显示

### 2. 责任流转
- 一键分派责任人（9个专业岗位）
- 回复历史完整记录
- 5种状态追踪：待分派 → 已分派 → 处理中 → 已回复 → 已关闭

### 3. 版本对比
- 查看批注的完整历史回复
- 时间线展示处理过程
- 当前状态与历史记录对比

### 4. 异常隔离
- 缺少图纸页码的记录自动进入问题区
- 专业名称错误的记录自动进入问题区
- 楼栋编号错误的记录自动进入问题区
- 可视化修复表单，修正后自动移出问题区

### 5. 导出一致
- **Excel 清单**：完整字段导出，可用于打印或分发
- **回复摘要**：按楼栋分组的详细回复报告，可用于向总包汇报
- **核对清单**：勾选式追踪表，便于现场核对

### 6. 导入去重
- 相同内容的文件只能导入一次（基于文件哈希）
- 重复的批注编号自动跳过
- 导入前预览数据，确认无误后再执行

## 快速开始

### 1. 安装依赖

```bash
cd annotation-tracker
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 http://localhost:5173

### 3. 导入样例数据

首次启动后，系统会自动加载 12 条样例批注数据（含 3 条问题记录）。如需手动导入：

1. 点击顶部「导入会审清单」按钮
2. 点击「导入样例数据」按钮
3. 等待导入完成，查看导入结果统计

### 4. 准备自己的 Excel 文件

1. 点击「导入会审清单」→「下载导入模板」
2. 按照模板格式填写会审清单
3. 保存为 .xlsx 格式
4. 拖拽或选择文件上传

## 数据一致性验证流程

### 步骤 1：确认初始状态
- 点击「刷新数据」按钮
- 记录统计卡片显示的数字
- 点击「导出」→「验证数据一致性」，记录显示的哈希值

### 步骤 2：进行一些操作
- 在问题区修复一条记录（点击「修复问题」→ 修改字段 → 保存）
- 打开某条批注的详情，添加一条回复
- 分派一条待分派记录的责任人

### 步骤 3：验证刷新后数据一致
- 点击「刷新数据」，确认统计数字已更新
- 再次点击「验证数据一致性」，记录新的哈希值
- 按 F5 刷新整个页面
- 页面重新加载后，点击「验证数据一致性」
- ✅ 确认哈希值与刷新前完全一致

### 步骤 4：验证导出数据一致
- 点击「导出」→「导出 Excel 清单」
- 打开导出的 Excel 文件
- 核对每条记录的批注编号、状态、责任人与网页显示一致
- 点击「导出」→「导出回复摘要」
- 打开导出的 txt 文件
- 核对已回复批注的内容和回复历史与详情页显示一致

## 项目结构

```
annotation-tracker/
├── src/
│   ├── components/          # React 组件
│   │   ├── AnnotationList.jsx    # 批注列表表格
│   │   ├── DetailDrawer.jsx      # 详情抽屉
│   │   ├── FilterPanel.jsx       # 筛选面板
│   │   ├── ImportWizard.jsx      # 导入向导
│   │   ├── ProblemSection.jsx    # 问题区
│   │   ├── StatsCards.jsx        # 统计卡片
│   │   └── StatusBadge.jsx       # 状态徽章
│   ├── db/                    # 数据库层
│   │   ├── index.js              # IndexedDB 定义和常量
│   │   └── operations.js         # CRUD 操作函数
│   ├── data/                  # 数据
│   │   └── mockData.js           # 样例数据
│   ├── hooks/                 # React Hooks
│   │   ├── useAnnotations.js     # 批注数据 Hook
│   │   └── useInitialize.js      # 初始化 Hook
│   ├── utils/                 # 工具函数
│   │   ├── export.js             # 导出功能
│   │   └── import.js             # 导入功能
│   ├── App.jsx                 # 主应用组件
│   ├── main.jsx                # 入口文件
│   └── index.css               # 全局样式
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 数据模型

### annotations（批注表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键，UUID |
| annotationNo | string | 批注编号，唯一 |
| building | string | 楼栋（1-8号楼） |
| major | string | 专业（建筑/结构/给排水等） |
| pageNo | string | 图纸页码 |
| description | string | 批注内容 |
| source | string | 来源（pdf/wechat/excel） |
| assignee | string | 责任人 |
| status | string | 状态（pending/assigned/in_progress/replied/closed） |
| priority | string | 优先级（high/medium/low） |
| hasError | boolean | 是否有数据问题 |
| errorType | string | 问题类型 |
| importBatchId | string | 导入批次ID |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### replies（回复表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| annotationId | string | 关联的批注ID |
| content | string | 回复内容 |
| replier | string | 回复人 |
| repliedAt | string | 回复时间 |

### importBatches（导入批次表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键 |
| fileName | string | 原始文件名 |
| fileHash | string | 文件内容哈希，用于去重 |
| importTime | string | 导入时间 |
| recordCount | number | 记录总数 |
| errorCount | number | 问题记录数 |

## 常见问题

### Q: 数据会丢失吗？
A: 数据存储在浏览器的 IndexedDB 中，只要不清理浏览器数据就不会丢失。但建议定期导出 Excel 备份。

### Q: 可以在不同浏览器之间同步数据吗？
A: 目前不支持跨浏览器同步，因为数据仅存储在本地。

### Q: 如何清空所有数据重新开始？
A: 点击顶部「重置数据」按钮，确认后会恢复到初始样例状态。

### Q: 支持多少条记录？
A: IndexedDB 理论上支持数百 MB 数据，几千条批注完全没问题。

## 许可证

MIT License
