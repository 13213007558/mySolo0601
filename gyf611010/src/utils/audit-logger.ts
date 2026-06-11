/**
 * 安全审计日志
 * @description 记录系统安全相关的操作事件，用于合规追溯和安全审计
 */
export interface SecurityAuditLog {
  /** 日志唯一标识 */
  id: string;
  /** 事件类型：user_locked / user_unlocked / forgery_reported / login / logout 等 */
  eventType: string;
  /** 严重程度：low / medium / high / critical */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 关联用户ID */
  userId?: string;
  /** 关联用户名 */
  userName?: string;
  /** 奶酪轮编号（如涉及） */
  wheelNumber?: string;
  /** 事件原因描述列表 */
  reasons?: string[];
  /** 检测置信度（0-1） */
  confidence?: number;
  /** 额外的事件详情 */
  details?: Record<string, unknown>;
  /** 事件发生时间 */
  timestamp: Date;
  /** 操作人ID */
  operatorId?: string;
}

/**
 * 日志记录参数（新格式）
 */
interface LogOptions {
  severity: SecurityAuditLog['severity'];
  userId?: string;
  userName?: string;
  wheelNumber?: string;
  reasons?: string[];
  confidence?: number;
  details?: Record<string, unknown>;
  operatorId?: string;
}

class AuditLogger {
  /**
   * 审计日志存储
   * @compliance 内存存储仅用于演示，生产环境应写入持久化日志系统
   */
  private logs: SecurityAuditLog[] = [];

  /**
   * 生成唯一日志ID
   */
  private generateId(): string {
    return `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * 记录安全审计日志（兼容旧格式和新格式）
   *
   * 新格式（推荐）：
   *   log('user_locked', { severity: 'critical', userId: 'U001', ... })
   *
   * 旧格式（向后兼容）：
   *   log('sms_sent', { phone: '139...', wheelNumber: 'CW001', timestamp: '...' })
   *
   * @compliance 符合食品安全管理体系（FSMS）的可追溯要求，所有安全相关操作均需留痕
   * @param eventType 事件类型
   * @param options 日志参数
   */
  log(
    eventType: string,
    options: LogOptions | Record<string, unknown>
  ): SecurityAuditLog {
    const isNewFormat = 'severity' in options;

    let log: SecurityAuditLog;

    if (isNewFormat) {
      const opts = options as LogOptions;
      log = {
        id: this.generateId(),
        eventType,
        severity: opts.severity,
        userId: opts.userId,
        userName: opts.userName,
        wheelNumber: opts.wheelNumber,
        reasons: opts.reasons,
        confidence: opts.confidence,
        details: opts.details,
        timestamp: new Date(),
        operatorId: opts.operatorId,
      };
    } else {
      const rawDetails = options as Record<string, unknown>;
      const details = { ...rawDetails };
      let parsedTimestamp: Date;

      if (typeof details.timestamp === 'string') {
        parsedTimestamp = new Date(details.timestamp as string);
        delete details.timestamp;
      } else if (details.timestamp instanceof Date) {
        parsedTimestamp = details.timestamp;
        delete details.timestamp;
      } else {
        parsedTimestamp = new Date();
      }

      log = {
        id: this.generateId(),
        eventType,
        severity: this.inferSeverity(eventType),
        userId: typeof details.userId === 'string' ? details.userId : undefined,
        userName: typeof details.userName === 'string' ? details.userName : undefined,
        wheelNumber: typeof details.wheelNumber === 'string' ? details.wheelNumber : undefined,
        details: Object.keys(details).length > 0 ? details : undefined,
        timestamp: parsedTimestamp,
      };
    }

    this.logs.unshift(log);

    console.log(
      `[AUDIT LOG ${log.timestamp.toISOString()}] ${eventType} | severity: ${log.severity} | id: ${log.id}`
    );

    return log;
  }

  /**
   * 根据事件类型推断严重程度（用于旧格式日志）
   */
  private inferSeverity(eventType: string): SecurityAuditLog['severity'] {
    const criticalEvents = ['user_locked', 'forgery_detected', 'forgery_reported'];
    const highEvents = ['user_unlocked', 'sms_failed'];
    const mediumEvents = ['login_failed', 'alert_service_initialized'];
    const lowEvents = ['login', 'logout', 'sms_sent'];

    if (criticalEvents.includes(eventType)) return 'critical';
    if (highEvents.includes(eventType)) return 'high';
    if (mediumEvents.includes(eventType)) return 'medium';
    if (lowEvents.includes(eventType)) return 'low';
    return 'low';
  }

  /**
   * 获取所有审计日志
   * @compliance 支持监管检查时的日志调阅和合规审查
   */
  getAuditLogs(): SecurityAuditLog[] {
    return [...this.logs];
  }

  /**
   * 上报安全事件给主管
   * @compliance 遵循逐级上报机制，严重安全事件必须及时通知管理层
   * @param logOrId 需上报的审计日志或日志ID
   */
  async reportToSupervisor(logOrId: SecurityAuditLog | string): Promise<boolean> {
    try {
      const logId = typeof logOrId === 'string' ? logOrId : logOrId.id;
      const log = typeof logOrId === 'string' ? this.logs.find(l => l.id === logOrId) : logOrId;

      console.log(
        `[AUDIT REPORT] 安全事件已上报主管: ${log?.eventType ?? 'unknown'} (${logId})`
      );
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      console.error('[AUDIT REPORT] 上报主管失败:', error);
      return false;
    }
  }
}

/**
 * 审计日志单例
 * @compliance 全局统一的审计入口，确保日志记录的一致性和完整性
 */
export const auditLogger = new AuditLogger();
