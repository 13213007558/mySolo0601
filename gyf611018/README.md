# 擒纵摆幅Mic台 - 腕表售后振幅检测系统

基于 WASM + Rust + Yew 构建的腕表擒纵机构振幅检测系统，用于售后中心检测腕表摆幅是否达标。

## 功能特性

- 🎤 **麦克风采集**: 通过 Web Audio API 实时采集擒纵机构声音波形
- 📊 **波形分析**: Rust 侧高性能波形计算，振幅、频率、峰峰值检测
- 🔴 **阈值标红**: 振幅低于阈值自动整行标红警示
- 📱 **机芯编号绑定**: 扫码或手动输入机芯编号，与检测记录绑定
- 🔍 **波形查看**: 缩略图悬停/点击放大查看详细波形
- 📈 **班次看板**: 按早/午/夜班批量检测汇总统计
- 📤 **品牌交换格式**: 导出品牌售后专用 CSV/JSON 交换格式
- 🔧 **返修管理**: 异常机芯自动创建返修申请，审批流程管理
- 🚫 **制度红线**: 标红机芯禁止直接返客，须走复检工位

## 技术架构

- **前端框架**: Yew 0.21 (Rust WebAssembly)
- **构建工具**: Trunk
- **音频采集**: Web Audio API (web-sys)
- **数据存储**: LocalStorage (gloo-storage)
- **波形计算**: Rust 原生实现（峰值检测、频率分析）

## 项目结构

```
.
├── Cargo.toml          # Rust 项目配置
├── Trunk.toml          # Trunk 构建配置
├── index.html          # HTML 入口
├── styles.css          # 全局样式
└── src/
    ├── main.rs         # 应用入口
    ├── lib.rs          # 库文件（核心逻辑）
    ├── waveform.rs     # 波形分析算法
    ├── models.rs       # 数据模型
    ├── storage.rs      # 本地存储
    ├── export.rs       # 导出功能
    └── components/     # UI 组件
        ├── mod.rs
        ├── header.rs
        ├── detection_page.rs    # 检测台页面
        ├── records_page.rs      # 记录查询页面
        ├── dashboard_page.rs    # 班次看板页面
        ├── repair_page.rs       # 返修管理页面
        ├── settings_page.rs     # 设置页面
        └── waveform_viewer.rs   # 波形查看器
```

## 快速开始

### 前置要求

- Rust 1.70+
- wasm32-unknown-unknown 目标
- Trunk 构建工具

### 安装依赖

```bash
# 添加 WASM 目标
rustup target add wasm32-unknown-unknown

# 安装 Trunk
cargo install trunk
```

### 开发运行

```bash
trunk serve
```

访问 http://localhost:8080

### 生产构建

```bash
trunk build --release
```

构建产物在 `dist/` 目录。

## 使用说明

### 1. 检测台

1. 输入或扫描机芯编号
2. 点击「开始采集」按钮
3. 系统自动采集 5 秒波形数据
4. 实时显示振幅、频率等参数
5. 振幅低于阈值自动标红并提示

### 2. 记录查询

- 搜索机芯编号、记录ID、操作员
- 按状态筛选（正常/警告/异常/待复检等）
- 点击波形缩略图查看大图
- 导出 CSV 或品牌交换格式

### 3. 班次看板

- 查看今日各班次检测统计
- 合格率、异常数、平均振幅
- 按班次导出数据

### 4. 返修管理

- 查看待审批返修申请
- 批准/拒绝返修申请
- 标记返修完成

### 5. 制度红线

- 标红机芯禁止直接返客
- 须走复检工位二次采集确认
- 复检仍不达标须创建返修申请
- 返修完成后方可返回客户

## 波形计算说明

振幅计算在 Rust (WASM) 侧完成，包括：

- **峰值检测**: 寻找波形中的峰值和谷值
- **振幅计算**: 峰峰值 / 2
- **频率计算**: 基于峰值间隔计算频率
- **RMS 计算**: 均方根值
- **降采样**: 用于缩略图显示

## 品牌售后交换格式

导出 JSON 格式包含以下字段：

- `record_id`: 记录唯一标识
- `movement_id`: 机芯编号
- `detection_time`: 检测时间
- `shift`: 班次
- `amplitude`: 振幅（度）
- `frequency`: 频率（Hz）
- `beat_error`: 日差（秒/日）
- `result`: 检测结果（PASS/FAIL）
- `operator`: 操作员
- `brand_code`: 品牌代码
- `waveform_hash`: 波形哈希校验

## License

MIT
