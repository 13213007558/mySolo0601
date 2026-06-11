/**
 * 温度采集点
 * @description 记录奶酪成熟过程中某一时刻的温度数据
 */
export interface TemperaturePoint {
  /** 采集时间戳 */
  timestamp: Date;
  /** 温度值（摄氏度） */
  temperature: number;
  /** 探针插入深度（厘米） */
  probeDepth: number;
  /** 数据状态：有效/中断/伪造 */
  status: 'valid' | 'interrupted' | 'forged';
}

/**
 * 奶酪轮
 * @description 描述单个奶酪轮的完整信息，包括基本属性、成熟状态和温度历史
 */
export interface CheeseWheel {
  /** 唯一标识符 */
  id: string;
  /** 奶酪轮编号 */
  wheelNumber: string;
  /** 酒窖位置ID */
  cellarPositionId: string;
  /** 酵母批次ID */
  yeastBatchId: string;
  /** 入窖时间 */
  entryTime: Date;
  /** 目标成熟时间 */
  targetMaturationTime: Date;
  /** 成熟状态：成熟中/已就绪/已发货/已中断 */
  status: 'maturing' | 'ready' | 'shipped' | 'interrupted';
  /** 目标温度范围 [最低温度, 最高温度] */
  targetTempRange: [number, number];
  /** 已成熟小时数 */
  maturationHours: number;
  /** 温度历史记录数组 */
  temperatureHistory: TemperaturePoint[];
}

/**
 * 酒窖位置
 * @description 酒窖中存储奶酪的具体位置信息
 */
export interface CellarPosition {
  /** 唯一标识符 */
  id: string;
  /** 位置编码 */
  positionCode: string;
  /** 区域 */
  zone: string;
  /** 货架号 */
  shelf: string;
  /** 环境温度（摄氏度） */
  ambientTemp: number;
}

/**
 * 酵母批次
 * @description 用于奶酪生产的酵母批次信息
 */
export interface YeastBatch {
  /** 唯一标识符 */
  id: string;
  /** 批次编号 */
  batchNumber: string;
  /** 酵母菌株 */
  strain: string;
  /** 生产日期 */
  productionDate: Date;
  /** 供应商 */
  supplier: string;
}

/**
 * 异常事件
 * @description 系统检测到的各类异常事件记录
 */
export interface AnomalyEvent {
  /** 唯一标识符 */
  id: string;
  /** 关联记录ID */
  recordId: string;
  /** 异常类型：温度骤升/检测到伪造/数据中断 */
  type: 'temperature_spike' | 'forgery_detected' | 'data_interruption';
  /** 严重程度：低/中/高/危急 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 发生时间戳 */
  timestamp: Date;
  /** 是否已确认 */
  acknowledged: boolean;
  /** 确认人 */
  acknowledgedBy: string;
}

/**
 * 用户
 * @description 系统用户信息
 */
export interface User {
  /** 唯一标识符 */
  id: string;
  /** 用户名 */
  username: string;
  /** 角色：技术员/经理/主管/管理员 */
  role: 'technician' | 'manager' | 'supervisor' | 'admin';
  /** 联系电话 */
  phone: string;
  /** 是否已锁定 */
  isLocked: boolean;
  /** 最后登录时间 */
  lastLogin: Date;
}

/**
 * 告警规则
 * @description 温度监控系统的告警配置规则
 */
export interface AlertRule {
  /** 唯一标识符 */
  id: string;
  /** 规则类型 */
  type: string;
  /** 告警阈值 */
  threshold: number;
  /** 持续时间（分钟） */
  duration: number;
  /** 接收人列表 */
  recipients: string[];
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 探针引导状态
 * @description 温度探针插入过程的引导状态
 */
export interface ProbeGuideState {
  /** 当前步骤 */
  currentStep: number;
  /** 总步骤数 */
  totalSteps: number;
  /** 当前插入深度（厘米） */
  currentDepth: number;
  /** 目标插入深度（厘米） */
  targetDepth: number;
  /** 是否已确认 */
  isConfirmed: boolean;
}

/**
 * HACCP报告
 * @description 危害分析与关键控制点报告，包含奶酪成熟过程的完整质量数据
 */
export interface HACCPReport {
  /** 奶酪轮ID */
  wheelId: string;
  /** 奶酪轮编号 */
  wheelNumber: string;
  /** 酒窖位置 */
  cellarPosition: string;
  /** 酵母批次 */
  yeastBatch: string;
  /** 温度曲线数据 */
  temperatureCurve: TemperaturePoint[];
  /** 目标温度范围 */
  targetRange: [number, number];
  /** 异常事件列表 */
  anomalies: AnomalyEvent[];
  /** 操作员 */
  operator: string;
  /** 生成时间 */
  generatedAt: Date;
}

/**
 * 应用状态
 * @description 前端应用的全局状态管理
 */
export interface AppState {
  /** 当前登录用户 */
  currentUser: User | null;
  /** 当前选中的奶酪轮 */
  selectedCheeseWheel: CheeseWheel | null;
  /** 当前活动视图 */
  activeView: string;
  /** 是否处于监控模式 */
  isMonitoring: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  eventType: 'user_locked' | 'user_unlocked' | 'forgery_detected' | 'forgery_reported' | 'sms_sent' | 'sms_failed' | 'login' | 'logout' | 'data_interruption' | 'service_initialized';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actorUserId: string;
  actorUserName: string;
  targetUserId?: string;
  targetUserName?: string;
  cheeseWheelId?: string;
  cheeseWheelNumber?: string;
  details: string;
  metadata?: Record<string, unknown>;
  reported?: boolean;
  reportedAt?: Date;
}
